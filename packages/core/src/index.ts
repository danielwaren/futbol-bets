// @futbolismo/core — lógica compartida web / mobile (agnóstica de plataforma).

export * from './env'
export * from './types'
export { supabase } from './supabase'
export { queryClient } from './queryClient'

export * from './utils/calc'
export * from './utils/settle'
export * from './utils/format'
export { cn } from './utils/cn'

export * from './config/plans'
export * from './config/site'
export * from './config/clubs'

export * from './services/bankroll'
export * from './services/bets'
export * from './services/matchCache'
export * from './services/standings'
export * from './services/odds'
export { mockOddsApi } from './services/odds/mockOddsApi'

export * from './hooks/useBankroll'
export * from './hooks/useBets'
export * from './hooks/useMatches'
export * from './hooks/useStandings'
export {
  useProfileQuery,
  useSetFreeLeagues,
  type Profile,
} from './hooks/useProfile'
export { useEntitlements, type Entitlements } from './hooks/useEntitlements'
