import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Bet, League, Market } from '@futbolismo/core'
import { LEAGUES, MARKETS } from '@futbolismo/core'
import { statsByLeague, statsByMarket } from '@futbolismo/core'
import { formatCLP, formatPercent } from '@futbolismo/core'
import {
  axisProps,
  ChartCard,
  CHART_COLORS,
  gridProps,
  MARKET_COLORS,
  tooltipStyle,
} from './common'

const marketLabel = (k: string) => MARKETS[k as Market]?.shortLabel ?? k
const leagueLabel = (k: string) => LEAGUES[k as League]?.shortLabel ?? k

export function WinrateByMarketChart({ bets }: { bets: Bet[] }) {
  const data = statsByMarket(bets).map((s) => ({
    name: marketLabel(s.key),
    key: s.key,
    winrate: Number(s.winrate.toFixed(1)),
    resueltas: s.settled,
  }))

  return (
    <ChartCard title="Winrate por mercado" subtitle="Solo apuestas resueltas">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: 4, right: 8, top: 4 }}>
          <CartesianGrid {...gridProps} vertical={false} />
          <XAxis dataKey="name" {...axisProps} />
          <YAxis
            {...axisProps}
            width={44}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(v, n) => [
              n === 'winrate' ? `${v}%` : v,
              n === 'winrate' ? 'Winrate' : 'Resueltas',
            ]}
          />
          <Bar dataKey="winrate" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.key} fill={MARKET_COLORS[d.key] ?? CHART_COLORS.slate} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function RoiByMarketChart({ bets }: { bets: Bet[] }) {
  const data = statsByMarket(bets).map((s) => ({
    name: marketLabel(s.key),
    key: s.key,
    roi: Number(s.roi.toFixed(1)),
  }))

  return (
    <ChartCard title="ROI por mercado" subtitle="P&L / stake de apuestas resueltas">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: 4, right: 8, top: 4 }}>
          <CartesianGrid {...gridProps} vertical={false} />
          <XAxis dataKey="name" {...axisProps} />
          <YAxis {...axisProps} width={48} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v) => [formatPercent(Number(v)), 'ROI']}
          />
          <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell
                key={d.key}
                fill={d.roi >= 0 ? CHART_COLORS.emerald : CHART_COLORS.rose}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function LeaguePerformanceChart({ bets }: { bets: Bet[] }) {
  const data = statsByLeague(bets).map((s) => ({
    name: leagueLabel(s.key),
    key: s.key,
    winrate: Number(s.winrate.toFixed(1)),
    roi: Number(s.roi.toFixed(1)),
  }))

  return (
    <ChartCard
      title="Winrate y ROI por liga"
      subtitle="Comparación entre competiciones"
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: 4, right: 8, top: 4 }}>
          <CartesianGrid {...gridProps} vertical={false} />
          <XAxis dataKey="name" {...axisProps} />
          <YAxis {...axisProps} width={48} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v, n) => [
              `${v}%`,
              n === 'winrate' ? 'Winrate' : 'ROI',
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="winrate" name="Winrate" fill={CHART_COLORS.sky} radius={[4, 4, 0, 0]} />
          <Bar dataKey="roi" name="ROI" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function BetsByMarketChart({ bets }: { bets: Bet[] }) {
  const data = statsByMarket(bets).map((s) => ({
    name: marketLabel(s.key),
    key: s.key,
    value: s.count,
    staked: s.staked,
  }))

  if (!data.length) return null

  return (
    <ChartCard
      title="Distribución de apuestas por mercado"
      subtitle="Dónde estás concentrando el volumen"
    >
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={45}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={MARKET_COLORS[d.key] ?? CHART_COLORS.slate} />
            ))}
          </Pie>
          <Tooltip
            {...tooltipStyle}
            formatter={(v, _n, item) => {
              const p = (item?.payload ?? {}) as { staked?: number; name?: string }
              return [
                `${v} apuestas · ${formatCLP(p.staked ?? 0)}`,
                p.name ?? '',
              ]
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
