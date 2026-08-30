import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { useEntitlements } from '@/hooks/useEntitlements'
import { isNative } from '@/lib/platform'
import { hideBanner, showBanner } from '@/lib/ads'
import {
  configurePurchases,
  entitlementActive,
  getCustomerInfo,
  getOfferings,
  logOutPurchases,
  onCustomerInfoUpdate,
  purchasePackage,
  purchasesAvailable,
  restorePurchases,
  syncEntitlement,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from '@/lib/purchases'

interface MonetizationContextValue {
  /** RevenueCat disponible (app nativa configurada). */
  storeAvailable: boolean
  offerings: PurchasesOfferings | null
  loadingOfferings: boolean
  purchase: (pkg: PurchasesPackage) => Promise<void>
  restore: () => Promise<void>
  busy: boolean
  error: unknown
}

const MonetizationContext = createContext<MonetizationContextValue | null>(null)

export function MonetizationProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const entitlements = useEntitlements()
  const qc = useQueryClient()

  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null)
  const [loadingOfferings, setLoadingOfferings] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const syncingRef = useRef(false)

  const refreshProfile = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['profile'] })
  }, [qc])

  const reconcile = useCallback(
    async (info: CustomerInfo | null) => {
      if (!info || syncingRef.current) return
      const activeInStore = entitlementActive(info)
      // Si la tienda dice premium pero el perfil aún no, sincronizamos vía backend.
      if (activeInStore && entitlements.plan !== 'premium') {
        syncingRef.current = true
        try {
          await syncEntitlement()
          refreshProfile()
        } catch (e) {
          console.warn('[monetization] sync falló', e)
        } finally {
          syncingRef.current = false
        }
      }
    },
    [entitlements.plan, refreshProfile],
  )

  // Configura RevenueCat al iniciar sesión.
  useEffect(() => {
    if (!userId || !purchasesAvailable()) return
    let cleanup: (() => void) | undefined
    ;(async () => {
      await configurePurchases(userId)
      setLoadingOfferings(true)
      try {
        setOfferings(await getOfferings())
        await reconcile(await getCustomerInfo())
      } catch (e) {
        setError(e)
      } finally {
        setLoadingOfferings(false)
      }
      cleanup = await onCustomerInfoUpdate((info) => void reconcile(info))
    })()
    return () => cleanup?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Cierra sesión de RevenueCat cuando el usuario sale.
  useEffect(() => {
    if (!userId) void logOutPurchases()
  }, [userId])

  // Banner de AdMob según el plan.
  useEffect(() => {
    if (!isNative) return
    if (entitlements.ads) void showBanner()
    else void hideBanner()
  }, [entitlements.ads])

  const purchase = useCallback(
    async (pkg: PurchasesPackage) => {
      setBusy(true)
      setError(null)
      try {
        const info = await purchasePackage(pkg)
        await syncEntitlement().catch(() => {})
        refreshProfile()
        await reconcile(info)
      } catch (e) {
        // El usuario cancelando no es un error que mostrar.
        const code = (e as { code?: string })?.code
        if (code !== 'PURCHASE_CANCELLED_ERROR') setError(e)
      } finally {
        setBusy(false)
      }
    },
    [reconcile, refreshProfile],
  )

  const restore = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const info = await restorePurchases()
      await syncEntitlement().catch(() => {})
      refreshProfile()
      await reconcile(info)
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }, [reconcile, refreshProfile])

  const value = useMemo<MonetizationContextValue>(
    () => ({
      storeAvailable: purchasesAvailable(),
      offerings,
      loadingOfferings,
      purchase,
      restore,
      busy,
      error,
    }),
    [offerings, loadingOfferings, purchase, restore, busy, error],
  )

  return (
    <MonetizationContext.Provider value={value}>
      {children}
    </MonetizationContext.Provider>
  )
}

export function useMonetization(): MonetizationContextValue {
  const ctx = useContext(MonetizationContext)
  if (!ctx)
    throw new Error('useMonetization debe usarse dentro de <MonetizationProvider>')
  return ctx
}
