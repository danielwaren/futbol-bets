import type { ReactNode } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts'
import {
  bankrollSeries,
  computeStats,
  formatCLP,
  formatPercent,
  formatSignedCLP,
  LEAGUES,
  MARKETS,
  statsByLeague,
  statsByMarket,
  type Bankroll,
  type Bet,
  type League,
  type Market,
} from '@futbolismo/core'
import { Txt } from './ui'
import { c, family, leagueColor, motion, radius, shadow } from '@/theme'

const MARKET_COLOR: Record<string, string> = {
  '1x2': c.amber,
  goals: '#4DA3FF',
  corners: '#B692FF',
  btts: '#22D3EE',
}
const mLabel = (k: string) => MARKETS[k as Market]?.shortLabel ?? k
const lLabel = (k: string) => LEAGUES[k as League]?.shortLabel ?? k

function ChartCard({
  title,
  subtitle,
  children,
  index = 0,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  index?: number
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * motion.stagger).duration(motion.enter)}
      style={[s.card, shadow.card]}
    >
      <View style={{ marginBottom: 12 }}>
        <Txt variant="h2" size={14}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="label" size={9.5} style={{ marginTop: 2 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {children}
    </Animated.View>
  )
}

function useChartWidth() {
  const { width } = useWindowDimensions()
  // Suelo de 240: en el primer render width puede ser 0 y las librerías de
  // gráficos reciben un ancho negativo (SVG lo rechaza).
  return Math.max(240, Math.min(width, 560) - 32 - 30)
}

/** Ejes en mono y sin rejilla estridente: la cifra manda, no el adorno. */
const axis = {
  yAxisTextStyle: { color: c.inkFaint, fontSize: 9, fontFamily: family.mono },
  xAxisLabelTextStyle: { color: c.inkFaint, fontSize: 9, fontFamily: family.mono },
  rulesColor: c.lineSoft,
  yAxisColor: c.lineSoft,
  xAxisColor: c.lineSoft,
  backgroundColor: 'transparent',
} as const

export function KpiTiles({ bankroll, bets }: { bankroll: Bankroll; bets: Bet[] }) {
  const st = computeStats(bets)
  const net = bankroll.currentAmount - bankroll.initialAmount
  const tiles: { label: string; value: string; tone?: 'pos' | 'neg' }[] = [
    { label: 'ROI', value: formatPercent(st.roi), tone: st.roi >= 0 ? 'pos' : 'neg' },
    { label: 'Winrate', value: formatPercent(st.winrate, 0) },
    { label: 'G/P neta', value: formatSignedCLP(net), tone: net >= 0 ? 'pos' : 'neg' },
    { label: 'Apostado', value: formatCLP(st.staked) },
    { label: 'Apuestas', value: String(st.count) },
    { label: 'Pendientes', value: String(st.pending) },
  ]
  return (
    <View style={s.kpis}>
      {tiles.map((t, i) => (
        <Animated.View
          key={t.label}
          entering={FadeInDown.delay(i * 40).duration(motion.enter)}
          style={[s.kpi, shadow.card]}
        >
          <Txt variant="label" size={9}>
            {t.label}
          </Txt>
          <Txt
            variant="data"
            size={19}
            color={t.tone === 'pos' ? c.pitch : t.tone === 'neg' ? c.flag : c.ink}
            style={{ marginTop: 2 }}
          >
            {t.value}
          </Txt>
        </Animated.View>
      ))}
    </View>
  )
}

export function BankrollEvolutionChart({
  bets,
  initialAmount,
  createdAt,
  index = 0,
}: {
  bets: Bet[]
  initialAmount: number
  createdAt: string
  index?: number
}) {
  const w = useChartWidth()
  const pts = bankrollSeries(bets, initialAmount, createdAt)
  const data = pts.map((p) => ({ value: p.balance }))
  return (
    <ChartCard
      title="Evolución de la banca"
      subtitle="Saldo tras cada apuesta resuelta"
      index={index}
    >
      <LineChart
        data={data}
        width={w}
        height={180}
        color={c.amber}
        thickness={2}
        areaChart
        startFillColor={c.amber}
        endFillColor={c.board}
        startOpacity={0.22}
        endOpacity={0}
        hideDataPoints={data.length > 12}
        dataPointsColor={c.amber}
        initialSpacing={4}
        {...axis}
      />
    </ChartCard>
  )
}

export function CumulativePnLChart({
  bets,
  initialAmount,
  createdAt,
  index = 0,
}: {
  bets: Bet[]
  initialAmount: number
  createdAt: string
  index?: number
}) {
  const w = useChartWidth()
  const pts = bankrollSeries(bets, initialAmount, createdAt)
  const data = pts.map((p) => ({ value: p.pnl }))
  const up = (pts.at(-1)?.pnl ?? 0) >= 0
  return (
    <ChartCard title="Ganancia acumulada" subtitle="P&L neto en el tiempo" index={index}>
      <LineChart
        data={data}
        width={w}
        height={180}
        areaChart
        color={up ? c.pitch : c.flag}
        startFillColor={up ? c.pitch : c.flag}
        endFillColor={c.board}
        startOpacity={0.28}
        endOpacity={0}
        thickness={2}
        hideDataPoints={data.length > 12}
        initialSpacing={4}
        {...axis}
      />
    </ChartCard>
  )
}

export function WinrateByMarketChart({ bets, index = 0 }: { bets: Bet[]; index?: number }) {
  const w = useChartWidth()
  const data = statsByMarket(bets).map((st) => ({
    value: Number(st.winrate.toFixed(1)),
    label: mLabel(st.key),
    frontColor: MARKET_COLOR[st.key] ?? c.amber,
  }))
  return (
    <ChartCard title="Winrate por mercado" subtitle="Solo apuestas resueltas" index={index}>
      <BarChart
        data={data}
        width={w}
        height={165}
        maxValue={100}
        barWidth={26}
        spacing={22}
        barBorderRadius={4}
        {...axis}
      />
    </ChartCard>
  )
}

export function RoiByMarketChart({ bets, index = 0 }: { bets: Bet[]; index?: number }) {
  const w = useChartWidth()
  const data = statsByMarket(bets).map((st) => {
    const roi = Number(st.roi.toFixed(1))
    return {
      value: roi,
      label: mLabel(st.key),
      frontColor: roi >= 0 ? c.pitch : c.flag,
    }
  })
  return (
    <ChartCard title="ROI por mercado" subtitle="P&L sobre lo apostado" index={index}>
      <BarChart
        data={data}
        width={w}
        height={165}
        barWidth={26}
        spacing={22}
        barBorderRadius={4}
        {...axis}
      />
    </ChartCard>
  )
}

export function LeaguePerformanceChart({ bets, index = 0 }: { bets: Bet[]; index?: number }) {
  const w = useChartWidth()
  const data = statsByLeague(bets).flatMap((st) => [
    {
      value: Number(st.winrate.toFixed(1)),
      label: lLabel(st.key),
      frontColor: leagueColor[st.key] ?? c.amber,
      spacing: 2,
    },
    { value: Number(st.roi.toFixed(1)), frontColor: c.board3 },
  ])
  return (
    <ChartCard
      title="Winrate y ROI por liga"
      subtitle="Color = winrate · gris = ROI"
      index={index}
    >
      <BarChart
        data={data}
        width={w}
        height={165}
        barWidth={13}
        spacing={16}
        barBorderRadius={3}
        {...axis}
      />
    </ChartCard>
  )
}

export function BetsByMarketChart({ bets, index = 0 }: { bets: Bet[]; index?: number }) {
  const stats = statsByMarket(bets).filter((st) => st.count > 0)
  if (!stats.length) return null
  const data = stats.map((st) => ({
    value: st.count,
    color: MARKET_COLOR[st.key] ?? c.amber,
  }))
  return (
    <ChartCard title="Distribución por mercado" subtitle="Volumen de apuestas" index={index}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <PieChart
          data={data}
          donut
          radius={66}
          innerRadius={42}
          innerCircleColor={c.board}
        />
        <View style={{ gap: 7, flex: 1 }}>
          {stats.map((st) => (
            <View key={st.key} style={s.legend}>
              <View
                style={[
                  s.legendDot,
                  { backgroundColor: MARKET_COLOR[st.key] ?? c.amber },
                ]}
              />
              <Txt variant="dataSm">
                {mLabel(st.key)} · {st.count}
              </Txt>
            </View>
          ))}
        </View>
      </View>
    </ChartCard>
  )
}

const s = StyleSheet.create({
  card: { backgroundColor: c.board, borderRadius: radius.lg, padding: 14 },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpi: {
    width: '31.5%',
    backgroundColor: c.board,
    borderRadius: radius.md,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 9, height: 9, borderRadius: 4.5 },
})
