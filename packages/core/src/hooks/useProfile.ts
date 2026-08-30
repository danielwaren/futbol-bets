import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { PlanId } from '../config/plans'

export interface Profile {
  id: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
  plan: PlanId
  planExpiresAt: string | null
}

async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url, plan, plan_expires_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error

  // Fallback defensivo si el trigger aún no creó la fila.
  if (!data) {
    const { data: created, error: upErr } = await supabase
      .from('profiles')
      .upsert({ id: userId }, { onConflict: 'id' })
      .select('id, email, display_name, avatar_url, plan, plan_expires_at')
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
}): Profile {
  const expired =
    row.plan_expires_at != null && new Date(row.plan_expires_at) < new Date()
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    plan: row.plan === 'premium' && !expired ? 'premium' : 'free',
    planExpiresAt: row.plan_expires_at,
  }
}

export function useProfileQuery(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId as string),
    enabled: Boolean(userId),
  })
}
