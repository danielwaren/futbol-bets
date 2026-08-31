import { describe, expect, it } from 'vitest'
import { PLANS, leagueAllowed, leaguesForPlan, planFor } from './plans'

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
  it('free respeta la elección de 3 ligas del usuario', () => {
    const picked = ['chile', 'seriea', 'brasileirao'] as const
    expect(leagueAllowed('free', 'seriea', [...picked])).toBe(true)
    expect(leagueAllowed('free', 'brasileirao', [...picked])).toBe(true)
    // premier ya no está elegida => bloqueada
    expect(leagueAllowed('free', 'premier', [...picked])).toBe(false)
  })
})

describe('leaguesForPlan', () => {
  it('free sin elección => trío por defecto', () => {
    expect(leaguesForPlan('free')).toEqual(['chile', 'laliga', 'premier'])
    expect(leaguesForPlan('free', null)).toEqual(['chile', 'laliga', 'premier'])
  })
  it('free con elección válida => esa elección', () => {
    const picked = ['argentina', 'ligue1', 'eredivisie'] as const
    expect(leaguesForPlan('free', [...picked])).toEqual([...picked])
  })
  it('free con elección incompleta => trío por defecto', () => {
    expect(leaguesForPlan('free', ['chile', 'seriea'] as never)).toEqual([
      'chile',
      'laliga',
      'premier',
    ])
  })
  it('premium => siempre las 10', () => {
    expect(leaguesForPlan('premium', ['chile', 'seriea', 'ligue1'] as never)).toHaveLength(10)
  })
})
