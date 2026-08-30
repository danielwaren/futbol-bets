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

export type Market = '1x2' | 'corners' | 'btts' | 'goals'

export type BetStatus = 'pending' | 'won' | 'lost' | 'void'

/** Selecciones válidas por mercado */
export type Selection1x2 = 'home' | 'draw' | 'away'
export type SelectionOverUnder = 'over' | 'under'
export type SelectionYesNo = 'yes' | 'no'
export type Selection =
  | Selection1x2
  | SelectionOverUnder
  | SelectionYesNo

export interface MatchOdds {
  '1x2'?: { home: number; draw: number; away: number }
  corners?: { line: number; over: number; under: number }
  btts?: { yes: number; no: number }
  goals?: { line: number; over: number; under: number }
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

export interface Bet {
  id: string
  bankrollId: string
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
  stake: number
  potentialReturn: number
  status: BetStatus
  notes: string | null
  createdAt: string
  settledAt: string | null
  settledBy: 'auto' | 'manual' | null
  resultDetail: string | null
}

/** Payload para crear/editar una apuesta (sin campos derivados/servidor) */
export interface BetDraft {
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
