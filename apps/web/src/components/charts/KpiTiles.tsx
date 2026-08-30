import type { Bankroll, Bet } from '@futbolismo/core'
import { computeStats } from '@futbolismo/core'
import {
  formatCLP,
  formatPercent,
  formatSignedCLP,
} from '@futbolismo/core'
import { cn } from '@futbolismo/core'

export function KpiTiles({
  bankroll,
  bets,
}: {
  bankroll: Bankroll
  bets: Bet[]
}) {
  const s = computeStats(bets)
  const net = bankroll.currentAmount - bankroll.initialAmount

  const tiles: {
    label: string
    value: string
    tone?: 'positive' | 'negative'
  }[] = [
    { label: 'Banca actual', value: formatCLP(bankroll.currentAmount) },
    {
      label: 'G/P neta',
      value: formatSignedCLP(net),
      tone: net >= 0 ? 'positive' : 'negative',
    },
    {
      label: 'ROI',
      value: formatPercent(s.roi),
      tone: s.roi >= 0 ? 'positive' : 'negative',
    },
    { label: 'Winrate', value: formatPercent(s.winrate, 0) },
    { label: 'Apuestas', value: String(s.count) },
    { label: 'Pendientes', value: String(s.pending) },
    { label: 'Total apostado', value: formatCLP(s.staked) },
    {
      label: 'Ganadas / Perdidas',
      value: `${s.won} / ${s.lost}`,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"
        >
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            {t.label}
          </p>
          <p
            className={cn(
              'mt-1 text-lg font-bold tabular-nums',
              t.tone === 'positive' && 'text-emerald-400',
              t.tone === 'negative' && 'text-rose-400',
              !t.tone && 'text-slate-100',
            )}
          >
            {t.value}
          </p>
        </div>
      ))}
    </div>
  )
}
