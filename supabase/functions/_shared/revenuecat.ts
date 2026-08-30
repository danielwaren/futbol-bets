// Utilidades compartidas para leer el estado de suscripción desde RevenueCat.
// (Cada edge function incluye su propia copia al desplegar; esto es la referencia.)

const RC_API = 'https://api.revenuecat.com/v1'
export const PREMIUM_ENTITLEMENT = 'premium'

export interface EntitlementState {
  premium: boolean
  expiresAt: string | null
  store: string | null
}

/** Consulta el subscriber en RevenueCat y devuelve el estado del entitlement premium. */
export async function fetchEntitlement(
  appUserId: string,
  secretKey: string,
): Promise<EntitlementState> {
  const res = await fetch(
    `${RC_API}/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } },
  )
  if (!res.ok) {
    throw new Error(`RevenueCat ${res.status}: ${(await res.text()).slice(0, 160)}`)
  }
  const body = await res.json()
  const ent = body?.subscriber?.entitlements?.[PREMIUM_ENTITLEMENT]
  if (!ent) return { premium: false, expiresAt: null, store: null }

  const expires: string | null = ent.expires_date ?? null // null = lifetime
  const active = expires === null || new Date(expires).getTime() > Date.now()

  // Store de la compra que activó el entitlement
  const prodId: string | undefined = ent.product_identifier
  const store =
    prodId && body?.subscriber?.subscriptions?.[prodId]?.store
      ? body.subscriber.subscriptions[prodId].store
      : null

  return { premium: active, expiresAt: expires, store }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const looksLikeUserId = (s: unknown): s is string =>
  typeof s === 'string' && UUID_RE.test(s)
