import { useEffect, useMemo, useState } from 'react'
import type { Bet, BetDraft, BetPrefill, League, Market } from '@futbolismo/core'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldRow, Label, Select, TextArea, TextInput } from '@/components/ui/Field'
import { ErrorState } from '@/components/ui/misc'
import {
  LEAGUES,
  MARKETS,
  MARKET_LIST,
  selectionLabel,
} from '@futbolismo/core'
import { potentialReturn } from '@futbolismo/core'
import { formatCLP } from '@futbolismo/core'

interface FormState {
  league: League
  homeTeam: string
  awayTeam: string
  matchDate: string // datetime-local value
  matchId: string | null
  market: Market
  selection: string
  line: string
  odds: string
  stake: string
  notes: string
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function oddForSelection(
  prefill: BetPrefill | undefined,
  market: Market,
  selection: string,
): number | undefined {
  if (!prefill?.match) return prefill?.odds
  const o = prefill.match.odds
  if (market === '1x2' && o['1x2']) {
    return o['1x2'][selection as 'home' | 'draw' | 'away']
  }
  if (market === 'goals' && o.goals) {
    return o.goals[selection as 'over' | 'under']
  }
  if (market === 'corners' && o.corners) {
    return o.corners[selection as 'over' | 'under']
  }
  if (market === 'btts' && o.btts) {
    return o.btts[selection as 'yes' | 'no']
  }
  return undefined
}

function buildInitialState(
  prefill?: BetPrefill,
  editing?: Bet,
): FormState {
  if (editing) {
    return {
      league: editing.league,
      homeTeam: editing.homeTeam,
      awayTeam: editing.awayTeam,
      matchDate: toDatetimeLocal(editing.matchDate),
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
    prefill?.line ??
    (match?.odds[market as 'goals' | 'corners']?.line ?? null)

  return {
    league: match?.league ?? 'chile',
    homeTeam: match?.homeTeam ?? '',
    awayTeam: match?.awayTeam ?? '',
    matchDate: match ? toDatetimeLocal(match.commenceTime) : '',
    matchId: match?.id ?? null,
    market,
    selection,
    line: line != null ? String(line) : '',
    odds:
      prefill?.odds != null
        ? String(prefill.odds)
        : oddForSelection(prefill, market, selection) != null
          ? String(oddForSelection(prefill, market, selection))
          : '',
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
  const leagueOptions = (
    editing ? [...new Set([editing.league, ...allowedLeagues])] : allowedLeagues
  ).map((id) => LEAGUES[id])

  const [state, setState] = useState<FormState>(() =>
    buildInitialState(prefill, editing),
  )

  useEffect(() => {
    if (open) setState(buildInitialState(prefill, editing))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }))

  const marketMeta = MARKETS[state.market]
  const lockedMatch = Boolean(prefill?.match) && !editing

  const stakeNum = Number(state.stake)
  const oddsNum = Number(state.odds)
  const lineNum = state.line === '' ? null : Number(state.line)
  const potential =
    Number.isFinite(stakeNum) && Number.isFinite(oddsNum) && oddsNum > 1
      ? potentialReturn(stakeNum, oddsNum)
      : 0

  const valid =
    state.homeTeam.trim() &&
    state.awayTeam.trim() &&
    state.matchDate &&
    Number.isFinite(stakeNum) &&
    stakeNum > 0 &&
    Number.isFinite(oddsNum) &&
    oddsNum > 1 &&
    (!marketMeta.hasLine || (lineNum != null && Number.isFinite(lineNum)))

  const selLabel = useMemo(
    () => selectionLabel(state.market, state.selection, lineNum),
    [state.market, state.selection, lineNum],
  )

  function handleMarketChange(market: Market) {
    const firstSel = MARKETS[market].selections[0].value
    const suggested = oddForSelection(prefill, market, firstSel)
    const suggestedLine =
      prefill?.match?.odds[market as 'goals' | 'corners']?.line ?? null
    setState((s) => ({
      ...s,
      market,
      selection: firstSel,
      line: suggestedLine != null ? String(suggestedLine) : '',
      odds: suggested != null ? String(suggested) : s.odds,
    }))
  }

  function handleSelectionChange(selection: string) {
    const suggested = oddForSelection(prefill, state.market, selection)
    setState((s) => ({
      ...s,
      selection,
      odds: suggested != null ? String(suggested) : s.odds,
    }))
  }

  function submit() {
    if (!valid) return
    const draft: BetDraft = {
      league: state.league,
      matchId: state.matchId,
      homeTeam: state.homeTeam.trim(),
      awayTeam: state.awayTeam.trim(),
      matchDate: new Date(state.matchDate).toISOString(),
      market: state.market,
      selection: state.selection,
      selectionLabel: selLabel,
      line: marketMeta.hasLine ? lineNum : null,
      odds: oddsNum,
      stake: Math.round(stakeNum),
      notes: state.notes.trim() || null,
    }
    onSubmit(draft)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? 'Editar apuesta' : 'Registrar apuesta'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!valid} loading={submitting}>
            {editing ? 'Guardar cambios' : 'Agregar al registro'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldRow>
          <div>
            <Label>Liga / competición</Label>
            <Select
              value={state.league}
              disabled={lockedMatch}
              onChange={(e) => set('league', e.target.value as League)}
            >
              {leagueOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Fecha y hora</Label>
            <TextInput
              type="datetime-local"
              value={state.matchDate}
              disabled={lockedMatch}
              onChange={(e) => set('matchDate', e.target.value)}
            />
          </div>
        </FieldRow>

        <FieldRow>
          <div>
            <Label>Local</Label>
            <TextInput
              value={state.homeTeam}
              disabled={lockedMatch}
              placeholder="Equipo local"
              onChange={(e) => set('homeTeam', e.target.value)}
            />
          </div>
          <div>
            <Label>Visita</Label>
            <TextInput
              value={state.awayTeam}
              disabled={lockedMatch}
              placeholder="Equipo visitante"
              onChange={(e) => set('awayTeam', e.target.value)}
            />
          </div>
        </FieldRow>

        <FieldRow>
          <div>
            <Label>Mercado</Label>
            <Select
              value={state.market}
              onChange={(e) => handleMarketChange(e.target.value as Market)}
            >
              {MARKET_LIST.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Selección</Label>
            <Select
              value={state.selection}
              onChange={(e) => handleSelectionChange(e.target.value)}
            >
              {marketMeta.selections.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </FieldRow>

        <FieldRow>
          {marketMeta.hasLine ? (
            <div>
              <Label>Línea</Label>
              <TextInput
                type="number"
                step="0.5"
                value={state.line}
                placeholder="9.5"
                onChange={(e) => set('line', e.target.value)}
              />
            </div>
          ) : (
            <div />
          )}
          <div>
            <Label>Cuota</Label>
            <TextInput
              type="number"
              step="0.01"
              min="1.01"
              value={state.odds}
              placeholder="1.85"
              onChange={(e) => set('odds', e.target.value)}
            />
          </div>
        </FieldRow>

        <FieldRow>
          <div>
            <Label hint={formatCLP(Number(state.stake) || 0)}>
              Monto apostado (stake)
            </Label>
            <TextInput
              type="number"
              inputMode="numeric"
              min="1"
              value={state.stake}
              onChange={(e) => set('stake', e.target.value)}
            />
          </div>
          <div>
            <Label>Ganancia potencial</Label>
            <div className="rounded-lg border border-slate-700 bg-slate-800/30 px-3 py-2 text-sm font-semibold text-emerald-400 tabular-nums">
              {formatCLP(potential)}
            </div>
          </div>
        </FieldRow>

        <div>
          <Label hint="opcional">Notas / razón de la apuesta</Label>
          <TextArea
            value={state.notes}
            placeholder="Parte de la estrategia, contexto, lesionados…"
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>

        <div className="rounded-lg bg-slate-800/40 px-3 py-2 text-xs text-slate-400">
          Registrando: <span className="text-slate-200">{selLabel}</span> ·
          cuota <span className="text-slate-200">{state.odds || '—'}</span> ·
          estado inicial <span className="text-amber-300">Pendiente</span>
        </div>

        {error ? <ErrorState error={error} /> : null}
      </div>
    </Modal>
  )
}
