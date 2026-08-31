import { useEffect, useMemo, useState } from 'react'
import { Platform, View } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import {
  formatCLP,
  formatDateTime,
  LEAGUES,
  MARKETS,
  MARKET_LIST,
  potentialReturn,
  selectionLabel,
  type Bet,
  type BetDraft,
  type BetPrefill,
  type League,
  type Market,
} from '@futbolismo/core'
import { Sheet, Button, Field, Input, Select, ErrorText, Txt } from '@/components/ui'
import { c, radius } from '@/theme'

interface FormState {
  league: League
  homeTeam: string
  awayTeam: string
  matchDate: Date
  matchId: string | null
  market: Market
  selection: string
  line: string
  odds: string
  stake: string
  notes: string
}

function oddFor(
  prefill: BetPrefill | undefined,
  market: Market,
  selection: string,
): number | undefined {
  if (!prefill?.match) return prefill?.odds
  const o = prefill.match.odds
  if (market === '1x2' && o['1x2'])
    return o['1x2'][selection as 'home' | 'draw' | 'away']
  if (market === 'goals' && o.goals)
    return o.goals[selection as 'over' | 'under']
  if (market === 'corners' && o.corners)
    return o.corners[selection as 'over' | 'under']
  if (market === 'btts' && o.btts) return o.btts[selection as 'yes' | 'no']
  return undefined
}

function initial(prefill?: BetPrefill, editing?: Bet): FormState {
  if (editing) {
    return {
      league: editing.league,
      homeTeam: editing.homeTeam,
      awayTeam: editing.awayTeam,
      matchDate: new Date(editing.matchDate),
      matchId: editing.matchId,
      market: editing.market,
      selection: editing.selection,
      line: editing.line != null ? String(editing.line) : '',
      odds: String(editing.odds),
      stake: String(editing.stake),
      notes: editing.notes ?? '',
    }
  }
  const match = prefill?.match
  const market = prefill?.market ?? '1x2'
  const selection = prefill?.selection ?? MARKETS[market].selections[0].value
  const line =
    prefill?.line ?? match?.odds[market as 'goals' | 'corners']?.line ?? null
  return {
    league: match?.league ?? 'chile',
    homeTeam: match?.homeTeam ?? '',
    awayTeam: match?.awayTeam ?? '',
    matchDate: match ? new Date(match.commenceTime) : new Date(),
    matchId: match?.id ?? null,
    market,
    selection,
    line: line != null ? String(line) : '',
    odds:
      prefill?.odds != null
        ? String(prefill.odds)
        : (oddFor(prefill, market, selection)?.toString() ?? ''),
    stake: '5000',
    notes: '',
  }
}

interface Props {
  open: boolean
  prefill?: BetPrefill
  editing?: Bet
  allowedLeagues: League[]
  submitting?: boolean
  error?: unknown
  onClose: () => void
  onSubmit: (draft: BetDraft) => void
}

export function BetFormModal({
  open,
  prefill,
  editing,
  allowedLeagues,
  submitting = false,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [st, setSt] = useState<FormState>(() => initial(prefill, editing))
  const [showDate, setShowDate] = useState(false)

  useEffect(() => {
    if (open) setSt(initial(prefill, editing))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setSt((s) => ({ ...s, [k]: v }))

  const mk = MARKETS[st.market]
  const locked = Boolean(prefill?.match) && !editing
  const stakeNum = Number(st.stake)
  const oddsNum = Number(st.odds)
  const lineNum = st.line === '' ? null : Number(st.line)
  const potential =
    Number.isFinite(stakeNum) && oddsNum > 1
      ? potentialReturn(stakeNum, oddsNum)
      : 0
  const valid =
    st.homeTeam.trim() &&
    st.awayTeam.trim() &&
    Number.isFinite(stakeNum) &&
    stakeNum > 0 &&
    oddsNum > 1 &&
    (!mk.hasLine || (lineNum != null && Number.isFinite(lineNum)))

  const selLabel = useMemo(
    () => selectionLabel(st.market, st.selection, lineNum),
    [st.market, st.selection, lineNum],
  )

  const leagueOpts = (
    editing ? [...new Set([editing.league, ...allowedLeagues])] : allowedLeagues
  ).map((id) => ({ value: id, label: LEAGUES[id].shortLabel }))

  function changeMarket(market: Market) {
    const firstSel = MARKETS[market].selections[0].value
    const suggested = oddFor(prefill, market, firstSel)
    const sLine = prefill?.match?.odds[market as 'goals' | 'corners']?.line ?? null
    setSt((s) => ({
      ...s,
      market,
      selection: firstSel,
      line: sLine != null ? String(sLine) : '',
      odds: suggested != null ? String(suggested) : s.odds,
    }))
  }

  function changeSelection(selection: string) {
    const suggested = oddFor(prefill, st.market, selection)
    setSt((s) => ({
      ...s,
      selection,
      odds: suggested != null ? String(suggested) : s.odds,
    }))
  }

  function submit() {
    if (!valid) return
    onSubmit({
      league: st.league,
      matchId: st.matchId,
      homeTeam: st.homeTeam.trim(),
      awayTeam: st.awayTeam.trim(),
      matchDate: st.matchDate.toISOString(),
      market: st.market,
      selection: st.selection,
      selectionLabel: selLabel,
      line: mk.hasLine ? lineNum : null,
      odds: oddsNum,
      stake: Math.round(stakeNum),
      notes: st.notes.trim() || null,
    })
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Editar apuesta' : 'Registrar apuesta'}
    >
      {locked ? (
        <View
          style={{
            backgroundColor: 'rgba(30,41,59,0.4)',
            borderRadius: radius.md,
            padding: 10,
          }}
        >
          <Txt variant="h2">
            {st.homeTeam} vs {st.awayTeam}
          </Txt>
          <Txt variant="label" size={12}>
            {LEAGUES[st.league].label} · {formatDateTime(st.matchDate.toISOString())}
          </Txt>
        </View>
      ) : (
        <>
          <Field label="Liga">
            <Select
              value={st.league}
              options={leagueOpts}
              onChange={(v) => set('league', v)}
            />
          </Field>
          <Field label="Local">
            <Input
              value={st.homeTeam}
              placeholder="Equipo local"
              onChangeText={(v) => set('homeTeam', v)}
            />
          </Field>
          <Field label="Visita">
            <Input
              value={st.awayTeam}
              placeholder="Equipo visitante"
              onChangeText={(v) => set('awayTeam', v)}
            />
          </Field>
          <Field label="Fecha y hora">
            <Button
              variant="secondary"
              size="sm"
              title={formatDateTime(st.matchDate.toISOString())}
              onPress={() => setShowDate(true)}
            />
            {showDate && (
              <DateTimePicker
                value={st.matchDate}
                mode="date"
                onChange={(_e, d) => {
                  setShowDate(Platform.OS === 'ios')
                  if (d) set('matchDate', d)
                }}
              />
            )}
          </Field>
        </>
      )}

      <Field label="Mercado">
        <Select
          value={st.market}
          options={MARKET_LIST.map((m) => ({ value: m.id, label: m.shortLabel }))}
          onChange={(v) => changeMarket(v as Market)}
        />
      </Field>
      <Field label="Selección">
        <Select
          value={st.selection}
          options={mk.selections}
          onChange={changeSelection}
        />
      </Field>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        {mk.hasLine && (
          <View style={{ flex: 1 }}>
            <Field label="Línea">
              <Input
                value={st.line}
                keyboardType="decimal-pad"
                placeholder="9.5"
                onChangeText={(v) => set('line', v)}
              />
            </Field>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Field label="Cuota">
            <Input
              value={st.odds}
              keyboardType="decimal-pad"
              placeholder="1.85"
              onChangeText={(v) => set('odds', v)}
            />
          </Field>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Stake" hint={formatCLP(stakeNum || 0)}>
            <Input
              value={st.stake}
              keyboardType="number-pad"
              onChangeText={(v) => set('stake', v)}
            />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Ganancia potencial">
            <View
              style={{
                borderWidth: 1,
                borderColor: c.line,
                borderRadius: radius.md,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Txt variant="h2" color={c.pitch}>
                {formatCLP(potential)}
              </Txt>
            </View>
          </Field>
        </View>
      </View>

      <Field label="Notas" hint="opcional">
        <Input
          value={st.notes}
          multiline
          placeholder="Razón de la apuesta…"
          onChangeText={(v) => set('notes', v)}
          style={{ minHeight: 60 }}
        />
      </Field>

      {error ? <ErrorText error={error} /> : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button
          variant="ghost"
          title="Cancelar"
          onPress={onClose}
          style={{ flex: 1 }}
        />
        <Button
          title={editing ? 'Guardar' : 'Agregar'}
          onPress={submit}
          loading={submitting}
          disabled={!valid}
          style={{ flex: 1 }}
        />
      </View>
    </Sheet>
  )
}
