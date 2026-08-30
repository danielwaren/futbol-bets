import {
  SocialLogin,
  type GoogleLoginResponseOnline,
} from '@capgo/capacitor-social-login'
import { supabase } from '@futbolismo/core'
import { googleWebClientId } from './platform'

let initialized = false

async function ensureInit() {
  if (initialized) return
  if (!googleWebClientId) {
    throw new Error(
      'Falta VITE_GOOGLE_WEB_CLIENT_ID para el login nativo con Google.',
    )
  }
  await SocialLogin.initialize({
    google: { webClientId: googleWebClientId, mode: 'online' },
  })
  initialized = true
}

function urlSafeNonce(): string {
  const a = new Uint8Array(32)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input),
  )
  return Array.from(new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

/**
 * Login nativo con Google (Android) → Supabase.
 * Patrón de nonce recomendado por Capgo/Supabase: se manda el hash a Google y el
 * nonce en claro a Supabase, que lo re-hashea y compara.
 */
export async function signInWithGoogleNative(retry = false): Promise<void> {
  await ensureInit()

  const rawNonce = urlSafeNonce()
  const nonceDigest = await sha256Hex(rawNonce)

  const res = await SocialLogin.login({
    provider: 'google',
    options: { scopes: ['email', 'profile'], nonce: nonceDigest },
  })

  if (res.result.responseType !== 'online') {
    throw new Error('El login de Google devolvió un modo no soportado.')
  }
  const google = res.result as GoogleLoginResponseOnline
  if (!google.idToken) throw new Error('Google no devolvió idToken.')

  const decoded = decodeJwt(google.idToken)
  const signIn = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: google.idToken,
    ...(decoded?.nonce ? { nonce: rawNonce } : {}),
  })

  if (signIn.error) {
    // Un idToken cacheado puede fallar la validación de nonce: reintentar una vez.
    if (!retry) {
      try {
        await SocialLogin.logout({ provider: 'google' })
      } catch {
        /* ignore */
      }
      return signInWithGoogleNative(true)
    }
    throw signIn.error
  }
}

export async function signOutNative(): Promise<void> {
  try {
    await SocialLogin.logout({ provider: 'google' })
  } catch {
    /* ignore */
  }
}
