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

  if (!bankroll) return <Screen title="Estadísticas"><Spinner /></Screen>

  return (
    <Screen
      title="Estadísticas"
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
        </>
      )}
    </Screen>
  )
}
