import { describe, expect, it } from 'vitest'
import { resolveBet } from './settle'

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

describe('resolveBet · córners', () => {
  it('siempre null (manual)', () => {
    expect(resolveBet('corners', 'over', 9.5, r(2, 1))).toBeNull()
  })
})
