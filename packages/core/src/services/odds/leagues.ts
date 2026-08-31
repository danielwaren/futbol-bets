import type { League, Market } from '../../types'

export interface LeagueMeta {
  id: League
  label: string
  shortLabel: string
  sportKey: string
  /** color de acento (tailwind-ish hex) para badges */
  color: string
  /** país (para el logo redondo del selector de ligas) */
  country: string
  /** emoji de bandera usado como "logo" redondo */
  flag: string
  /** true = forma parte del trío free por defecto (fallback si el usuario no eligió) */
  free: boolean
}

export const LEAGUES: Record<League, LeagueMeta> = {
  chile: {
    id: 'chile',
    label: 'Primera División de Chile',
    shortLabel: 'Chile',
    sportKey: 'soccer_chile_campeonato',
    color: '#ef4444',
    country: 'Chile',
    flag: '🇨🇱',
    free: true,
  },
  laliga: {
    id: 'laliga',
    label: 'LaLiga (España)',
    shortLabel: 'LaLiga',
    sportKey: 'soccer_spain_la_liga',
    color: '#f59e0b',
    country: 'España',
    flag: '🇪🇸',
    free: true,
  },
  premier: {
    id: 'premier',
    label: 'Premier League (Inglaterra)',
    shortLabel: 'Premier',
    sportKey: 'soccer_epl',
    color: '#8b5cf6',
    country: 'Inglaterra',
    flag: '🇬🇧',
    free: true,
  },
  seriea: {
    id: 'seriea',
    label: 'Serie A (Italia)',
    shortLabel: 'Serie A',
    sportKey: 'soccer_italy_serie_a',
    color: '#22d3ee',
    country: 'Italia',
    flag: '🇮🇹',
    free: false,
  },
  bundesliga: {
    id: 'bundesliga',
    label: 'Bundesliga (Alemania)',
    shortLabel: 'Bundesliga',
    sportKey: 'soccer_germany_bundesliga',
    color: '#f43f5e',
    country: 'Alemania',
    flag: '🇩🇪',
    free: false,
  },
  ligue1: {
    id: 'ligue1',
    label: 'Ligue 1 (Francia)',
    shortLabel: 'Ligue 1',
    sportKey: 'soccer_france_ligue_one',
    color: '#38bdf8',
    country: 'Francia',
    flag: '🇫🇷',
    free: false,
  },
  primeira: {
    id: 'primeira',
    label: 'Primeira Liga (Portugal)',
    shortLabel: 'Primeira',
    sportKey: 'soccer_portugal_primeira_liga',
    color: '#34d399',
    country: 'Portugal',
    flag: '🇵🇹',
    free: false,
  },
  eredivisie: {
    id: 'eredivisie',
    label: 'Eredivisie (Países Bajos)',
    shortLabel: 'Eredivisie',
    sportKey: 'soccer_netherlands_eredivisie',
    color: '#fb923c',
    country: 'Países Bajos',
    flag: '🇳🇱',
    free: false,
  },
  brasileirao: {
    id: 'brasileirao',
    label: 'Brasileirão Série A',
    shortLabel: 'Brasil',
    sportKey: 'soccer_brazil_campeonato',
    color: '#a3e635',
    country: 'Brasil',
    flag: '🇧🇷',
    free: false,
  },
  argentina: {
    id: 'argentina',
    label: 'Primera División (Argentina)',
    shortLabel: 'Argentina',
    sportKey: 'soccer_argentina_primera_division',
    color: '#818cf8',
    country: 'Argentina',
    flag: '🇦🇷',
    free: false,
  },
}

export const LEAGUE_LIST: LeagueMeta[] = Object.values(LEAGUES)
export const ALL_LEAGUE_IDS = LEAGUE_LIST.map((l) => l.id)

/** Nº de ligas que incluye el plan free (el usuario elige cuáles). */
export const FREE_LEAGUE_SLOTS = 3

/**
 * Trío free por defecto: se usa como fallback mientras el usuario no haya
 * elegido sus ligas. Debe coincidir con `public.default_free_leagues()` en la BD.
 */
export const DEFAULT_FREE_LEAGUE_IDS = LEAGUE_LIST.filter((l) => l.free).map(
  (l) => l.id,
)

/** @deprecated El plan free ya no tiene ligas fijas. Usa `DEFAULT_FREE_LEAGUE_IDS`. */
export const FREE_LEAGUE_IDS = DEFAULT_FREE_LEAGUE_IDS

export function leagueFromSportKey(sportKey: string): League | null {
  const found = LEAGUE_LIST.find((l) => l.sportKey === sportKey)
  return found ? found.id : null
}

export interface MarketMeta {
  id: Market
  label: string
  shortLabel: string
  /** claves de selección y su etiqueta legible */
  selections: { value: string; label: string }[]
  hasLine: boolean
}

export const MARKETS: Record<Market, MarketMeta> = {
  '1x2': {
    id: '1x2',
    label: 'Resultado (1X2)',
    shortLabel: '1X2',
    hasLine: false,
    selections: [
      { value: 'home', label: 'Local' },
      { value: 'draw', label: 'Empate' },
      { value: 'away', label: 'Visita' },
    ],
  },
  corners: {
    id: 'corners',
    label: 'Córners (Over/Under)',
    shortLabel: 'Córners',
    hasLine: true,
    selections: [
      { value: 'over', label: 'Over' },
      { value: 'under', label: 'Under' },
    ],
  },
  btts: {
    id: 'btts',
    label: 'Ambos anotan (BTTS)',
    shortLabel: 'BTTS',
    hasLine: false,
    selections: [
      { value: 'yes', label: 'Sí' },
      { value: 'no', label: 'No' },
    ],
  },
  goals: {
    id: 'goals',
    label: 'Goles (Over/Under)',
    shortLabel: 'Goles',
    hasLine: true,
    selections: [
      { value: 'over', label: 'Over' },
      { value: 'under', label: 'Under' },
    ],
  },
}

export const MARKET_LIST: MarketMeta[] = Object.values(MARKETS)

/** Etiqueta legible de una selección dentro de un mercado. */
export function selectionLabel(
  market: Market,
  selection: string,
  line?: number | null,
): string {
  const base =
    MARKETS[market].selections.find((s) => s.value === selection)?.label ??
    selection
  if (MARKETS[market].hasLine && line != null) {
    return `${base} ${line}`
  }
  return base
}
