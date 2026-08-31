import { StyleSheet, View } from 'react-native'
import type { BetStatus } from '@futbolismo/core'
import { Txt } from './ui'
import { c, family, radius } from '@/theme'

const CFG: Record<BetStatus, { label: string; fg: string; bg: string }> = {
  pending: { label: 'Pendiente', fg: c.amber, bg: c.amberSoft },
  won: { label: 'Ganada', fg: c.pitch, bg: c.pitchSoft },
  lost: { label: 'Perdida', fg: c.flag, bg: c.flagSoft },
  void: { label: 'Anulada', fg: c.inkDim, bg: 'rgba(149,166,161,0.13)' },
}

export function BetStatusBadge({ status }: { status: BetStatus }) {
  const x = CFG[status]
  return (
    <View style={[s.pill, { backgroundColor: x.bg }]}>
      <Txt
        color={x.fg}
        style={{
          fontFamily: family.monoBold,
          fontSize: 9,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {x.label}
      </Txt>
    </View>
  )
}

export function LeagueBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={s.league}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Txt
        color={color}
        style={{
          fontFamily: family.monoBold,
          fontSize: 9.5,
          letterSpacing: 1.1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Txt>
    </View>
  )
}

const s = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  league: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
})
