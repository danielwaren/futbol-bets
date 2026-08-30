import { View } from 'react-native'
import type { BetStatus } from '@futbolismo/core'
import { Txt } from './ui'
import { c, radius } from '@/theme'

const CFG: Record<BetStatus, { label: string; fg: string; bg: string }> = {
  pending: { label: 'Pendiente', fg: c.amber, bg: c.amberBg },
  won: { label: 'Ganada', fg: c.emerald, bg: c.emeraldBg },
  lost: { label: 'Perdida', fg: c.rose, bg: c.roseBg },
  void: { label: 'Anulada', fg: c.textDim, bg: 'rgba(148,163,184,0.15)' },
}

export function BetStatusBadge({ status }: { status: BetStatus }) {
  const x = CFG[status]
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: x.bg,
        borderColor: x.fg + '55',
        borderWidth: 1,
        borderRadius: radius.pill,
        paddingHorizontal: 8,
        paddingVertical: 2,
      }}
    >
      <Txt size={11} weight="500" color={x.fg}>
        {x.label}
      </Txt>
    </View>
  )
}

export function LeagueBadge({
  label,
  color,
}: {
  label: string
  color: string
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: color + '1a',
        borderColor: color + '55',
        borderWidth: 1,
        borderRadius: radius.pill,
        paddingHorizontal: 8,
        paddingVertical: 2,
      }}
    >
      <View
        style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }}
      />
      <Txt size={11} weight="500" color={color}>
        {label}
      </Txt>
    </View>
  )
}
