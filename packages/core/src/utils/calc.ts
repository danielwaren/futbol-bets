import type { Bet, BetStatus, League, Market } from '../types'

/** Ganancia potencial (retorno bruto) = stake × cuota, redondeado a CLP. */
export function potentialReturn(stake: number, odds: number): number {
  return Math.round(stake * odds)
}

/**
 * Resultado neto de una apuesta sobre la banca:
 *  - won:  stake × (cuota − 1)   (ganancia neta)
 *  - lost: −stake
 *  - void / pending: 0
 */
export function betPnl(bet: Pick<Bet, 'status' | 'stake' | 'odds'>): number {
  switch (bet.status) {
    case 'won':
      return Math.round(bet.stake * (bet.odds - 1))
    case 'lost':
      return -bet.stake
    default:
      return 0
  }
}

/**
 * Delta de banca de una apuesta. Espejo de la función SQL `bankroll_delta`
 * (el trigger `bets_recalc` es la fuente de verdad del saldo):
 *  - pending: −stake (dinero comprometido)
 *  - lost:    −stake
 *  - won:     +stake × (cuota − 1)  → equivale a devolver stake y sumar ganancia
 *  - void:    0 (reembolso completo)
 */
export function bankrollDelta(
  bet: Pick<Bet, 'status' | 'stake' | 'odds'>,
): number {
  switch (bet.status) {
    case 'pending':
    case 'lost':
      return -bet.stake
    case 'won':
      return Math.round(bet.stake * (bet.odds - 1))
    case 'void':
      return 0
  }
}

export function currentAmountFromBets(
  initialAmount: number,
  bets: Pick<Bet, 'status' | 'stake' | 'odds'>[],
): number {
  return Math.round(
    bets.reduce((acc, b) => acc + bankrollDelta(b), initialAmount),
  )
}

export function roi(pnl: number, staked: number): number {
  if (!staked) return 0
  return (pnl / staked) * 100
}

const SETTLED: BetStatus[] = ['won', 'lost']

export function isSettled(bet: Pick<Bet, 'status'>): boolean {
  return SETTLED.includes(bet.status)
}

/** Winrate = ganadas / (ganadas + perdidas) · 100. Ignora pendientes y anuladas. */
export function winrate(bets: Pick<Bet, 'status'>[]): number {
  const won = bets.filter((b) => b.status === 'won').length
  const lost = bets.filter((b) => b.status === 'lost').length
  const total = won + lost
  if (!total) return 0
  return (won / total) * 100
}

export interface BetStats {
  count: number
  settled: number
  pending: number
  won: number
  lost: number
  voided: number
  staked: number
  stakedSettled: number
  pnl: number
  roi: number
  winrate: number
}

export function computeStats(bets: Bet[]): BetStats {
  const staked = bets.reduce((a, b) => a + b.stake, 0)
  const settledBets = bets.filter(isSettled)
  const stakedSettled = settledBets.reduce((a, b) => a + b.stake, 0)
  const pnl = bets.reduce((a, b) => a + betPnl(b), 0)
  return {
    count: bets.length,
    settled: settledBets.length,
    pending: bets.filter((b) => b.status === 'pending').length,
    won: bets.filter((b) => b.status === 'won').length,
    lost: bets.filter((b) => b.status === 'lost').length,
    voided: bets.filter((b) => b.status === 'void').length,
    staked,
    stakedSettled,
    pnl,
    roi: roi(pnl, stakedSettled),
    winrate: winrate(bets),
  }
}

export function groupBy<T, K extends string>(
  items: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const k = keyFn(item)
      ;(acc[k] ??= []).push(item)
      return acc
    },
    {} as Record<K, T[]>,
  )
}

export interface SegmentStats extends BetStats {
  key: string
}

export function statsBySegment<K extends string>(
  bets: Bet[],
  keyFn: (bet: Bet) => K,
): SegmentStats[] {
  const groups = groupBy(bets, keyFn)
  return (Object.keys(groups) as K[]).map((key) => ({
    key,
    ...computeStats(groups[key]),
  }))
}

export const statsByMarket = (bets: Bet[]) =>
  statsBySegment(bets, (b) => b.market as Market)

export const statsByLeague = (bets: Bet[]) =>
  statsBySegment(bets, (b) => b.league as League)

export interface BankrollPoint {
  /** ISO date de resolución (o creación de banca) */
  date: string
  label: string
  balance: number
  pnl: number
}

/**
 * Serie temporal de la banca: parte del monto inicial y aplica el P&L de cada
 * apuesta resuelta en orden cronológico (por settledAt, luego createdAt).
 */
export function bankrollSeries(
  bets: Bet[],
  initialAmount: number,
  startDate?: string,
): BankrollPoint[] {
  const settled = bets
    .filter((b) => isSettled(b) && b.settledAt)
    .slice()
    .sort((a, b) => (a.settledAt ?? '').localeCompare(b.settledAt ?? ''))

  const points: BankrollPoint[] = [
    {
      date: startDate ?? settled[0]?.settledAt ?? new Date().toISOString(),
      label: 'Inicio',
      balance: initialAmount,
      pnl: 0,
    },
  ]

  let balance = initialAmount
  let cumPnl = 0
  for (const bet of settled) {
    const delta = betPnl(bet)
    balance += delta
    cumPnl += delta
    points.push({
      date: bet.settledAt as string,
      label: betTitle(bet),
      balance: Math.round(balance),
      pnl: Math.round(cumPnl),
    })
  }
  return points
}

/**
 * Título de una apuesta para listas y gráficos. Una combinada no tiene "local
 * vs visita": se nombra por cuántas selecciones lleva.
 */
export function betTitle(
  bet: Pick<Bet, 'kind' | 'homeTeam' | 'awayTeam' | 'legs'>,
): string {
  if (bet.kind === 'parlay') {
    const n = bet.legs?.length ?? 0
    return `Combinada · ${n} ${n === 1 ? 'selección' : 'selecciones'}`
  }
  return `${bet.homeTeam} vs ${bet.awayTeam}`
}
