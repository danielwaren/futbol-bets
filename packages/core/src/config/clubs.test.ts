import { describe, expect, it } from 'vitest'
import { clubIdentity } from './clubs'

describe('clubIdentity', () => {
  it('reconoce clubes catalogados', () => {
    const cc = clubIdentity('Colo Colo')
    expect(cc.abbr).toBe('CC')
    expect(cc.pattern).toBe('stripes')
    expect(cc.darkInk).toBe(true)
  })

  it('tolera acentos, puntuación y mayúsculas', () => {
    expect(clubIdentity('Ñublense').abbr).toBe('NUB')
    expect(clubIdentity('U. Católica').abbr).toBe(clubIdentity('Universidad Catolica').abbr)
    expect(clubIdentity('ATLETICO MADRID').abbr).toBe('ATM')
  })

  it('ignora prefijos y sufijos de club', () => {
    expect(clubIdentity('CD Universidad Catolica').abbr).toBe('UC')
    expect(clubIdentity('Manchester City FC').abbr).toBe('MCI')
  })

  it('deriva identidad estable para clubes sin catalogar', () => {
    const a = clubIdentity('Deportivo Pupilos del Maule')
    const b = clubIdentity('Deportivo Pupilos del Maule')
    expect(a).toEqual(b)
    expect(a.abbr.length).toBeGreaterThan(0)
    expect(a.c1).toMatch(/^#[0-9A-F]{6}$/i)
  })

  it('da identidades distintas a equipos distintos', () => {
    const a = clubIdentity('Equipo Alfa')
    const b = clubIdentity('Equipo Beta')
    expect(a.abbr).not.toBe(b.abbr)
  })

  it('siempre devuelve un patrón y colores válidos', () => {
    for (const name of ['Real Madrid', 'X', 'Club Deportivo', 'FC']) {
      const id = clubIdentity(name)
      expect(['solid', 'stripes', 'halves', 'band', 'sash']).toContain(id.pattern)
      expect(id.c1).toMatch(/^#[0-9A-F]{6}$/i)
      expect(id.c2).toMatch(/^#[0-9A-F]{6}$/i)
    }
  })
})
