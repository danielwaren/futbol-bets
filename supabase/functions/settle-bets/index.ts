// Resuelve automáticamente las apuestas pendientes cuyo partido ya terminó,
// usando el marcador real de The Odds API (/scores). El trigger `bets_recalc`
// actualiza la banca. Córners no se resuelven aquí (falta fuente de stats).
//
// - cron:  { cron: true, secret: <REFRESH_CRON_SECRET> }  -> todas las apuestas
// - app:   Authorization: Bearer <user jwt>               -> solo las del usuario
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const ODDS_KEY = Deno.env.get('THE_ODDS_API_KEY') ?? ''
const CRON_SECRET = Deno.env.get('REFRESH_CRON_SECRET') ?? ''

const ODDS_BASE = 'https://api.the-odds-api.com/v4'
const SETTLE_AFTER_MIN = 90

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

// --- lógica de resolución (espejo de src/utils/settle.ts) ---
function resolveBet(
  market: string,
  selection: string,
  line: number | null,
  home: number,
  away: number,
): 'won' | 'lost' | 'void' | null {
  const total = home + away
  if (market === '1x2') {
    const outcome = home > away ? 'home' : home < away ? 'away' : 'draw'
    return selection === outcome ? 'won' : 'lost'
  }
  if (market === 'btts') {
    const both = home > 0 && away > 0
    return (selection === 'yes') === both ? 'won' : 'lost'
  }
  if (market === 'goals') {
    if (line == null) return null
    if (Number.isInteger(line) && total === line) return 'void'
    const wentOver = total > line
    return (selection === 'over') === wentOver ? 'won' : 'lost'
  }
  return null
}

interface RawScore {
  id: string
  completed: boolean
  home_team: string
  away_team: string
  scores: { name: string; score: string }[] | null
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

/**
 * Secreto compartido con el cron. Vive en `app_config` (tabla que solo lee el
 * service role), no en un secret de la función: así el cron queda programado
 * desde una migración, sin que nadie tenga que pegar claves a mano.
 * Se mantiene el env por compatibilidad.
 */
let cachedSecrets: string[] | null = null
async function cronSecrets(): Promise<string[]> {
  if (cachedSecrets) return cachedSecrets
  const { data } = await admin
    .from('app_config')
    .select('value')
    .eq('key', 'cron_secret')
    .maybeSingle()
  // Se aceptan ambos: si el env quedó configurado de antes seguiría siendo
  // válido, y el cron nuevo usa el de la BD.
  cachedSecrets = [CRON_SECRET, data?.value ?? ''].filter(Boolean)
  return cachedSecrets
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (!ODDS_KEY) return json({ error: 'THE_ODDS_API_KEY no configurada' }, 500)

  let body: { cron?: boolean; secret?: string } = {}
  try {
    body = await req.json()
  } catch { /* vacío */ }

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
  let q = admin
    .from('bets')
    .select('id, bankroll_id, league, match_id, home_team, away_team, market, selection, line')
    .eq('status', 'pending')
    .not('match_id', 'is', null)
    .neq('market', 'corners')
    .lt('match_date', cutoff)
  if (userId) q = q.eq('user_id', userId)

  const { data: bets, error } = await q
  if (error) return json({ error: error.message }, 500)

  if (!bets?.length) {
    await admin.from('settle_runs').insert({ checked: 0, settled: 0 })
    return json({ checked: 0, settled: 0 })
  }

  const leagues = [...new Set(bets.map((b) => b.league))].filter(
    (l) => l in SPORT_KEYS,
  )

  // Marcadores por evento
  const results = new Map<string, { home: number; away: number }>()
  let credits = 0
  let remaining: number | null = null

  for (const league of leagues) {
    try {
      const url = new URL(`${ODDS_BASE}/sports/${SPORT_KEYS[league]}/scores`)
      url.searchParams.set('apiKey', ODDS_KEY)
      url.searchParams.set('daysFrom', '3')
      url.searchParams.set('dateFormat', 'iso')
      const res = await fetch(url)
      credits += 2
      const rem = Number(res.headers.get('x-requests-remaining') ?? 'NaN')
      if (Number.isFinite(rem)) remaining = rem
      if (!res.ok) continue
      const events = (await res.json()) as RawScore[]
      for (const e of events) {
        if (!e.completed || !e.scores) continue
        const get = (name: string) =>
          Number(e.scores!.find((s) => s.name === name)?.score ?? 'NaN')
        const home = get(e.home_team)
        const away = get(e.away_team)
        if (Number.isFinite(home) && Number.isFinite(away)) {
          results.set(e.id, { home, away })
        }
      }
    } catch {
      /* liga con error -> se reintenta en la próxima corrida */
    }
  }

  let settled = 0
  for (const bet of bets) {
    const score = bet.match_id ? results.get(bet.match_id) : undefined
    if (!score) continue
    const status = resolveBet(
      bet.market,
      bet.selection,
      bet.line != null ? Number(bet.line) : null,
      score.home,
      score.away,
    )
    if (!status) continue
    const { error: upErr } = await admin
      .from('bets')
      .update({
        status,
        settled_at: new Date().toISOString(),
        settled_by: 'auto',
        result_detail: `FT ${score.home}-${score.away}`,
      })
      .eq('id', bet.id)
      .eq('status', 'pending')
    if (!upErr) settled++
  }

  await admin.from('settle_runs').insert({
    checked: bets.length,
    settled,
    credits_used: credits,
    requests_remaining: remaining,
  })

  return json({ checked: bets.length, settled, requestsRemaining: remaining })
})
