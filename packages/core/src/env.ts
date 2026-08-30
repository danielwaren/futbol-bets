/**
 * Configuración inyectada por cada app (web / mobile) al arrancar, ANTES de
 * importar cualquier otra cosa de `@futbolismo/core`.
 *
 * Patrón: la app tiene un módulo `initCore` que se importa primero (side-effect).
 */

export interface CoreConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  /** localStorage-like (web) o AsyncStorage (React Native). */
  supabaseStorage?: unknown
  /** web = true (maneja el redirect OAuth); RN = false. */
  detectSessionInUrl?: boolean
  /** 'supabase' lee matches_cache; 'mock' genera fixtures locales. */
  oddsProvider: 'mock' | 'supabase'
}

let _config: CoreConfig | null = null

export function initCore(config: CoreConfig): void {
  _config = config
}

export function coreConfig(): CoreConfig {
  if (!_config) {
    throw new Error(
      '@futbolismo/core: initCore() no se ha llamado. Impórtalo primero en el entrypoint de la app.',
    )
  }
  return _config
}
