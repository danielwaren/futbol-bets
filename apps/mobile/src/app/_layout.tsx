import '@/initCore'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
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
import { hasSeenOnboarding } from '@/lib/onboarding'
import { Spinner } from '@/components/ui'
import { c } from '@/theme'

SplashScreen.preventAutoHideAsync()

// Rutas accesibles sin sesión.
const PUBLIC = ['login', 'onboarding', 'privacidad', 'terminos', 'eliminar-cuenta']
// Rutas que un usuario sin haber visto el onboarding sí puede abrir (deep links legales).
const PRE_ONBOARDING_OK = ['onboarding', 'privacidad', 'terminos']

function Gate() {
  const { session, loading } = useAuth()
  const { needsLeagueChoice, loading: entLoading } = useEntitlements()
  const segments = useSegments()
  const router = useRouter()

  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null)
  useEffect(() => {
    hasSeenOnboarding().then(setSeenOnboarding)
  }, [])

  const booting = loading || seenOnboarding === null

  useEffect(() => {
    if (booting) return
    void SplashScreen.hideAsync()
    const first = (segments[0] ?? '') as string

    if (!session) {
      if (!seenOnboarding && !PRE_ONBOARDING_OK.includes(first)) {
        router.replace('/onboarding')
      } else if (seenOnboarding && !PUBLIC.includes(first)) {
        router.replace('/login')
      }
      return
    }

    // Con sesión.
    if (first === 'login' || first === 'onboarding') {
      router.replace('/')
      return
    }
    if (!entLoading && needsLeagueChoice && first !== 'elegir-ligas') {
      router.replace('/elegir-ligas')
    }
  }, [
    booting,
    session,
    seenOnboarding,
    needsLeagueChoice,
    entLoading,
    segments,
    router,
  ])

  if (booting) {
    return (
      <View style={{ flex: 1, backgroundColor: c.canvas, justifyContent: 'center' }}>
        <Spinner />
      </View>
    )
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.canvas },
        animation: 'fade',
      }}
    />
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.canvas }}>
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
