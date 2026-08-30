import { useMemo, useState } from 'react'
import type { BetStatus, League, Market } from '@futbolismo/core'
import { BetHistoryTable } from '@/components/bets/BetHistoryTable'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { EmptyState, ErrorState, InlineStat, Spinner } from '@/components/ui/misc'
import { LEAGUE_LIST, MARKET_LIST } from '@futbolismo/core'
import { useBankrollContext } from '@/context/BankrollContext'
import { useBets, useSettleAll } from '@futbolismo/core'
import { useBetForm } from '@/context/BetFormContext'
import { usingMockOdds } from '@futbolismo/core'
import { computeStats } from '@futbolismo/core'
import { formatCLP, formatPercent, formatSignedCLP } from '@futbolismo/core'

const STATUS_OPTIONS: { value: BetStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'won', label: 'Ganadas' },
  { value: 'lost', label: 'Perdidas' },
  { value: 'void', label: 'Anuladas' },
]

export function HistoryPage() {
  const { selected: bankroll } = useBankrollContext()
  const betsQuery = useBets(bankroll?.id)
  const { openNew } = useBetForm()
  const settleAll = useSettleAll()

  const [league, setLeague] = useState<League | 'all'>('all')
  const [market, setMarket] = useState<Market | 'all'>('all')
  const [status, setStatus] = useState<BetStatus | 'all'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const all = useMemo(() => betsQuery.data ?? [], [betsQuery.data])

  const filtered = useMemo(() => {
    return all.filter((b) => {
      if (league !== 'all' && b.league !== league) return false
      if (market !== 'all' && b.market !== market) return false
      if (status !== 'all' && b.status !== status) return false
      if (from && b.matchDate < new Date(`${from}T00:00:00`).toISOString())
        return false
      if (to && b.matchDate > new Date(`${to}T23:59:59`).toISOString())
        return false
      return true
    })
  }, [all, league, market, status, from, to])

  const stats = computeStats(filtered)

  const awaitingResult = useMemo(() => {
    // oxlint-disable-next-line react/purity
    const now = Date.now()
    return all.filter(
      (b) =>
        b.status === 'pending' &&
        b.matchId &&
        b.market !== 'corners' &&
        new Date(b.matchDate).getTime() < now,
    ).length
  }, [all])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-white">Historial</h1>
          <p className="text-xs text-slate-500">
            {all.length} apuestas en {bankroll?.name ?? 'la banca'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!usingMockOdds() && awaitingResult > 0 && (
            <Button
              variant="secondary"
              size="sm"
              loading={settleAll.isPending}
              onClick={() => settleAll.mutate(undefined)}
            >
              Actualizar resultados ({awaitingResult})
            </Button>
          )}
          <Button size="sm" onClick={() => openNew()} disabled={!bankroll}>
            + Apuesta manual
          </Button>
        </div>
      </div>

      {settleAll.data && (
        <p className="rounded-lg bg-sky-500/10 px-3 py-2 text-xs text-sky-200">
          {settleAll.data.settled > 0
            ? `${settleAll.data.settled} apuesta(s) resueltas automáticamente.`
            : 'Aún no hay resultados finales para tus apuestas pendientes.'}
        </p>
      )}
      {settleAll.isError && <ErrorState error={settleAll.error} />}

      <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 sm:grid-cols-4">
        <InlineStat label="Apuestas" value={stats.count} />
        <InlineStat label="Apostado" value={formatCLP(stats.staked)} />
        <InlineStat
          label="P&L"
          value={formatSignedCLP(stats.pnl)}
          tone={stats.pnl >= 0 ? 'positive' : 'negative'}
        />
        <InlineStat
          label="ROI"
          value={formatPercent(stats.roi)}
          tone={stats.roi >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <div className="grid gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-3 sm:grid-cols-3 lg:grid-cols-5">
        <Select
          value={league}
          onChange={(e) => setLeague(e.target.value as League | 'all')}
        >
          <option value="all">Todas las ligas</option>
          {LEAGUE_LIST.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </Select>
        <Select
          value={market}
          onChange={(e) => setMarket(e.target.value as Market | 'all')}
        >
          <option value="all">Todos los mercados</option>
          {MARKET_LIST.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as BetStatus | 'all')}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        />
      </div>

      {betsQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7" />
        </div>
      ) : betsQuery.isError ? (
        <ErrorState error={betsQuery.error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            all.length === 0
              ? 'Todavía no registras apuestas'
              : 'Ninguna apuesta coincide con los filtros'
          }
          hint={
            all.length === 0
              ? 'Agrega una desde la pestaña Partidos o con "Registrar apuesta manual".'
              : undefined
          }
        />
      ) : (
        <BetHistoryTable bets={filtered} />
      )}
    </div>
  )
}
