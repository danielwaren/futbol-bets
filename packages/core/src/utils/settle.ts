import type { BetStatus, Market } from '../types'

export interface MatchResult {
  homeScore: number
  awayScore: number
}

/**
 * Determina el resultado de una apuesta a partir del marcador final.
 * Devuelve `null` si el mercado no se puede resolver automáticamente
 * (córners, o falta la línea en over/under).
 *
 * Convención de líneas: `.5` nunca empata; línea entera → push (void) si el
 * total coincide exactamente.
 */
export function resolveBet(
  market: Market,
  selection: string,
  line: number | null,
  result: MatchResult,
): Exclude<BetStatus, 'pending'> | null {
  const { homeScore, awayScore } = result
  const total = homeScore + awayScore

  switch (market) {
    case '1x2': {
      const outcome =
        homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw'
      return selection === outcome ? 'won' : 'lost'
    }

    case 'btts': {
      const both = homeScore > 0 && awayScore > 0
      const pickedYes = selection === 'yes'
      return pickedYes === both ? 'won' : 'lost'
    }

    case 'goals': {
      if (line == null) return null
      if (Number.isInteger(line) && total === line) return 'void'
      const wentOver = total > line
      const pickedOver = selection === 'over'
      return pickedOver === wentOver ? 'won' : 'lost'
    }

    case 'corners':
      // The Odds API /scores no da córners: se resuelve a mano.
      return null

    default:
      return null
  }
}

export function scoreDetail(result: MatchResult): string {
  return `${result.homeScore}-${result.awayScore}`
}
