import { supabase } from '../supabase'
import type {
  Bet,
  BetDraft,
  BetKind,
  BetLeg,
  BetStatus,
  League,
  Market,
  ParlayDraft,
} from '../types'
import { potentialReturn } from '../utils/calc'

interface BetLegRow {
  id: string
  bet_id: string
  league: string
  match_id: string | null
  home_team: string
  away_team: string
  match_date: string
  market: string
  selection: string
  selection_label: string
  line: number | null
  odds: number
  status: BetStatus
  settled_at: string | null
  settled_by: 'auto' | 'manual' | null
  result_detail: string | null
}

interface BetRow {
  id: string
  bankroll_id: string
  kind: BetKind
  league: string
  match_id: string | null
  home_team: string
  away_team: string
  match_date: string
  market: string
  selection: string
  selection_label: string
  line: number | null
  odds: number
  stake: number
  potential_return: number
  status: BetStatus
  notes: string | null
  created_at: string
  settled_at: string | null
  settled_by: 'auto' | 'manual' | null
  result_detail: string | null
  legs?: BetLegRow[] | null
}

/** Trae la fila madre y sus patas en una sola consulta. */
const BET_SELECT = '*, legs:bet_legs(*)'

function rowToLeg(row: BetLegRow): BetLeg {
  return {
    id: row.id,
    betId: row.bet_id,
    league: row.league as League,
    matchId: row.match_id,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    matchDate: row.match_date,
    market: row.market as Market,
    selection: row.selection,
    selectionLabel: row.selection_label,
    line: row.line != null ? Number(row.line) : null,
    odds: Number(row.odds),
    status: row.status,
    settledAt: row.settled_at,
    settledBy: row.settled_by,
    resultDetail: row.result_detail,
  }
}

function rowToBet(row: BetRow): Bet {
  return {
    id: row.id,
    bankrollId: row.bankroll_id,
    kind: row.kind ?? 'single',
    league: row.league as League,
    matchId: row.match_id,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    matchDate: row.match_date,
    market: row.market as Market,
    selection: row.selection,
    selectionLabel: row.selection_label,
    line: row.line != null ? Number(row.line) : null,
    odds: Number(row.odds),
    stake: Number(row.stake),
    potentialReturn: Number(row.potential_return),
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    settledAt: row.settled_at,
    settledBy: row.settled_by,
    resultDetail: row.result_detail,
    legs: (row.legs ?? [])
      .map(rowToLeg)
      .sort((a, b) => a.matchDate.localeCompare(b.matchDate)),
  }
}

// El recálculo de la banca lo hace el trigger `bets_recalc` en la BD, y el de
// la cuota efectiva de una combinada el trigger `bet_legs_recalc`.

export async function listBets(bankrollId: string): Promise<Bet[]> {
  const { data, error } = await supabase
    .from('bets')
    .select(BET_SELECT)
    .eq('bankroll_id', bankrollId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as unknown as BetRow[]).map(rowToBet)
}

export async function createBet(
  bankrollId: string,
  draft: BetDraft,
): Promise<Bet> {
  const { data: sess } = await supabase.auth.getSession()
  const userId = sess.session?.user.id
  if (!userId) throw new Error('Necesitas iniciar sesión.')

  const { data, error } = await supabase
    .from('bets')
    .insert({
      user_id: userId,
      bankroll_id: bankrollId,
      kind: 'single',
      league: draft.league,
      match_id: draft.matchId,
      home_team: draft.homeTeam,
      away_team: draft.awayTeam,
      match_date: draft.matchDate,
      market: draft.market,
      selection: draft.selection,
      selection_label: draft.selectionLabel,
      line: draft.line,
      odds: draft.odds,
      stake: draft.stake,
      potential_return: potentialReturn(draft.stake, draft.odds),
      status: 'pending',
      notes: draft.notes,
    })
    .select(BET_SELECT)
    .single()
  if (error) throw error
  return rowToBet(data as unknown as BetRow)
}

/**
 * Crea una combinada. Va por RPC (`create_parlay`) y no por dos inserts para
 * que la fila madre y sus patas entren en la misma transacción: si una liga
 * está bloqueada por el plan falla todo, sin dejar combinadas a medio crear.
 */
export async function createParlay(
  bankrollId: string,
  draft: ParlayDraft,
): Promise<Bet> {
  const { data: betId, error } = await supabase.rpc('create_parlay', {
    p_bankroll_id: bankrollId,
    p_stake: draft.stake,
    p_notes: draft.notes,
    p_legs: draft.legs.map((l) => ({
      league: l.league,
      match_id: l.matchId,
      home_team: l.homeTeam,
      away_team: l.awayTeam,
      match_date: l.matchDate,
      market: l.market,
      selection: l.selection,
      selection_label: l.selectionLabel,
      line: l.line,
      odds: l.odds,
    })),
  })
  if (error) throw error

  const { data, error: readErr } = await supabase
    .from('bets')
    .select(BET_SELECT)
    .eq('id', betId as string)
    .single()
  if (readErr) throw readErr
  return rowToBet(data as unknown as BetRow)
}

export async function updateBet(betId: string, draft: BetDraft): Promise<Bet> {
  const { data, error } = await supabase
    .from('bets')
    .update({
      league: draft.league,
      match_id: draft.matchId,
      home_team: draft.homeTeam,
      away_team: draft.awayTeam,
      match_date: draft.matchDate,
      market: draft.market,
      selection: draft.selection,
      selection_label: draft.selectionLabel,
      line: draft.line,
      odds: draft.odds,
      stake: draft.stake,
      potential_return: potentialReturn(draft.stake, draft.odds),
      notes: draft.notes,
    })
    .eq('id', betId)
    .select(BET_SELECT)
    .single()
  if (error) throw error
  return rowToBet(data as unknown as BetRow)
}

/** Cambia solo el monto. Es lo único editable de una combinada ya creada. */
export async function updateParlayStake(
  betId: string,
  stake: number,
  notes: string | null,
): Promise<Bet> {
  const { data: current, error: readErr } = await supabase
    .from('bets')
    .select('odds')
    .eq('id', betId)
    .single()
  if (readErr) throw readErr

  const { data, error } = await supabase
    .from('bets')
    .update({
      stake,
      potential_return: potentialReturn(stake, Number(current.odds)),
      notes,
    })
    .eq('id', betId)
    .select(BET_SELECT)
    .single()
  if (error) throw error
  return rowToBet(data as unknown as BetRow)
}

export async function settleBet(
  betId: string,
  status: Exclude<BetStatus, 'pending'>,
): Promise<Bet> {
  const { data, error } = await supabase
    .from('bets')
    .update({
      status,
      settled_at: new Date().toISOString(),
      settled_by: 'manual',
    })
    .eq('id', betId)
    .select(BET_SELECT)
    .single()
  if (error) throw error
  return rowToBet(data as unknown as BetRow)
}

export async function reopenBet(betId: string): Promise<Bet> {
  const { data, error } = await supabase
    .from('bets')
    .update({
      status: 'pending',
      settled_at: null,
      settled_by: null,
      result_detail: null,
    })
    .eq('id', betId)
    .select(BET_SELECT)
    .single()
  if (error) throw error
  return rowToBet(data as unknown as BetRow)
}

/**
 * Resuelve una pata a mano. No hace falta tocar la combinada: el trigger
 * `bet_legs_recalc` recalcula estado y cuota efectiva de la fila madre.
 */
export async function settleLeg(
  legId: string,
  status: Exclude<BetStatus, 'pending'>,
): Promise<void> {
  const { error } = await supabase
    .from('bet_legs')
    .update({
      status,
      settled_at: new Date().toISOString(),
      settled_by: 'manual',
    })
    .eq('id', legId)
  if (error) throw error
}

export async function reopenLeg(legId: string): Promise<void> {
  const { error } = await supabase
    .from('bet_legs')
    .update({
      status: 'pending',
      settled_at: null,
      settled_by: null,
      result_detail: null,
    })
    .eq('id', legId)
  if (error) throw error
}

export async function deleteBet(betId: string): Promise<void> {
  const { error } = await supabase.from('bets').delete().eq('id', betId)
  if (error) throw error
}

/**
 * Pide al backend resolver las apuestas pendientes del usuario cuyos partidos
 * ya terminaron (marcador de The Odds API + estadísticas de API-Football).
 */
export async function requestSettle(): Promise<{
  checked: number
  settled: number
}> {
  const { data, error } = await supabase.functions.invoke('settle-bets', {
    body: {},
  })
  if (error) throw error
  return { checked: data?.checked ?? 0, settled: data?.settled ?? 0 }
}
