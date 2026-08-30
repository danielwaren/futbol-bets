import { Select } from '@/components/ui/Field'
import { useBankrollContext } from '@/context/BankrollContext'
import { LEAGUES } from '@futbolismo/core'

export function BankrollSwitcher() {
  const { bankrolls, selected, selectBankroll } = useBankrollContext()
  const active = bankrolls.filter((b) => b.isActive)
  if (active.length < 2) return null

  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-slate-400">
        Banca activa
      </label>
      <Select
        value={selected?.id ?? ''}
        onChange={(e) => selectBankroll(e.target.value)}
      >
        {active.map((b) => (
          <option key={b.id} value={b.id}>
            {b.league ? LEAGUES[b.league].shortLabel : 'Global'} · {b.name}
          </option>
        ))}
      </Select>
    </div>
  )
}
