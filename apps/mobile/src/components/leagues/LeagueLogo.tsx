import { View } from 'react-native'
import type { LeagueMeta } from '@futbolismo/core'
import { Txt } from '@/components/ui'
import { c } from '@/theme'

/**
 * "Logo" redondo de una liga: círculo con el color de acento + bandera del país.
 * Estados: `selected` (elegida), `locked` (premium), normal.
 */
export function LeagueLogo({
  league,
  size = 56,
  selected = false,
  locked = false,
}: {
  league: LeagueMeta
  size?: number
  selected?: boolean
  locked?: boolean
}) {
  const ring = selected ? c.sky : locked ? c.border2 : league.color
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: selected ? 2.5 : 2,
          borderColor: ring,
          backgroundColor: locked ? c.surface2 : league.color + '22',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: locked ? 0.55 : 1,
        }}
      >
        <Txt size={size * 0.44}>{league.flag}</Txt>
      </View>

      {selected && (
        <View
          style={{
            position: 'absolute',
            right: -2,
            top: -2,
            width: size * 0.36,
            height: size * 0.36,
            borderRadius: size * 0.18,
            backgroundColor: c.sky,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: c.canvas,
          }}
        >
          <Txt size={size * 0.2} weight="700" color={c.canvas}>
            ✓
          </Txt>
        </View>
      )}

      {locked && (
        <View
          style={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            width: size * 0.34,
            height: size * 0.34,
            borderRadius: size * 0.17,
            backgroundColor: c.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: c.border2,
          }}
        >
          <Txt size={size * 0.16}>🔒</Txt>
        </View>
      )}
    </View>
  )
}
