import { supabase } from '../supabase'
import type { League, Match, MatchOdds } from '../types'
import { isSameLocalDay } from '../utils/format'

interface CacheRow {
  id: string
  league: string
  sport_key: string
  home_team: string
  away_team: string
  commence_time: string
  odds: MatchOdds
  bookmaker: string | null
  fetched_at: string
}

function rowToMatch(row: CacheRow): Match {
  return {
    id: row.id,
    league: row.league as League,
    sportKey: row.sport_key,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    commenceTime: row.commence_time,
    odds: row.odds ?? {},
    bookmaker: row.bookmaker ?? undefined,
  }
}

/**
 * Lee la caché compartida `matches_cache` (poblada por la edge function
 * `refresh-odds`). El cliente ya no escribe aquí.
 */
export async function readCachedMatches(
  leagues: League[],
  date: string,
): Promise<Match[]> {
  if (!leagues.length) return []
  const from = new Date(`${date}T00:00:00`)
  from.setDate(from.getDate() - 1)
  const to = new Date(`${date}T23:59:59`)
  to.setDate(to.getDate() + 2)

  const { data, error } = await supabase
    .from('matches_cache')
    .select('*')
    .in('league', leagues)
    .gte('commence_time', from.toISOString())
    .lte('commence_time', to.toISOString())
    .order('commence_time', { ascending: true })
  if (error) throw error

  return (data as CacheRow[])
    .map(rowToMatch)
    .filter((m) => isSameLocalDay(m.commenceTime, date))
}

/** Dispara un refresh server-side de las cuotas (edge function). */
export async function requestOddsRefresh(leagues?: League[]): Promise<{
  updated: number
  requestsRemaining: number | null
}> {
  const { data, error } = await supabase.functions.invoke('refresh-odds', {
    body: leagues?.length ? { leagues } : {},
  })
  if (error) throw error
  return {
    updated: data?.updated ?? 0,
    requestsRemaining: data?.requestsRemaining ?? null,
  }
}
