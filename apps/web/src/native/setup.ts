import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Keyboard } from '@capacitor/keyboard'
import { isNative } from '@/lib/platform'

/** Configuración específica de la app nativa. No hace nada en web. */
export async function initNative(): Promise<void> {
  if (!isNative) return

  try {
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#0b1120' })
  } catch {
    /* iOS no soporta setBackgroundColor; ignorar */
  }

  try {
    Keyboard.setAccessoryBarVisible({ isVisible: false })
  } catch {
    /* ignore */
  }

  // Botón atrás de Android
  App.addListener('backButton', ({ canGoBack }) => {
    const openDialog = document.querySelector('[role="dialog"]')
    if (openDialog) {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
      return
    }
    if (canGoBack && window.location.pathname !== '/') {
      window.history.back()
    } else {
      void App.exitApp()
    }
  })

  // Ocultar splash cuando el primer render ya ocurrió
  requestAnimationFrame(() => {
    void SplashScreen.hide()
  })
}
