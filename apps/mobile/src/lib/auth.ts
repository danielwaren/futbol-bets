import * as AuthSession from 'expo-auth-session'
import * as Crypto from 'expo-crypto'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@futbolismo/core'
import { googleWebClientId } from './platform'

WebBrowser.maybeCompleteAuthSession()

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
}

/**
 * Login con Google vía navegador (funciona en Expo Go). Usa el flujo implícito
 * con id_token + nonce y lo pasa a Supabase.
 */
export async function signInWithGoogle(): Promise<void> {
  if (!googleWebClientId) {
    throw new Error(
      'Falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Usa el acceso por email o configúralo.',
    )
  }

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'futbolismo' })
  const rawNonce = Crypto.randomUUID()
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  )

  const request = new AuthSession.AuthRequest({
    clientId: googleWebClientId,
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
    extraParams: { nonce: hashedNonce },
  })

  const result = await request.promptAsync(discovery)
  if (result.type !== 'success') {
    if (result.type === 'dismiss' || result.type === 'cancel') return
    throw new Error('El login con Google no se completó.')
  }

  const idToken = result.params.id_token
  if (!idToken) throw new Error('Google no devolvió id_token.')

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
    nonce: rawNonce,
  })
  if (error) throw error
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}
