import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.futbolismo',
  appName: 'Futbolismo',
  webDir: 'dist',
  backgroundColor: '#0b1120',
  android: {
    // El WebView usa el mismo esquema que el resto del sitio.
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: true,
      backgroundColor: '#0b1120',
      androidSpinnerStyle: 'small',
      spinnerColor: '#38bdf8',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0b1120',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'native',
    },
  },
}

// Live-reload en dispositivo durante desarrollo:
//   CAP_SERVER_URL=http://192.168.x.x:5173 npx cap run android
if (process.env.CAP_SERVER_URL) {
  config.server = { url: process.env.CAP_SERVER_URL, cleartext: true }
}

export default config
