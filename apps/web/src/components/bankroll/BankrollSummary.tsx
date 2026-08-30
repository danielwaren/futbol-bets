import type { Bankroll, Bet } from '@futbolismo/core'
import { computeStats } from '@futbolismo/core'
import { formatCLP, formatPercent, formatSignedCLP } from '@futbolismo/core'
import { cn } from '@futbolismo/core'

export function BankrollSummary({
  bankroll,
  bets,
}: {
  bankroll: Bankroll
  bets: Bet[]
}) {
  const stats = computeStats(bets)
  const net = bankroll.currentAmount - bankroll.initialAmount
  const roiPct = bankroll.initialAmount
    ? (net / bankroll.initialAmount) * 100
    : 0
  const positive = net >= 0

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-500">
          Banca actual
        </p>
        <p className="text-2xl font-bold text-white tabular-nums">
          {formatCLP(bankroll.currentAmount)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <Metric label="Inicial" value={formatCLP(bankroll.initialAmount)} />
        <Metric
          label="G/P neta"
          value={formatSignedCLP(net)}
          tone={positive ? 'positive' : 'negative'}
        />
        <Metric
          label="ROI"
          value={formatPercent(roiPct)}
          tone={positive ? 'positive' : 'negative'}
        />
        <Metric
          label="Comprometido"
          value={formatCLP(
            bets
              .filter((b) => b.status === 'pending')
              .reduce((a, b) => a + b.stake, 0),
          )}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 text-[11px] text-slate-400">
        <span>{stats.count} apuestas</span>
        <span>{stats.pending} pend.</span>
        <span className="text-emerald-400">{stats.won}G</span>
        <span className="text-rose-400">{stats.lost}P</span>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'neutral' | 'positive' | 'negative'
}) {
  return (
    <div className="rounded-lg bg-slate-800/40 px-2.5 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          'font-semibold tabular-nums',
          tone === 'positive' && 'text-emerald-400',
          tone === 'negative' && 'text-rose-400',
          tone === 'neutral' && 'text-slate-100',
        )}
      >
        {value}
      </p>
    </div>
  )
}
