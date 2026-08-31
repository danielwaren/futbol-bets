import { useSyncExternalStore } from 'react'
import { getItem, setItem } from './storage'

const ONBOARDING_KEY = 'fb.onboardingSeen.v1'

/** null = todavía leyendo AsyncStorage */
let seen: boolean | null = null
let loading = false
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

async function load() {
  if (loading) return
  loading = true
  seen = (await getItem(ONBOARDING_KEY)) === '1'
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (seen === null) void load()
  return () => {
    listeners.delete(listener)
  }
}

const snapshot = () => seen

/**
 * Store suscribible (no solo AsyncStorage) para que el gate de navegación
 * reaccione al instante cuando se completa el onboarding; si no, seguiría
 * leyendo el valor viejo y rebotaría de vuelta a /onboarding.
 */
export function useOnboardingSeen(): boolean | null {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

export async function markOnboardingSeen(): Promise<void> {
  seen = true
  emit()
  await setItem(ONBOARDING_KEY, '1')
}
