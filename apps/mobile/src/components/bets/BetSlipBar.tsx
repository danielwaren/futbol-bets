import { StyleSheet, View } from 'react-native'
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formatOdds, MIN_PARLAY_LEGS } from '@futbolismo/core'
import { Springy, Txt } from '@/components/ui'
import { Icon, ICON_STROKE } from '@/components/icons'
import { useBetSlip } from '@/context/BetSlipContext'
import { useReducedMotion } from '@/lib/motion'
import { c, radius, shadow, TAP } from '@/theme'

/**
 * Cupón flotante. Solo aparece en modo combinada y con selecciones dentro, así
 * que no le roba sitio a la lista de partidos el resto del tiempo.
 */
export function BetSlipBar() {
  const { mode, legs, odds, canPlace, open, clear } = useBetSlip()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()

  if (mode !== 'parlay' || legs.length === 0) return null

  const n = legs.length

  return (
    <Animated.View
      entering={reduced ? FadeInDown.duration(120) : FadeInDown.duration(220)}
      exiting={reduced ? FadeOutDown.duration(120) : FadeOutDown.duration(180)}
      pointerEvents="box-none"
      style={[s.wrap, { paddingBottom: insets.bottom + 12 }]}
    >
      <View style={[s.bar, shadow.raised]}>
        <Springy
          onPress={clear}
          scaleTo={0.88}
          accessibilityRole="button"
          accessibilityLabel="Vaciar el cupón"
        >
          <View style={s.clear}>
            <Icon.delete size={15} color={c.inkFaint} strokeWidth={ICON_STROKE} />
          </View>
        </Springy>

        <View style={{ flex: 1 }}>
          <Txt variant="label" size={10}>
            {n} {n === 1 ? 'selección' : 'selecciones'}
          </Txt>
          <Txt variant="data" size={18} color={c.amber} style={{ marginTop: 1 }}>
            {formatOdds(odds)}
          </Txt>
        </View>

        <Springy
          onPress={open}
          disabled={!canPlace}
          accessibilityRole="button"
          accessibilityLabel={
            canPlace
              ? `Continuar con la combinada de ${n} selecciones`
              : `Faltan selecciones: mínimo ${MIN_PARLAY_LEGS}`
          }
          accessibilityState={{ disabled: !canPlace }}
        >
          <View style={[s.cta, !canPlace && s.ctaOff]}>
            <Txt variant="label" size={11} color={canPlace ? c.night : c.inkFaint}>
              {canPlace ? 'Continuar' : `Mínimo ${MIN_PARLAY_LEGS}`}
            </Txt>
            {canPlace && (
              <Icon.next size={14} color={c.night} strokeWidth={ICON_STROKE} />
            )}
          </View>
        </Springy>
      </View>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: c.board3,
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  clear: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.board,
  },
  cta: {
    minHeight: TAP - 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: c.amber,
    borderRadius: radius.md,
    paddingHorizontal: 15,
  },
  ctaOff: { backgroundColor: c.board, opacity: 0.6 },
})
