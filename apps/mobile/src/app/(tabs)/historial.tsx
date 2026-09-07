import { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import {
  computeStats,
  formatCLP,
  formatPercent,
  formatSignedCLP,
  MARKETS,
  MARKET_LIST,
  useBets,
  useSettleAll,
  usingMockOdds,
  type BetStatus,
  type Market,
} from '@futbolismo/core'
import { Screen } from '@/components/Screen'
import { BetCard } from '@/components/bets/BetCard'
import { Button, Card, EmptyState, ErrorText, Select, Txt } from '@/components/ui'
import { BetSkeleton, SkeletonList } from '@/components/Skeleton'
import { useBankrollContext } from '@/context/BankrollContext'
import { useBetForm } from '@/context/BetFormContext'
import { c, motion, radius } from '@/theme'

const STATUS: { value: BetStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'won', label: 'Ganadas' },
  { value: 'lost', label: 'Perdidas' },
  { value: 'void', label: 'Anuladas' },
]

export default function History() {
  const { selected: bankroll } = useBankrollContext()
  const q = useBets(bankroll?.id)
  const { openNew } = useBetForm()
  const settleAll = useSettleAll()

  const [market, setMarket] = useState<Market | 'all'>('all')
  const [status, setStatus] = useState<BetStatus | 'all'>('all')

  const all = useMemo(() => q.data ?? [], [q.data])
  const filtered = useMemo(
    () =>
      all.filter(
        (b) =>
          (market === 'all' || b.market === market) &&
          (status === 'all' || b.status === status),
      ),
    [all, market, status],
  )
  const stats = computeStats(filtered)

  /**
   * Distinguir "el partido sigue en juego" de "las fuentes están caídas". Sin
   * esto el aviso decía lo mismo en los dos casos y la resolución automática
   * podía llevar días sin funcionar sin que nadie se enterara.
   */
  const d = settleAll.data
  const sinFuentes = Boolean(d && (d.quotaExhausted || !d.statsAvailable))
  const motivoSinFuentes = !d
    ? ''
    : d.quotaExhausted && !d.statsAvailable
      ? 'The Odds API sin créditos este mes y falta configurar API_FOOTBALL_KEY. Cierra las apuestas a mano mientras tanto.'
      : d.quotaExhausted
        ? 'The Odds API se quedó sin créditos este mes; se reintenta con las estadísticas.'
        : 'Falta configurar API_FOOTBALL_KEY en Supabase para leer córners, tarjetas y tiros.'

  const awaiting = useMemo(() => {
    const now = Date.now()
    return all.filter(
      (b) =>
        b.status === 'pending' &&
        b.matchId &&
        MARKETS[b.market].settleSource !== 'manual' &&
        new Date(b.matchDate).getTime() < now,
    ).length
  }, [all])

  /**
   * Resuelve solo al entrar si hay partidos ya terminados. El cron lo hace cada
   * hora, pero si el usuario abre la app justo después de un partido no tiene
   * por qué esperar ni tocar nada.
   */
  const autoSettled = useRef(false)
  useEffect(() => {
    if (autoSettled.current) return
    if (usingMockOdds() || awaiting === 0 || settleAll.isPending) return
    autoSettled.current = true
    settleAll.mutate()
  }, [awaiting, settleAll])

  return (
    <Screen
      title="Historial"
      subtitle={`${all.length} apuestas`}
      onRefresh={() => q.refetch()}
      refreshing={q.isFetching}
      right={
        <Button
          size="sm"
          title="+ Manual"
          onPress={() => openNew()}
          disabled={!bankroll}
        />
      }
    >
      {!usingMockOdds() && awaiting > 0 && (
        <Button
          variant="secondary"
          size="sm"
          title={`Actualizar resultados (${awaiting})`}
          loading={settleAll.isPending}
          onPress={() => settleAll.mutate()}
        />
      )}
      {settleAll.data && (
        <View
          style={{
            backgroundColor: settleAll.data.settled > 0 ? c.amberSoft : c.board2,
            borderRadius: radius.md,
            padding: 11,
            gap: 3,
          }}
        >
          <Txt
            variant="dataSm"
            color={settleAll.data.settled > 0 ? c.amber : c.inkDim}
          >
            {settleAll.data.settled > 0
              ? `${settleAll.data.settled} resueltas automáticamente.`
              : sinFuentes
                ? 'No se pudo consultar los resultados.'
                : 'Sin resultados finales aún.'}
          </Txt>
          {settleAll.data.settled === 0 && sinFuentes ? (
            <Txt variant="label" size={9.5}>
              {motivoSinFuentes}
            </Txt>
          ) : null}
        </View>
      )}

      <Card>
        <View style={s.row}>
          <Stat
            label="P&L"
            value={formatSignedCLP(stats.pnl)}
            tone={stats.pnl >= 0 ? 'pos' : 'neg'}
          />
          <Stat
            label="ROI"
            value={formatPercent(stats.roi)}
            tone={stats.roi >= 0 ? 'pos' : 'neg'}
          />
          <Stat label="Apostado" value={formatCLP(stats.staked)} />
        </View>
      </Card>

      <Select
        value={status}
        options={STATUS}
        onChange={(v) => setStatus(v as BetStatus | 'all')}
      />
      <Select
        value={market}
        options={[
          { value: 'all', label: 'Todos los mercados' },
          ...MARKET_LIST.map((m) => ({ value: m.id, label: m.label })),
        ]}
        onChange={(v) => setMarket(v as Market | 'all')}
      />

      {q.isLoading ? (
        <SkeletonList count={4}>{(i) => <BetSkeleton key={i} />}</SkeletonList>
      ) : q.isError ? (
        <ErrorText error={q.error} />
      ) : filtered.length === 0 ? (
        <Animated.View entering={FadeInDown.duration(motion.enter)}>
          <EmptyState
            title={
              all.length === 0
                ? 'Todavía no registras apuestas'
                : 'Nada con esos filtros'
            }
            hint={
              all.length === 0
                ? 'Toca una cuota en Partidos para registrar la primera.'
                : undefined
            }
          />
        </Animated.View>
      ) : (
        filtered.map((b, i) => <BetCard key={b.id} bet={b} index={i} />)
      )}
    </Screen>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'pos' | 'neg'
}) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Txt variant="label" size={9}>
        {label}
      </Txt>
      <Txt
        variant="data"
        size={14}
        color={tone === 'pos' ? c.pitch : tone === 'neg' ? c.flag : c.ink}
      >
        {value}
      </Txt>
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
})
