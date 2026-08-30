import { isNative } from './platform'
import {
  admobBannerId,
  admobInterstitialId,
  admobTestMode,
  INTERSTITIAL_ENABLED,
  INTERSTITIAL_MIN_INTERVAL_MS,
} from '@/config/monetization'

async function mod() {
  return await import('@capacitor-community/admob')
}

export const adsAvailable = () => isNative

let initialized = false
let bannerVisible = false
let lastInterstitial = 0

/** Inicializa AdMob y resuelve el consentimiento (UMP). No hace nada en web. */
export async function initAds(): Promise<void> {
  if (!adsAvailable() || initialized) return
  const { AdMob } = await mod()
  await AdMob.initialize({
    initializeForTesting: admobTestMode,
  })

  try {
    const consent = await AdMob.requestConsentInfo()
    if (
      consent.isConsentFormAvailable &&
      consent.status === 'REQUIRED'
    ) {
      await AdMob.showConsentForm()
    }
  } catch {
    /* consentimiento opcional según región */
  }
  initialized = true
}

export async function showBanner(): Promise<void> {
  if (!adsAvailable() || bannerVisible) return
  await initAds()
  const { AdMob, BannerAdSize, BannerAdPosition } = await mod()
  await AdMob.showBanner({
    adId: admobBannerId,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: admobTestMode,
  })
  bannerVisible = true
}

export async function hideBanner(): Promise<void> {
  if (!adsAvailable() || !bannerVisible) return
  const { AdMob } = await mod()
  try {
    await AdMob.removeBanner()
  } catch {
    /* ignore */
  }
  bannerVisible = false
}

/** Intersticial con tope de frecuencia. Desactivado por `INTERSTITIAL_ENABLED`. */
export async function maybeShowInterstitial(): Promise<void> {
  if (!adsAvailable() || !INTERSTITIAL_ENABLED) return
  if (Date.now() - lastInterstitial < INTERSTITIAL_MIN_INTERVAL_MS) return
  try {
    await initAds()
    const { AdMob } = await mod()
    await AdMob.prepareInterstitial({
      adId: admobInterstitialId,
      isTesting: admobTestMode,
    })
    await AdMob.showInterstitial()
    lastInterstitial = Date.now()
  } catch {
    /* sin ad disponible */
  }
}
