import type { League, Match, MatchOdds } from '../../types'

export interface FetchMatchesResult {
  matches: Match[]
  /** requests restantes en el plan (header x-requests-remaining), si aplica */
  requestsRemaining: number | null
  source: 'mock' | 'theoddsapi'
}

export interface ExtraMarketsResult {
  odds: Pick<MatchOdds, 'corners' | 'btts'>
  requestsRemaining: number | null
}

export interface OddsProvider {
  readonly id: 'mock' | 'theoddsapi'
  /**
   * Partidos próximos de una liga con los mercados base (1X2 + goles).
   * `date` (yyyy-mm-dd) es una pista de filtrado; el mock lo respeta,
   * The Odds API devuelve toda la ventana próxima y se filtra en cliente.
   */
  getMatches(league: League, date: string): Promise<FetchMatchesResult>
  /** Mercados adicionales (córners + BTTS) para un partido puntual. */
  getExtraMarkets(match: Match): Promise<ExtraMarketsResult>
}
