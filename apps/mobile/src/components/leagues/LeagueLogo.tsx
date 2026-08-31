import { StyleSheet, Text, View } from 'react-native'
import type { LeagueMeta } from '@futbolismo/core'
import { c, family, leagueColor } from '@/theme'

/**
 * Disco de liga: bandera del país sobre el color de la competición.
 * Elegida = anillo ámbar con marca; bloqueada = apagada con candado.
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
  const ring = selected ? c.amber : locked ? c.line : accent

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: selected ? 2.5 : 1.5,
          borderColor: ring,
          backgroundColor: locked ? c.board2 : accent + '1F',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: locked ? 0.5 : 1,
        }}
      >
        <Text style={{ fontSize: size * 0.42 }}>{league.flag}</Text>
      </View>

      {selected && (
        <View style={[s.mark, { backgroundColor: c.amber }]}>
          <Text style={s.markTxt}>✓</Text>
        </View>
      )}

      {locked && (
        <View style={[s.mark, s.lock]}>
          <Text style={{ fontSize: 9 }}>🔒</Text>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  mark: {
    position: 'absolute',
    right: -3,
    top: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: c.night,
  },
  markTxt: {
    fontFamily: family.display,
    fontSize: 11,
    color: c.night,
    lineHeight: 13,
  },
  lock: {
    top: undefined,
    bottom: -3,
    backgroundColor: c.board3,
    borderColor: c.night,
  },
})
