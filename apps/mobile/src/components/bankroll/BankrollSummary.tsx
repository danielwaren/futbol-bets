import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'
import {
  bankrollSeries,
  computeStats,
  formatCLP,
  formatPercent,
  formatSignedCLP,
  type Bankroll,
  type Bet,
} from '@futbolismo/core'
import { Txt } from '@/components/ui'
import { c, family, radius, shadow } from '@/theme'

/**
 * La banca no salta al nuevo valor: recorre los dígitos. Da sensación de que
 * el saldo se recalcula, que es exactamente lo que pasa por debajo.
 */
function useCountUp(value: number, ms = 750) {
  const [shown, setShown] = useState(value)

  useEffect(() => {
    const from = shown
    if (from === value) return
    const started = Date.now()
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - started) / ms)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(from + (value - from) * eased))
      if (t >= 1) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return shown
}

const W = 300
const H = 40

function Spark({
  bets,
  initialAmount,
  createdAt,
  positive,
}: {
  bets: Bet[]
  initialAmount: number
  createdAt: string
  positive: boolean
}) {
  const { line, area } = useMemo(() => {
    const pts = bankrollSeries(bets, initialAmount, createdAt)
    if (pts.length < 2) return { line: '', area: '' }

    const vals = pts.map((p) => p.balance)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const span = max - min || 1
    const step = W / (pts.length - 1)

    const coords = vals.map((v, i) => {
      const x = i * step
      const y = H - 4 - ((v - min) / span) * (H - 10)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })

    return {
      line: `M${coords.join(' L')}`,
      area: `M${coords.join(' L')} L${W},${H} L0,${H} Z`,
    }
  }, [bets, initialAmount, createdAt])

  if (!line) return null
  const stroke = positive ? c.pitch : c.flag

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="bkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <Stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#bkFill)" />
      <Path d={line} stroke={stroke} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  )
}

export function BankrollSummary({
  bankroll,
  bets,
}: {
  bankroll: Bankroll
  bets: Bet[]
}) {
  const stats = computeStats(bets)
  const net = bankroll.currentAmount - bankroll.initialAmount
  const roi = bankroll.initialAmount ? (net / bankroll.initialAmount) * 100 : 0
  const pos = net >= 0
  const committed = bets
    .filter((b) => b.status === 'pending')
    .reduce((a, b) => a + b.stake, 0)

  const shown = useCountUp(bankroll.currentAmount)

  return (
    <Animated.View entering={FadeIn.duration(320)} style={[s.card, shadow.card]}>
      <View style={s.top}>
        <Txt variant="label">Banca · {bankroll.name}</Txt>
        <View style={[s.delta, { backgroundColor: pos ? c.pitchSoft : c.flagSoft }]}>
          <Txt
            color={pos ? c.pitch : c.flag}
            style={{ fontFamily: family.monoBold, fontSize: 11.5 }}
          >
            {pos ? '▲' : '▼'} {formatPercent(roi)}
          </Txt>
        </View>
      </View>

      <Txt variant="figure" style={{ marginTop: 2 }}>
        {formatCLP(shown)}
      </Txt>

      <View style={{ marginTop: 8, marginHorizontal: -2 }}>
        <Spark
          bets={bets}
          initialAmount={bankroll.initialAmount}
          createdAt={bankroll.createdAt}
          positive={pos}
        />
      </View>

      <View style={s.metrics}>
        <Metric label="Inicial" value={formatCLP(bankroll.initialAmount)} />
        <Metric label="G/P neta" value={formatSignedCLP(net)} tone={pos ? 'pos' : 'neg'} />
        <Metric label="Comprometido" value={formatCLP(committed)} />
      </View>

      <View style={s.tally}>
        <Txt variant="dataSm">{stats.count} apuestas</Txt>
        <Txt variant="dataSm">{stats.pending} pend.</Txt>
        <Txt variant="dataSm" color={c.pitch}>
          {stats.won} G
        </Txt>
        <Txt variant="dataSm" color={c.flag}>
          {stats.lost} P
        </Txt>
      </View>
    </Animated.View>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'pos' | 'neg'
}) {
  return (
    <View style={{ flex: 1, gap: 1 }}>
      <Txt variant="label" size={9}>
        {label}
      </Txt>
      <Txt
        variant="data"
        size={12.5}
        color={tone === 'pos' ? c.pitch : tone === 'neg' ? c.flag : c.ink}
      >
        {value}
      </Txt>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: c.board,
    borderRadius: radius.lg,
    padding: 15,
    overflow: 'hidden',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  delta: { borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3 },
  metrics: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: c.lineSoft,
  },
  tally: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 11,
    backgroundColor: c.board2,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
})
