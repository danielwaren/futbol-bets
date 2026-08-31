import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { League } from '../types'
import { readStandings, requestStandingsRefresh } from '../services/standings'

export const standingKeys = {
  league: (league: League) => ['standings', league] as const,
}

export function useStandings(league: League | undefined) {
  return useQuery({
    queryKey: standingKeys.league(league as League),
    queryFn: () => readStandings(league as League),
    enabled: Boolean(league),
    // Las posiciones solo cambian cuando termina una jornada.
    staleTime: 30 * 60_000,
  })
}

export function useRefreshStandings(league: League | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => requestStandingsRefresh(league ? [league] : []),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['standings'] }),
  })
}
