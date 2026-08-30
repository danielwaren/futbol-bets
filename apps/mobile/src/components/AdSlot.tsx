import { View } from 'react-native'
import { useEntitlements } from '@/hooks/useEntitlements'
import { isExpoGo } from '@/lib/platform'
import { Txt } from './ui'
import { c, radius } from '@/theme'

/**
 * Placeholder de anuncio. En Expo Go no hay AdMob; el dev build (fase 8) monta
 * el banner real. Se muestra solo en plan free.
 */
export function AdSlot() {
  const { ads } = useEntitlements()
  if (!ads || !isExpoGo) return null
  return (
    <View
      style={{
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: c.border2,
        borderRadius: radius.md,
      }}
    >
      <Txt size={10} faint>
        ESPACIO PUBLICITARIO
      </Txt>
    </View>
  )
}
