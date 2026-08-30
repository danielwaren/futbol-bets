import Constants from 'expo-constants'

export const isNative = true

/** Expo Go no tiene módulos nativos (RevenueCat, AdMob, Google nativo). */
export const isExpoGo = Constants.appOwnership === 'expo'

export const googleWebClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined
export const revenueCatAndroidKey =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || undefined
export const admobBannerId =
  process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ||
  'ca-app-pub-3940256099942544/9214589741' // test adaptive banner
