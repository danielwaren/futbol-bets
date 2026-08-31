import { useMemo } from 'react'
import type { League } from '../types'
import {
  leaguesForPlan,
  planFor,
  type PlanConfig,
  type PlanId,
} from '../config/plans'
import { FREE_LEAGUE_SLOTS } from '../services/odds/leagues'

export interface Entitlements extends PlanConfig {
  plan: PlanId
  isPremium: boolean
  loading: boolean
  /** ligas jugables ahora mismo (elección free del usuario, o las 10 en premium) */
  leagues: League[]
  /** las 3 ligas free elegidas, o null si aún no eligió (solo aplica a free) */
  freeLeagues: League[] | null
  /** true = usuario free que todavía no ha elegido sus 3 ligas */
  needsLeagueChoice: boolean
  allows: (league: League) => boolean
}

/**
 * Deriva los entitlements a partir del plan del usuario y su elección de ligas
 * free. Agnóstico de plataforma.
 */
export function useEntitlements(
  plan: PlanId = 'free',
  loading = false,
  freeLeagues: League[] | null = null,
): Entitlements {
  return useMemo(() => {
    const config = planFor(plan)
    const isPremium = plan === 'premium'
    const leagues = leaguesForPlan(plan, freeLeagues)
    const chosen =
      freeLeagues && freeLeagues.length === FREE_LEAGUE_SLOTS ? freeLeagues : null
    return {
      ...config,
      plan,
      isPremium,
      loading,
      leagues,
      freeLeagues: chosen,
      needsLeagueChoice: !isPremium && !loading && chosen === null,
      allows: (league: League) => leagues.includes(league),
    }
    // freeLeagues se compara por contenido vía la key de abajo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, loading, (freeLeagues ?? []).join(',')])
}
