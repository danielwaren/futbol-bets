import {
  BankrollEvolutionChart,
  CumulativePnLChart,
} from '@/components/charts/BankrollCharts'
import { KpiTiles } from '@/components/charts/KpiTiles'
import {
  BetsByMarketChart,
  LeaguePerformanceChart,
  RoiByMarketChart,
  WinrateByMarketChart,
} from '@/components/charts/SegmentCharts'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/misc'
import { useBankrollContext } from '@/context/BankrollContext'
import { useBets } from '@futbolismo/core'

export function StatsPage() {
  const { selected: bankroll } = useBankrollContext()
  const betsQuery = useBets(bankroll?.id)
  const bets = betsQuery.data ?? []

  if (!bankroll) return null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-white">Estadísticas</h1>
        <p className="text-xs text-slate-500">
          Rendimiento de la estrategia · {bankroll.name}
        </p>
      </div>

      {betsQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7" />
        </div>
      ) : betsQuery.isError ? (
        <ErrorState error={betsQuery.error} />
      ) : bets.length === 0 ? (
        <EmptyState
          title="Sin datos todavía"
          hint="Registra y resuelve algunas apuestas para ver la evolución de la banca, el winrate y el ROI por mercado y liga."
        />
      ) : (
        <>
          <KpiTiles bankroll={bankroll} bets={bets} />
          <div className="grid gap-3 lg:grid-cols-2">
            <BankrollEvolutionChart
              bets={bets}
              initialAmount={bankroll.initialAmount}
              createdAt={bankroll.createdAt}
            />
            <CumulativePnLChart
              bets={bets}
              initialAmount={bankroll.initialAmount}
              createdAt={bankroll.createdAt}
            />
            <WinrateByMarketChart bets={bets} />
            <RoiByMarketChart bets={bets} />
            <LeaguePerformanceChart bets={bets} />
            <BetsByMarketChart bets={bets} />
          </div>
        </>
      )}
    </div>
  )
}
