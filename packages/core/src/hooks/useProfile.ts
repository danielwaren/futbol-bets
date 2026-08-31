import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { League } from '../types'
import type { PlanId } from '../config/plans'
import { ALL_LEAGUE_IDS, FREE_LEAGUE_SLOTS } from '../services/odds/leagues'

export interface Profile {
  id: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
  plan: PlanId
  planExpiresAt: string | null
  /** las 3 ligas free elegidas; null = todavía no eligió */
  freeLeagues: League[] | null
}

const PROFILE_COLS =
  'id, email, display_name, avatar_url, plan, plan_expires_at, free_leagues'

async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLS)
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error

  // Fallback defensivo si el trigger aún no creó la fila.
  if (!data) {
    const { data: created, error: upErr } = await supabase
      .from('profiles')
      .upsert({ id: userId }, { onConflict: 'id' })
      .select(PROFILE_COLS)
      .single()
    if (upErr) throw upErr
    return mapProfile(created)
  }
  return mapProfile(data)
}

function mapProfile(row: {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  plan: string
  plan_expires_at: string | null
  free_leagues: string[] | null
}): Profile {
  const expired =
    row.plan_expires_at != null && new Date(row.plan_expires_at) < new Date()
  const freeLeagues =
    Array.isArray(row.free_leagues) &&
    row.free_leagues.length === FREE_LEAGUE_SLOTS &&
    row.free_leagues.every((l) => (ALL_LEAGUE_IDS as string[]).includes(l))
      ? (row.free_leagues as League[])
      : null
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    plan: row.plan === 'premium' && !expired ? 'premium' : 'free',
    planExpiresAt: row.plan_expires_at,
    freeLeagues,
  }
}

export function useProfileQuery(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId as string),
    enabled: Boolean(userId),
  })
}

/**
 * Guarda las 3 ligas free del usuario. El trigger `profiles_validate_free_leagues`
 * en la BD rechaza cualquier valor que no sean 3 ligas válidas y distintas.
 */
export function useSetFreeLeagues(userId: string | null | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (leagues: League[]) => {
      if (leagues.length !== FREE_LEAGUE_SLOTS) {
        throw new Error(`Elige exactamente ${FREE_LEAGUE_SLOTS} ligas.`)
      }
      const { error } = await supabase
        .from('profiles')
        .update({ free_leagues: leagues })
        .eq('id', userId as string)
      if (error) throw error
      return leagues
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', userId] })
    },
  })
}
