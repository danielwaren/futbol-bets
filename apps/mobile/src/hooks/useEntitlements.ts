import {
  useEntitlements as deriveEntitlements,
  type Entitlements,
} from '@futbolismo/core'
import { useProfile } from './useProfile'

export type { Entitlements }

export function useEntitlements(): Entitlements {
  const { data: profile, isLoading } = useProfile()
  return deriveEntitlements(
    profile?.plan ?? 'free',
    isLoading,
    profile?.freeLeagues ?? null,
  )
}
