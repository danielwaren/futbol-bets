import { Pressable, View } from 'react-native'
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
import { Card, Txt, Button } from '@/components/ui'
import { LeagueBadge } from '@/components/badges'
import { c, radius } from '@/theme'

function Odds({
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
    <Pressable
      onPress={onPress}
      disabled={off}
      style={{
        flex: 1,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: off ? c.slate800 : c.border2,
        borderRadius: radius.md,
        paddingVertical: 6,
      }}
    >
      <Txt size={10} faint>
        {label}
      </Txt>
      <Txt weight="600" color={off ? c.textFainter : c.text}>
        {odds != null ? formatOdds(odds) : '—'}
      </Txt>
    </Pressable>
  )
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      <Txt size={11} weight="500" dim>
        {title}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 6 }}>{children}</View>
    </View>
  )
}

export function MatchCard({ match }: { match: Match }) {
  const league = LEAGUES[match.league]
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
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Txt weight="600">
            {match.homeTeam} <Txt faint>vs</Txt> {match.awayTeam}
          </Txt>
          <Txt size={11} dim style={{ textTransform: 'capitalize' }}>
            {formatMatchDate(match.commenceTime)} · {formatMatchTime(match.commenceTime)}
          </Txt>
        </View>
        <LeagueBadge label={league.shortLabel} color={league.color} />
      </View>

      <Row title={MARKETS['1x2'].label}>
        <Odds label="1" odds={odds['1x2']?.home} onPress={() => pick('1x2', 'home', odds['1x2']?.home)} />
        <Odds label="X" odds={odds['1x2']?.draw} onPress={() => pick('1x2', 'draw', odds['1x2']?.draw)} />
        <Odds label="2" odds={odds['1x2']?.away} onPress={() => pick('1x2', 'away', odds['1x2']?.away)} />
      </Row>

      <Row title={`Goles${odds.goals ? ` · ${odds.goals.line}` : ''}`}>
        <Odds
          label={`Over ${odds.goals?.line ?? ''}`}
          odds={odds.goals?.over}
          onPress={() => pick('goals', 'over', odds.goals?.over, odds.goals?.line)}
        />
        <Odds
          label={`Under ${odds.goals?.line ?? ''}`}
          odds={odds.goals?.under}
          onPress={() => pick('goals', 'under', odds.goals?.under, odds.goals?.line)}
        />
      </Row>

      {odds.corners && (
        <Row title={`Córners · ${odds.corners.line}`}>
          <Odds
            label={`Over ${odds.corners.line}`}
            odds={odds.corners.over}
            onPress={() => pick('corners', 'over', odds.corners?.over, odds.corners?.line)}
          />
          <Odds
            label={`Under ${odds.corners.line}`}
            odds={odds.corners.under}
            onPress={() => pick('corners', 'under', odds.corners?.under, odds.corners?.line)}
          />
        </Row>
      )}

      {odds.btts && (
        <Row title={MARKETS.btts.label}>
          <Odds label="Sí" odds={odds.btts.yes} onPress={() => pick('btts', 'yes', odds.btts?.yes)} />
          <Odds label="No" odds={odds.btts.no} onPress={() => pick('btts', 'no', odds.btts?.no)} />
        </Row>
      )}

      <Button
        variant="secondary"
        size="sm"
        title="Agregar apuesta"
        onPress={() => openNew({ match })}
      />
    </Card>
  )
}
