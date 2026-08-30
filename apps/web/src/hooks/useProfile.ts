import { useProfileQuery, type Profile } from '@futbolismo/core'
import { useAuth } from '@/context/AuthContext'

export type { Profile }

export function useProfile() {
  const { userId } = useAuth()
  return useProfileQuery(userId)
}
