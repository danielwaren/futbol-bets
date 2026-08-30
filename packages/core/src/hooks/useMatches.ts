import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { League, Match } from '../types'
import { usingMockOdds } from '../services/odds'
import { mockOddsApi } from '../services/odds/mockOddsApi'
import { readCachedMatches, requestOddsRefresh } from '../services/matchCache'
import { isSameLocalDay } from '../utils/format'

export const matchKeys = {
  list: (leagues: League[], date: string) =>
    ['matches', [...leagues].sort().join(','), date] as const,
}

export interface MatchesData {
  matches: Match[]
}

const sortByKickoff = (a: Match, b: Match) =>
  a.commenceTime.localeCompare(b.commenceTime)

async function loadMatches(
  leagues: League[],
  date: string,
): Promise<MatchesData> {
  if (usingMockOdds()) {
    const results = await Promise.all(
      leagues.map((l) => mockOddsApi.getMatches(l, date)),
    )
    return {
      matches: results
        .flatMap((r) => r.matches)
        .filter((m) => isSameLocalDay(m.commenceTime, date))
        .sort(sortByKickoff),
    }
  }
  // Producción: solo se lee la caché compartida (poblada server-side).
  return { matches: await readCachedMatches(leagues, date) }
}

export function useMatches(leagues: League[], date: string) {
  return useQuery({
    queryKey: matchKeys.list(leagues, date),
    queryFn: () => loadMatches(leagues, date),
    enabled: leagues.length > 0,
  })
}

/**
 * Pide un refresh de cuotas. En mock no hace nada real (los datos ya son
 * deterministas); en producción invoca la edge function `refresh-odds`.
 */
export function useRefreshMatches(leagues: League[]) {
  const qc = useQueryClient()
  const [requestsRemaining, setRequestsRemaining] = useState<number | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      if (usingMockOdds()) return { updated: 0, requestsRemaining: null }
      const res = await requestOddsRefresh(leagues)
      setRequestsRemaining(res.requestsRemaining)
      return res
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  })

  return { ...mutation, requestsRemaining, disabled: usingMockOdds() }
}
