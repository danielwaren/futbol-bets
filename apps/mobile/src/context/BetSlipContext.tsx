import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  MAX_PARLAY_LEGS,
  MIN_PARLAY_LEGS,
  parlayOdds,
  useCreateParlay,
  type BetLegDraft,
} from '@futbolismo/core'
import { BetSlipSheet } from '@/components/bets/BetSlipSheet'
import { useBankrollContext } from '@/context/BankrollContext'

/** Modo de la pantalla de partidos: tocar una cuota apuesta o suma al cupón. */
export type SlipMode = 'single' | 'parlay'

interface BetSlipContextValue {
  mode: SlipMode
  setMode: (m: SlipMode) => void
  legs: BetLegDraft[]
  odds: number
  /** ¿Esta selección exacta ya está en el cupón? */
  isPicked: (matchId: string | null, market: string, selection: string) => boolean
  /** ¿Hay ya alguna selección de este partido? */
  hasMatch: (matchId: string | null) => boolean
  /** Añade, o quita si es la misma selección. Una sola pata por partido. */
  toggle: (leg: BetLegDraft) => void
  remove: (index: number) => void
  clear: () => void
  open: () => void
  full: boolean
  canPlace: boolean
}

const BetSlipContext = createContext<BetSlipContextValue | null>(null)

const sameLeg = (a: BetLegDraft, matchId: string | null, market: string, selection: string) =>
  a.matchId === matchId && a.market === market && a.selection === selection

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<SlipMode>('single')
  const [legs, setLegs] = useState<BetLegDraft[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)

  const { selected: bankroll } = useBankrollContext()
  const createParlay = useCreateParlay()

  const clear = useCallback(() => setLegs([]), [])

  const toggle = useCallback((leg: BetLegDraft) => {
    setLegs((current) => {
      const exact = current.findIndex((l) =>
        sameLeg(l, leg.matchId, leg.market, leg.selection),
      )
      // Tocar la misma cuota otra vez la quita.
      if (exact >= 0) return current.filter((_, i) => i !== exact)

      // Dos selecciones del mismo partido están correlacionadas y ninguna casa
      // las admite (y `create_parlay` las rechaza): se reemplaza la anterior.
      const other = current.findIndex((l) => l.matchId === leg.matchId)
      if (other >= 0) {
        const next = [...current]
        next[other] = leg
        return next
      }

      if (current.length >= MAX_PARLAY_LEGS) return current
      return [...current, leg]
    })
  }, [])

  const remove = useCallback(
    (index: number) => setLegs((c) => c.filter((_, i) => i !== index)),
    [],
  )

  const isPicked = useCallback(
    (matchId: string | null, market: string, selection: string) =>
      legs.some((l) => sameLeg(l, matchId, market, selection)),
    [legs],
  )

  const hasMatch = useCallback(
    (matchId: string | null) => legs.some((l) => l.matchId === matchId),
    [legs],
  )

  const odds = useMemo(() => parlayOdds(legs), [legs])

  const value = useMemo<BetSlipContextValue>(
    () => ({
      mode,
      setMode: (m) => {
        setMode(m)
        if (m === 'single') setLegs([])
      },
      legs,
      odds,
      isPicked,
      hasMatch,
      toggle,
      remove,
      clear,
      open: () => setSheetOpen(true),
      full: legs.length >= MAX_PARLAY_LEGS,
      canPlace: legs.length >= MIN_PARLAY_LEGS,
    }),
    [mode, legs, odds, isPicked, hasMatch, toggle, remove, clear],
  )

  return (
    <BetSlipContext.Provider value={value}>
      {children}

      <BetSlipSheet
        open={sheetOpen}
        legs={legs}
        odds={odds}
        bankroll={bankroll}
        submitting={createParlay.isPending}
        error={createParlay.error}
        onRemove={remove}
        onClose={() => {
          setSheetOpen(false)
          createParlay.reset()
        }}
        onSubmit={({ stake, notes }) => {
          if (!bankroll) return
          createParlay.mutate(
            { bankrollId: bankroll.id, draft: { legs, stake, notes } },
            {
              onSuccess: () => {
                setSheetOpen(false)
                setLegs([])
                createParlay.reset()
              },
            },
          )
        }}
      />
    </BetSlipContext.Provider>
  )
}

export function useBetSlip(): BetSlipContextValue {
  const ctx = useContext(BetSlipContext)
  if (!ctx) throw new Error('useBetSlip debe usarse dentro de <BetSlipProvider>')
  return ctx
}
