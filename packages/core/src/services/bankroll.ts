import { supabase } from '../supabase'
import type { Bankroll, League } from '../types'

interface BankrollRow {
  id: string
  user_id: string
  name: string
  league: string | null
  initial_amount: number
  current_amount: number
  is_active: boolean
  created_at: string
  archived_at: string | null
}

function rowToBankroll(row: BankrollRow): Bankroll {
  return {
    id: row.id,
    name: row.name,
    league: (row.league as League | null) ?? null,
    initialAmount: Number(row.initial_amount),
    currentAmount: Number(row.current_amount),
    isActive: row.is_active,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
  }
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new Error('Necesitas iniciar sesión.')
  return id
}

/** Todas las bancas del usuario (activas y archivadas), más recientes primero. */
export async function listBankrolls(): Promise<Bankroll[]> {
  const { data, error } = await supabase
    .from('bankrolls')
    .select('*')
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as BankrollRow[]).map(rowToBankroll)
}

export async function listActiveBankrolls(): Promise<Bankroll[]> {
  return (await listBankrolls()).filter((b) => b.isActive)
}

export async function createBankroll(params: {
  initialAmount: number
  name?: string
  league?: League | null
}): Promise<Bankroll> {
  const userId = await currentUserId()
  const league = params.league ?? null

  // Archiva la banca activa del mismo alcance (global o esa liga) para no chocar
  // con el índice único (user_id, coalesce(league,'')) where is_active.
  const archiveQuery = supabase
    .from('bankrolls')
    .update({ is_active: false, archived_at: new Date().toISOString() })
    .eq('is_active', true)
  if (league === null) {
    await archiveQuery.is('league', null)
  } else {
    await archiveQuery.eq('league', league)
  }

  const { data, error } = await supabase
    .from('bankrolls')
    .insert({
      user_id: userId,
      name: params.name?.trim() || 'Mi banca',
      league,
      initial_amount: params.initialAmount,
      current_amount: params.initialAmount,
      is_active: true,
    })
    .select('*')
    .single()
  if (error) throw error
  return rowToBankroll(data as BankrollRow)
}

export async function archiveBankroll(id: string): Promise<void> {
  const { error } = await supabase
    .from('bankrolls')
    .update({ is_active: false, archived_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function renameBankroll(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('bankrolls').update({ name }).eq('id', id)
  if (error) throw error
}

// El recálculo de `current_amount` lo hace el trigger `bets_recalc` en la BD
// (misma fórmula que `currentAmountFromBets` en utils/calc.ts).
