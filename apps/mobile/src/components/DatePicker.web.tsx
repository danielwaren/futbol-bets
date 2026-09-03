import { useRef } from 'react'
import { c, family, radius } from '@/theme'

export interface DatePickerProps {
  value: Date
  onChange: (event: unknown, date?: Date) => void
}

/** yyyy-mm-dd en horario local, que es lo que espera <input type="date">. */
function toInputValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * `@react-native-community/datetimepicker` no tiene implementación web, así que
 * en el navegador usamos el selector nativo del sistema vía <input type="date">.
 * Metro resuelve este archivo por la extensión `.web.tsx`.
 */
export function DatePicker({ value, onChange }: DatePickerProps) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <input
      ref={ref}
      type="date"
      value={toInputValue(value)}
      onChange={(e) => {
        const v = e.target.value
        if (!v) return onChange({ type: 'dismissed' }, undefined)
        // Mediodía local: evita que el desfase horario mueva el día.
        onChange({ type: 'set' }, new Date(`${v}T12:00:00`))
      }}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        background: c.board2,
        color: c.ink,
        border: `1px solid ${c.line}`,
        borderRadius: radius.md,
        padding: '12px 13px',
        minHeight: 44,
        fontFamily: family.mono,
        fontSize: 15,
        colorScheme: 'dark',
      }}
    />
  )
}
