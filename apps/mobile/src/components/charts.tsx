import type { ReactNode } from 'react'
import { useWindowDimensions, View } from 'react-native'
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
import { Card, Txt } from './ui'
import { c } from '@/theme'

const COLORS = {
  sky: '#38bdf8',
  emerald: '#34d399',
  amber: '#fbbf24',
  violet: '#a78bfa',
  rose: '#fb7185',
}
const MARKET_COLOR: Record<string, string> = {
  '1x2': COLORS.sky,
  goals: COLORS.emerald,
  corners: COLORS.amber,
  btts: COLORS.violet,
}
const mLabel = (k: string) => MARKETS[k as Market]?.shortLabel ?? k
const lLabel = (k: string) => LEAGUES[k as League]?.shortLabel ?? k

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <Card style={{ gap: 10 }}>
      <View>
        <Txt weight="600">{title}</Txt>
        {subtitle && (
          <Txt size={11} faint>
            {subtitle}
          </Txt>
        )}
      </View>
      {children}
    </Card>
  )
}

function useChartWidth() {
  const { width } = useWindowDimensions()
  return Math.min(width, 560) - 32 - 28 // padding de pantalla + card
}

export function KpiTiles({
  bankroll,
  bets,
}: {
  bankroll: Bankroll
  bets: Bet[]
}) {
  const s = computeStats(bets)
  const net = bankroll.currentAmount - bankroll.initialAmount
  const tiles: { label: string; value: string; tone?: 'pos' | 'neg' }[] = [
    { label: 'Banca actual', value: formatCLP(bankroll.currentAmount) },
    { label: 'G/P neta', value: formatSignedCLP(net), tone: net >= 0 ? 'pos' : 'neg' },
    { label: 'ROI', value: formatPercent(s.roi), tone: s.roi >= 0 ? 'pos' : 'neg' },
    { label: 'Winrate', value: formatPercent(s.winrate, 0) },
    { label: 'Apuestas', value: String(s.count) },
    { label: 'Pendientes', value: String(s.pending) },
    { label: 'Apostado', value: formatCLP(s.staked) },
    { label: 'G / P', value: `${s.won} / ${s.lost}` },
  ]
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {tiles.map((t) => (
        <Card key={t.label} style={{ width: '47%', padding: 12 }}>
          <Txt size={11} faint>
            {t.label.toUpperCase()}
          </Txt>
          <Txt
            weight="700"
            size={17}
            color={t.tone === 'pos' ? c.emerald : t.tone === 'neg' ? c.rose : c.white}
          >
            {t.value}
          </Txt>
        </Card>
      ))}
    </View>
  )
}

export function BankrollEvolutionChart({
  bets,
  initialAmount,
  createdAt,
}: {
  bets: Bet[]
  initialAmount: number
  createdAt: string
}) {
  const w = useChartWidth()
  const pts = bankrollSeries(bets, initialAmount, createdAt)
  const data = pts.map((p, i) => ({
    value: p.balance,
    label: i === 0 ? 'Inicio' : '',
  }))
  return (
    <ChartCard title="Evolución de la banca" subtitle="Saldo tras cada apuesta resuelta">
      <LineChart
        data={data}
        width={w}
        height={190}
        color={COLORS.sky}
        thickness={2}
        hideDataPoints={data.length > 12}
        yAxisTextStyle={{ color: c.textDim, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: c.textDim, fontSize: 9 }}
        rulesColor={c.border}
        yAxisColor={c.border}
        xAxisColor={c.border}
        formatYLabel={(v) => formatCLP(Number(v))}
      />
    </ChartCard>
  )
}

export function CumulativePnLChart({
  bets,
  initialAmount,
  createdAt,
}: {
  bets: Bet[]
  initialAmount: number
  createdAt: string
}) {
  const w = useChartWidth()
  const pts = bankrollSeries(bets, initialAmount, createdAt)
  const data = pts.map((p, i) => ({ value: p.pnl, label: i === 0 ? 'Inicio' : '' }))
  return (
    <ChartCard title="Ganancia / pérdida acumulada" subtitle="P&L neto en el tiempo">
      <LineChart
        data={data}
        width={w}
        height={190}
        areaChart
        color={COLORS.emerald}
        startFillColor={COLORS.emerald}
        endFillColor={c.canvas}
        startOpacity={0.4}
        endOpacity={0.05}
        thickness={2}
        hideDataPoints={data.length > 12}
        yAxisTextStyle={{ color: c.textDim, fontSize: 10 }}
        rulesColor={c.border}
        yAxisColor={c.border}
        xAxisColor={c.border}
        formatYLabel={(v) => formatSignedCLP(Number(v))}
      />
    </ChartCard>
  )
}

export function WinrateByMarketChart({ bets }: { bets: Bet[] }) {
  const w = useChartWidth()
  const data = statsByMarket(bets).map((s) => ({
    value: Number(s.winrate.toFixed(1)),
    label: mLabel(s.key),
    frontColor: MARKET_COLOR[s.key] ?? COLORS.sky,
  }))
  return (
    <ChartCard title="Winrate por mercado" subtitle="Solo apuestas resueltas">
      <BarChart
        data={data}
        width={w}
        height={180}
        maxValue={100}
        barWidth={26}
        spacing={22}
        yAxisTextStyle={{ color: c.textDim, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: c.textDim, fontSize: 10 }}
        rulesColor={c.border}
        yAxisColor={c.border}
        xAxisColor={c.border}
      />
    </ChartCard>
  )
}

export function RoiByMarketChart({ bets }: { bets: Bet[] }) {
  const w = useChartWidth()
  const data = statsByMarket(bets).map((s) => {
    const roi = Number(s.roi.toFixed(1))
    return {
      value: roi,
      label: mLabel(s.key),
      frontColor: roi >= 0 ? COLORS.emerald : COLORS.rose,
    }
  })
  return (
    <ChartCard title="ROI por mercado" subtitle="P&L / stake de apuestas resueltas">
      <BarChart
        data={data}
        width={w}
        height={180}
        barWidth={26}
        spacing={22}
        yAxisTextStyle={{ color: c.textDim, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: c.textDim, fontSize: 10 }}
        rulesColor={c.border}
        yAxisColor={c.border}
        xAxisColor={c.border}
      />
    </ChartCard>
  )
}

export function LeaguePerformanceChart({ bets }: { bets: Bet[] }) {
  const w = useChartWidth()
  const data = statsByLeague(bets).flatMap((s) => [
    { value: Number(s.winrate.toFixed(1)), label: lLabel(s.key), frontColor: COLORS.sky, spacing: 2 },
    { value: Number(s.roi.toFixed(1)), frontColor: COLORS.amber },
  ])
  return (
    <ChartCard title="Winrate y ROI por liga" subtitle="Azul = winrate · ámbar = ROI">
      <BarChart
        data={data}
        width={w}
        height={180}
        barWidth={14}
        spacing={16}
        yAxisTextStyle={{ color: c.textDim, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: c.textDim, fontSize: 9 }}
        rulesColor={c.border}
        yAxisColor={c.border}
        xAxisColor={c.border}
      />
    </ChartCard>
  )
}

export function BetsByMarketChart({ bets }: { bets: Bet[] }) {
  const stats = statsByMarket(bets).filter((s) => s.count > 0)
  if (!stats.length) return null
  const data = stats.map((s) => ({
    value: s.count,
    color: MARKET_COLOR[s.key] ?? COLORS.sky,
    text: String(s.count),
  }))
  return (
    <ChartCard title="Distribución por mercado" subtitle="Volumen de apuestas">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <PieChart data={data} donut radius={70} innerRadius={42} innerCircleColor={c.surface} />
        <View style={{ gap: 6 }}>
          {stats.map((s) => (
            <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: MARKET_COLOR[s.key] ?? COLORS.sky,
                }}
              />
              <Txt size={12} dim>
                {mLabel(s.key)} · {s.count}
              </Txt>
            </View>
          ))}
        </View>
      </View>
    </ChartCard>
  )
}
