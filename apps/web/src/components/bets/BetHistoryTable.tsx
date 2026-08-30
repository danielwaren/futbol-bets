import type { Bet } from '@futbolismo/core'
import { LEAGUES, MARKETS } from '@futbolismo/core'
import { BetStatusBadge, LeagueBadge } from './BetStatusBadge'
import { SettleBetControl } from './SettleBetControl'
import { betPnl } from '@futbolismo/core'
import {
  formatCLP,
  formatDateTime,
  formatOdds,
  formatSignedCLP,
} from '@futbolismo/core'
import { cn } from '@futbolismo/core'

const matchEnded = (bet: Bet) =>
  bet.matchId != null &&
  bet.market !== 'corners' &&
  new Date(bet.matchDate).getTime() < Date.now()

export function BetHistoryTable({ bets }: { bets: Bet[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-[900px] w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/60 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2 font-medium">Partido</th>
            <th className="px-3 py-2 font-medium">Mercado</th>
            <th className="px-3 py-2 font-medium text-right">Cuota</th>
            <th className="px-3 py-2 font-medium text-right">Stake</th>
            <th className="px-3 py-2 font-medium text-right">Retorno pot.</th>
            <th className="px-3 py-2 font-medium text-right">P&L</th>
            <th className="px-3 py-2 font-medium">Estado</th>
            <th className="px-3 py-2 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {bets.map((bet) => {
            const pnl = betPnl(bet)
            return (
              <tr
                key={bet.id}
                className="border-b border-slate-800/70 last:border-0 hover:bg-slate-900/40"
              >
                <td className="px-3 py-2.5 align-top">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-slate-100">
                      {bet.homeTeam}{' '}
                      <span className="text-slate-500">vs</span> {bet.awayTeam}
                    </span>
                    <div className="flex items-center gap-2">
                      <LeagueBadge
                        label={LEAGUES[bet.league].shortLabel}
                        color={LEAGUES[bet.league].color}
                      />
                      <span className="text-[11px] text-slate-500">
                        {formatDateTime(bet.matchDate)}
                      </span>
                    </div>
                    {bet.notes && (
                      <span className="max-w-xs text-[11px] italic text-slate-500">
                        “{bet.notes}”
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 align-top">
                  <span className="text-slate-300">
                    {MARKETS[bet.market].shortLabel}
                  </span>
                  <br />
                  <span className="text-[12px] text-slate-400">
                    {bet.selectionLabel}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right align-top tabular-nums text-slate-200">
                  {formatOdds(bet.odds)}
                </td>
                <td className="px-3 py-2.5 text-right align-top tabular-nums text-slate-200">
                  {formatCLP(bet.stake)}
                </td>
                <td className="px-3 py-2.5 text-right align-top tabular-nums text-slate-400">
                  {formatCLP(bet.potentialReturn)}
                </td>
                <td
                  className={cn(
                    'px-3 py-2.5 text-right align-top tabular-nums font-medium',
                    pnl > 0 && 'text-emerald-400',
                    pnl < 0 && 'text-rose-400',
                    pnl === 0 && 'text-slate-500',
                  )}
                >
                  {bet.status === 'pending' || bet.status === 'void'
                    ? '—'
                    : formatSignedCLP(pnl)}
                </td>
                <td className="px-3 py-2.5 align-top">
                  <div className="flex flex-col items-start gap-1">
                    <BetStatusBadge status={bet.status} />
                    {bet.status === 'pending' && matchEnded(bet) && (
                      <span className="text-[10px] text-slate-500">
                        ⏳ esperando resultado
                      </span>
                    )}
                    {bet.resultDetail && (
                      <span className="text-[10px] text-slate-500">
                        {bet.resultDetail}
                        {bet.settledBy === 'auto' && ' · auto'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 align-top">
                  <SettleBetControl bet={bet} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
