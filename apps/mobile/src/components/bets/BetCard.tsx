import { useState } from 'react'
import { Alert, View } from 'react-native'
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
import { Card, Txt, Button } from '@/components/ui'
import { BetStatusBadge, LeagueBadge } from '@/components/badges'
import { c } from '@/theme'

const matchEnded = (b: Bet) =>
  b.matchId != null && b.market !== 'corners' && new Date(b.matchDate).getTime() < Date.now()

export function BetCard({ bet }: { bet: Bet }) {
  const settle = useSettleBet()
  const reopen = useReopenBet()
  const del = useDeleteBet()
  const { openEdit } = useBetForm()
  const [busy, setBusy] = useState(false)
  const pnl = betPnl(bet)
  const busyAll = busy || settle.isPending || reopen.isPending || del.isPending

  function confirmDelete() {
    Alert.alert('Eliminar apuesta', `${bet.homeTeam} vs ${bet.awayTeam} (${bet.selectionLabel})`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          setBusy(true)
          del.mutate(bet.id, { onSettled: () => setBusy(false) })
        },
      },
    ])
  }

  return (
    <Card style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Txt weight="600">
            {bet.homeTeam} <Txt faint>vs</Txt> {bet.awayTeam}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <LeagueBadge label={LEAGUES[bet.league].shortLabel} color={LEAGUES[bet.league].color} />
            <Txt size={11} faint>
              {formatDateTime(bet.matchDate)}
            </Txt>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <BetStatusBadge status={bet.status} />
          {bet.status === 'pending' && matchEnded(bet) && (
            <Txt size={10} faint>
              ⏳ esperando resultado
            </Txt>
          )}
          {bet.resultDetail && (
            <Txt size={10} faint>
              {bet.resultDetail}
              {bet.settledBy === 'auto' ? ' · auto' : ''}
            </Txt>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt size={12} dim>
          {MARKETS[bet.market].shortLabel} · {bet.selectionLabel} @ {formatOdds(bet.odds)}
        </Txt>
        <Txt size={12} dim>
          {formatCLP(bet.stake)}
        </Txt>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt size={12} faint>
          Retorno pot. {formatCLP(bet.potentialReturn)}
        </Txt>
        <Txt
          weight="600"
          color={pnl > 0 ? c.emerald : pnl < 0 ? c.rose : c.textFaint}
        >
          {bet.status === 'pending' || bet.status === 'void' ? '—' : formatSignedCLP(pnl)}
        </Txt>
      </View>

      {bet.notes && (
        <Txt size={11} faint style={{ fontStyle: 'italic' }}>
          “{bet.notes}”
        </Txt>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {bet.status === 'pending' ? (
          <>
            <Button
              variant="success"
              size="sm"
              title="Ganada"
              disabled={busyAll}
              onPress={() => settle.mutate({ id: bet.id, status: 'won' })}
            />
            <Button
              variant="danger"
              size="sm"
              title="Perdida"
              disabled={busyAll}
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
            onPress={() => reopen.mutate(bet.id)}
          />
        )}
        <Button variant="ghost" size="sm" title="Editar" disabled={busyAll} onPress={() => openEdit(bet)} />
        <Button variant="ghost" size="sm" title="Eliminar" disabled={busyAll} onPress={confirmDelete} />
      </View>
    </Card>
  )
}
