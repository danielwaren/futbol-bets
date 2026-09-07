export type League =
  | 'chile'
  | 'laliga'
  | 'premier'
  | 'seriea'
  | 'bundesliga'
  | 'ligue1'
  | 'primeira'
  | 'eredivisie'
  | 'brasileirao'
  | 'argentina'

/**
 * Mercados apostables + `parlay`, que no se apuesta directamente: es la fila
 * madre de una combinada y agrupa varias selecciones (`BetLeg`).
 * Para el selector del formulario usa `BETTABLE_MARKETS`, no `MARKET_LIST`.
 */
export type Market =
  | '1x2'
  | 'goals'
  | 'btts'
  | 'corners'
  | 'cards'
  | 'shots'
  | 'shots_on_target'
  | 'parlay'

/** Simple (una selección) o combinada (varias, todas deben ganar). */
export type BetKind = 'single' | 'parlay'

export type BetStatus = 'pending' | 'won' | 'lost' | 'void'

/** Selecciones válidas por mercado */
export type Selection1x2 = 'home' | 'draw' | 'away'
export type SelectionOverUnder = 'over' | 'under'
export type SelectionYesNo = 'yes' | 'no'
export type Selection =
  | Selection1x2
  | SelectionOverUnder
  | SelectionYesNo

export interface OverUnderOdds {
  line: number
  over: number
  under: number
}

export interface MatchOdds {
  '1x2'?: { home: number; draw: number; away: number }
  goals?: OverUnderOdds
  btts?: { yes: number; no: number }
  corners?: OverUnderOdds
  cards?: OverUnderOdds
  // Tiros y tiros a puerta no tienen cuota de mercado a nivel partido
  // (los bookies solo los ofrecen por jugador): se registran a mano.
}

export interface Match {
  id: string
  league: League
  sportKey: string
  homeTeam: string
  awayTeam: string
  /** ISO datetime */
  commenceTime: string
  odds: MatchOdds
  bookmaker?: string
}

export interface Bankroll {
  id: string
  name: string
  /** null = banca global (plan free); una liga = banca por liga (premium) */
  league: League | null
  initialAmount: number
  currentAmount: number
  isActive: boolean
  createdAt: string
  archivedAt: string | null
}

/**
 * Una selección dentro de una combinada. Se resuelve por sí sola (cada partido
 * termina cuando termina) y la fila madre se recalcula a partir de todas.
 */
export interface BetLeg {
  id: string
  betId: string
  league: League
  matchId: string | null
  homeTeam: string
  awayTeam: string
  /** ISO datetime */
  matchDate: string
  market: Market
  selection: string
  selectionLabel: string
  line: number | null
  odds: number
  status: BetStatus
  settledAt: string | null
  settledBy: 'auto' | 'manual' | null
  resultDetail: string | null
}

export interface Bet {
  id: string
  bankrollId: string
  kind: BetKind
  league: League
  matchId: string | null
  homeTeam: string
  awayTeam: string
  /** ISO datetime. En una combinada: el partido que se juega último. */
  matchDate: string
  market: Market
  selection: string
  selectionLabel: string
  line: number | null
  /**
   * Cuota efectiva. En una combinada es el producto de las cuotas de las patas
   * que NO quedaron anuladas, así que puede bajar cuando se anula una pata.
   */
  odds: number
  stake: number
  potentialReturn: number
  status: BetStatus
  notes: string | null
  createdAt: string
  settledAt: string | null
  settledBy: 'auto' | 'manual' | null
  resultDetail: string | null
  /** Vacío en las simples; una entrada por selección en las combinadas. */
  legs: BetLeg[]
}

/** Una selección sin los campos de servidor (id, estado, resolución). */
export interface BetLegDraft {
  league: League
  matchId: string | null
  homeTeam: string
  awayTeam: string
  matchDate: string
  market: Market
  selection: string
  selectionLabel: string
  line: number | null
  odds: number
}

/** Payload para crear/editar una apuesta simple. */
export interface BetDraft extends BetLegDraft {
  stake: number
  notes: string | null
}

/** Payload para crear una combinada: la cuota sale del producto de las patas. */
export interface ParlayDraft {
  legs: BetLegDraft[]
  stake: number
  notes: string | null
}

/** Preselección al abrir el formulario desde una card */
export interface BetPrefill {
  match?: Match
  market?: Market
  selection?: string
  selectionLabel?: string
  line?: number | null
  odds?: number
}
