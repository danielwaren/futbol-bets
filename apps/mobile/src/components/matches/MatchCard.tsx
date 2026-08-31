import { StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import {
  formatMatchDate,
  formatMatchTime,
  formatOdds,
  LEAGUES,
  MARKETS,
  type Market,
  type Match,
} from '@futbolismo/core'
import { useBetForm } from '@/context/BetFormContext'
import { Crest } from '@/components/club/Crest'
import { Springy, Txt } from '@/components/ui'
import { c, family, leagueColor, motion, radius, shadow } from '@/theme'

/** Una cuota. Es el gesto más repetido de la app, por eso lleva resorte propio. */
function Odd({
  label,
  odds,
  onPress,
}: {
  label: string
  odds: number | undefined
  onPress: () => void
}) {
  const off = odds == null
  return (
    <Springy onPress={onPress} disabled={off} style={{ flex: 1 }}>
      <View style={[s.odd, off && s.oddOff]}>
        <Txt variant="label" size={9.5} style={{ letterSpacing: 1.1 }}>
          {label}
        </Txt>
        <Txt
          variant="data"
          size={15}
          color={off ? c.inkFaint : c.ink}
          style={{ marginTop: 1 }}
        >
          {odds != null ? formatOdds(odds) : '—'}
        </Txt>
      </View>
    </Springy>
  )
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 5 }}>
      <Txt variant="label" size={9.5}>
        {title}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 6 }}>{children}</View>
    </View>
  )
}

export function MatchCard({ match, index = 0 }: { match: Match; index?: number }) {
  const league = LEAGUES[match.league]
  const accent = leagueColor[match.league] ?? c.amber
  const { openNew } = useBetForm()
  const { odds } = match

  const pick = (
    market: Market,
    selection: string,
    value: number | undefined,
    line?: number | null,
  ) => {
    if (value == null) return
    openNew({ match, market, selection, line: line ?? null, odds: value })
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * motion.stagger)
        .duration(motion.enter)
        .springify()
        .damping(18)}
      style={[s.card, shadow.card]}
    >
      {/* haz de luz: la única marca de color de la liga */}
      <View style={[s.beam, { backgroundColor: accent }]} />

      <View style={s.top}>
        <Txt
          color={accent}
          style={{
            fontFamily: family.monoBold,
            fontSize: 10,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}
        >
          {league.shortLabel}
        </Txt>
        <Txt variant="label" size={9.5}>
          {formatMatchDate(match.commenceTime)} · {formatMatchTime(match.commenceTime)}
        </Txt>
      </View>

      <View style={s.teams}>
        <View style={s.team}>
          <Crest team={match.homeTeam} size={38} />
          <Txt variant="team" numberOfLines={1} style={{ flex: 1 }}>
            {match.homeTeam}
          </Txt>
        </View>
        <View style={s.team}>
          <Crest team={match.awayTeam} size={38} />
          <Txt variant="team" numberOfLines={1} style={{ flex: 1 }}>
            {match.awayTeam}
          </Txt>
        </View>
      </View>

      <View style={s.markets}>
        <Row title={MARKETS['1x2'].label}>
          <Odd label="1" odds={odds['1x2']?.home} onPress={() => pick('1x2', 'home', odds['1x2']?.home)} />
          <Odd label="X" odds={odds['1x2']?.draw} onPress={() => pick('1x2', 'draw', odds['1x2']?.draw)} />
          <Odd label="2" odds={odds['1x2']?.away} onPress={() => pick('1x2', 'away', odds['1x2']?.away)} />
        </Row>

        {odds.goals && (
          <Row title={`Goles · ${odds.goals.line}`}>
            <Odd
              label="Over"
              odds={odds.goals.over}
              onPress={() => pick('goals', 'over', odds.goals?.over, odds.goals?.line)}
            />
            <Odd
              label="Under"
              odds={odds.goals.under}
              onPress={() => pick('goals', 'under', odds.goals?.under, odds.goals?.line)}
            />
          </Row>
        )}

        {odds.corners && (
          <Row title={`Córners · ${odds.corners.line}`}>
            <Odd
              label="Over"
              odds={odds.corners.over}
              onPress={() => pick('corners', 'over', odds.corners?.over, odds.corners?.line)}
            />
            <Odd
              label="Under"
              odds={odds.corners.under}
              onPress={() => pick('corners', 'under', odds.corners?.under, odds.corners?.line)}
            />
          </Row>
        )}

        {odds.btts && (
          <Row title={MARKETS.btts.label}>
            <Odd label="Sí" odds={odds.btts.yes} onPress={() => pick('btts', 'yes', odds.btts?.yes)} />
            <Odd label="No" odds={odds.btts.no} onPress={() => pick('btts', 'no', odds.btts?.no)} />
          </Row>
        )}
      </View>

      <Springy onPress={() => openNew({ match })}>
        <View style={s.foot}>
          <Txt variant="label" size={9.5}>
            Otro mercado
          </Txt>
          <Txt variant="label" size={9.5} color={c.amber}>
            Agregar apuesta →
          </Txt>
        </View>
      </Springy>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: c.board,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  beam: { height: 2, width: '100%' },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingTop: 11,
  },
  teams: { paddingHorizontal: 13, paddingTop: 10, gap: 9 },
  team: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  markets: { paddingHorizontal: 13, paddingTop: 13, paddingBottom: 12, gap: 10 },
  odd: {
    borderRadius: radius.sm,
    backgroundColor: c.board2,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  oddOff: { opacity: 0.45 },
  foot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: c.lineSoft,
  },
})
