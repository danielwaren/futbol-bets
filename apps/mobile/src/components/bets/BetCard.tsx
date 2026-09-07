import { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated'
import {
  betPnl,
  betTitle,
  formatCLP,
  formatDateTime,
  formatOdds,
  formatSignedCLP,
  LEAGUES,
  MARKETS,
  useDeleteBet,
  useReopenBet,
  useReopenLeg,
  useSettleBet,
  useSettleLeg,
  type Bet,
  type BetLeg,
} from '@futbolismo/core'
import { useBetForm } from '@/context/BetFormContext'
import { Button, Springy, Txt } from '@/components/ui'
import { BetStatusBadge } from '@/components/badges'
import { Icon, ICON_STROKE } from '@/components/icons'
import { c, leagueColor, motion, radius, shadow, TAP } from '@/theme'

const STRIPE: Record<Bet['status'], string> = {
  pending: c.amber,
  won: c.pitch,
  lost: c.flag,
  void: c.inkFaint,
}

/**
 * ¿Terminó el partido y seguimos esperando el resultado? Todos los mercados
 * tienen ya fuente automática (marcador o estadísticas), salvo la combinada,
 * que se resuelve desde sus patas.
 */
const awaitingResult = (b: Pick<BetLeg, 'matchId' | 'market' | 'matchDate'>) =>
  b.matchId != null &&
  MARKETS[b.market].settleSource !== 'manual' &&
  new Date(b.matchDate).getTime() < Date.now()

/** Una pata de la combinada, con sus botones de resolución manual. */
function LegRow({ leg, disabled }: { leg: BetLeg; disabled: boolean }) {
  const settleLeg = useSettleLeg()
  const reopenLeg = useReopenLeg()
  const busy = disabled || settleLeg.isPending || reopenLeg.isPending

  return (
    <View style={s.leg}>
      <View style={[s.legDot, { backgroundColor: STRIPE[leg.status] }]} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="team" size={12.5} numberOfLines={1}>
          {leg.homeTeam} vs {leg.awayTeam}
        </Txt>
        <Txt variant="label" size={9}>
          {LEAGUES[leg.league].shortLabel} · {MARKETS[leg.market].shortLabel} ·{' '}
          {leg.selectionLabel} @ {formatOdds(leg.odds)}
        </Txt>
        {leg.resultDetail ? (
          <Txt variant="label" size={8.5}>
            {leg.resultDetail}
            {leg.settledBy === 'auto' ? ' · auto' : ''}
          </Txt>
        ) : leg.status === 'pending' && awaitingResult(leg) ? (
          <View style={s.waiting}>
            <Icon.pending size={10} color={c.inkFaint} strokeWidth={ICON_STROKE} />
            <Txt variant="label" size={8.5}>
              Esperando
            </Txt>
          </View>
        ) : null}
      </View>

      {leg.status === 'pending' ? (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Button
            variant="success"
            size="sm"
            title="✓"
            disabled={busy}
            onPress={() => settleLeg.mutate({ id: leg.id, status: 'won' })}
          />
          <Button
            variant="danger"
            size="sm"
            title="✕"
            disabled={busy}
            onPress={() => settleLeg.mutate({ id: leg.id, status: 'lost' })}
          />
        </View>
      ) : (
        <Springy
          onPress={() => reopenLeg.mutate(leg.id)}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`Reabrir ${leg.homeTeam} contra ${leg.awayTeam}`}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <BetStatusBadge status={leg.status} />
            <Icon.reopen size={13} color={c.inkFaint} strokeWidth={ICON_STROKE} />
          </View>
        </Springy>
      )}
    </View>
  )
}

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
  const isParlay = bet.kind === 'parlay'
  const wonLegs = bet.legs.filter((l) => l.status === 'won').length

  function confirmDelete() {
    Alert.alert(
      isParlay ? 'Eliminar combinada' : 'Eliminar apuesta',
      isParlay
        ? `${bet.legs.length} selecciones @ ${formatOdds(bet.odds)}`
        : `${bet.homeTeam} vs ${bet.awayTeam} (${bet.selectionLabel})`,
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
              <Txt variant="team" size={15} numberOfLines={2}>
                {betTitle(bet)}
              </Txt>
              <Txt variant="label" size={9} color={accent}>
                {isParlay
                  ? `${wonLegs}/${bet.legs.length} ganadas · último ${formatDateTime(bet.matchDate)}`
                  : `${LEAGUES[bet.league].shortLabel} · ${formatDateTime(bet.matchDate)}`}
              </Txt>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 3 }}>
              <BetStatusBadge status={bet.status} />
              {bet.status === 'pending' && !isParlay && awaitingResult(bet) && (
                <View style={s.waiting}>
                  <Icon.pending size={11} color={c.inkFaint} strokeWidth={ICON_STROKE} />
                  <Txt variant="label" size={9}>
                    Esperando
                  </Txt>
                </View>
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
              {isParlay
                ? `Combinada @ ${formatOdds(bet.odds)}`
                : `${MARKETS[bet.market].shortLabel} · ${bet.selectionLabel} @ ${formatOdds(bet.odds)}`}
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

      {open && isParlay && (
        <Animated.View entering={FadeInDown.duration(180)} style={s.legs}>
          {bet.legs.map((leg) => (
            <LegRow key={leg.id} leg={leg} disabled={busyAll} />
          ))}
          <Txt variant="label" size={9}>
            Una pata anulada sale del cálculo y baja la cuota; una perdida tumba
            la combinada.
          </Txt>
        </Animated.View>
      )}

      {open && (
        <Animated.View entering={FadeInDown.duration(180)} style={s.actions}>
          {/* En una combinada el estado sale de las patas: resolver la fila
              madre a mano lo pisaría el trigger en cuanto cambie cualquiera. */}
          {isParlay ? null : bet.status === 'pending' ? (
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
          {!isParlay && (
            <Button
              variant="ghost"
              size="sm"
              title="Editar"
              disabled={busyAll}
              onPress={() => openEdit(bet)}
            />
          )}
          <Springy
            onPress={confirmDelete}
            disabled={busyAll}
            accessibilityRole="button"
            accessibilityLabel={isParlay ? 'Eliminar combinada' : 'Eliminar apuesta'}
            style={isParlay ? { flex: 1 } : undefined}
          >
            <View style={s.iconBtn}>
              <Icon.delete size={17} color={c.flag} strokeWidth={ICON_STROKE} />
            </View>
          </Springy>
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
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legs: {
    gap: 7,
    paddingHorizontal: 12,
    paddingLeft: 14,
    paddingBottom: 10,
  },
  leg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: c.board2,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  legDot: { width: 5, height: 5, borderRadius: 2.5 },
  iconBtn: {
    width: TAP,
    height: TAP - 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingLeft: 14,
    paddingBottom: 12,
  },
})
