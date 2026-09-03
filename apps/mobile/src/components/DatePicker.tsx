import DateTimePicker from '@react-native-community/datetimepicker'

export interface DatePickerProps {
  value: Date
  /** Firma de @react-native-community/datetimepicker. */
  onChange: (event: unknown, date?: Date) => void
}

/**
 * Selector de fecha nativo. La variante `DatePicker.web.tsx` la sustituye en la
 * build web, donde este módulo no tiene implementación.
 */
export function DatePicker({ value, onChange }: DatePickerProps) {
  return <DateTimePicker value={value} mode="date" onChange={onChange} />
}
