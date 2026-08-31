import { useRef, useState } from 'react'
import {
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { OnboardingArt } from '@/components/onboarding/OnboardingArt'
import { Button, Txt } from '@/components/ui'
import { markOnboardingSeen } from '@/lib/onboarding'
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

export default function Onboarding() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const scroller = useRef<ScrollView>(null)
  const [index, setIndex] = useState(0)

  const last = index === SLIDES.length - 1

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width)
    if (i !== index) setIndex(i)
  }

  async function finish() {
    await markOnboardingSeen()
    router.replace('/login')
  }

  function next() {
    if (last) return void finish()
    scroller.current?.scrollTo({ x: (index + 1) * width, animated: true })
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas, paddingTop: insets.top }}>
      <View style={{ height: 44, justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 16 }}>
        {!last && (
          <Pressable onPress={finish} hitSlop={12}>
            <Txt size={13} dim>
              Saltar
            </Txt>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s) => (
          <View
            key={s.scene}
            style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 28 }}
          >
            <OnboardingArt scene={s.scene} size={Math.min(width - 96, 260)} />
            <View style={{ gap: 12, alignItems: 'center' }}>
              <Txt size={22} weight="700" center>
                {s.title}
              </Txt>
              <Txt size={14} dim center style={{ lineHeight: 21 }}>
                {s.body}
              </Txt>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 20, gap: 20 }}>
        <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === index ? c.sky : c.border2,
              }}
            />
          ))}
        </View>
        <Button title={last ? 'Empezar' : 'Siguiente'} onPress={next} />
      </View>
    </View>
  )
}
