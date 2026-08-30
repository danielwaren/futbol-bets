import { describe, expect, it } from 'vitest'
import type { Bet } from '../types'
import {
  bankrollSeries,
  betPnl,
  currentAmountFromBets,
  potentialReturn,
  roi,
  statsByMarket,
  winrate,
} from './calc'

function makeBet(partial: Partial<Bet>): Bet {
  return {
    id: crypto.randomUUID(),
    bankrollId: 'bk',
    league: 'chile',
    matchId: null,
    homeTeam: 'A',
    awayTeam: 'B',
    matchDate: '2026-08-20T22:00:00.000Z',
    market: '1x2',
    selection: 'home',
    selectionLabel: 'Local',
    line: null,
    odds: 2,
    stake: 1000,
    potentialReturn: 2000,
    status: 'pending',
    notes: null,
    createdAt: '2026-08-19T10:00:00.000Z',
    settledAt: null,
    settledBy: null,
    resultDetail: null,
    ...partial,
  }
}

describe('potentialReturn', () => {
  it('multiplica stake por cuota y redondea', () => {
    expect(potentialReturn(1000, 2.5)).toBe(2500)
    expect(potentialReturn(1500, 1.83)).toBe(2745)
  })
})

describe('betPnl', () => {
  it('ganada devuelve ganancia neta', () => {
    expect(betPnl({ status: 'won', stake: 1000, odds: 2.5 })).toBe(1500)
  })
  it('perdida devuelve -stake', () => {
    expect(betPnl({ status: 'lost', stake: 1000, odds: 2.5 })).toBe(-1000)
  })
  it('pendiente y anulada devuelven 0', () => {
    expect(betPnl({ status: 'pending', stake: 1000, odds: 2.5 })).toBe(0)
    expect(betPnl({ status: 'void', stake: 1000, odds: 2.5 })).toBe(0)
  })
})

describe('currentAmountFromBets', () => {
  it('descuenta stake de pendientes y perdidas, suma ganancia de ganadas', () => {
    const bets = [
      makeBet({ status: 'pending', stake: 1000, odds: 2 }), // -1000
      makeBet({ status: 'lost', stake: 500, odds: 3 }), // -500
      makeBet({ status: 'won', stake: 1000, odds: 2 }), // +1000
      makeBet({ status: 'void', stake: 800, odds: 2 }), // 0
    ]
    expect(currentAmountFromBets(10_000, bets)).toBe(10_000 - 1000 - 500 + 1000)
  })
})

describe('winrate', () => {
  it('ignora pendientes y anuladas', () => {
    const bets = [
      makeBet({ status: 'won' }),
      makeBet({ status: 'won' }),
      makeBet({ status: 'lost' }),
      makeBet({ status: 'pending' }),
      makeBet({ status: 'void' }),
    ]
    expect(winrate(bets)).toBeCloseTo((2 / 3) * 100)
  })
  it('sin apuestas resueltas devuelve 0', () => {
    expect(winrate([makeBet({ status: 'pending' })])).toBe(0)
  })
})

describe('roi', () => {
  it('pnl sobre lo apostado', () => {
    expect(roi(500, 2000)).toBe(25)
    expect(roi(100, 0)).toBe(0)
  })
})

describe('statsByMarket', () => {
  it('agrupa y calcula por mercado', () => {
    const bets = [
      makeBet({ market: '1x2', status: 'won', stake: 1000, odds: 2 }),
      makeBet({ market: '1x2', status: 'lost', stake: 1000, odds: 2 }),
      makeBet({ market: 'goals', status: 'won', stake: 1000, odds: 1.9 }),
    ]
    const stats = statsByMarket(bets)
    const h2h = stats.find((s) => s.key === '1x2')!
    const goals = stats.find((s) => s.key === 'goals')!
    expect(h2h.count).toBe(2)
    expect(h2h.pnl).toBe(0)
    expect(h2h.winrate).toBe(50)
    expect(goals.pnl).toBe(900)
  })
})

describe('bankrollSeries', () => {
  it('parte del inicial y acumula el P&L de las resueltas en orden', () => {
    const bets = [
      makeBet({
        status: 'won',
        stake: 1000,
        odds: 2,
        settledAt: '2026-08-21T10:00:00.000Z',
      }),
      makeBet({
        status: 'lost',
        stake: 500,
        odds: 3,
        settledAt: '2026-08-22T10:00:00.000Z',
      }),
      makeBet({ status: 'pending', stake: 999, odds: 2 }),
    ]
    const series = bankrollSeries(bets, 10_000, '2026-08-20T00:00:00.000Z')
    expect(series).toHaveLength(3)
    expect(series[0].balance).toBe(10_000)
    expect(series[1].balance).toBe(11_000)
    expect(series[2].balance).toBe(10_500)
  })
})
