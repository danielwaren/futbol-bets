// Webhook de RevenueCat: fuente de verdad de la suscripción.
// Config en RevenueCat: Project > Integrations > Webhooks
//   URL:    https://<ref>.supabase.co/functions/v1/revenuecat-webhook
//   Header: Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>
// verify_jwt = false (RC no manda un JWT de Supabase; validamos el header nosotros).
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RC_SECRET = Deno.env.get('REVENUECAT_SECRET_KEY') ?? ''
const WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? ''

const RC_API = 'https://api.revenuecat.com/v1'
const PREMIUM = 'premium'
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function fetchEntitlement(appUserId: string) {
  const res = await fetch(
    `${RC_API}/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: { Authorization: `Bearer ${RC_SECRET}` } },
  )
  if (!res.ok) throw new Error(`RevenueCat ${res.status}`)
  const body = await res.json()
  const ent = body?.subscriber?.entitlements?.[PREMIUM]
  if (!ent) return { premium: false, expiresAt: null as string | null }
  const expires: string | null = ent.expires_date ?? null
  const active = expires === null || new Date(expires).getTime() > Date.now()
  return { premium: active, expiresAt: expires }
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok')
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const auth = req.headers.get('Authorization') ?? ''
  if (!WEBHOOK_SECRET || auth !== `Bearer ${WEBHOOK_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  let payload: { event?: Record<string, unknown> }
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }
  const event = payload.event ?? {}
  const appUserId = String(event.app_user_id ?? '')
  const eventType = String(event.type ?? 'UNKNOWN')
  const store = (event.store as string) ?? null
  const aliases = (event.aliases as string[]) ?? []

  // Elige el id que parezca un user_id de Supabase (RC puede mandar alias anónimos).
  const userId = [appUserId, ...aliases].find((a) => UUID_RE.test(a)) ?? null

  let expiresAt: string | null = null
  let premium = false
  if (userId && RC_SECRET) {
    try {
      const s = await fetchEntitlement(userId)
      premium = s.premium
      expiresAt = s.expiresAt
    } catch (e) {
      // Fallback: deducir del propio evento
      const em = event.expiration_at_ms as number | undefined
      expiresAt = em ? new Date(em).toISOString() : null
      premium = !['CANCELLATION', 'EXPIRATION', 'SUBSCRIPTION_PAUSED'].includes(
        eventType,
      )
      console.warn('[rc-webhook] fallback', e instanceof Error ? e.message : e)
    }
  }

  if (userId) {
    await admin
      .from('profiles')
      .update({
        plan: premium ? 'premium' : 'free',
        plan_source: premium ? 'revenuecat' : null,
        plan_expires_at: expiresAt,
      })
      .eq('id', userId)
  }

  await admin.from('subscription_events').insert({
    user_id: userId,
    app_user_id: appUserId,
    event_type: eventType,
    store,
    entitlement: PREMIUM,
    expires_at: expiresAt,
    raw: event,
  })

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
