import { useEffect, useState } from 'react'
import { View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import {
  toDateInputValue,
  useBets,
  useMatches,
  useRefreshMatches,
  usingMockOdds,
  type League,
} from '@futbolismo/core'
import { Screen } from '@/components/Screen'
import { DateLeagueBar } from '@/components/matches/DateLeagueBar'
import { MatchCard } from '@/components/matches/MatchCard'
import { AdSlot } from '@/components/AdSlot'
import { BankrollSwitcher } from '@/components/bankroll/BankrollSwitcher'
import { BankrollSummary } from '@/components/bankroll/BankrollSummary'
import { Button, Chip, EmptyState, ErrorText, Txt } from '@/components/ui'
import { BetSlipBar } from '@/components/bets/BetSlipBar'
import { MatchSkeleton, SkeletonList } from '@/components/Skeleton'
import { useBankrollContext } from '@/context/BankrollContext'
import { useEntitlements } from '@/hooks/useEntitlements'
import { usePaywall } from '@/context/PaywallContext'
import { useBetSlip } from '@/context/BetSlipContext'
import { c, motion, radius } from '@/theme'

export default function Matches() {
  const entitlements = useEntitlements()
  const { openPaywall } = usePaywall()
  const { selected: bankroll } = useBankrollContext()
  const slip = useBetSlip()
  const allowed = entitlements.leagues
  const allowedKey = allowed.join(',')

  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [leagues, setLeagues] = useState<League[]>(allowed)

  useEffect(() => {
    setLeagues(allowed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedKey])

  const q = useMatches(leagues, date)
  const refresh = useRefreshMatches(leagues)
  const bets = useBets(bankroll?.id)
  const matches = q.data?.matches ?? []

  return (
    <Screen
      title="Partidos"
      subtitle="1X2 · Goles · Córners · Tarjetas · BTTS"
      footer={<BetSlipBar />}
      onRefresh={() => q.refetch()}
      refreshing={q.isFetching}
      right={
        !refresh.disabled ? (
          <Button
            variant="secondary"
            size="sm"
            title="Actualizar"
            loading={refresh.isPending}
            onPress={() => refresh.mutate()}
          />
        ) : null
      }
    >
      {bankroll ? (
        <BankrollSummary bankroll={bankroll} bets={bets.data ?? []} />
      ) : null}

      <BankrollSwitcher />

      {usingMockOdds() && (
        <View style={{ backgroundColor: c.amberSoft, borderRadius: radius.md, padding: 12 }}>
          <Txt variant="dataSm" color={c.amber}>
            Modo desarrollo (mock): partidos generados al azar.
          </Txt>
        </View>
      )}

      {/* Simple = tocar una cuota abre el formulario. Combinada = la suma al
          cupón. Explícito y no esconde la combinada tras un gesto invisible. */}
      <View style={{ flexDirection: 'row', gap: 7 }}>
        <Chip
          label="Simple"
          active={slip.mode === 'single'}
          onPress={() => slip.setMode('single')}
        />
        <Chip
          label="Combinada"
          active={slip.mode === 'parlay'}
          onPress={() => slip.setMode('parlay')}
        />
        {slip.mode === 'parlay' ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Txt variant="label" size={10}>
              Toca cuotas de partidos distintos
            </Txt>
          </View>
        ) : null}
      </View>

      <DateLeagueBar
        date={date}
        leagues={leagues}
        allowedLeagues={allowed}
        onDateChange={setDate}
        onLeaguesChange={setLeagues}
        onLockedPress={() =>
          openPaywall('Esa liga no está en tu selección. Premium desbloquea las 10.')
        }
      />

      <AdSlot />

      {refresh.isError && <ErrorText error={refresh.error} />}

      {q.isLoading ? (
        <SkeletonList count={3}>{(i) => <MatchSkeleton key={i} />}</SkeletonList>
      ) : q.isError ? (
        <ErrorText error={q.error} />
      ) : matches.length === 0 ? (
        <Animated.View entering={FadeInDown.duration(motion.enter)}>
          <EmptyState
            title="No hay partidos para esta fecha"
            hint="Prueba otra fecha o pulsa Actualizar. La API solo trae partidos próximos."
          />
        </Animated.View>
      ) : (
        matches.map((m, i) => <MatchCard key={m.id} match={m} index={i} />)
      )}
    </Screen>
  )
}
