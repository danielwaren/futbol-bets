import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { PaywallScreen } from '@/components/premium/PaywallScreen'

interface PaywallContextValue {
  openPaywall: (reason?: string) => void
}

const PaywallContext = createContext<PaywallContextValue | null>(null)

export function PaywallProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string | undefined>()

  const openPaywall = useCallback((r?: string) => {
    setReason(r)
    setOpen(true)
  }, [])

  const value = useMemo(() => ({ openPaywall }), [openPaywall])

  return (
    <PaywallContext.Provider value={value}>
      {children}
      <PaywallScreen
        open={open}
        reason={reason}
        onClose={() => setOpen(false)}
      />
    </PaywallContext.Provider>
  )
}

export function usePaywall(): PaywallContextValue {
  const ctx = useContext(PaywallContext)
  if (!ctx) throw new Error('usePaywall debe usarse dentro de <PaywallProvider>')
  return ctx
}
