import { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import {
  addDays,
  formatMatchDate,
  LEAGUE_LIST,
  LEAGUES,
  toDateInputValue,
  type League,
} from '@futbolismo/core'
import { Card, Chip, Springy, Txt } from '@/components/ui'
import { c, leagueColor, radius } from '@/theme'

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
    <Card style={{ gap: 11, paddingBottom: 11 }}>
      <View style={s.nav}>
        <Nav label="‹" onPress={() => onDateChange(addDays(date, -1))} />
        <Springy onPress={() => setShowPicker(true)} style={{ flex: 1 }}>
          <View style={{ alignItems: 'center' }}>
            <Txt variant="h2" size={15} style={{ textTransform: 'capitalize' }}>
              {formatMatchDate(`${date}T12:00:00`)}
            </Txt>
          </View>
        </Springy>
        <Nav label="›" onPress={() => onDateChange(addDays(date, 1))} />
        <Nav label="HOY" onPress={() => onDateChange(toDateInputValue(new Date()))} wide />
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 7, paddingRight: 8 }}
      >
        <Chip
          label="Todas"
          active={allSelected}
          onPress={() => onLeaguesChange(allowedLeagues)}
        />
        {allowedLeagues.map((id) => (
          <Chip
            key={id}
            label={LEAGUES[id].shortLabel}
            active={!allSelected && leagues.includes(id)}
            color={leagueColor[id]}
            onPress={() => select(id)}
          />
        ))}
        {locked.map((l) => (
          <Chip
            key={l.id}
            label={`🔒 ${l.shortLabel}`}
            locked
            onPress={onLockedPress}
          />
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
    <Springy onPress={onPress} scaleTo={0.9}>
      <View style={[s.navBtn, wide && { paddingHorizontal: 12 }]}>
        <Txt variant="label" size={11} color={c.inkDim}>
          {label}
        </Txt>
      </View>
    </Springy>
  )
}

const s = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: {
    backgroundColor: c.board3,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 11,
    minWidth: 34,
    alignItems: 'center',
  },
})
