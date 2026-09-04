import { useState } from 'react'
import { Pressable, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { OnboardingArt } from '@/components/onboarding/OnboardingArt'
import { Button, Txt } from '@/components/ui'
import { markOnboardingSeen } from '@/lib/onboarding'
import { useReducedMotion } from '@/lib/motion'
import { c } from '@/theme'

const SLIDES = [
  {
    scene: 1 as const,
    title: 'Apuesta sin arriesgar nada',
    body: 'Registra apuestas de fútbol con dinero ficticio y prueba tus estrategias sin poner un peso real.',
  },
  {
    scene: 2 as const,
    title: 'Sigue tu banca en el tiempo',
    body: 'Cada apuesta recalcula tu banca. Gráficos de evolución, ROI y winrate por mercado y por liga.',
  },
  {
    scene: 3 as const,
    title: 'Elige tus 3 ligas gratis',
    body: 'El plan gratis incluye 3 ligas a tu elección. Las demás quedan en Premium, cuando quieras.',
  },
]

/**
 * Una diapositiva a la vez (no un carrusel horizontal): el `ScrollView horizontal
 * pagingEnabled` de RN no se comporta igual en web —las diapositivas se apilan— y
 * para 3 pantallas de onboarding el botón + los puntos bastan.
 */
export default function Onboarding() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)

  const slide = SLIDES[index]
  const last = index === SLIDES.length - 1

  async function finish() {
    await markOnboardingSeen()
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  function next() {
    if (last) return void finish()
    setIndex((i) => i + 1)
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.night, paddingTop: insets.top }}>
      <View
        style={{
          height: 44,
          justifyContent: 'center',
          alignItems: 'flex-end',
          paddingHorizontal: 16,
        }}
      >
        {!last && (
          <Pressable
            onPress={finish}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Saltar tutorial"
          >
            <Txt variant="label" size={10}>
              Saltar
            </Txt>
          </Pressable>
        )}
      </View>

      <Animated.View
        key={index}
        entering={reduced ? FadeIn.duration(120) : FadeIn.duration(260)}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          gap: 28,
        }}
      >
        <OnboardingArt scene={slide.scene} size={240} />
        <View style={{ gap: 12, alignItems: 'center' }}>
          <Txt variant="screen" size={25} center>
            {slide.title}
          </Txt>
          <Txt variant="small" center style={{ lineHeight: 21, maxWidth: 320 }}>
            {slide.body}
          </Txt>
        </View>
      </Animated.View>

      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 20,
          gap: 20,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
          {SLIDES.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => setIndex(i)}
              accessibilityRole="button"
              accessibilityLabel={`Ir a la pantalla ${i + 1}`}
              hitSlop={8}
            >
              <View
                style={{
                  width: i === index ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === index ? c.amber : c.line,
                }}
              />
            </Pressable>
          ))}
        </View>
        <Button title={last ? 'Empezar' : 'Siguiente'} onPress={next} />
      </View>
    </View>
  )
}
