import { LEAGUES } from '@futbolismo/core'
import { useBankrollContext } from '@/context/BankrollContext'
import { Field, Select } from '@/components/ui'

export function BankrollSwitcher() {
  const { bankrolls, selected, selectBankroll } = useBankrollContext()
  const active = bankrolls.filter((b) => b.isActive)
  if (active.length < 2) return null
  return (
    <Field label="Banca activa">
      <Select
        value={selected?.id ?? active[0].id}
        options={active.map((b) => ({
          value: b.id,
          label: `${b.league ? LEAGUES[b.league].shortLabel : 'Global'} · ${b.name}`,
        }))}
        onChange={selectBankroll}
      />
    </Field>
  )
}
