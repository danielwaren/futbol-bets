// Side-effect: configura @futbolismo/core ANTES de cargar la app.
import { Platform } from 'react-native'
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { initCore } from '@futbolismo/core/env'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

/**
 * Sin estas variables el cliente de Supabase revienta con "supabaseUrl is
 * required" y la app queda en una pantalla del color de fondo, sin ninguna
 * pista de qué falta. Se comprueba aquí para fallar con un mensaje útil.
 *
 * Ojo en web: Vercel NO lee `eas.json` ni `.env` (está en .gitignore). Las
 * variables se configuran en Settings → Environment Variables del proyecto.
 */
if (!url || !anonKey) {
  const faltan = [
    !url && 'EXPO_PUBLIC_SUPABASE_URL',
    !anonKey && 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  ]
    .filter(Boolean)
    .join(', ')

  const donde =
    Platform.OS === 'web'
      ? 'Configúralas en Vercel → Settings → Environment Variables y vuelve a desplegar.'
      : 'Configúralas en apps/mobile/.env (local) o en el perfil de eas.json (build).'

  throw new Error(
    `Futbolismo no puede arrancar: faltan ${faltan}. ${donde}`,
  )
}

initCore({
  supabaseUrl: url,
  supabaseAnonKey: anonKey,
  supabaseStorage: AsyncStorage,
  // En web la sesión de OAuth vuelve como fragmento en la URL y Supabase debe
  // recogerla; en nativo llega por deep link y lo hace AuthContext.
  detectSessionInUrl: Platform.OS === 'web',
  oddsProvider:
    (process.env.EXPO_PUBLIC_ODDS_PROVIDER as 'mock' | 'supabase' | undefined) ??
    'supabase',
})
