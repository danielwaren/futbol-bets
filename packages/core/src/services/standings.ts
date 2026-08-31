import { supabase } from '../supabase'
import type { League } from '../types'

export type StandingZone = 'ucl' | 'uel' | 'relegation' | null

export interface StandingRow {
  league: League
  season: number
  position: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  /** 'WWDLW', más reciente al final. null si la fuente no lo trae. */
  form: string | null
  /** '' cuando la liga no tiene grupos */
  groupLabel: string
  zone: StandingZone
  updatedAt: string
}

interface Row {
  league: string
  season: number
  position: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_diff: number
  points: number
  form: string | null
  group_label: string
  zone: string | null
  updated_at: string
}

const toRow = (r: Row): StandingRow => ({
  league: r.league as League,
  season: r.season,
  position: r.position,
  team: r.team,
  played: r.played,
  won: r.won,
  drawn: r.drawn,
  lost: r.lost,
  goalsFor: r.goals_for,
  goalsAgainst: r.goals_against,
  goalDiff: r.goal_diff,
  points: r.points,
  form: r.form,
  groupLabel: r.group_label,
  zone: (r.zone as StandingZone) ?? null,
  updatedAt: r.updated_at,
})

/**
 * Lee la caché `standings_cache` (poblada por la edge function
 * `refresh-standings`). El cliente nunca escribe aquí.
 */
export async function readStandings(league: League): Promise<StandingRow[]> {
  const { data, error } = await supabase
    .from('standings_cache')
    .select('*')
    .eq('league', league)
    .order('group_label', { ascending: true })
    .order('position', { ascending: true })

  if (error) throw error
  return (data ?? []).map(toRow)
}

/** Pide al backend refrescar las posiciones de unas ligas. */
export async function requestStandingsRefresh(
  leagues: League[],
): Promise<{ updated: number }> {
  const { data, error } = await supabase.functions.invoke('refresh-standings', {
    body: { leagues },
  })
  if (error) throw error
  return { updated: data?.updated ?? 0 }
}
