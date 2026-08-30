import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Bet } from '@futbolismo/core'
import { bankrollSeries } from '@futbolismo/core'
import { formatCLP, formatSignedCLP } from '@futbolismo/core'
import {
  axisProps,
  ChartCard,
  CHART_COLORS,
  gridProps,
  tooltipStyle,
} from './common'

function shortDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
  }).format(d)
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
  const data = bankrollSeries(bets, initialAmount, createdAt).map((p, i) => ({
    ...p,
    idx: i,
    tick: i === 0 ? 'Inicio' : shortDate(p.date),
  }))

  return (
    <ChartCard
      title="Evolución de la banca"
      subtitle="Saldo tras cada apuesta resuelta"
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ left: 4, right: 8, top: 4 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="tick" {...axisProps} />
          <YAxis
            {...axisProps}
            width={70}
            tickFormatter={(v) => formatCLP(v as number)}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(v) => [formatCLP(v as number), 'Saldo']}
          />
          <ReferenceLine y={initialAmount} stroke="#475569" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="balance"
            stroke={CHART_COLORS.sky}
            strokeWidth={2}
            dot={{ r: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
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
  const data = bankrollSeries(bets, initialAmount, createdAt).map((p, i) => ({
    ...p,
    tick: i === 0 ? 'Inicio' : shortDate(p.date),
  }))

  return (
    <ChartCard
      title="Ganancia / pérdida acumulada"
      subtitle="P&L neto sumado en el tiempo"
    >
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ left: 4, right: 8, top: 4 }}>
          <defs>
            <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.emerald} stopOpacity={0.4} />
              <stop offset="100%" stopColor={CHART_COLORS.emerald} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="tick" {...axisProps} />
          <YAxis
            {...axisProps}
            width={70}
            tickFormatter={(v) => formatSignedCLP(v as number)}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(v) => [formatSignedCLP(v as number), 'P&L acum.']}
          />
          <ReferenceLine y={0} stroke="#475569" />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke={CHART_COLORS.emerald}
            strokeWidth={2}
            fill="url(#pnlFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
