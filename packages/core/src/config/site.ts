/** Datos de marca / legales usados en páginas públicas, ficha de Play y edge functions. */
export const SITE = {
  appName: 'Futbolismo',
  /** Editor en Google Play y responsable del tratamiento de datos. TODO: rellenar. */
  publisher: '[NOMBRE DEL EDITOR]',
  supportEmail: 'danigayoso41@gmail.com',
  /** Base pública donde se despliega la web. TODO: dominio definitivo. */
  url: 'https://futbolismo.vercel.app',
  androidPackage: 'app.futbolismo',
  /** Fecha de última actualización de los textos legales. */
  legalUpdatedAt: '27 de agosto de 2026',
  minAge: 18,
} as const

export const LEGAL_LINKS = {
  privacy: '/privacidad',
  terms: '/terminos',
  deleteAccount: '/eliminar-cuenta',
}

/** Deep link a la gestión de suscripciones de Google Play. */
export const PLAY_SUBSCRIPTIONS_URL = `https://play.google.com/store/account/subscriptions?package=${SITE.androidPackage}`
