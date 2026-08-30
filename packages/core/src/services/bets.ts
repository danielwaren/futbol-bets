import { supabase } from '../supabase'
import type { Bet, BetDraft, BetStatus, League, Market } from '../types'
import { potentialReturn } from '../utils/calc'

interface BetRow {
  id: string
  bankroll_id: string
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
}

function rowToBet(row: BetRow): Bet {
  return {
    id: row.id,
    bankrollId: row.bankroll_id,
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
  }
}

// El recálculo de la banca lo hace el trigger `bets_recalc` en la BD.

export async function listBets(bankrollId: string): Promise<Bet[]> {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('bankroll_id', bankrollId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as BetRow[]).map(rowToBet)
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
    .select('*')
    .single()
  if (error) throw error
  return rowToBet(data as BetRow)
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
    .select('*')
    .single()
  if (error) throw error
  return rowToBet(data as BetRow)
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
    .select('*')
    .single()
  if (error) throw error
  return rowToBet(data as BetRow)
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
    .select('*')
    .single()
  if (error) throw error
  return rowToBet(data as BetRow)
}

export async function deleteBet(betId: string): Promise<void> {
  const { error } = await supabase.from('bets').delete().eq('id', betId)
  if (error) throw error
}

/**
 * Pide al backend resolver las apuestas pendientes del usuario cuyos partidos
 * ya terminaron (marcador real de The Odds API).
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
