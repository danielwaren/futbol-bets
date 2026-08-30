import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BetDraft, BetStatus } from '../types'
import {
  createBet,
  deleteBet,
  listBets,
  reopenBet,
  requestSettle,
  settleBet,
  updateBet,
} from '../services/bets'
export const betKeys = {
  list: (bankrollId: string | undefined) => ['bets', bankrollId] as const,
}

export function useBets(bankrollId: string | undefined) {
  return useQuery({
    queryKey: betKeys.list(bankrollId),
    queryFn: () => listBets(bankrollId as string),
    enabled: Boolean(bankrollId),
  })
}

function useBetMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bets'] })
      qc.invalidateQueries({ queryKey: ['bankroll'] })
    },
  })
}

export function useCreateBet() {
  return useBetMutation(
    ({ bankrollId, draft }: { bankrollId: string; draft: BetDraft }) =>
      createBet(bankrollId, draft),
  )
}

export function useUpdateBet() {
  return useBetMutation(({ id, draft }: { id: string; draft: BetDraft }) =>
    updateBet(id, draft),
  )
}

export function useSettleBet() {
  return useBetMutation(
    ({ id, status }: { id: string; status: Exclude<BetStatus, 'pending'> }) =>
      settleBet(id, status),
  )
}

export function useReopenBet() {
  return useBetMutation((id: string) => reopenBet(id))
}

export function useDeleteBet() {
  return useBetMutation((id: string) => deleteBet(id))
}

/** Resuelve automáticamente las apuestas del usuario cuyos partidos terminaron. */
export function useSettleAll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => requestSettle(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bets'] })
      qc.invalidateQueries({ queryKey: ['bankroll'] })
    },
  })
}
