import { supabase } from '@futbolismo/core'

// En Expo Go RevenueCat no está disponible. Estos tipos son mínimos; el dev
// build (fase 8) los sustituye por los de `react-native-purchases`.
export interface PurchasesPackage {
  identifier: string
  packageType: string
  product: { title: string; priceString: string }
}
export interface PurchasesOfferings {
  current: { availablePackages: PurchasesPackage[] } | null
}
export interface CustomerInfo {
  entitlements: { active: Record<string, unknown> }
}

export const purchasesAvailable = () => false

export async function configurePurchases(_userId: string): Promise<void> {}
export async function logOutPurchases(): Promise<void> {}
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  return null
}
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  return null
}
export async function purchasePackage(
  _pkg: PurchasesPackage,
): Promise<CustomerInfo> {
  throw new Error('Compras no disponibles en esta versión.')
}
export async function restorePurchases(): Promise<CustomerInfo> {
  throw new Error('Compras no disponibles en esta versión.')
}
export async function onCustomerInfoUpdate(
  _cb: (info: CustomerInfo) => void,
): Promise<() => void> {
  return () => {}
}
export function entitlementActive(_info: CustomerInfo): boolean {
  return false
}

/** Verifica el entitlement con RevenueCat en el backend y sincroniza el plan. */
export async function syncEntitlement(): Promise<{ plan: string } | null> {
  const { data, error } = await supabase.functions.invoke('sync-entitlement', {
    body: {},
  })
  if (error) throw error
  return data ?? null
}
