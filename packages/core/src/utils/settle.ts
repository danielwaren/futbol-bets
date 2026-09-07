import { MARKETS } from '../services/odds/leagues'
import type { BetStatus, Market } from '../types'

/** Máximo de selecciones en una combinada (la cuota crece exponencialmente). */
export const MAX_PARLAY_LEGS = 12
export const MIN_PARLAY_LEGS = 2

/**
 * Datos del partido terminado. El marcador siempre está (The Odds API
 * `/scores`); las estadísticas solo si API-Football las tiene para ese partido.
 * Todos los totales son **de los dos equipos sumados**.
 */
export interface MatchResult {
  homeScore: number
  awayScore: number
  /** Córners totales del partido. */
  corners?: number | null
  /** Tarjetas totales: amarillas + rojas. */
  cards?: number | null
  /** Tiros totales. */
  shots?: number | null
  /** Tiros a puerta totales. */
  shotsOnTarget?: number | null
}

export type SettledStatus = Exclude<BetStatus, 'pending'>

/**
 * Over/Under con la convención de siempre: `.5` nunca empata; línea entera →
 * push (void) si el total coincide exactamente.
 */
function overUnder(
  total: number | null | undefined,
  line: number | null,
  selection: string,
): SettledStatus | null {
  if (total == null || !Number.isFinite(total) || line == null) return null
  if (Number.isInteger(line) && total === line) return 'void'
  const wentOver = total > line
  return (selection === 'over') === wentOver ? 'won' : 'lost'
}

/** El total del partido que mide cada mercado over/under. */
function statFor(market: Market, r: MatchResult): number | null | undefined {
  switch (market) {
    case 'goals':
      return r.homeScore + r.awayScore
    case 'corners':
      return r.corners
    case 'cards':
      return r.cards
    case 'shots':
      return r.shots
    case 'shots_on_target':
      return r.shotsOnTarget
    default:
      return undefined
  }
}

/**
 * Determina el resultado de una selección a partir de los datos del partido.
 * Devuelve `null` si todavía no se puede resolver: falta la línea, o el
 * mercado necesita una estadística que no llegó (córners, tarjetas, tiros).
 */
export function resolveBet(
  market: Market,
  selection: string,
  line: number | null,
  result: MatchResult,
): SettledStatus | null {
  const { homeScore, awayScore } = result

  switch (market) {
    case '1x2': {
      const outcome =
        homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw'
      return selection === outcome ? 'won' : 'lost'
    }

    case 'btts': {
      const both = homeScore > 0 && awayScore > 0
      return (selection === 'yes') === both ? 'won' : 'lost'
    }

    case 'goals':
    case 'corners':
    case 'cards':
    case 'shots':
    case 'shots_on_target':
      return overUnder(statFor(market, result), line, selection)

    // La combinada no se resuelve desde el marcador: sale de sus patas.
    case 'parlay':
      return null

    default:
      return null
  }
}

export function scoreDetail(result: MatchResult): string {
  return `${result.homeScore}-${result.awayScore}`
}

/** Texto corto que explica la resolución: "FT 2-1" o "FT 2-1 · 11 córners". */
export function resultDetailFor(market: Market, result: MatchResult): string {
  const ft = `FT ${scoreDetail(result)}`
  const stat = statFor(market, result)
  if (market === 'goals' || stat == null) return ft
  return `${ft} · ${stat} ${MARKETS[market].shortLabel.toLowerCase()}`
}

export interface ParlayOutcome {
  status: BetStatus
  /**
   * Cuota efectiva = producto de las patas que NO quedaron anuladas. Una pata
   * anulada no tumba la combinada: sale del cálculo y baja el premio.
   */
  odds: number
}

/**
 * Estado de una combinada a partir de sus patas:
 *  - una pata perdida  → perdida (aunque queden pendientes)
 *  - todas ganadas     → ganada
 *  - todas anuladas    → anulada (reembolso)
 *  - si no             → pendiente
 */
export function resolveParlay(
  legs: { status: BetStatus; odds: number }[],
): ParlayOutcome {
  const live = legs.filter((l) => l.status !== 'void')
  const odds = Number(
    live.reduce((acc, l) => acc * l.odds, 1).toFixed(3),
  )

  if (!legs.length) return { status: 'pending', odds: 1 }
  if (legs.some((l) => l.status === 'lost')) return { status: 'lost', odds }
  if (!live.length) return { status: 'void', odds: 1 }
  if (live.every((l) => l.status === 'won')) return { status: 'won', odds }
  return { status: 'pending', odds }
}

/** Cuota de una combinada tal como se muestra al construirla. */
export function parlayOdds(legs: { odds: number }[]): number {
  return Number(legs.reduce((acc, l) => acc * l.odds, 1).toFixed(3))
}
