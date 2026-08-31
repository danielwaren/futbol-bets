import { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated'
import {
  betPnl,
  formatCLP,
  formatDateTime,
  formatOdds,
  formatSignedCLP,
  LEAGUES,
  MARKETS,
  useDeleteBet,
  useReopenBet,
  useSettleBet,
  type Bet,
} from '@futbolismo/core'
import { useBetForm } from '@/context/BetFormContext'
import { Crest } from '@/components/club/Crest'
import { Button, Springy, Txt } from '@/components/ui'
import { BetStatusBadge } from '@/components/badges'
import { c, leagueColor, motion, radius, shadow } from '@/theme'

const STRIPE: Record<Bet['status'], string> = {
  pending: c.amber,
  won: c.pitch,
  lost: c.flag,
  void: c.inkFaint,
}

const matchEnded = (b: Bet) =>
  b.matchId != null &&
  b.market !== 'corners' &&
  new Date(b.matchDate).getTime() < Date.now()

export function BetCard({ bet, index = 0 }: { bet: Bet; index?: number }) {
  const settle = useSettleBet()
  const reopen = useReopenBet()
  const del = useDeleteBet()
  const { openEdit } = useBetForm()
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)

  const pnl = betPnl(bet)
  const busyAll = busy || settle.isPending || reopen.isPending || del.isPending
  const accent = leagueColor[bet.league] ?? c.amber

  function confirmDelete() {
    Alert.alert(
      'Eliminar apuesta',
      `${bet.homeTeam} vs ${bet.awayTeam} (${bet.selectionLabel})`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setBusy(true)
            del.mutate(bet.id, { onSettled: () => setBusy(false) })
          },
        },
      ],
    )
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * motion.stagger).duration(motion.enter)}
      layout={LinearTransition.springify().damping(20)}
      style={[s.card, shadow.card]}
    >
      <View style={[s.stripe, { backgroundColor: STRIPE[bet.status] }]} />

      <Springy onPress={() => setOpen((v) => !v)} scaleTo={0.985}>
        <View style={s.body}>
          <View style={s.top}>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={s.crests}>
                <Crest team={bet.homeTeam} size={22} />
                <Crest team={bet.awayTeam} size={22} />
                <Txt variant="team" size={13.5} numberOfLines={1} style={{ flex: 1 }}>
                  {bet.homeTeam} vs {bet.awayTeam}
                </Txt>
              </View>
              <Txt variant="label" size={9} color={accent}>
                {LEAGUES[bet.league].shortLabel} · {formatDateTime(bet.matchDate)}
              </Txt>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 3 }}>
              <BetStatusBadge status={bet.status} />
              {bet.status === 'pending' && matchEnded(bet) && (
                <Txt variant="label" size={8.5}>
                  ⏳ esperando
                </Txt>
              )}
              {bet.resultDetail ? (
                <Txt variant="label" size={8.5}>
                  {bet.resultDetail}
                  {bet.settledBy === 'auto' ? ' · auto' : ''}
                </Txt>
              ) : null}
            </View>
          </View>

          <View style={s.line}>
            <Txt variant="dataSm">
              {MARKETS[bet.market].shortLabel} · {bet.selectionLabel} @{' '}
              {formatOdds(bet.odds)}
            </Txt>
            <Txt
              variant="data"
              size={13.5}
              color={
                bet.status === 'pending' || bet.status === 'void'
                  ? c.inkDim
                  : pnl > 0
                    ? c.pitch
                    : c.flag
              }
            >
              {bet.status === 'pending'
                ? formatCLP(bet.stake)
                : bet.status === 'void'
                  ? '—'
                  : formatSignedCLP(pnl)}
            </Txt>
          </View>

          {bet.notes ? (
            <Txt variant="dataSm" size={10.5} numberOfLines={open ? undefined : 1}>
              “{bet.notes}”
            </Txt>
          ) : null}
        </View>
      </Springy>

      {open && (
        <Animated.View entering={FadeInDown.duration(180)} style={s.actions}>
          {bet.status === 'pending' ? (
            <>
              <Button
                variant="success"
                size="sm"
                title="Ganada"
                disabled={busyAll}
                style={{ flex: 1 }}
                onPress={() => settle.mutate({ id: bet.id, status: 'won' })}
              />
              <Button
                variant="danger"
                size="sm"
                title="Perdida"
                disabled={busyAll}
                style={{ flex: 1 }}
                onPress={() => settle.mutate({ id: bet.id, status: 'lost' })}
              />
              <Button
                variant="ghost"
                size="sm"
                title="Anular"
                disabled={busyAll}
                onPress={() => settle.mutate({ id: bet.id, status: 'void' })}
              />
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              title="Reabrir"
              disabled={busyAll}
              style={{ flex: 1 }}
              onPress={() => reopen.mutate(bet.id)}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            title="Editar"
            disabled={busyAll}
            onPress={() => openEdit(bet)}
          />
          <Button
            variant="ghost"
            size="sm"
            title="🗑"
            disabled={busyAll}
            onPress={confirmDelete}
          />
        </Animated.View>
      )}
    </Animated.View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: c.board,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  /* franja de estado a lo alto de la tarjeta, sin depender del flujo */
  stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 2.5, zIndex: 1 },
  body: { padding: 12, paddingLeft: 14, gap: 8 },
  top: { flexDirection: 'row', gap: 10 },
  crests: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingLeft: 14,
    paddingBottom: 12,
  },
})
