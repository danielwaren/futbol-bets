import { coreConfig } from '../../env'

/**
 * Proveedor de cuotas configurado en `initCore`:
 * - 'mock'     -> fixtures deterministas para desarrollo local sin pipeline.
 * - 'supabase' -> el cliente lee la tabla matches_cache (poblada por refresh-odds).
 *
 * Se resuelve de forma perezosa (función, no constante) para no llamar a
 * `coreConfig()` mientras se evalúa el barrel — `initCore()` puede no haberse
 * ejecutado todavía según el orden de módulos del bundler.
 */
export function oddsSource(): 'mock' | 'supabase' {
  return coreConfig().oddsProvider
}

export function usingMockOdds(): boolean {
  return oddsSource() === 'mock'
}

export * from './leagues'
export * from './provider'
