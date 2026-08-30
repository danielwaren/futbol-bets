/** Tokens de diseño (dark). Espejo de la paleta de la web (slate + sky). */
export const c = {
  canvas: '#0b1120',
  surface: '#0f172a',
  surface2: '#111a2e',
  card: 'rgba(15,23,42,0.7)',
  border: '#1e293b',
  border2: '#334155',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  textFaint: '#64748b',
  textFainter: '#475569',
  white: '#f8fafc',
  sky: '#38bdf8',
  skyBg: 'rgba(56,189,248,0.15)',
  emerald: '#34d399',
  emeraldBg: 'rgba(52,211,153,0.15)',
  rose: '#fb7185',
  roseBg: 'rgba(251,113,133,0.15)',
  amber: '#fbbf24',
  amberBg: 'rgba(251,191,36,0.15)',
  slate700: '#334155',
  slate800: '#1e293b',
} as const

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 9999 }
export const space = (n: number) => n * 4

export const font = {
  h1: { fontSize: 20, fontWeight: '700' as const, color: c.white },
  h2: { fontSize: 16, fontWeight: '600' as const, color: c.white },
  body: { fontSize: 14, color: c.text },
  small: { fontSize: 12, color: c.textDim },
  tiny: { fontSize: 11, color: c.textFaint },
  label: { fontSize: 11, fontWeight: '500' as const, color: c.textDim },
}
