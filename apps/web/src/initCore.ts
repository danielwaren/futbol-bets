// Side-effect: configura @futbolismo/core. Debe importarse ANTES que App.
// Import de subpath (no del barrel) para no evaluar supabase/odds antes de tiempo.
import { initCore } from '@futbolismo/core/env'

initCore({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  supabaseStorage:
    typeof window !== 'undefined' ? window.localStorage : undefined,
  detectSessionInUrl: true,
  oddsProvider:
    (import.meta.env.VITE_ODDS_PROVIDER as 'mock' | 'supabase' | undefined) ??
    'supabase',
})
