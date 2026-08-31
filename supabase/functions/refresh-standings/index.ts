// Edge function: llena `standings_cache` desde API-Football.
//
// Mismo patrón que refresh-odds: la key vive como secret del proyecto y el
// cliente NUNCA la ve; la app solo lee la tabla cacheada.
//
// Consumo: 1 request por liga. Con las 10 ligas y 2 corridas diarias son ~20
// requests/día, muy por debajo de las 100 del plan gratuito.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const API_BASE = 'https://v3.football.api-sports.io'
const API_KEY = Deno.env.get('API_FOOTBALL_KEY') ?? ''
const CRON_SECRET = Deno.env.get('REFRESH_CRON_SECRET') ?? ''

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/** id de liga en API-Football por cada liga nuestra */
const LEAGUE_IDS: Record<string, number> = {
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

/** No repetir una liga antes de esto (las posiciones cambian por jornada). */
const COOLDOWN_MIN = 180

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

interface ApiTeamRow {
  rank: number
  team: { name: string }
  points: number
  goalsDiff: number
  group?: string
  form?: string
  description?: string | null
  all: {
    played: number
    win: number
    draw: number
    lose: number
    goals: { for: number; against: number }
  }
}

/** La descripción de API-Football es texto libre por liga; la normalizamos. */
function zoneOf(description?: string | null): string | null {
  if (!description) return null
  const d = description.toLowerCase()
  if (d.includes('relegation') || d.includes('descenso')) return 'relegation'
  if (d.includes('champions')) return 'ucl'
  if (d.includes('europa') || d.includes('sudamericana')) return 'uel'
  if (d.includes('libertadores')) return 'ucl'
  return null
}

async function fetchLeague(league: string, season: number) {
  const id = LEAGUE_IDS[league]
  const res = await fetch(
    `${API_BASE}/standings?league=${id}&season=${season}`,
    { headers: { 'x-apisports-key': API_KEY } },
  )
  if (!res.ok) {
    throw new Error(`API-Football ${res.status}: ${(await res.text()).slice(0, 160)}`)
  }
  const body = await res.json()

  if (Array.isArray(body?.errors) && body.errors.length) {
    throw new Error(`API-Football: ${JSON.stringify(body.errors).slice(0, 200)}`)
  }
  // response[0].league.standings es un array de grupos, cada uno con sus filas.
  const groups: ApiTeamRow[][] = body?.response?.[0]?.league?.standings ?? []

  const rows = groups.flatMap((group) =>
    group.map((r) => ({
      league,
      season,
      position: r.rank,
      team: r.team.name,
      played: r.all.played,
      won: r.all.win,
      drawn: r.all.draw,
      lost: r.all.lose,
      goals_for: r.all.goals.for,
      goals_against: r.all.goals.against,
      goal_diff: r.goalsDiff,
      points: r.points,
      form: r.form ?? null,
      group_label: groups.length > 1 ? (r.group ?? '') : '',
      zone: zoneOf(r.description),
      updated_at: new Date().toISOString(),
    })),
  )
  return rows
}

Deno.serve(async (req) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  if (!API_KEY) {
    return json({ error: 'API_FOOTBALL_KEY no configurada' }, 500, cors)
  }

  let body: { leagues?: string[]; season?: number; cron?: boolean; secret?: string } = {}
  try {
    body = await req.json()
  } catch {
    /* body vacío */
  }

  const isCron =
    Boolean(body.cron) && body.secret === CRON_SECRET && CRON_SECRET !== ''

  const targets = (
    body.leagues?.length ? body.leagues : Object.keys(LEAGUE_IDS)
  ).filter((l) => l in LEAGUE_IDS)

  // Temporada: API-Football la identifica por el año de inicio.
  const now = new Date()
  const season = body.season ?? now.getFullYear()

  const results: Record<string, string> = {}
  let updated = 0

  for (const league of targets) {
    try {
      if (!isCron) {
        const { data: last } = await admin
          .from('standings_cache')
          .select('updated_at')
          .eq('league', league)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (last?.updated_at) {
          const mins = (Date.now() - new Date(last.updated_at).getTime()) / 60000
          if (mins < COOLDOWN_MIN) {
            results[league] = `en caché (${Math.round(mins)} min)`
            continue
          }
        }
      }

      const rows = await fetchLeague(league, season)
      if (!rows.length) {
        results[league] = 'sin datos'
        await admin.from('standings_refresh_log').insert({
          league,
          rows: 0,
          error: 'respuesta vacía',
        })
        continue
      }

      // La tabla completa se reemplaza: los equipos no cambian de liga a mitad
      // de temporada, pero sí puede cambiar el número de filas entre fases.
      await admin
        .from('standings_cache')
        .delete()
        .eq('league', league)
        .eq('season', season)

      const { error } = await admin.from('standings_cache').insert(rows)
      if (error) throw new Error(error.message)

      updated += rows.length
      results[league] = `${rows.length} equipos`
      await admin
        .from('standings_refresh_log')
        .insert({ league, rows: rows.length })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      results[league] = `error: ${msg}`
      await admin
        .from('standings_refresh_log')
        .insert({ league, rows: 0, error: msg })
    }
  }

  return json({ updated, season, results }, 200, cors)
})

function json(payload: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}
