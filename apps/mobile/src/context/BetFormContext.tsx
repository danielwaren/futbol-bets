import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Bet, BetDraft, BetPrefill, League } from '@futbolismo/core'
import { BetFormModal } from '@/components/bets/BetFormModal'
import { CreateBankrollModal } from '@/components/bankroll/CreateBankrollModal'
import { useBankrollContext } from '@/context/BankrollContext'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useCreateBankroll } from '@futbolismo/core'
import { useCreateBet, useUpdateBet } from '@futbolismo/core'
import { LEAGUES } from '@futbolismo/core'

interface BetFormContextValue {
  openNew: (prefill?: BetPrefill) => void
  openEdit: (bet: Bet) => void
}

const BetFormContext = createContext<BetFormContextValue | null>(null)

export function BetFormProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [prefill, setPrefill] = useState<BetPrefill | undefined>()
  const [editing, setEditing] = useState<Bet | undefined>()
  const [pendingLeague, setPendingLeague] = useState<League | null>(null)

  const { bankrollForLeague } = useBankrollContext()
  const entitlements = useEntitlements()
  const createBankroll = useCreateBankroll()
  const createBet = useCreateBet()
  const updateBet = useUpdateBet()

  const openNew = useCallback((p?: BetPrefill) => {
    setEditing(undefined)
    setPrefill(p)
    setOpen(true)
  }, [])

  const openEdit = useCallback((bet: Bet) => {
    setPrefill(undefined)
    setEditing(bet)
    setOpen(true)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    createBet.reset()
    updateBet.reset()
  }, [createBet, updateBet])

  const value = useMemo(() => ({ openNew, openEdit }), [openNew, openEdit])

  function submit(draft: BetDraft) {
    if (editing) {
      updateBet.mutate({ id: editing.id, draft }, { onSuccess: close })
      return
    }
    const target = bankrollForLeague(draft.league)
    if (!target) {
      // Premium sin banca para esa liga: pedir crearla y reabrir el formulario.
      setPendingLeague(draft.league)
      setOpen(false)
      return
    }
    createBet.mutate(
      { bankrollId: target.id, draft },
      { onSuccess: close },
    )
  }

  return (
    <BetFormContext.Provider value={value}>
      {children}

      <BetFormModal
        open={open}
        prefill={prefill}
        editing={editing}
        allowedLeagues={entitlements.leagues}
        submitting={createBet.isPending || updateBet.isPending}
        error={createBet.error ?? updateBet.error}
        onClose={close}
        onSubmit={submit}
      />

      <CreateBankrollModal
        open={pendingLeague != null}
        title={
          pendingLeague
            ? `Crea tu banca de ${LEAGUES[pendingLeague].shortLabel}`
            : 'Crear banca'
        }
        forcedLeague={pendingLeague}
        submitting={createBankroll.isPending}
        error={createBankroll.error}
        onClose={() => setPendingLeague(null)}
        onSubmit={(params) =>
          createBankroll.mutate(params, {
            onSuccess: () => {
              setPendingLeague(null)
              setOpen(true)
            },
          })
        }
      />
    </BetFormContext.Provider>
  )
}

export function useBetForm(): BetFormContextValue {
  const ctx = useContext(BetFormContext)
  if (!ctx) throw new Error('useBetForm debe usarse dentro de <BetFormProvider>')
  return ctx
}
