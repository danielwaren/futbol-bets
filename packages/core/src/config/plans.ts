import type { League } from '../types'
import {
  ALL_LEAGUE_IDS,
  DEFAULT_FREE_LEAGUE_IDS,
  FREE_LEAGUE_SLOTS,
} from '../services/odds/leagues'

export type PlanId = 'free' | 'premium'

export interface PlanConfig {
  id: PlanId
  label: string
  /**
   * Ligas del plan. En `free` es un valor *por defecto* (el trío fallback);
   * las ligas efectivas del usuario salen de `leaguesForPlan()` /
   * `useEntitlements()` con su elección guardada.
   */
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
    leagues: DEFAULT_FREE_LEAGUE_IDS,
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

/**
 * Ligas efectivas para un plan:
 * - premium → las 10.
 * - free → las 3 que eligió el usuario (`freeLeagues`), o el trío por defecto
 *   mientras no haya elegido.
 */
export function leaguesForPlan(
  plan: PlanId | undefined | null,
  freeLeagues?: League[] | null,
): League[] {
  if ((plan ?? 'free') === 'premium') return ALL_LEAGUE_IDS
  if (freeLeagues && freeLeagues.length === FREE_LEAGUE_SLOTS) return freeLeagues
  return DEFAULT_FREE_LEAGUE_IDS
}

export function leagueAllowed(
  plan: PlanId | undefined | null,
  league: League,
  freeLeagues?: League[] | null,
): boolean {
  return leaguesForPlan(plan, freeLeagues).includes(league)
}
