// Verifica el entitlement del usuario autenticado con RevenueCat y sincroniza
// `profiles.plan`. Lo llama la app tras una compra/restore y al abrir.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const RC_SECRET = Deno.env.get('REVENUECAT_SECRET_KEY') ?? ''

const RC_API = 'https://api.revenuecat.com/v1'
const PREMIUM = 'premium'

async function fetchEntitlement(appUserId: string) {
  const res = await fetch(
    `${RC_API}/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: { Authorization: `Bearer ${RC_SECRET}` } },
  )
  if (!res.ok) {
    throw new Error(`RevenueCat ${res.status}: ${(await res.text()).slice(0, 160)}`)
  }
  const body = await res.json()
  const ent = body?.subscriber?.entitlements?.[PREMIUM]
  if (!ent) return { premium: false, expiresAt: null as string | null }
  const expires: string | null = ent.expires_date ?? null
  const active = expires === null || new Date(expires).getTime() > Date.now()
  return { premium: active, expiresAt: expires }
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (!RC_SECRET) return json({ error: 'REVENUECAT_SECRET_KEY no configurada' }, 500)

  const authHeader = req.headers.get('Authorization') ?? ''
  const asUser = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })
  const { data: userData, error: userErr } = await asUser.auth.getUser()
  if (userErr || !userData.user) return json({ error: 'No autenticado' }, 401)
  const userId = userData.user.id

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  })

  let state: { premium: boolean; expiresAt: string | null }
  try {
    state = await fetchEntitlement(userId)
  } catch (e) {
    // Si el subscriber aún no existe en RC (404), lo tratamos como free.
    state = { premium: false, expiresAt: null }
    console.warn('[sync-entitlement]', e instanceof Error ? e.message : e)
  }

  const plan = state.premium ? 'premium' : 'free'
  const { error: upErr } = await admin
    .from('profiles')
    .update({
      plan,
      plan_source: state.premium ? 'revenuecat' : null,
      plan_expires_at: state.expiresAt,
    })
    .eq('id', userId)
  if (upErr) return json({ error: upErr.message }, 500)

  await admin.from('subscription_events').insert({
    user_id: userId,
    app_user_id: userId,
    event_type: 'sync',
    entitlement: PREMIUM,
    expires_at: state.expiresAt,
  })

  return json({ plan, plan_expires_at: state.expiresAt })
})
