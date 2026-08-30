/** Identificador del entitlement en RevenueCat. */
export const PREMIUM_ENTITLEMENT = 'premium'

/** API key pública de RevenueCat para Android (empieza con `goog_`). */
export const revenueCatAndroidKey = import.meta.env
  .VITE_REVENUECAT_ANDROID_KEY as string | undefined

// --- AdMob ---
// IDs de PRUEBA de Google (funcionan siempre, no generan ingresos).
const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111'
const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712'

export const admobBannerId =
  (import.meta.env.VITE_ADMOB_BANNER_ID as string | undefined) || TEST_BANNER
export const admobInterstitialId =
  (import.meta.env.VITE_ADMOB_INTERSTITIAL_ID as string | undefined) ||
  TEST_INTERSTITIAL

/** true = usar IDs de prueba / marcar el dispositivo como test device. */
export const admobTestMode =
  import.meta.env.DEV || !import.meta.env.VITE_ADMOB_BANNER_ID

/** Intersticiales: implementados pero desactivados por defecto (UX). */
export const INTERSTITIAL_ENABLED = false
export const INTERSTITIAL_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6 h
