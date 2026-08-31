import * as AuthSession from 'expo-auth-session'
import * as Crypto from 'expo-crypto'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@futbolismo/core'
import { googleWebClientId, isExpoGo } from './platform'

WebBrowser.maybeCompleteAuthSession()

/**
 * Login con Google:
 * - **Dev build / release**: SDK nativo (`@react-native-google-signin/google-signin`),
 *   flujo de una pulsación, devuelve un `idToken` que pasamos a Supabase.
 * - **Expo Go**: no hay módulo nativo → fallback a `expo-auth-session` (navegador
 *   del sistema + redirect al scheme `futbolismo://`).
 *
 * Ambos caminos necesitan `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (OAuth 2.0 Client ID
 * de tipo "Web application", el mismo del provider Google de Supabase).
 */
export function nativeGoogleAvailable(): boolean {
  return !isExpoGo && Boolean(googleWebClientId)
}

async function signInWithGoogleNative(): Promise<void> {
  // require() perezoso: en Expo Go este módulo nativo no existe y no debe tocarse.
  const { GoogleSignin, statusCodes } =
    require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin')

  GoogleSignin.configure({ webClientId: googleWebClientId as string })

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
    const response = await GoogleSignin.signIn()

    if (response.type === 'cancelled') return
    const idToken = response.data?.idToken
    if (!idToken) throw new Error('Google no devolvió idToken.')

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    })
    if (error) throw error
  } catch (e) {
    const code = (e as { code?: string }).code
    if (code === statusCodes.SIGN_IN_CANCELLED) return
    throw e
  }
}

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
}

async function signInWithGoogleBrowser(): Promise<void> {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'futbolismo' })
  const rawNonce = Crypto.randomUUID()
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  )

  const request = new AuthSession.AuthRequest({
    clientId: googleWebClientId as string,
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

export async function signInWithGoogle(): Promise<void> {
  if (!googleWebClientId) {
    throw new Error(
      'Falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Usa el acceso por email o configúralo.',
    )
  }
  if (nativeGoogleAvailable()) return signInWithGoogleNative()
  return signInWithGoogleBrowser()
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  if (nativeGoogleAvailable()) {
    try {
      const { GoogleSignin } =
        require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin')
      await GoogleSignin.signOut()
    } catch {
      /* no pasa nada si no había sesión de Google nativa */
    }
  }
  await supabase.auth.signOut()
}
