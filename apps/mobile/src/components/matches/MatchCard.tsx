import { StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import {
  formatMatchTime,
  formatOdds,
  LEAGUES,
  MARKETS,
  selectionLabel,
  type Market,
  type Match,
  type OverUnderOdds,
} from '@futbolismo/core'
import { useBetForm } from '@/context/BetFormContext'
import { useBetSlip } from '@/context/BetSlipContext'
import { Springy, Txt } from '@/components/ui'
import { Icon, ICON_STROKE } from '@/components/icons'
import { enterAt, useReducedMotion } from '@/lib/motion'
import { c, family, leagueColor, radius, shadow, TAP } from '@/theme'

/**
 * Una cuota. Es el gesto más repetido de la app: área táctil completa de 44pt,
 * resorte al pulsar y etiqueta accesible con el mercado y el valor.
 */
function Odd({
  market,
  label,
  odds,
  selected,
  onPress,
}: {
  market: string
  label: string
  odds: number | undefined
  selected?: boolean
  onPress: () => void
}) {
  const off = odds == null
  return (
    <Springy
      onPress={onPress}
      disabled={off}
      style={{ flex: 1 }}
      accessibilityRole="button"
      accessibilityLabel={`${market}, ${label}, cuota ${odds != null ? formatOdds(odds) : 'no disponible'}`}
      accessibilityState={{ disabled: off, selected }}
    >
      <View style={[s.odd, off && s.oddOff, selected && s.oddOn]}>
        <Txt
          variant="label"
          size={10}
          color={selected ? c.night : undefined}
          style={{ letterSpacing: 0.9 }}
        >
          {label}
        </Txt>
        <Txt
          variant="data"
          size={16}
          color={selected ? c.night : off ? c.inkFaint : c.ink}
          style={{ marginTop: 2 }}
        >
          {odds != null ? formatOdds(odds) : '—'}
        </Txt>
      </View>
    </Springy>
  )
}

function MarketRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="label" size={10}>
        {title}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 7 }}>{children}</View>
    </View>
  )
}

/** Fila de equipo: sin escudo. La L y la V distinguen local de visita. */
function Team({ side, name }: { side: 'L' | 'V'; name: string }) {
  return (
    <View style={s.team}>
      <Txt
        style={{
          fontFamily: family.monoBold,
          fontSize: 10,
          color: c.inkFaint,
          width: 13,
          letterSpacing: 0.5,
        }}
      >
        {side}
      </Txt>
      <Txt variant="team" numberOfLines={2} style={{ flex: 1 }}>
        {name}
      </Txt>
    </View>
  )
}

/** Mercados over/under que llegan con cuota del feed, en orden de aparición. */
const OU_MARKETS: Market[] = ['goals', 'corners', 'cards']

export function MatchCard({ match, index = 0 }: { match: Match; index?: number }) {
  const league = LEAGUES[match.league]
  const accent = leagueColor[match.league] ?? c.amber
  const { openNew } = useBetForm()
  const { mode, toggle, isPicked } = useBetSlip()
  const reduced = useReducedMotion()
  const { odds } = match

  /**
   * En modo simple abre el formulario; en modo combinada suma la selección al
   * cupón (y al tocarla otra vez la quita).
   */
  const pick = (
    market: Market,
    selection: string,
    value: number | undefined,
    line?: number | null,
  ) => {
    if (value == null) return
    if (mode === 'parlay') {
      toggle({
        league: match.league,
        matchId: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        matchDate: match.commenceTime,
        market,
        selection,
        selectionLabel: selectionLabel(market, selection, line ?? null),
        line: line ?? null,
        odds: value,
      })
      return
    }
    openNew({ match, market, selection, line: line ?? null, odds: value })
  }

  const picked = (market: Market, selection: string) =>
    mode === 'parlay' && isPicked(match.id, market, selection)

  return (
    <Animated.View entering={enterAt(index, reduced)} style={[s.card, shadow.card]}>
      {/* Cabecera: la liga se identifica por un punto de color y su nombre,
          no por una barra decorativa cruzando la tarjeta. */}
      <View style={s.top}>
        <View style={s.league}>
          <View style={[s.dot, { backgroundColor: accent }]} />
          <Txt
            style={{
              fontFamily: family.monoBold,
              fontSize: 10.5,
              letterSpacing: 1.3,
              textTransform: 'uppercase',
              color: c.inkDim,
            }}
          >
            {league.shortLabel}
          </Txt>
        </View>
        <Txt variant="label" size={10}>
          {formatMatchTime(match.commenceTime)}
        </Txt>
      </View>

      <View style={s.teams}>
        <Team side="L" name={match.homeTeam} />
        <Team side="V" name={match.awayTeam} />
      </View>

      <View style={s.markets}>
        <MarketRow title={MARKETS['1x2'].label}>
          <Odd
            market="Resultado"
            label="1"
            odds={odds['1x2']?.home}
            selected={picked('1x2', 'home')}
            onPress={() => pick('1x2', 'home', odds['1x2']?.home)}
          />
          <Odd
            market="Resultado"
            label="X"
            odds={odds['1x2']?.draw}
            selected={picked('1x2', 'draw')}
            onPress={() => pick('1x2', 'draw', odds['1x2']?.draw)}
          />
          <Odd
            market="Resultado"
            label="2"
            odds={odds['1x2']?.away}
            selected={picked('1x2', 'away')}
            onPress={() => pick('1x2', 'away', odds['1x2']?.away)}
          />
        </MarketRow>

        {OU_MARKETS.map((m) => {
          const ou = odds[m as 'goals' | 'corners' | 'cards'] as
            | OverUnderOdds
            | undefined
          if (!ou) return null
          const name = MARKETS[m].shortLabel
          return (
            <MarketRow key={m} title={`${name} · ${ou.line}`}>
              <Odd
                market={name}
                label="Over"
                odds={ou.over}
                selected={picked(m, 'over')}
                onPress={() => pick(m, 'over', ou.over, ou.line)}
              />
              <Odd
                market={name}
                label="Under"
                odds={ou.under}
                selected={picked(m, 'under')}
                onPress={() => pick(m, 'under', ou.under, ou.line)}
              />
            </MarketRow>
          )
        })}

        {odds.btts && (
          <MarketRow title={MARKETS.btts.label}>
            <Odd
              market="Ambos anotan"
              label="Sí"
              odds={odds.btts.yes}
              selected={picked('btts', 'yes')}
              onPress={() => pick('btts', 'yes', odds.btts?.yes)}
            />
            <Odd
              market="Ambos anotan"
              label="No"
              odds={odds.btts.no}
              selected={picked('btts', 'no')}
              onPress={() => pick('btts', 'no', odds.btts?.no)}
            />
          </MarketRow>
        )}
      </View>

      <Springy
        onPress={() => openNew({ match })}
        accessibilityRole="button"
        accessibilityLabel={`Agregar apuesta manual de ${match.homeTeam} contra ${match.awayTeam}`}
      >
        <View style={s.foot}>
          <Txt variant="label" size={10}>
            Tiros · T. a puerta · otro
          </Txt>
          <View style={s.footCta}>
            <Txt variant="label" size={10} color={c.amber}>
              Agregar
            </Txt>
            <Icon.next size={13} color={c.amber} strokeWidth={ICON_STROKE} />
          </View>
        </View>
      </Springy>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  card: { backgroundColor: c.board, borderRadius: radius.lg, overflow: 'hidden' },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 13,
  },
  league: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  teams: { paddingHorizontal: 14, paddingTop: 11, gap: 7 },
  team: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  markets: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 13, gap: 11 },
  odd: {
    minHeight: TAP,
    borderRadius: radius.sm,
    backgroundColor: c.board2,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Deshabilitado: opacidad 0.38-0.5 según la regla disabled-states. */
  oddOff: { opacity: 0.42 },
  /** En el cupón: ámbar sólido, el único acento interactivo de la app. */
  oddOn: { backgroundColor: c.amber },
  foot: {
    minHeight: TAP,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: c.lineSoft,
  },
  footCta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
})
