const clpFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 0,
})

/** Formatea un monto como pesos chilenos, sin decimales. */
export function formatCLP(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return clpFormatter.format(Math.round(value))
}

/** Igual que formatCLP pero anteponiendo el signo (+/−) explícito. */
export function formatSignedCLP(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const rounded = Math.round(value)
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''
  return `${sign}${clpFormatter.format(Math.abs(rounded))}`
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return numberFormatter.format(value)
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—'
  return `${value >= 0 ? '' : '−'}${Math.abs(value).toFixed(digits)}%`
}

export function formatOdds(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return value.toFixed(2)
}

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
})

const timeFormatter = new Intl.DateTimeFormat('es-CL', {
  hour: '2-digit',
  minute: '2-digit',
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatMatchDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return dateFormatter.format(d)
}

export function formatMatchTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return timeFormatter.format(d)
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return dateTimeFormatter.format(d)
}

/** yyyy-mm-dd en horario local (para <input type="date"> y navegación por día). */
export function toDateInputValue(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() + delta)
  return toDateInputValue(d)
}

/** ¿El ISO datetime cae en el día local `dateStr` (yyyy-mm-dd)? */
export function isSameLocalDay(iso: string, dateStr: string): boolean {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  return toDateInputValue(d) === dateStr
}
