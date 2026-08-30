import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js'
import { coreConfig } from './env'

let _client: SupabaseClient | null = null

function build(): SupabaseClient {
  const c = coreConfig()
  const auth: NonNullable<SupabaseClientOptions<'public'>['auth']> = {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: c.detectSessionInUrl ?? false,
  }
  if (c.supabaseStorage) {
    // @ts-expect-error storage difiere entre web (Storage) y RN (AsyncStorage)
    auth.storage = c.supabaseStorage
  }
  return createClient(c.supabaseUrl, c.supabaseAnonKey, { auth })
}

export function getSupabase(): SupabaseClient {
  if (!_client) _client = build()
  return _client
}

/**
 * Cliente perezoso: no se crea hasta el primer acceso a una propiedad, de modo
 * que `import { supabase }` no depende del orden de `initCore()`.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase() as unknown as Record<string | symbol, unknown>
    const value = client[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
