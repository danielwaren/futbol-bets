import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useReducedMotion } from '@/lib/motion'
import { c, radius, shadow } from '@/theme'

/**
 * Reglas `progressive-loading` / `loading-chart`: para esperas de más de ~300 ms
 * se muestra la forma del contenido, no un spinner. El usuario ve dónde va a
 * aparecer cada cosa y la pantalla no salta al llegar los datos.
 */
function Shimmer({ style }: { style?: object }) {
  const o = useSharedValue(0.45)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) {
      o.value = 0.5
      return
    }
    o.value = withRepeat(withTiming(0.85, { duration: 850 }), -1, true)
  }, [o, reduced])

  const anim = useAnimatedStyle(() => ({ opacity: o.value }))
  return <Animated.View style={[s.bone, style, anim]} />
}

/** Esqueleto de una tarjeta de partido. */
export function MatchSkeleton() {
  return (
    <View style={[s.card, shadow.card]}>
      <View style={s.row}>
        <Shimmer style={{ width: 78, height: 11 }} />
        <Shimmer style={{ width: 42, height: 11 }} />
      </View>
      <Shimmer style={{ width: '68%', height: 17, marginTop: 14 }} />
      <Shimmer style={{ width: '54%', height: 17, marginTop: 8 }} />
      <View style={[s.row, { marginTop: 18, gap: 7 }]}>
        {[0, 1, 2].map((i) => (
          <Shimmer key={i} style={{ flex: 1, height: 44, borderRadius: radius.sm }} />
        ))}
      </View>
    </View>
  )
}

/** Esqueleto de una tarjeta de apuesta. */
export function BetSkeleton() {
  return (
    <View style={[s.card, { padding: 13 }, shadow.card]}>
      <View style={s.row}>
        <Shimmer style={{ width: '62%', height: 15 }} />
        <Shimmer style={{ width: 58, height: 15 }} />
      </View>
      <Shimmer style={{ width: '44%', height: 11, marginTop: 9 }} />
    </View>
  )
}

/** Esqueleto genérico de bloque (gráficos, tabla). */
export function BlockSkeleton({ height = 180 }: { height?: number }) {
  return (
    <View style={[s.card, shadow.card]}>
      <Shimmer style={{ width: '46%', height: 13 }} />
      <Shimmer style={{ width: '100%', height, marginTop: 14, borderRadius: radius.md }} />
    </View>
  )
}

export function SkeletonList({
  count = 3,
  children,
}: {
  count?: number
  children: (i: number) => React.ReactNode
}) {
  return (
    <View
      style={{ gap: 11 }}
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando"
    >
      {Array.from({ length: count }, (_, i) => children(i))}
    </View>
  )
}

const s = StyleSheet.create({
  card: { backgroundColor: c.board, borderRadius: radius.lg, padding: 14 },
  bone: { backgroundColor: c.board3, borderRadius: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
})
