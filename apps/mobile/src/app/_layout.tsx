import '@/initCore'
import { useEffect } from 'react'
import {
  SplashScreen,
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
// Import por subruta a propósito: el índice del paquete reexporta TODOS los
// pesos e itálicas, y Metro los empaqueta (≈1,5 MB de TTF que no usamos).
import { Chivo_300Light } from '@expo-google-fonts/chivo/300Light'
import { Chivo_400Regular } from '@expo-google-fonts/chivo/400Regular'
import { Chivo_600SemiBold } from '@expo-google-fonts/chivo/600SemiBold'
import { Chivo_700Bold } from '@expo-google-fonts/chivo/700Bold'
import { Chivo_900Black } from '@expo-google-fonts/chivo/900Black'
import { ChivoMono_400Regular } from '@expo-google-fonts/chivo-mono/400Regular'
import { ChivoMono_500Medium } from '@expo-google-fonts/chivo-mono/500Medium'
import { ChivoMono_700Bold } from '@expo-google-fonts/chivo-mono/700Bold'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@futbolismo/core'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { MonetizationProvider } from '@/context/MonetizationContext'
import { PaywallProvider } from '@/context/PaywallContext'
import { BankrollProvider } from '@/context/BankrollContext'
import { BetFormProvider } from '@/context/BetFormContext'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useOnboardingSeen } from '@/lib/onboarding'
import { c } from '@/theme'

SplashScreen.preventAutoHideAsync()

// Rutas accesibles sin sesión.
const PUBLIC = ['login', 'onboarding', 'privacidad', 'terminos', 'eliminar-cuenta']
// Rutas que se pueden abrir antes de completar el onboarding (deep links legales).
const PRE_ONBOARDING_OK = ['onboarding', 'privacidad', 'terminos']

function Gate() {
  const { session, loading } = useAuth()
  const { needsLeagueChoice, loading: entLoading } = useEntitlements()
  const segments = useSegments()
  const router = useRouter()
  const seenOnboarding = useOnboardingSeen()

  // `<Stack>` se monta siempre (ver abajo), pero el navegador raíz no acepta
  // acciones hasta que React Navigation lo registra. Sin esta guarda, los
  // redirects de abajo se despachan al vacío ("action ... was not handled by
  // any navigator") y la app se queda en la ruta inicial.
  const navReady = Boolean(useRootNavigationState()?.key)

  // Sin las fuentes cargadas la app se dibuja con la del sistema y salta al
  // reemplazarla; esperamos con la splash puesta.
  const [fontsReady] = useFonts({
    Chivo_300Light,
    Chivo_400Regular,
    Chivo_600SemiBold,
    Chivo_700Bold,
    Chivo_900Black,
    ChivoMono_400Regular,
    ChivoMono_500Medium,
    ChivoMono_700Bold,
  })

  const booting = loading || seenOnboarding === null || !fontsReady

  useEffect(() => {
    if (!navReady || booting) return
    void SplashScreen.hideAsync()
    const first = (segments[0] ?? '') as string

    // El onboarding va primero SIEMPRE en el primer arranque, aunque haya una
    // sesión restaurada de una instalación anterior.
    if (!seenOnboarding) {
      if (!PRE_ONBOARDING_OK.includes(first)) router.replace('/onboarding')
      return
    }

    if (!session) {
      if (!PUBLIC.includes(first)) router.replace('/login')
      return
    }

    // Con sesión. Ojo: /onboarding NO rebota, porque con el flag ya marcado solo
    // se llega ahí a propósito (Cuenta → "Ver tutorial").
    if (first === 'login') {
      router.replace('/')
      return
    }
    if (first === 'onboarding') return
    if (!entLoading && needsLeagueChoice && first !== 'elegir-ligas') {
      router.replace('/elegir-ligas')
    }
  }, [
    navReady,
    booting,
    session,
    seenOnboarding,
    needsLeagueChoice,
    entLoading,
    segments,
    router,
  ])

  // Nunca se desmonta: si el navegador raíz aparece y desaparece, expo-router
  // pierde las acciones encoladas. Durante el arranque la splash lo tapa.
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.night },
        animation: 'slide_from_right',
      }}
    />
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.night }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <MonetizationProvider>
              <PaywallProvider>
                <BankrollProvider>
                  <BetFormProvider>
                    <Gate />
                  </BetFormProvider>
                </BankrollProvider>
              </PaywallProvider>
            </MonetizationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
