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
import { useActiveBankrolls } from '@futbolismo/core'
import { useAuth } from './AuthContext'
import { useEntitlements } from '@/hooks/useEntitlements'
import { getItem, setItem } from '@/lib/storage'

const STORAGE_KEY = 'fb.selectedBankrollId'

interface BankrollContextValue {
  bankrolls: Bankroll[]
  selected: Bankroll | null
  selectBankroll: (id: string) => void
  bankrollForLeague: (league: League) => Bankroll | null
  isLoading: boolean
  isError: boolean
  error: unknown
  needsFirstBankroll: boolean
}

const BankrollContext = createContext<BankrollContextValue | null>(null)

export function BankrollProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const entitlements = useEntitlements()
  const query = useActiveBankrolls(userId)
  const bankrolls = useMemo(() => query.data ?? [], [query.data])

  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    getItem(STORAGE_KEY).then((v) => v && setSelectedId(v))
  }, [])

  const selectBankroll = useCallback((id: string) => {
    setSelectedId(id)
    void setItem(STORAGE_KEY, id)
  }, [])

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
      // Sin userId la query está deshabilitada y `isLoading` es false, así que
      // sin este guard el modal obligatorio de banca aparecía sin sesión.
      needsFirstBankroll:
        Boolean(userId) &&
        query.isSuccess &&
        bankrolls.length === 0,
    }),
    [
      userId,
      bankrolls,
      selected,
      selectBankroll,
      bankrollForLeague,
      query.isLoading,
      query.isError,
      query.isSuccess,
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
