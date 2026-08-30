import { Capacitor } from '@capacitor/core'

export const isNative = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform() // 'web' | 'android' | 'ios'
export const isAndroid = platform === 'android'

/** Web client ID de Google (OAuth 2.0, tipo "Web application"). */
export const googleWebClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as
  | string
  | undefined
