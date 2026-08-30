import type { League, Match, MatchOdds } from '../../types'
import { LEAGUES } from './leagues'
import { TEAMS } from './teams'
import type {
  ExtraMarketsResult,
  FetchMatchesResult,
  OddsProvider,
} from './provider'

/** PRNG determinista (mulberry32) para que una fecha+liga siempre genere lo mismo. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Convierte 3 "fuerzas" en cuotas 1X2 con margen de casa (~6%). */
function oddsFromStrengths(pHome: number, pDraw: number, pAway: number) {
  const total = pHome + pDraw + pAway
  const margin = 1.06
  return {
    home: round2(Math.max(1.05, (total / pHome) / margin + 0.02)),
    draw: round2(Math.max(1.05, (total / pDraw) / margin + 0.02)),
    away: round2(Math.max(1.05, (total / pAway) / margin + 0.02)),
  }
}

function overUnder(prob: number): { over: number; under: number } {
  const margin = 1.06
  return {
    over: round2(Math.max(1.05, 1 / prob / margin)),
    under: round2(Math.max(1.05, 1 / (1 - prob) / margin)),
  }
}

function buildOdds(rand: () => number): MatchOdds {
  const homeAdv = 0.15 + rand() * 0.55
  const awayAdv = 0.1 + rand() * 0.5
  const drawStr = 0.22 + rand() * 0.12
  const pHome = homeAdv
  const pAway = awayAdv
  const pDraw = drawStr

  const cornersLine = rand() > 0.5 ? 9.5 : 10.5
  const goalsLine = rand() > 0.4 ? 2.5 : 3.5

  return {
    '1x2': oddsFromStrengths(pHome, pDraw, pAway),
    goals: {
      line: goalsLine,
      ...overUnder(goalsLine === 2.5 ? 0.52 + rand() * 0.14 : 0.34 + rand() * 0.12),
    },
    corners: {
      line: cornersLine,
      ...overUnder(cornersLine === 9.5 ? 0.53 + rand() * 0.12 : 0.4 + rand() * 0.12),
    },
    btts: (() => {
      const p = 0.44 + rand() * 0.16
      const m = 1.06
      return {
        yes: round2(Math.max(1.05, 1 / p / m)),
        no: round2(Math.max(1.05, 1 / (1 - p) / m)),
      }
    })(),
  }
}

function generateMatches(league: League, date: string): Match[] {
  const meta = LEAGUES[league]
  const rand = seededRandom(hashString(`${league}:${date}`))
  const pool = [...TEAMS[league]]
  // Fisher–Yates con el PRNG sembrado
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  // Calendario más realista: la mayoría de los partidos caen en fin de semana.
  const weekday = new Date(`${date}T12:00:00`).getDay() // 0 dom … 6 sáb
  const capByDay: Record<number, number> = {
    0: 5, // domingo
    1: 2, // lunes
    2: 1, // martes
    3: 2, // miércoles (jornada entre semana ocasional)
    4: 1, // jueves
    5: 3, // viernes
    6: 6, // sábado
  }
  const cap = capByDay[weekday] ?? 3
  const count = Math.max(0, Math.round(rand() * cap))
  const kickoffHours = [12, 14, 16, 18, 20, 21]
  const matches: Match[] = []

  for (let i = 0; i < count && pool.length >= 2; i++) {
    const home = pool.pop() as string
    const away = pool.pop() as string
    const hour = kickoffHours[Math.floor(rand() * kickoffHours.length)]
    const minute = rand() > 0.5 ? 0 : 30
    const commence = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`)

    matches.push({
      id: `mock-${league}-${date}-${i}`,
      league,
      sportKey: meta.sportKey,
      homeTeam: home,
      awayTeam: away,
      commenceTime: commence.toISOString(),
      odds: buildOdds(rand),
      bookmaker: 'Mock Bookmaker',
    })
  }

  return matches.sort((a, b) => a.commenceTime.localeCompare(b.commenceTime))
}

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export const mockOddsApi: OddsProvider = {
  id: 'mock',
  async getMatches(league, date): Promise<FetchMatchesResult> {
    await delay(250 + Math.random() * 200)
    return {
      matches: generateMatches(league, date),
      requestsRemaining: null,
      source: 'mock',
    }
  },
  async getExtraMarkets(match): Promise<ExtraMarketsResult> {
    await delay(200)
    // El mock ya trae córners y BTTS; los devolvemos tal cual.
    return {
      odds: { corners: match.odds.corners, btts: match.odds.btts },
      requestsRemaining: null,
    }
  },
}
