import { describe, expect, it } from 'vitest'
import { PLANS, leagueAllowed, planFor } from './plans'

describe('PLANS', () => {
  it('free tiene 3 ligas, 1 banca global, con ads', () => {
    expect(PLANS.free.leagues).toHaveLength(3)
    expect(PLANS.free.maxBankrolls).toBe(1)
    expect(PLANS.free.bankrollPerLeague).toBe(false)
    expect(PLANS.free.ads).toBe(true)
  })

  it('premium tiene 10 ligas, 10 bancas por liga, sin ads', () => {
    expect(PLANS.premium.leagues).toHaveLength(10)
    expect(PLANS.premium.maxBankrolls).toBe(10)
    expect(PLANS.premium.bankrollPerLeague).toBe(true)
    expect(PLANS.premium.ads).toBe(false)
  })
})

describe('planFor', () => {
  it('cae a free ante valores nulos o desconocidos', () => {
    expect(planFor(null).id).toBe('free')
    expect(planFor(undefined).id).toBe('free')
  })
})

describe('leagueAllowed', () => {
  it('free solo permite chile/laliga/premier', () => {
    expect(leagueAllowed('free', 'chile')).toBe(true)
    expect(leagueAllowed('free', 'premier')).toBe(true)
    expect(leagueAllowed('free', 'seriea')).toBe(false)
    expect(leagueAllowed('free', 'brasileirao')).toBe(false)
  })
  it('premium permite todas', () => {
    expect(leagueAllowed('premium', 'seriea')).toBe(true)
    expect(leagueAllowed('premium', 'argentina')).toBe(true)
  })
})
