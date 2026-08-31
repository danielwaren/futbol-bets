import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { clubIdentity, type ClubIdentity } from '@futbolismo/core'
import { c, family } from '@/theme'

/**
 * Disco con los colores y el patrón de camiseta del club, más su abreviatura.
 * No reproduce escudos registrados (ver `packages/core/src/config/clubs.ts`).
 */
function Pattern({ id }: { id: ClubIdentity }) {
  switch (id.pattern) {
    case 'stripes':
      return (
        <View style={StyleSheet.absoluteFill}>
          <View style={s.stripeRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={{ flex: 1, backgroundColor: i % 2 === 0 ? id.c1 : id.c2 }}
              />
            ))}
          </View>
        </View>
      )
    case 'halves':
      return (
        <View style={[StyleSheet.absoluteFill, s.stripeRow]}>
          <View style={{ flex: 1, backgroundColor: id.c1 }} />
          <View style={{ flex: 1, backgroundColor: id.c2 }} />
        </View>
      )
    case 'band':
      return (
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, backgroundColor: id.c1 }} />
          <View style={{ flex: 1.05, backgroundColor: id.c2 }} />
          <View style={{ flex: 1, backgroundColor: id.c1 }} />
        </View>
      )
    case 'sash':
      return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: id.c1 }]}>
          <View
            style={[
              s.sash,
              { backgroundColor: id.c2, transform: [{ rotate: '-38deg' }] },
            ]}
          />
        </View>
      )
    default:
      return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: id.c1 }]} />
      )
  }
}

export const Crest = memo(function Crest({
  team,
  size = 40,
}: {
  team: string
  size?: number
}) {
  const id = clubIdentity(team)
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: id.c1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
      }}
    >
      <Pattern id={id} />
      <Text
        numberOfLines={1}
        style={{
          fontFamily: family.display,
          fontSize: size * 0.3,
          letterSpacing: -0.3,
          color: id.darkInk ? '#101413' : c.white,
          textShadowColor: id.darkInk ? 'transparent' : 'rgba(0,0,0,0.55)',
          textShadowRadius: 3,
          textShadowOffset: { width: 0, height: 1 },
        }}
      >
        {id.abbr}
      </Text>
    </View>
  )
})

const s = StyleSheet.create({
  stripeRow: { flex: 1, flexDirection: 'row' },
  sash: {
    position: 'absolute',
    left: -20,
    right: -20,
    top: '38%',
    height: '26%',
  },
})
