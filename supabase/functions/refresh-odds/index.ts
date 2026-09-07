// Edge function: refresca la caché compartida de partidos/cuotas desde The Odds API.
// - Invocada por usuarios autenticados (botón "Actualizar cuotas") -> refresh ligero.
// - Invocada por el cron (pg_cron -> pg_net) con { deep: true, cron: true } -> incluye
//   córners/tarjetas/BTTS por evento.
//
// PRESUPUESTO. El plan gratis son 500 créditos/mes (~16/día) y cada llamada cuesta
// `mercados × regiones`. Sin frenos esto se come la cuota en tres días (pasó el
// 2026-09-03). Tres medidas lo mantienen dentro:
//   1. Solo se refrescan las ligas que algún usuario tiene elegidas de verdad.
//   2. `deep` solo mira los partidos más próximos, con tope de eventos.
//   3. Si quedan menos de LOW_CREDITS créditos, se degrada a lo mínimo.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ODDS_BASE = 'https://api.the-odds-api.com/v4'
const ODDS_KEY = Deno.env.get('THE_ODDS_API_KEY') ?? ''
const REGION = Deno.env.get('ODDS_REGION') ?? 'eu'
const CRON_SECRET = Deno.env.get('REFRESH_CRON_SECRET') ?? ''

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const LEAGUES: Record<string, string> = {
  chile: 'soccer_chile_campeonato',
  laliga: 'soccer_spain_la_liga',
  premier: 'soccer_epl',
  seriea: 'soccer_italy_serie_a',
  bundesliga: 'soccer_germany_bundesliga',
  ligue1: 'soccer_france_ligue_one',
  primeira: 'soccer_portugal_primeira_liga',
  eredivisie: 'soccer_netherlands_eredivisie',
  brasileirao: 'soccer_brazil_campeonato',
  argentina: 'soccer_argentina_primera_division',
}
const ALL_LEAGUES = Object.keys(LEAGUES)
/** Trío por defecto de `public.free_leagues` cuando el usuario no ha elegido. */
const DEFAULT_FREE = ['chile', 'laliga', 'premier']

const COOLDOWN_MIN = 25
const DEEP_EVENT_CAP = 8 // máx eventos con córners/tarjetas/BTTS por corrida
const DEEP_WINDOW_DAYS = 2
const LOW_CREDITS = 60 // por debajo de esto solo se refresca lo básico
const CORNERS_MARKETS = ['totals_corners', 'alternate_totals_corners']

interface RawOutcome { name: string; price: number; point?: number }
interface RawMarket { key: string; outcomes: RawOutcome[] }
interface RawBookmaker { key: string; title: string; markets: RawMarket[] }
interface RawEvent {
  id: string
  sport_key: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: RawBookmaker[]
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

function pickBookmaker(e: RawEvent) {
  return [...(e.bookmakers ?? [])].sort(
    (a, b) => b.markets.length - a.markets.length,
  )[0]
}
const findMarket = (bk: RawBookmaker | undefined, key: string) =>
  bk?.markets.find((m) => m.key === key)

function parse1x2(bk: RawBookmaker | undefined, home: string, away: string) {
  const m = findMarket(bk, 'h2h')
  if (!m) return undefined
  const get = (n: string) =>
    m.outcomes.find((o) => o.name.toLowerCase() === n.toLowerCase())?.price
  const h = get(home), a = get(away), d = get('Draw')
  if (h == null || a == null || d == null) return undefined
  return { home: h, draw: d, away: a }
}

function parseOverUnder(m: RawMarket | undefined, target: number) {
  if (!m) return undefined
  const byLine = new Map<number, { over?: number; under?: number }>()
  for (const o of m.outcomes) {
    if (o.point == null) continue
    const e = byLine.get(o.point) ?? {}
    if (/over/i.test(o.name)) e.over = o.price
    if (/under/i.test(o.name)) e.under = o.price
    byLine.set(o.point, e)
  }
  const complete = [...byLine.entries()].filter(
    ([, v]) => v.over != null && v.under != null,
  )
  if (!complete.length) return undefined
  complete.sort(([a], [b]) => Math.abs(a - target) - Math.abs(b - target))
  const [line, v] = complete[0]
  return { line, over: v.over as number, under: v.under as number }
}

function parseBtts(bk: RawBookmaker | undefined) {
  const m = findMarket(bk, 'btts')
  if (!m) return undefined
  const yes = m.outcomes.find((o) => /yes|s[ií]/i.test(o.name))?.price
  const no = m.outcomes.find((o) => /^no$/i.test(o.name))?.price
  if (yes == null || no == null) return undefined
  return { yes, no }
}

class QuotaError extends Error {}

async function oddsFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${ODDS_BASE}${path}`)
  url.searchParams.set('apiKey', ODDS_KEY)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url)
  const remaining = Number(res.headers.get('x-requests-remaining') ?? 'NaN')
  if (!res.ok) {
    const text = (await res.text()).slice(0, 200)
    // Sin créditos no sirve reintentar con otra liga: se aborta la corrida.
    if (res.status === 401 && /quota|credit/i.test(text)) {
      throw new QuotaError(`Odds API sin créditos: ${text}`)
    }
    throw new Error(`Odds API ${res.status}: ${text}`)
  }
  return {
    data: await res.json(),
    remaining: Number.isFinite(remaining) ? remaining : null,
  }
}

/**
 * Ligas que alguien usa de verdad. Refrescar las 10 siempre era la mayor fuga
 * de créditos: en el plan free cada usuario solo puede apostar en 3.
 */
async function activeLeagues(): Promise<string[]> {
  const { data, error } = await admin
    .from('profiles')
    .select('plan, free_leagues')
  if (error || !data?.length) return DEFAULT_FREE

  // Un usuario premium puede apostar en todas.
  if (data.some((p) => p.plan === 'premium')) return ALL_LEAGUES

  const set = new Set<string>()
  for (const p of data) {
    const ls: string[] | null = p.free_leagues
    for (const l of ls?.length ? ls : DEFAULT_FREE) set.add(l)
  }
  const out = [...set].filter((l) => l in LEAGUES)
  return out.length ? out : DEFAULT_FREE
}

/** Último `requests_remaining` conocido, para decidir si degradar. */
async function lastRemaining(): Promise<number | null> {
  const { data } = await admin
    .from('odds_refresh_log')
    .select('requests_remaining')
    .not('requests_remaining', 'is', null)
    .order('ran_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.requests_remaining ?? null
}

async function refreshLeague(leagueId: string, deep: boolean) {
  const sportKey = LEAGUES[leagueId]
  const started = Date.now()
  let credits = 0
  let remaining: number | null = null

  const base = await oddsFetch(`/sports/${sportKey}/odds`, {
    regions: REGION,
    markets: 'h2h,totals',
    oddsFormat: 'decimal',
    dateFormat: 'iso',
  })
  credits += 2
  remaining = base.remaining
  const events = base.data as RawEvent[]

  const rows = events.map((e) => {
    const bk = pickBookmaker(e)
    return {
      id: e.id,
      league: leagueId,
      sport_key: sportKey,
      home_team: e.home_team,
      away_team: e.away_team,
      commence_time: e.commence_time,
      bookmaker: bk?.title ?? null,
      odds: {
        '1x2': parse1x2(bk, e.home_team, e.away_team),
        goals: parseOverUnder(findMarket(bk, 'totals'), 2.5),
      } as Record<string, unknown>,
      fetched_at: new Date().toISOString(),
    }
  })

  if (deep) {
    const cutoff = Date.now() + DEEP_WINDOW_DAYS * 86_400_000
    // Los partidos más próximos primero: son los que el usuario va a mirar hoy.
    const near = events
      .filter((e) => new Date(e.commence_time).getTime() < cutoff)
      .sort((a, b) => a.commence_time.localeCompare(b.commence_time))
      .slice(0, DEEP_EVENT_CAP)

    for (const e of near) {
      // De más completo a más barato: si la liga no soporta un mercado la API
      // devuelve error y se pierde toda la llamada, así que se degrada.
      const attempts = [
        ...CORNERS_MARKETS.map((ck) => ({ markets: `btts,${ck},totals_cards`, cost: 3 })),
        ...CORNERS_MARKETS.map((ck) => ({ markets: `btts,${ck}`, cost: 2 })),
        { markets: 'btts,totals_cards', cost: 2 },
        { markets: 'btts', cost: 1 },
      ]

      for (const attempt of attempts) {
        try {
          const r = await oddsFetch(`/sports/${sportKey}/events/${e.id}/odds`, {
            regions: REGION,
            markets: attempt.markets,
            oddsFormat: 'decimal',
            dateFormat: 'iso',
          })
          credits += attempt.cost
          remaining = r.remaining ?? remaining
          const bk = pickBookmaker(r.data as RawEvent)
          const row = rows.find((x) => x.id === e.id)
          if (row) {
            const btts = parseBtts(bk)
            if (btts) row.odds.btts = btts
            for (const ck of CORNERS_MARKETS) {
              const corners = parseOverUnder(findMarket(bk, ck), 9.5)
              if (corners) { row.odds.corners = corners; break }
            }
            const cards =
              parseOverUnder(findMarket(bk, 'totals_cards'), 4.5) ??
              parseOverUnder(findMarket(bk, 'alternate_totals_cards'), 4.5)
            if (cards) row.odds.cards = cards
          }
          break
        } catch (err) {
          if (err instanceof QuotaError) throw err
          // mercado desconocido para esta liga -> probar la combinación siguiente
        }
      }
    }
  }

  if (rows.length) {
    const { error } = await admin
      .from('matches_cache')
      .upsert(rows, { onConflict: 'id' })
    if (error) throw error
  }

  await admin.from('odds_refresh_log').insert({
    league: leagueId,
    events: rows.length,
    credits_used: credits,
    requests_remaining: remaining,
    error: null,
  })

  return { league: leagueId, events: rows.length, credits, remaining, ms: Date.now() - started }
}

async function onCooldown(leagueId: string): Promise<boolean> {
  const since = new Date(Date.now() - COOLDOWN_MIN * 60_000).toISOString()
  const { data } = await admin
    .from('odds_refresh_log')
    .select('id')
    .eq('league', leagueId)
    .is('error', null)
    .gte('ran_at', since)
    .limit(1)
  return Boolean(data?.length)
}

Deno.serve(async (req) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), {
      status: s,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (!ODDS_KEY) return json({ error: 'THE_ODDS_API_KEY no configurada' }, 500)

  let body: { deep?: boolean; cron?: boolean; secret?: string; leagues?: string[] } = {}
  try {
    body = await req.json()
  } catch { /* body vacío */ }

  const isCron = Boolean(body.cron) && CRON_SECRET !== '' && body.secret === CRON_SECRET

  // Antes era `Boolean(body.deep) || isCron`: el cron "light" también hacía la
  // pasada profunda y por eso los 500 créditos del mes se iban en tres días.
  const remainingBefore = await lastRemaining()
  const lowOnCredits = remainingBefore != null && remainingBefore < LOW_CREDITS
  const deep = Boolean(body.deep) && !lowOnCredits

  const targets = (body.leagues?.length ? body.leagues : await activeLeagues())
    .filter((l) => l in LEAGUES)

  const results: unknown[] = []
  let remaining: number | null = remainingBefore
  let updated = 0
  let quotaExhausted = false

  for (const leagueId of targets) {
    if (await onCooldown(leagueId)) {
      results.push({ league: leagueId, skipped: 'cooldown' })
      continue
    }
    try {
      const r = await refreshLeague(leagueId, deep)
      updated += r.events
      remaining = r.remaining ?? remaining
      results.push(r)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await admin
        .from('odds_refresh_log')
        .insert({ league: leagueId, error: message.slice(0, 400) })
      results.push({ league: leagueId, error: message })
      // Sin créditos no sirve seguir pidiendo por cada liga: 10 errores 401
      // por corrida solo ensucian el log.
      if (err instanceof QuotaError) {
        quotaExhausted = true
        break
      }
    }
  }

  return json({
    updated,
    requestsRemaining: remaining,
    deep,
    lowOnCredits,
    quotaExhausted,
    leagues: targets,
    results,
  })
})
