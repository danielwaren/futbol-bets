import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import {
  addDays,
  formatMatchDate,
  LEAGUE_LIST,
  LEAGUES,
  toDateInputValue,
  type League,
} from '@futbolismo/core'
import { Card, Txt } from '@/components/ui'
import { c, radius } from '@/theme'

export function DateLeagueBar({
  date,
  leagues,
  allowedLeagues,
  onDateChange,
  onLeaguesChange,
  onLockedPress,
}: {
  date: string
  leagues: League[]
  allowedLeagues: League[]
  onDateChange: (d: string) => void
  onLeaguesChange: (l: League[]) => void
  onLockedPress: () => void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const allSelected = leagues.length === allowedLeagues.length
  const locked = LEAGUE_LIST.filter((l) => !allowedLeagues.includes(l.id))

  const select = (id: League) => {
    if (leagues.length === 1 && leagues[0] === id) onLeaguesChange(allowedLeagues)
    else onLeaguesChange([id])
  }

  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Nav label="‹" onPress={() => onDateChange(addDays(date, -1))} />
        <Pressable onPress={() => setShowPicker(true)} style={{ flex: 1, alignItems: 'center' }}>
          <Txt weight="600" style={{ textTransform: 'capitalize' }}>
            {formatMatchDate(`${date}T12:00:00`)}
          </Txt>
        </Pressable>
        <Nav label="›" onPress={() => onDateChange(addDays(date, 1))} />
        <Nav label="Hoy" onPress={() => onDateChange(toDateInputValue(new Date()))} wide />
      </View>

      {showPicker && (
        <DateTimePicker
          value={new Date(`${date}T12:00:00`)}
          mode="date"
          onChange={(_e, d) => {
            setShowPicker(false)
            if (d) onDateChange(toDateInputValue(d))
          }}
        />
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        <Chip active={allSelected} onPress={() => onLeaguesChange(allowedLeagues)}>
          Todas
        </Chip>
        {allowedLeagues.map((id) => (
          <Chip
            key={id}
            active={!allSelected && leagues.includes(id)}
            color={LEAGUES[id].color}
            onPress={() => select(id)}
          >
            {LEAGUES[id].shortLabel}
          </Chip>
        ))}
        {locked.map((l) => (
          <Chip key={l.id} locked onPress={onLockedPress}>
            🔒 {l.shortLabel}
          </Chip>
        ))}
      </ScrollView>
    </Card>
  )
}

function Nav({
  label,
  onPress,
  wide,
}: {
  label: string
  onPress: () => void
  wide?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: c.slate700,
        borderRadius: radius.md,
        paddingVertical: 6,
        paddingHorizontal: wide ? 12 : 10,
      }}
    >
      <Txt size={13}>{label}</Txt>
    </Pressable>
  )
}

function Chip({
  children,
  active,
  locked,
  color,
  onPress,
}: {
  children: React.ReactNode
  active?: boolean
  locked?: boolean
  color?: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: locked ? c.slate800 : active ? color ?? c.sky : c.border2,
        backgroundColor: active ? c.skyBg : 'transparent',
        borderRadius: radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <Txt size={12} color={locked ? c.textFainter : active ? color ?? c.sky : c.textDim}>
        {children}
      </Txt>
    </Pressable>
  )
}
