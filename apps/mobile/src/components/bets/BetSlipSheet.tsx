import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { LinearTransition } from 'react-native-reanimated'
import {
  formatCLP,
  formatMatchDate,
  formatOdds,
  LEAGUES,
  MIN_PARLAY_LEGS,
  potentialReturn,
  type Bankroll,
  type BetLegDraft,
} from '@futbolismo/core'
import { Button, ErrorText, Field, Input, Sheet, Springy, Txt } from '@/components/ui'
import { Icon, ICON_STROKE } from '@/components/icons'
import { c, leagueColor, radius } from '@/theme'

interface Props {
  open: boolean
  legs: BetLegDraft[]
  odds: number
  bankroll: Bankroll | null | undefined
  submitting?: boolean
  error?: unknown
  onRemove: (index: number) => void
  onClose: () => void
  onSubmit: (v: { stake: number; notes: string | null }) => void
}

export function BetSlipSheet({
  open,
  legs,
  odds,
  bankroll,
  submitting = false,
  error,
  onRemove,
  onClose,
  onSubmit,
}: Props) {
  const [stake, setStake] = useState('5000')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setStake('5000')
      setNotes('')
    }
  }, [open])

  const stakeNum = Number(stake)
  const stakeOk = Number.isFinite(stakeNum) && stakeNum > 0
  const enough = bankroll ? stakeNum <= bankroll.currentAmount : false
  const valid = legs.length >= MIN_PARLAY_LEGS && stakeOk && enough && Boolean(bankroll)
  const potential = stakeOk ? potentialReturn(stakeNum, odds) : 0

  return (
    <Sheet open={open} onClose={onClose} title="Combinada">
      <View style={s.summary}>
        <View>
          <Txt variant="label" size={10}>
            {legs.length} selecciones
          </Txt>
          <Txt variant="data" size={26} color={c.amber} style={{ marginTop: 2 }}>
            {formatOdds(odds)}
          </Txt>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Txt variant="label" size={10}>
            Ganancia potencial
          </Txt>
          <Txt variant="data" size={20} color={c.pitch} style={{ marginTop: 2 }}>
            {formatCLP(potential)}
          </Txt>
        </View>
      </View>

      <View style={{ gap: 7 }}>
        {legs.map((leg, i) => (
          <Animated.View key={`${leg.matchId}-${leg.market}-${leg.selection}`} layout={LinearTransition}>
            <View style={s.leg}>
              <View style={[s.dot, { backgroundColor: leagueColor[leg.league] ?? c.amber }]} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="team" numberOfLines={1}>
                  {leg.homeTeam} vs {leg.awayTeam}
                </Txt>
                <Txt variant="label" size={9.5}>
                  {LEAGUES[leg.league].shortLabel} · {formatMatchDate(leg.matchDate)} ·{' '}
                  {leg.selectionLabel}
                </Txt>
              </View>
              <Txt variant="data" size={14}>
                {formatOdds(leg.odds)}
              </Txt>
              <Springy
                onPress={() => onRemove(i)}
                scaleTo={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${leg.homeTeam} contra ${leg.awayTeam}`}
              >
                <View style={s.remove}>
                  <Icon.close size={13} color={c.inkFaint} strokeWidth={ICON_STROKE} />
                </View>
              </Springy>
            </View>
          </Animated.View>
        ))}
      </View>

      {legs.length < MIN_PARLAY_LEGS && (
        <Txt variant="label" size={10} color={c.amber}>
          Añade al menos {MIN_PARLAY_LEGS} selecciones de partidos distintos.
        </Txt>
      )}

      <Field
        label="Monto"
        hint={
          bankroll
            ? `Banca: ${formatCLP(bankroll.currentAmount)}`
            : 'Necesitas una banca activa'
        }
      >
        <Input value={stake} keyboardType="number-pad" onChangeText={setStake} />
      </Field>

      {stakeOk && !enough && bankroll ? (
        <Txt variant="label" size={10} color={c.flag}>
          No te alcanza la banca para ese monto.
        </Txt>
      ) : null}

      <Field label="Notas" hint="opcional">
        <Input
          value={notes}
          multiline
          placeholder="Razón de la combinada…"
          onChangeText={setNotes}
          style={{ minHeight: 52 }}
        />
      </Field>

      {error ? <ErrorText error={error} /> : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button variant="ghost" title="Cancelar" onPress={onClose} style={{ flex: 1 }} />
        <Button
          title="Apostar"
          onPress={() =>
            onSubmit({ stake: Math.round(stakeNum), notes: notes.trim() || null })
          }
          loading={submitting}
          disabled={!valid}
          style={{ flex: 1 }}
        />
      </View>
    </Sheet>
  )
}

const s = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: c.board2,
    borderRadius: radius.md,
    padding: 13,
  },
  leg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: c.board2,
    borderRadius: radius.sm,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  remove: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.board3,
  },
})
