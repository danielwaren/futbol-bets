// Borra la cuenta del usuario autenticado: auth.users (cascada -> profiles,
// bankrolls, bets) y, si hay clave, el subscriber en RevenueCat.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const RC_SECRET = Deno.env.get('REVENUECAT_SECRET_KEY') ?? ''

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

  const authHeader = req.headers.get('Authorization') ?? ''
  const asUser = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })
  const { data: userData, error: userErr } = await asUser.auth.getUser()
  if (userErr || !userData.user) return json({ error: 'No autenticado' }, 401)
  const userId = userData.user.id

  // Best-effort: eliminar el subscriber en RevenueCat.
  if (RC_SECRET) {
    try {
      await fetch(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${RC_SECRET}` } },
      )
    } catch (e) {
      console.warn('[delete-account] RC', e instanceof Error ? e.message : e)
    }
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  })
  // El FK on delete cascade limpia profiles / bankrolls / bets.
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return json({ error: error.message }, 500)

  return json({ ok: true })
})
