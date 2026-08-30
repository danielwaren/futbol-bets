// Edge function: refresca la caché compartida de partidos/cuotas desde The Odds API.
// - Invocada por usuarios autenticados (botón "Actualizar cuotas") -> refresh ligero.
// - Invocada por el cron (pg_cron -> pg_net) con { deep: true, cron: true } -> incluye
//   córners/BTTS por evento.
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

const COOLDOWN_MIN = 25
const DEEP_EVENT_CAP = 20 // máx eventos con córners/BTTS por corrida
const DEEP_WINDOW_DAYS = 3
const CORNERS_MARKETS = ['alternate_totals_corners', 'totals_corners']

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

async function oddsFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${ODDS_BASE}${path}`)
  url.searchParams.set('apiKey', ODDS_KEY)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url)
  const remaining = Number(res.headers.get('x-requests-remaining') ?? 'NaN')
  if (!res.ok) {
    throw new Error(`Odds API ${res.status}: ${(await res.text()).slice(0, 160)}`)
  }
  return {
    data: await res.json(),
    remaining: Number.isFinite(remaining) ? remaining : null,
  }
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
    const near = events
      .filter((e) => new Date(e.commence_time).getTime() < cutoff)
      .slice(0, DEEP_EVENT_CAP)
    for (const e of near) {
      let ok = false
      for (const cornersKey of CORNERS_MARKETS) {
        try {
          const r = await oddsFetch(
            `/sports/${sportKey}/events/${e.id}/odds`,
            {
              regions: REGION,
              markets: `btts,${cornersKey}`,
              oddsFormat: 'decimal',
              dateFormat: 'iso',
            },
          )
          credits += 2
          remaining = r.remaining ?? remaining
          const bk = pickBookmaker(r.data as RawEvent)
          const row = rows.find((x) => x.id === e.id)
          if (row) {
            const btts = parseBtts(bk)
            const corners = parseOverUnder(findMarket(bk, cornersKey), 9.5)
            if (btts) row.odds.btts = btts
            if (corners) row.odds.corners = corners
          }
          ok = true
          break
        } catch {
          // mercado desconocido para esta liga -> probar el siguiente
        }
      }
      if (!ok) {
        // sin córners: al menos intentar BTTS suelto
        try {
          const r = await oddsFetch(
            `/sports/${sportKey}/events/${e.id}/odds`,
            { regions: REGION, markets: 'btts', oddsFormat: 'decimal', dateFormat: 'iso' },
          )
          credits += 1
          remaining = r.remaining ?? remaining
          const bk = pickBookmaker(r.data as RawEvent)
          const btts = parseBtts(bk)
          const row = rows.find((x) => x.id === e.id)
          if (row && btts) row.odds.btts = btts
        } catch { /* noop */ }
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  if (!ODDS_KEY) {
    return json({ error: 'THE_ODDS_API_KEY no configurada' }, 500, cors)
  }

  let body: { leagues?: string[]; deep?: boolean; cron?: boolean; secret?: string } = {}
  try {
    body = await req.json()
  } catch { /* body vacío */ }

  const isCron = Boolean(body.cron) && body.secret === CRON_SECRET && CRON_SECRET !== ''
  const deep = Boolean(body.deep) || isCron
  const targets = (body.leagues?.length ? body.leagues : Object.keys(LEAGUES))
    .filter((l) => l in LEAGUES)

  const results: unknown[] = []
  let remaining: number | null = null
  let updated = 0

  for (const leagueId of targets) {
    if (!isCron && (await onCooldown(leagueId))) {
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
      await admin.from('odds_refresh_log').insert({ league: leagueId, error: message })
      results.push({ league: leagueId, error: message })
    }
  }

  return json({ updated, requestsRemaining: remaining, results }, 200, cors)
})

function json(payload: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}
