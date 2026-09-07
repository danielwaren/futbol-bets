import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BetDraft, BetStatus, ParlayDraft } from '../types'
import {
  createBet,
  createParlay,
  deleteBet,
  listBets,
  reopenBet,
  reopenLeg,
  requestSettle,
  settleBet,
  settleLeg,
  updateBet,
  updateParlayStake,
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

export function useCreateParlay() {
  return useBetMutation(
    ({ bankrollId, draft }: { bankrollId: string; draft: ParlayDraft }) =>
      createParlay(bankrollId, draft),
  )
}

/** Lo único editable de una combinada creada: el monto (y las notas). */
export function useUpdateParlayStake() {
  return useBetMutation(
    ({ id, stake, notes }: { id: string; stake: number; notes: string | null }) =>
      updateParlayStake(id, stake, notes),
  )
}

/** Resuelve una pata a mano; el trigger recalcula la combinada entera. */
export function useSettleLeg() {
  return useBetMutation(
    ({ id, status }: { id: string; status: Exclude<BetStatus, 'pending'> }) =>
      settleLeg(id, status),
  )
}

export function useReopenLeg() {
  return useBetMutation((id: string) => reopenLeg(id))
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
