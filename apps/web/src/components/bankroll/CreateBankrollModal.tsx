import { useMemo, useState } from 'react'
import type { League } from '@futbolismo/core'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Label, Select, TextInput } from '@/components/ui/Field'
import { ErrorState } from '@/components/ui/misc'
import { LEAGUES } from '@futbolismo/core'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useBankrollContext } from '@/context/BankrollContext'
import { formatCLP } from '@futbolismo/core'

export interface CreateBankrollParams {
  initialAmount: number
  name: string
  league: League | null
}

interface Props {
  open: boolean
  mandatory?: boolean
  title?: string
  submitting?: boolean
  error?: unknown
  /** Fuerza una liga concreta (p. ej. al crear la banca de esa liga desde una card). */
  forcedLeague?: League | null
  onClose?: () => void
  onSubmit: (params: CreateBankrollParams) => void
}

const PRESETS = [50_000, 100_000, 250_000, 500_000]

export function CreateBankrollModal({
  open,
  mandatory = false,
  title = 'Crear banca',
  submitting = false,
  error,
  forcedLeague,
  onClose,
  onSubmit,
}: Props) {
  const entitlements = useEntitlements()
  const { bankrolls } = useBankrollContext()
  const perLeague = entitlements.bankrollPerLeague

  const takenLeagues = useMemo(
    () => new Set(bankrolls.filter((b) => b.league).map((b) => b.league)),
    [bankrolls],
  )
  const availableLeagues = useMemo(
    () =>
      entitlements.leagues
        .map((id) => LEAGUES[id])
        .filter((l) => !takenLeagues.has(l.id)),
    [entitlements.leagues, takenLeagues],
  )

  const [amount, setAmount] = useState('100000')
  const [name, setName] = useState('Mi banca')
  const [league, setLeague] = useState<League | ''>(
    forcedLeague ?? (perLeague ? (availableLeagues[0]?.id ?? '') : ''),
  )

  const numeric = Number(amount)
  const effectiveLeague: League | null = perLeague
    ? ((forcedLeague ?? (league || null)) as League | null)
    : null
  const valid =
    Number.isFinite(numeric) &&
    numeric > 0 &&
    (!perLeague || effectiveLeague != null)

  const suggestedName =
    perLeague && effectiveLeague
      ? `Banca ${LEAGUES[effectiveLeague].shortLabel}`
      : 'Mi banca'

  return (
    <Modal
      open={open}
      onClose={() => onClose?.()}
      dismissable={!mandatory}
      title={title}
      footer={
        <>
          {!mandatory && (
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
          )}
          <Button
            onClick={() =>
              valid &&
              onSubmit({
                initialAmount: Math.round(numeric),
                name: name.trim() || suggestedName,
                league: effectiveLeague,
              })
            }
            disabled={!valid}
            loading={submitting}
          >
            Crear banca
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Define el capital ficticio con el que vas a practicar tu estrategia.
          Toda la simulación parte de este monto.
        </p>

        {perLeague && !forcedLeague && (
          <div>
            <Label>Liga de esta banca</Label>
            {availableLeagues.length ? (
              <Select
                value={league}
                onChange={(e) => setLeague(e.target.value as League)}
              >
                {availableLeagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </Select>
            ) : (
              <p className="text-xs text-amber-300">
                Ya tienes una banca activa para cada liga disponible.
              </p>
            )}
          </div>
        )}

        {perLeague && forcedLeague && (
          <p className="rounded-lg bg-slate-800/40 px-3 py-2 text-xs text-slate-300">
            Banca para <strong>{LEAGUES[forcedLeague].label}</strong>
          </p>
        )}

        <div>
          <Label>Nombre</Label>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={suggestedName}
          />
        </div>

        <div>
          <Label hint={valid ? formatCLP(numeric) : 'monto inválido'}>
            Monto inicial (CLP)
          </Label>
          <TextInput
            type="number"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(String(p))}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-sky-500 hover:text-white"
              >
                {formatCLP(p)}
              </button>
            ))}
          </div>
        </div>

        {error ? <ErrorState error={error} /> : null}
      </div>
    </Modal>
  )
}
