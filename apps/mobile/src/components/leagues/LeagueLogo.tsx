import { StyleSheet, View } from 'react-native'
import type { LeagueMeta } from '@futbolismo/core'
import { Icon, ICON_STROKE } from '@/components/icons'
import { Txt } from '@/components/ui'
import { c, family, leagueCode, leagueColor } from '@/theme'

/**
 * Ficha de liga: código de país tipográfico sobre el color de la competición.
 *
 * Sustituye a la bandera emoji, que se dibujaba distinta en cada Android (y no
 * se dibujaba en absoluto en muchos), no aceptaba tokens de color y era la
 * pista más clara de plantilla genérica.
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
  const accent = leagueColor[league.id] ?? c.amber
  const code = leagueCode[league.id] ?? league.shortLabel.slice(0, 3).toUpperCase()
  const ring = selected ? c.amber : locked ? c.line : accent

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: selected ? 2 : 1.25,
          borderColor: ring,
          backgroundColor: locked ? c.board2 : accent + '1A',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: locked ? 0.5 : 1,
        }}
      >
        <Txt
          style={{
            fontFamily: family.monoBold,
            fontSize: size * 0.27,
            letterSpacing: 0.5,
            color: locked ? c.inkFaint : selected ? c.amber : accent,
          }}
        >
          {code}
        </Txt>
      </View>

      {selected && (
        <View style={[s.mark, { backgroundColor: c.amber }]}>
          <Icon.check size={size * 0.2} color={c.night} strokeWidth={3} />
        </View>
      )}

      {locked && (
        <View style={[s.mark, s.lock]}>
          <Icon.lock size={size * 0.17} color={c.inkFaint} strokeWidth={ICON_STROKE} />
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  mark: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: c.night,
  },
  lock: {
    top: undefined,
    bottom: -2,
    backgroundColor: c.board3,
    borderColor: c.night,
  },
})
