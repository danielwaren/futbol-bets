import { useBets } from '@futbolismo/core'
import { Screen } from '@/components/Screen'
import { EmptyState, ErrorText, Spinner } from '@/components/ui'
import { useBankrollContext } from '@/context/BankrollContext'
import {
  BankrollEvolutionChart,
  BetsByMarketChart,
  CumulativePnLChart,
  KpiTiles,
  LeaguePerformanceChart,
  RoiByMarketChart,
  WinrateByMarketChart,
} from '@/components/charts'

export default function Stats() {
  const { selected: bankroll } = useBankrollContext()
  const q = useBets(bankroll?.id)
  const bets = q.data ?? []

  if (!bankroll) {
    return (
      <Screen title="Análisis">
        <Spinner />
      </Screen>
    )
  }

  return (
    <Screen
      title="Análisis"
      subtitle={bankroll.name}
      onRefresh={() => q.refetch()}
      refreshing={q.isFetching}
    >
      {q.isLoading ? (
        <Spinner />
      ) : q.isError ? (
        <ErrorText error={q.error} />
      ) : bets.length === 0 ? (
        <EmptyState
          title="Sin datos todavía"
          hint="Registra y resuelve algunas apuestas para ver la evolución de la banca."
        />
      ) : (
        <>
          <KpiTiles bankroll={bankroll} bets={bets} />
          <BankrollEvolutionChart
            bets={bets}
            initialAmount={bankroll.initialAmount}
            createdAt={bankroll.createdAt}
            index={1}
          />
          <CumulativePnLChart
            bets={bets}
            initialAmount={bankroll.initialAmount}
            createdAt={bankroll.createdAt}
            index={2}
          />
          <WinrateByMarketChart bets={bets} index={3} />
          <RoiByMarketChart bets={bets} index={4} />
          <LeaguePerformanceChart bets={bets} index={5} />
          <BetsByMarketChart bets={bets} index={6} />
        </>
      )}
    </Screen>
  )
}
