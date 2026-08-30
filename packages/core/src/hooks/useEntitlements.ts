import { useMemo } from 'react'
import type { League } from '../types'
import { planFor, type PlanConfig, type PlanId } from '../config/plans'

export interface Entitlements extends PlanConfig {
  plan: PlanId
  isPremium: boolean
  loading: boolean
  allows: (league: League) => boolean
}

/** Deriva los entitlements a partir del plan del usuario. Agnóstico de plataforma. */
export function useEntitlements(
  plan: PlanId = 'free',
  loading = false,
): Entitlements {
  return useMemo(() => {
    const config = planFor(plan)
    return {
      ...config,
      plan,
      isPremium: plan === 'premium',
      loading,
      allows: (league: League) => config.leagues.includes(league),
    }
  }, [plan, loading])
}
