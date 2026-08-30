// Side-effect: configura @futbolismo/core ANTES de cargar la app.
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { initCore } from '@futbolismo/core/env'

initCore({
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL as string,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string,
  supabaseStorage: AsyncStorage,
  detectSessionInUrl: false,
  oddsProvider:
    (process.env.EXPO_PUBLIC_ODDS_PROVIDER as 'mock' | 'supabase' | undefined) ??
    'supabase',
})
