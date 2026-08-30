import { isNative } from './platform'
import { PREMIUM_ENTITLEMENT, revenueCatAndroidKey } from '@/config/monetization'
import { supabase } from '@futbolismo/core'

// Los tipos del plugin solo se usan como `type` para no forzar el import en web.
import type {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from '@revenuecat/purchases-capacitor'

export type { CustomerInfo, PurchasesOfferings, PurchasesPackage }

let configuredFor: string | null = null

async function mod() {
  return await import('@revenuecat/purchases-capacitor')
}

/** ¿RevenueCat está disponible aquí? (solo app nativa con API key). */
export const purchasesAvailable = () => isNative && Boolean(revenueCatAndroidKey)

/** Configura RevenueCat y lo asocia al usuario de Supabase. Idempotente. */
export async function configurePurchases(userId: string): Promise<void> {
  if (!purchasesAvailable() || configuredFor === userId) return
  const { Purchases, LOG_LEVEL } = await mod()
  await Purchases.setLogLevel({
    level: import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR,
  })
  if (configuredFor === null) {
    await Purchases.configure({
      apiKey: revenueCatAndroidKey as string,
      appUserID: userId,
    })
  } else {
    await Purchases.logIn({ appUserID: userId })
  }
  configuredFor = userId
}

export async function logOutPurchases(): Promise<void> {
  if (!purchasesAvailable() || !configuredFor) return
  try {
    const { Purchases } = await mod()
    await Purchases.logOut()
  } catch {
    /* ignore */
  }
  configuredFor = null
}

export function entitlementActive(info: CustomerInfo): boolean {
  return Boolean(info.entitlements.active[PREMIUM_ENTITLEMENT])
}

export function entitlementExpiry(info: CustomerInfo): string | null {
  return info.entitlements.active[PREMIUM_ENTITLEMENT]?.expirationDate ?? null
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!purchasesAvailable()) return null
  const { Purchases } = await mod()
  const { customerInfo } = await Purchases.getCustomerInfo()
  return customerInfo
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!purchasesAvailable()) return null
  const { Purchases } = await mod()
  return await Purchases.getOfferings()
}

export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<CustomerInfo> {
  const { Purchases } = await mod()
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
  return customerInfo
}

export async function restorePurchases(): Promise<CustomerInfo> {
  const { Purchases } = await mod()
  const { customerInfo } = await Purchases.restorePurchases()
  return customerInfo
}

export async function onCustomerInfoUpdate(
  cb: (info: CustomerInfo) => void,
): Promise<() => void> {
  if (!purchasesAvailable()) return () => {}
  const { Purchases } = await mod()
  const id = await Purchases.addCustomerInfoUpdateListener(cb)
  return () => {
    void Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: id })
  }
}

/**
 * Pide al backend que verifique el entitlement con RevenueCat y sincronice
 * `profiles.plan`. Se llama tras una compra/restore y al abrir la app.
 */
export async function syncEntitlement(): Promise<{ plan: string } | null> {
  const { data, error } = await supabase.functions.invoke('sync-entitlement', {
    body: {},
  })
  if (error) throw error
  return data ?? null
}
