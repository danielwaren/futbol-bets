// AdMob no está disponible en Expo Go. El dev build (fase 8) monta el banner real.
export const adsAvailable = () => false
export async function initAds(): Promise<void> {}
export async function showBanner(): Promise<void> {}
export async function hideBanner(): Promise<void> {}
export async function maybeShowInterstitial(): Promise<void> {}
