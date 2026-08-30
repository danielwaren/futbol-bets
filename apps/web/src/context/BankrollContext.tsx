import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Bankroll, League } from '@futbolismo/core'
import { useAuth } from './AuthContext'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useActiveBankrolls } from '@futbolismo/core'

const STORAGE_KEY = 'fb.selectedBankrollId'

interface BankrollContextValue {
  bankrolls: Bankroll[]
  selected: Bankroll | null
  selectBankroll: (id: string) => void
  /** Banca que corresponde a una liga según el plan (global en free). */
  bankrollForLeague: (league: League) => Bankroll | null
  isLoading: boolean
  isError: boolean
  error: unknown
  /** No hay ninguna banca activa todavía. */
  needsFirstBankroll: boolean
}

const BankrollContext = createContext<BankrollContextValue | null>(null)

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function BankrollProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const entitlements = useEntitlements()
  const query = useActiveBankrolls(userId)
  const bankrolls = useMemo(() => query.data ?? [], [query.data])

  const [selectedId, setSelectedId] = useState<string | null>(() => readStored())

  const selectBankroll = useCallback((id: string) => {
    setSelectedId(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* ignore */
    }
  }, [])

  // Mantener una selección válida.
  useEffect(() => {
    if (!bankrolls.length) return
    const exists = bankrolls.some((b) => b.id === selectedId)
    if (!exists) setSelectedId(bankrolls[0].id)
  }, [bankrolls, selectedId])

  const selected = useMemo(
    () => bankrolls.find((b) => b.id === selectedId) ?? bankrolls[0] ?? null,
    [bankrolls, selectedId],
  )

  const bankrollForLeague = useCallback(
    (league: League): Bankroll | null => {
      if (!entitlements.bankrollPerLeague) {
        return bankrolls.find((b) => b.league === null) ?? bankrolls[0] ?? null
      }
      return bankrolls.find((b) => b.league === league) ?? null
    },
    [bankrolls, entitlements.bankrollPerLeague],
  )

  const value = useMemo<BankrollContextValue>(
    () => ({
      bankrolls,
      selected,
      selectBankroll,
      bankrollForLeague,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      needsFirstBankroll:
        !query.isLoading && !query.isError && bankrolls.length === 0,
    }),
    [
      bankrolls,
      selected,
      selectBankroll,
      bankrollForLeague,
      query.isLoading,
      query.isError,
      query.error,
    ],
  )

  return (
    <BankrollContext.Provider value={value}>{children}</BankrollContext.Provider>
  )
}

export function useBankrollContext(): BankrollContextValue {
  const ctx = useContext(BankrollContext)
  if (!ctx)
    throw new Error('useBankrollContext debe usarse dentro de <BankrollProvider>')
  return ctx
}
