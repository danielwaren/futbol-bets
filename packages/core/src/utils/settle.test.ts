import { describe, expect, it } from 'vitest'
import type { BetStatus } from '../types'
import { parlayOdds, resolveBet, resolveParlay, resultDetailFor } from './settle'

const r = (h: number, a: number) => ({ homeScore: h, awayScore: a })

describe('resolveBet · 1x2', () => {
  it('local gana', () => {
    expect(resolveBet('1x2', 'home', null, r(2, 0))).toBe('won')
    expect(resolveBet('1x2', 'away', null, r(2, 0))).toBe('lost')
    expect(resolveBet('1x2', 'draw', null, r(2, 0))).toBe('lost')
  })
  it('empate', () => {
    expect(resolveBet('1x2', 'draw', null, r(1, 1))).toBe('won')
    expect(resolveBet('1x2', 'home', null, r(1, 1))).toBe('lost')
  })
  it('visita gana', () => {
    expect(resolveBet('1x2', 'away', null, r(0, 3))).toBe('won')
  })
})

describe('resolveBet · btts', () => {
  it('ambos anotan', () => {
    expect(resolveBet('btts', 'yes', null, r(1, 2))).toBe('won')
    expect(resolveBet('btts', 'no', null, r(1, 2))).toBe('lost')
  })
  it('no ambos anotan', () => {
    expect(resolveBet('btts', 'no', null, r(3, 0))).toBe('won')
    expect(resolveBet('btts', 'yes', null, r(3, 0))).toBe('lost')
    expect(resolveBet('btts', 'no', null, r(0, 0))).toBe('won')
  })
})

describe('resolveBet · goals', () => {
  it('over/under 2.5', () => {
    expect(resolveBet('goals', 'over', 2.5, r(2, 1))).toBe('won')
    expect(resolveBet('goals', 'under', 2.5, r(2, 1))).toBe('lost')
    expect(resolveBet('goals', 'under', 2.5, r(1, 1))).toBe('won')
  })
  it('línea entera → push', () => {
    expect(resolveBet('goals', 'over', 3, r(2, 1))).toBe('void')
    expect(resolveBet('goals', 'under', 3, r(2, 1))).toBe('void')
    expect(resolveBet('goals', 'over', 3, r(3, 1))).toBe('won')
  })
  it('sin línea → no se puede resolver', () => {
    expect(resolveBet('goals', 'over', null, r(2, 1))).toBeNull()
  })
})

describe('resolveBet · mercados por estadísticas', () => {
  const withStats = {
    ...r(1, 1),
    corners: 11,
    cards: 4,
    shots: 24,
    shotsOnTarget: 9,
  }

  it('córners over/under', () => {
    expect(resolveBet('corners', 'over', 9.5, withStats)).toBe('won')
    expect(resolveBet('corners', 'under', 9.5, withStats)).toBe('lost')
    expect(resolveBet('corners', 'under', 11.5, withStats)).toBe('won')
  })
  it('tarjetas: línea entera empatada → push', () => {
    expect(resolveBet('cards', 'over', 4, withStats)).toBe('void')
    expect(resolveBet('cards', 'over', 3.5, withStats)).toBe('won')
    expect(resolveBet('cards', 'under', 3.5, withStats)).toBe('lost')
  })
  it('tiros y tiros a puerta', () => {
    expect(resolveBet('shots', 'under', 24.5, withStats)).toBe('won')
    expect(resolveBet('shots_on_target', 'over', 8.5, withStats)).toBe('won')
    expect(resolveBet('shots_on_target', 'under', 8.5, withStats)).toBe('lost')
  })
  it('sin la estadística no se resuelve (queda pendiente)', () => {
    expect(resolveBet('corners', 'over', 9.5, r(2, 1))).toBeNull()
    expect(resolveBet('cards', 'over', 4.5, r(2, 1))).toBeNull()
    expect(resolveBet('shots', 'over', 24.5, { ...r(2, 1), shots: null })).toBeNull()
  })
  it('una combinada nunca se resuelve desde el marcador', () => {
    expect(resolveBet('parlay', 'parlay', null, withStats)).toBeNull()
  })
})

describe('resultDetailFor', () => {
  it('goles solo muestra el marcador', () => {
    expect(resultDetailFor('goals', r(2, 1))).toBe('FT 2-1')
  })
  it('los mercados de estadística añaden el total medido', () => {
    expect(resultDetailFor('corners', { ...r(2, 1), corners: 11 })).toBe(
      'FT 2-1 · 11 córners',
    )
    expect(resultDetailFor('cards', { ...r(0, 0), cards: 5 })).toBe(
      'FT 0-0 · 5 tarjetas',
    )
  })
  it('sin estadística cae al marcador', () => {
    expect(resultDetailFor('corners', r(2, 1))).toBe('FT 2-1')
  })
})

describe('parlayOdds', () => {
  it('multiplica las cuotas y redondea a 3 decimales', () => {
    expect(parlayOdds([{ odds: 2 }, { odds: 1.5 }, { odds: 1.6 }])).toBe(4.8)
    expect(parlayOdds([{ odds: 1.33 }, { odds: 1.33 }])).toBe(1.769)
  })
})

const leg = (status: BetStatus, odds: number) => ({ status, odds })

describe('resolveParlay', () => {
  it('todas pendientes → pendiente, cuota completa', () => {
    expect(
      resolveParlay([leg('pending', 2), leg('pending', 1.5)]),
    ).toEqual({ status: 'pending', odds: 3 })
  })

  it('una perdida tumba la combinada aunque queden partidos', () => {
    expect(
      resolveParlay([leg('won', 2), leg('lost', 1.5), leg('pending', 1.6)]),
    ).toMatchObject({ status: 'lost' })
  })

  it('todas ganadas → ganada', () => {
    expect(resolveParlay([leg('won', 2), leg('won', 1.5)])).toEqual({
      status: 'won',
      odds: 3,
    })
  })

  it('una pata anulada sale del producto y baja el premio', () => {
    expect(
      resolveParlay([leg('won', 2), leg('won', 1.5), leg('void', 1.6)]),
    ).toEqual({ status: 'won', odds: 3 })
  })

  it('anulada + pendiente sigue pendiente, ya con la cuota bajada', () => {
    expect(
      resolveParlay([leg('won', 2), leg('pending', 1.5), leg('void', 4)]),
    ).toEqual({ status: 'pending', odds: 3 })
  })

  it('todas anuladas → anulada y cuota 1 (reembolso)', () => {
    expect(resolveParlay([leg('void', 2), leg('void', 1.5)])).toEqual({
      status: 'void',
      odds: 1,
    })
  })

  it('sin patas → pendiente', () => {
    expect(resolveParlay([])).toEqual({ status: 'pending', odds: 1 })
  })
})
