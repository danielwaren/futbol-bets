import { StyleSheet, View } from 'react-native'
import { useEntitlements } from '@/hooks/useEntitlements'
import { isExpoGo } from '@/lib/platform'
import { Txt } from './ui'
import { c, radius } from '@/theme'

/**
 * Reserva del banner. En Expo Go no hay AdMob; el dev build monta el real.
 * Solo se muestra en plan free.
 */
export function AdSlot() {
  const { ads } = useEntitlements()
  if (!ads || !isExpoGo) return null
  return (
    <View style={s.slot}>
      <Txt variant="label" size={9}>
        Espacio publicitario
      </Txt>
    </View>
  )
}

const s = StyleSheet.create({
  slot: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: c.line,
    borderRadius: radius.md,
  },
})
