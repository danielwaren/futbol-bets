import type { League } from '../types'
import { ALL_LEAGUE_IDS, FREE_LEAGUE_IDS } from '../services/odds/leagues'

export type PlanId = 'free' | 'premium'

export interface PlanConfig {
  id: PlanId
  label: string
  leagues: League[]
  maxBankrolls: number
  /** premium: una banca por liga; free: una banca global */
  bankrollPerLeague: boolean
  ads: boolean
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    label: 'Free',
    leagues: FREE_LEAGUE_IDS,
    maxBankrolls: 1,
    bankrollPerLeague: false,
    ads: true,
  },
  premium: {
    id: 'premium',
    label: 'Premium',
    leagues: ALL_LEAGUE_IDS,
    maxBankrolls: 10,
    bankrollPerLeague: true,
    ads: false,
  },
}

export function planFor(plan: PlanId | undefined | null): PlanConfig {
  return PLANS[plan ?? 'free'] ?? PLANS.free
}

export function leagueAllowed(plan: PlanId | undefined | null, league: League): boolean {
  return planFor(plan).leagues.includes(league)
}
