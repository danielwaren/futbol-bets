import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated'
import {
  formatDateTime,
  LEAGUES,
  useStandings,
  useRefreshStandings,
  type League,
  type StandingRow,
} from '@futbolismo/core'
import { Screen } from '@/components/Screen'
import { Crest } from '@/components/club/Crest'
import { Button, Card, Chip, EmptyState, ErrorText, Spinner, Txt } from '@/components/ui'
import { useEntitlements } from '@/hooks/useEntitlements'
import { c, family, leagueColor, motion, radius, shadow } from '@/theme'

const ZONE_COLOR: Record<string, string> = {
  ucl: c.pitch,
  uel: '#4DA3FF',
  relegation: c.flag,
}

/** Racha: los últimos resultados, el más reciente a la derecha. */
function Form({ form }: { form: string | null }) {
  if (!form) return <View style={{ width: 44 }} />
  const last = form.slice(-5).split('')
  return (
    <View style={s.form}>
      {last.map((r, i) => (
        <View
          key={i}
          style={[
            s.formDot,
            {
              backgroundColor:
                r === 'W' ? c.pitch : r === 'L' ? c.flag : c.inkFaint,
            },
          ]}
        />
      ))}
    </View>
  )
}

function Row({ row, index }: { row: StandingRow; index: number }) {
  const zoneColor = row.zone ? ZONE_COLOR[row.zone] : undefined
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 12) * 28).duration(motion.enter)}
      layout={LinearTransition.springify().damping(20)}
      style={s.row}
    >
      <View style={[s.posWrap, zoneColor ? { borderLeftColor: zoneColor } : null]}>
        <Txt variant="data" size={12} color={zoneColor ?? c.inkFaint}>
          {row.position}
        </Txt>
      </View>

      <View style={s.team}>
        <Crest team={row.team} size={26} />
        <Txt variant="h2" size={13} numberOfLines={1} style={{ flex: 1 }}>
          {row.team}
        </Txt>
      </View>

      <Form form={row.form} />

      <Txt variant="dataSm" size={11} style={s.num}>
        {row.played}
      </Txt>
      <Txt variant="dataSm" size={11} style={s.num}>
        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
      </Txt>
      <Txt variant="data" size={12.5} style={s.num}>
        {row.points}
      </Txt>
    </Animated.View>
  )
}

export default function Standings() {
  const entitlements = useEntitlements()
  const allowed = entitlements.leagues
  const [league, setLeague] = useState<League | undefined>(allowed[0])

  // Si cambian las ligas del plan, la seleccionada puede dejar de existir.
  useEffect(() => {
    if (!league || !allowed.includes(league)) setLeague(allowed[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed.join(',')])

  const q = useStandings(league)
  const refresh = useRefreshStandings(league)
  const rows = useMemo(() => q.data ?? [], [q.data])

  /** Una liga puede venir dividida en grupos (Apertura/Clausura, zonas). */
  const groups = useMemo(() => {
    const map = new Map<string, StandingRow[]>()
    for (const r of rows) {
      const k = r.groupLabel || ''
      const list = map.get(k)
      if (list) list.push(r)
      else map.set(k, [r])
    }
    return [...map.entries()]
  }, [rows])

  const updatedAt = rows[0]?.updatedAt

  return (
    <Screen
      title="Posiciones"
      subtitle={updatedAt ? `Act. ${formatDateTime(updatedAt)}` : 'Tabla de la liga'}
      onRefresh={() => q.refetch()}
      refreshing={q.isFetching}
      right={
        <Button
          variant="secondary"
          size="sm"
          title="Actualizar"
          loading={refresh.isPending}
          onPress={() => refresh.mutate()}
        />
      }
    >
      <View style={s.chips}>
        {allowed.map((id) => (
          <Chip
            key={id}
            label={LEAGUES[id].shortLabel}
            active={id === league}
            color={leagueColor[id]}
            onPress={() => setLeague(id)}
          />
        ))}
      </View>

      {refresh.isError && <ErrorText error={refresh.error} />}

      {q.isLoading ? (
        <Spinner />
      ) : q.isError ? (
        <ErrorText error={q.error} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Tabla no disponible todavía"
          hint="Pulsa Actualizar para traer las posiciones de esta liga."
        />
      ) : (
        groups.map(([groupLabel, list]) => (
          <View key={groupLabel || 'única'} style={{ gap: 8 }}>
            {groupLabel ? (
              <Txt variant="label" style={{ marginTop: 4 }}>
                {groupLabel}
              </Txt>
            ) : null}

            <Card style={[s.table, shadow.card]} flat>
              <View style={s.head}>
                <Txt variant="label" size={9} style={{ width: 26 }}>
                  #
                </Txt>
                <Txt variant="label" size={9} style={{ flex: 1 }}>
                  Equipo
                </Txt>
                <Txt variant="label" size={9} style={{ width: 44 }}>
                  Forma
                </Txt>
                <Txt variant="label" size={9} style={s.num}>
                  PJ
                </Txt>
                <Txt variant="label" size={9} style={s.num}>
                  DG
                </Txt>
                <Txt variant="label" size={9} style={s.num}>
                  PTS
                </Txt>
              </View>
              {list.map((r, i) => (
                <Row key={`${r.groupLabel}-${r.team}`} row={r} index={i} />
              ))}
            </Card>
          </View>
        ))
      )}

      {rows.length > 0 && (
        <View style={s.legend}>
          <Legend color={c.pitch} label="Clasifica" />
          <Legend color="#4DA3FF" label="Repechaje" />
          <Legend color={c.flag} label="Desciende" />
        </View>
      )}
    </Screen>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 3, height: 11, backgroundColor: color, borderRadius: 2 }} />
      <Txt variant="label" size={8.5}>
        {label}
      </Txt>
    </View>
  )
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  table: { padding: 0, overflow: 'hidden', backgroundColor: c.board },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: c.line,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: c.lineSoft,
  },
  posWrap: {
    width: 26,
    borderLeftWidth: 2.5,
    borderLeftColor: 'transparent',
    paddingLeft: 7,
  },
  team: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  form: { flexDirection: 'row', gap: 3, width: 44 },
  formDot: { width: 5.5, height: 5.5, borderRadius: 3 },
  num: { width: 30, textAlign: 'right', fontFamily: family.mono },
  legend: {
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
    paddingTop: 4,
  },
})
