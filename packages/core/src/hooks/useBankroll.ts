import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { League } from '../types'
import {
  archiveBankroll,
  createBankroll,
  listActiveBankrolls,
  listBankrolls,
  renameBankroll,
} from '../services/bankroll'

export const bankrollKeys = {
  active: (userId: string | null) => ['bankroll', 'active', userId] as const,
  list: (userId: string | null) => ['bankroll', 'list', userId] as const,
}

export function useActiveBankrolls(userId: string | null) {
  return useQuery({
    queryKey: bankrollKeys.active(userId),
    queryFn: listActiveBankrolls,
    enabled: Boolean(userId),
  })
}

export function useAllBankrolls(userId: string | null) {
  return useQuery({
    queryKey: bankrollKeys.list(userId),
    queryFn: listBankrolls,
    enabled: Boolean(userId),
  })
}

function useInvalidateBankroll() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['bankroll'] })
    qc.invalidateQueries({ queryKey: ['bets'] })
  }
}

export function useCreateBankroll() {
  const invalidate = useInvalidateBankroll()
  return useMutation({
    mutationFn: (params: {
      initialAmount: number
      name?: string
      league?: League | null
    }) => createBankroll(params),
    onSuccess: invalidate,
  })
}

export function useResetBankroll() {
  const invalidate = useInvalidateBankroll()
  return useMutation({
    mutationFn: async (params: {
      currentId: string
      initialAmount: number
      name?: string
      league?: League | null
    }) => {
      await archiveBankroll(params.currentId)
      return createBankroll({
        initialAmount: params.initialAmount,
        name: params.name,
        league: params.league ?? null,
      })
    },
    onSuccess: invalidate,
  })
}

export function useRenameBankroll() {
  const invalidate = useInvalidateBankroll()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameBankroll(id, name),
    onSuccess: invalidate,
  })
}
