import type { ReactNode } from 'react'

export const CHART_COLORS = {
  sky: '#38bdf8',
  emerald: '#34d399',
  amber: '#fbbf24',
  violet: '#a78bfa',
  rose: '#fb7185',
  slate: '#94a3b8',
}

export const MARKET_COLORS: Record<string, string> = {
  '1x2': CHART_COLORS.sky,
  goals: CHART_COLORS.emerald,
  corners: CHART_COLORS.amber,
  btts: CHART_COLORS.violet,
}

export const LEAGUE_CHART_COLORS: Record<string, string> = {
  chile: CHART_COLORS.rose,
  laliga: CHART_COLORS.amber,
  premier: CHART_COLORS.violet,
}

export const axisProps = {
  stroke: '#475569',
  tick: { fill: '#94a3b8', fontSize: 11 },
  tickLine: false,
}

export const gridProps = {
  stroke: '#1e293b',
  strokeDasharray: '3 3',
}

export const tooltipStyle = {
  contentStyle: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: '#e2e8f0' },
  itemStyle: { color: '#e2e8f0' },
}

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
