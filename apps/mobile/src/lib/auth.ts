import * as AuthSession from 'expo-auth-session'
import { getQueryParams } from 'expo-auth-session/build/QueryParams'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@futbolismo/core'
import { googleWebClientId, isExpoGo } from './platform'

WebBrowser.maybeCompleteAuthSession()

/**
 * Login con Google, por dos caminos:
 *
 * - **Dev build / release**: SDK nativo de Google. Selector de cuentas del
 *   sistema, una pulsación, sin salir de la app.
 * - **Expo Go**: no hay módulo nativo → OAuth de Supabase en el navegador.
 *   Google redirige a `https://<ref>.supabase.co/auth/v1/callback` (una URL
 *   https que Google sí acepta) y Supabase devuelve al esquema de la app.
 *
 * El camino del navegador NO necesita ninguna credencial en el cliente: el
 * Client ID y el Secret viven en el proveedor Google del dashboard de Supabase.
 */
export function nativeGoogleAvailable(): boolean {
  return !isExpoGo && Boolean(googleWebClientId)
}

/** Crea la sesión a partir de la URL de vuelta del navegador. */
export async function createSessionFromUrl(url: string): Promise<boolean> {
  const { params, errorCode } = getQueryParams(url)
  if (errorCode) throw new Error(errorCode)

  const { access_token, refresh_token } = params
  if (!access_token || !refresh_token) return false

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  })
  if (error) throw error
  return true
}

async function signInWithGoogleNative(): Promise<void> {
  // require perezoso: en Expo Go este módulo nativo no existe y no debe tocarse.
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

async function signInWithGoogleBrowser(): Promise<void> {
  // En Expo Go devuelve exp://<ip>:8081/--/...; en un build, futbolismo://
  const redirectTo = AuthSession.makeRedirectUri()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  })
  if (error) throw error
  if (!data?.url) throw new Error('Supabase no devolvió la URL de autorización.')

  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
  if (res.type !== 'success') return // el usuario cerró el navegador

  const ok = await createSessionFromUrl(res.url)
  if (!ok) {
    throw new Error(
      'Google no devolvió una sesión. Revisa que la URL de redirección esté ' +
        'permitida en Supabase (Authentication → URL Configuration).',
    )
  }
}

export async function signInWithGoogle(): Promise<void> {
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
      /* no pasa nada si no había sesión nativa de Google */
    }
  }
  await supabase.auth.signOut()
}
