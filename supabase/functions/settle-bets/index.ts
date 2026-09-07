// Resuelve automáticamente las apuestas pendientes cuyo partido ya terminó.
//
// Dos fuentes, porque ninguna da todo:
//   - The Odds API `/scores`  -> marcador. Resuelve 1x2, goles y BTTS.
//     Match por id de evento (exacto), pero el plan gratis son 500 créditos/mes.
//   - API-Football `/fixtures` + `/fixtures/statistics` -> córners, tarjetas,
//     tiros y tiros a puerta (y también el marcador, así que sirve de respaldo
//     cuando The Odds API se queda sin cuota). 100 requests/día gratis. Aquí el
//     match es por nombre de equipo normalizado, así que se cachea el resultado
//     en `match_stats_cache`: un partido terminado ya no cambia.
//
// Resuelve tanto apuestas simples (`bets`) como patas de combinada
// (`bet_legs`); el trigger `bet_legs_recalc` recalcula sola la fila madre.
//
// - cron:  { cron: true, secret: <cron_secret> }  -> todas las apuestas
// - app:   Authorization: Bearer <user jwt>       -> solo las del usuario
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const ODDS_KEY = Deno.env.get('THE_ODDS_API_KEY') ?? ''
const AF_KEY = Deno.env.get('API_FOOTBALL_KEY') ?? ''
const CRON_SECRET = Deno.env.get('REFRESH_CRON_SECRET') ?? ''

const ODDS_BASE = 'https://api.the-odds-api.com/v4'
const AF_BASE = 'https://v3.football.api-sports.io'
const SETTLE_AFTER_MIN = 90
/** Tope de llamadas a API-Football por corrida (plan gratis: 100/día). */
const AF_BUDGET = 12

const SPORT_KEYS: Record<string, string> = {
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

/** id de liga en API-Football (mismo mapa que refresh-standings). */
const AF_LEAGUE_IDS: Record<string, number> = {
  chile: 265,
  laliga: 140,
  premier: 39,
  seriea: 135,
  bundesliga: 78,
  ligue1: 61,
  primeira: 94,
  eredivisie: 88,
  brasileirao: 71,
  argentina: 128,
}

/** Mercados que necesitan estadísticas, no solo el marcador. */
const STATS_MARKETS = ['corners', 'cards', 'shots', 'shots_on_target']

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

// --- lógica de resolución (espejo de packages/core/src/utils/settle.ts) ---

interface MatchResult {
  homeScore: number
  awayScore: number
  corners?: number | null
  cards?: number | null
  shots?: number | null
  shotsOnTarget?: number | null
}

function statFor(market: string, r: MatchResult): number | null | undefined {
  switch (market) {
    case 'goals': return r.homeScore + r.awayScore
    case 'corners': return r.corners
    case 'cards': return r.cards
    case 'shots': return r.shots
    case 'shots_on_target': return r.shotsOnTarget
    default: return undefined
  }
}

function overUnder(
  total: number | null | undefined,
  line: number | null,
  selection: string,
): 'won' | 'lost' | 'void' | null {
  if (total == null || !Number.isFinite(total) || line == null) return null
  if (Number.isInteger(line) && total === line) return 'void'
  return (selection === 'over') === (total > line) ? 'won' : 'lost'
}

function resolveBet(
  market: string,
  selection: string,
  line: number | null,
  r: MatchResult,
): 'won' | 'lost' | 'void' | null {
  if (market === '1x2') {
    const outcome =
      r.homeScore > r.awayScore ? 'home' : r.homeScore < r.awayScore ? 'away' : 'draw'
    return selection === outcome ? 'won' : 'lost'
  }
  if (market === 'btts') {
    const both = r.homeScore > 0 && r.awayScore > 0
    return (selection === 'yes') === both ? 'won' : 'lost'
  }
  if (
    market === 'goals' || market === 'corners' || market === 'cards' ||
    market === 'shots' || market === 'shots_on_target'
  ) {
    return overUnder(statFor(market, r), line, selection)
  }
  return null
}

const MARKET_UNIT: Record<string, string> = {
  corners: 'córners',
  cards: 'tarjetas',
  shots: 'tiros',
  shots_on_target: 'tiros a puerta',
}

function resultDetail(market: string, r: MatchResult): string {
  const ft = `FT ${r.homeScore}-${r.awayScore}`
  const stat = statFor(market, r)
  if (!MARKET_UNIT[market] || stat == null) return ft
  return `${ft} · ${stat} ${MARKET_UNIT[market]}`
}

// --- API-Football ---

const DIACRITICS = /[\u0300-\u036f]/g
const NON_ALNUM = /[^a-z0-9 ]/g

/** Sufijos societarios que no distinguen a un club de otro. */
const CLUB_NOISE = new Set(['fc', 'cf', 'afc', 'sc', 'ac', 'cd', 'club'])

/**
 * The Odds API escribe las ciudades en ingles y API-Football en el idioma
 * local, asi que "Bayern Munich" y "Bayern Munchen" no se cruzaban solos.
 */
const CITY_ALIASES: Record<string, string> = {
  munich: 'munchen',
  cologne: 'koln',
  seville: 'sevilla',
  turin: 'torino',
  rome: 'roma',
  milano: 'milan',
  lisbon: 'lisboa',
  moenchengladbach: 'monchengladbach',
}

/** "Man. City" y "Manchester City FC" tienen que caer en el mismo cubo. */
function normalizeTeam(name: string): string {
  return name
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(NON_ALNUM, ' ')
    .split(' ')
    // Ojo con ampliar esta lista: quitar "city"/"united"/"real" haria que
    // Manchester City y Manchester United normalizaran igual.
    .filter((t) => t && !CLUB_NOISE.has(t))
    .map((t) => CITY_ALIASES[t] ?? t)
    .join(' ')
}
/**
 * ¿Son el mismo equipo? Se exige que TODOS los tokens largos del nombre corto
 * estén en el largo. Con "comparten alguno" bastaba, y entonces Manchester
 * City y Manchester United eran el mismo equipo. El match además va acotado
 * por liga, fecha y lado (local/visita), así que no hace falta más.
 */
function sameTeam(a: string, b: string): boolean {
  const x = normalizeTeam(a)
  const y = normalizeTeam(b)
  if (!x || !y) return false
  if (x === y || x.includes(y) || y.includes(x)) return true
  const [short, long] = x.length <= y.length ? [x, y] : [y, x]
  const longTokens = new Set(long.split(' '))
  const shortTokens = short.split(' ').filter((t) => t.length > 3)
  if (!shortTokens.length) return false
  return shortTokens.every((t) => longTokens.has(t))
}

interface AfFixture {
  fixture: { id: number; status: { short: string } }
  league: { id: number }
  teams: { home: { name: string }; away: { name: string } }
  goals: { home: number | null; away: number | null }
}

interface AfStatBlock {
  team: { name: string }
  statistics: { type: string; value: number | string | null }[]
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

let afCalls = 0
async function afFetch<T>(path: string): Promise<T | null> {
  if (!AF_KEY || afCalls >= AF_BUDGET) return null
  afCalls++
  try {
    const res = await fetch(`${AF_BASE}${path}`, {
      headers: { 'x-apisports-key': AF_KEY },
    })
    if (!res.ok) return null
    const body = await res.json()
    if (Array.isArray(body?.errors) && body.errors.length) return null
    return body?.response ?? null
  } catch {
    return null
  }
}

const num = (v: number | string | null | undefined): number => {
  if (v == null) return 0
  const n = typeof v === 'number' ? v : Number(String(v).replace('%', ''))
  return Number.isFinite(n) ? n : 0
}

/** Suma la estadística de los dos equipos. */
function sumStat(blocks: AfStatBlock[], ...types: string[]): number | null {
  let total = 0
  let seen = false
  for (const b of blocks) {
    for (const s of b.statistics ?? []) {
      if (types.includes(s.type)) {
        total += num(s.value)
        seen = true
      }
    }
  }
  return seen ? total : null
}

/** yyyy-mm-dd en UTC (API-Football usa UTC por defecto). */
const utcDate = (iso: string) => iso.slice(0, 10)

/**
 * Estadísticas de los partidos pedidos. Primero la caché; lo que falte se pide
 * a API-Football (1 request por día de partidos + 1 por partido) y se cachea.
 */
async function loadStats(
  wanted: { matchId: string; league: string; homeTeam: string; awayTeam: string; matchDate: string }[],
): Promise<Map<string, MatchResult>> {
  const out = new Map<string, MatchResult>()
  if (!wanted.length) return out

  const ids = [...new Set(wanted.map((w) => w.matchId))]
  const { data: cached } = await admin
    .from('match_stats_cache')
    .select('*')
    .in('match_id', ids)

  for (const row of cached ?? []) {
    if (row.home_score == null || row.away_score == null) continue
    out.set(row.match_id, {
      homeScore: row.home_score,
      awayScore: row.away_score,
      corners: row.corners,
      cards: row.cards,
      shots: row.shots,
      shotsOnTarget: row.shots_on_target,
    })
  }

  const missing = wanted.filter((w) => !out.has(w.matchId))
  if (!missing.length || !AF_KEY) return out

  // Un request por fecha trae los partidos de todas las ligas de ese día.
  const byDate = new Map<string, typeof missing>()
  for (const m of missing) {
    const d = utcDate(m.matchDate)
    byDate.set(d, [...(byDate.get(d) ?? []), m])
  }

  for (const [date, items] of byDate) {
    const fixtures = await afFetch<AfFixture[]>(`/fixtures?date=${date}`)
    if (!fixtures) continue

    const ours = fixtures.filter((f) =>
      Object.values(AF_LEAGUE_IDS).includes(f.league?.id),
    )

    for (const item of items) {
      const leagueId = AF_LEAGUE_IDS[item.league]
      const fx = ours.find(
        (f) =>
          f.league?.id === leagueId &&
          sameTeam(f.teams.home.name, item.homeTeam) &&
          sameTeam(f.teams.away.name, item.awayTeam),
      )
      // FT / AET / PEN: el partido acabó. Cualquier otro estado se reintenta.
      if (!fx || !['FT', 'AET', 'PEN'].includes(fx.fixture.status.short)) continue
      if (fx.goals.home == null || fx.goals.away == null) continue

      const blocks = await afFetch<AfStatBlock[]>(
        `/fixtures/statistics?fixture=${fx.fixture.id}`,
      )

      const yellow = blocks ? sumStat(blocks, 'Yellow Cards') : null
      const red = blocks ? sumStat(blocks, 'Red Cards') : null
      const result: MatchResult = {
        homeScore: fx.goals.home,
        awayScore: fx.goals.away,
        corners: blocks ? sumStat(blocks, 'Corner Kicks') : null,
        // Tarjetas del partido = amarillas + rojas, la convención habitual.
        cards: yellow == null && red == null ? null : (yellow ?? 0) + (red ?? 0),
        shots: blocks ? sumStat(blocks, 'Total Shots') : null,
        shotsOnTarget: blocks ? sumStat(blocks, 'Shots on Goal') : null,
      }
      out.set(item.matchId, result)

      await admin.from('match_stats_cache').upsert(
        {
          match_id: item.matchId,
          league: item.league,
          fixture_id: fx.fixture.id,
          home_team: item.homeTeam,
          away_team: item.awayTeam,
          home_score: result.homeScore,
          away_score: result.awayScore,
          corners: result.corners,
          cards: result.cards,
          shots: result.shots,
          shots_on_target: result.shotsOnTarget,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: 'match_id' },
      )
    }
  }

  return out
}

/**
 * Secreto compartido con el cron. Vive en `app_config` (tabla que solo lee el
 * service role), no en un secret de la función.
 */
let cachedSecrets: string[] | null = null
async function cronSecrets(): Promise<string[]> {
  if (cachedSecrets) return cachedSecrets
  const { data } = await admin
    .from('app_config')
    .select('value')
    .eq('key', 'cron_secret')
    .maybeSingle()
  cachedSecrets = [CRON_SECRET, data?.value ?? ''].filter(Boolean)
  return cachedSecrets
}

interface Pending {
  table: 'bets' | 'bet_legs'
  id: string
  league: string
  match_id: string | null
  home_team: string
  away_team: string
  match_date: string
  market: string
  selection: string
  line: number | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  let body: { cron?: boolean; secret?: string } = {}
  try {
    body = await req.json()
  } catch { /* vacío */ }

  // El isolate se reutiliza entre invocaciones: el presupuesto es por corrida.
  afCalls = 0

  const secrets = await cronSecrets()
  const isCron =
    Boolean(body.cron) &&
    typeof body.secret === 'string' &&
    secrets.includes(body.secret)

  let userId: string | null = null
  if (!isCron) {
    const asUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      auth: { persistSession: false },
    })
    const { data } = await asUser.auth.getUser()
    if (!data.user) return json({ error: 'No autenticado' }, 401)
    userId = data.user.id
  }

  const cutoff = new Date(Date.now() - SETTLE_AFTER_MIN * 60_000).toISOString()
  const cols =
    'id, league, match_id, home_team, away_team, match_date, market, selection, line'

  // Apuestas simples. Las combinadas (kind='parlay') no se tocan: salen solas
  // del trigger cuando se resuelven sus patas.
  let qBets = admin
    .from('bets')
    .select(cols)
    .eq('status', 'pending')
    .eq('kind', 'single')
    .not('match_id', 'is', null)
    .lt('match_date', cutoff)
  if (userId) qBets = qBets.eq('user_id', userId)

  let qLegs = admin
    .from('bet_legs')
    .select(cols)
    .eq('status', 'pending')
    .not('match_id', 'is', null)
    .lt('match_date', cutoff)
  if (userId) qLegs = qLegs.eq('user_id', userId)

  const [betsRes, legsRes] = await Promise.all([qBets, qLegs])
  if (betsRes.error) return json({ error: betsRes.error.message }, 500)
  if (legsRes.error) return json({ error: legsRes.error.message }, 500)

  const pending: Pending[] = [
    ...(betsRes.data ?? []).map((b) => ({ ...b, table: 'bets' as const })),
    ...(legsRes.data ?? []).map((l) => ({ ...l, table: 'bet_legs' as const })),
  ]

  if (!pending.length) {
    await admin.from('settle_runs').insert({ checked: 0, settled: 0 })
    return json({ checked: 0, settled: 0 })
  }

  // --- marcadores desde The Odds API (barato y con id exacto) ---
  const scores = new Map<string, MatchResult>()
  let credits = 0
  let remaining: number | null = null
  let quotaExhausted = false

  const scoreLeagues = [
    ...new Set(
      pending
        .filter((p) => !STATS_MARKETS.includes(p.market))
        .map((p) => p.league),
    ),
  ].filter((l) => l in SPORT_KEYS)

  if (ODDS_KEY) {
    for (const league of scoreLeagues) {
      try {
        const url = new URL(`${ODDS_BASE}/sports/${SPORT_KEYS[league]}/scores`)
        url.searchParams.set('apiKey', ODDS_KEY)
        url.searchParams.set('daysFrom', '3')
        url.searchParams.set('dateFormat', 'iso')
        const res = await fetch(url)
        credits += 2
        const rem = Number(res.headers.get('x-requests-remaining') ?? 'NaN')
        if (Number.isFinite(rem)) remaining = rem
        if (!res.ok) {
          if (res.status === 401) { quotaExhausted = true; break }
          continue
        }
        const events = await res.json()
        for (const e of events) {
          if (!e.completed || !e.scores) continue
          const get = (name: string) =>
            Number(e.scores.find((s: { name: string }) => s.name === name)?.score ?? 'NaN')
          const home = get(e.home_team)
          const away = get(e.away_team)
          if (Number.isFinite(home) && Number.isFinite(away)) {
            scores.set(e.id, { homeScore: home, awayScore: away })
          }
        }
      } catch {
        /* liga con error -> se reintenta en la próxima corrida */
      }
    }
  }

  // --- estadísticas desde API-Football, y de paso el marcador de lo que
  //     The Odds API no pudo dar (por ejemplo con la cuota agotada) ---
  const needStats = pending.filter(
    (p) =>
      p.match_id &&
      (STATS_MARKETS.includes(p.market) || !scores.has(p.match_id)),
  )
  const stats = await loadStats(
    [
      ...new Map(
        needStats.map((p) => [
          p.match_id as string,
          {
            matchId: p.match_id as string,
            league: p.league,
            homeTeam: p.home_team,
            awayTeam: p.away_team,
            matchDate: p.match_date,
          },
        ]),
      ).values(),
    ],
  )

  // --- resolver ---
  let settled = 0
  for (const item of pending) {
    if (!item.match_id) continue
    const fromStats = stats.get(item.match_id)
    const fromScore = scores.get(item.match_id)
    // Para un mercado de estadísticas solo sirve API-Football; para el resto
    // vale cualquiera de las dos, con preferencia por el marcador exacto.
    const result = STATS_MARKETS.includes(item.market)
      ? fromStats
      : (fromScore ?? fromStats)
    if (!result) continue

    const status = resolveBet(
      item.market,
      item.selection,
      item.line != null ? Number(item.line) : null,
      result,
    )
    if (!status) continue

    const { error: upErr } = await admin
      .from(item.table)
      .update({
        status,
        settled_at: new Date().toISOString(),
        settled_by: 'auto',
        result_detail: resultDetail(item.market, result),
      })
      .eq('id', item.id)
      .eq('status', 'pending')
    if (!upErr) settled++
  }

  await admin.from('settle_runs').insert({
    checked: pending.length,
    settled,
    credits_used: credits,
    requests_remaining: remaining,
    error: quotaExhausted ? 'The Odds API sin créditos' : null,
  })

  return json({
    checked: pending.length,
    settled,
    requestsRemaining: remaining,
    quotaExhausted,
    apiFootballCalls: afCalls,
    statsAvailable: Boolean(AF_KEY),
  })
})
