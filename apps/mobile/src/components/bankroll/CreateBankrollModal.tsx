import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { formatCLP, LEAGUES, type League } from '@futbolismo/core'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useBankrollContext } from '@/context/BankrollContext'
import { Sheet, Button, Field, Input, Select, ErrorText, Txt } from '@/components/ui'
import { c, radius } from '@/theme'

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

  const taken = useMemo(
    () => new Set(bankrolls.filter((b) => b.league).map((b) => b.league)),
    [bankrolls],
  )
  const available = useMemo(
    () => entitlements.leagues.map((id) => LEAGUES[id]).filter((l) => !taken.has(l.id)),
    [entitlements.leagues, taken],
  )

  const [amount, setAmount] = useState('100000')
  const [name, setName] = useState('')
  const [league, setLeague] = useState<League | ''>(
    forcedLeague ?? (perLeague ? (available[0]?.id ?? '') : ''),
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
    <Sheet open={open} onClose={() => onClose?.()} title={title} dismissable={!mandatory}>
      <Txt size={13} dim>
        Define el capital ficticio con el que vas a practicar. Toda la simulación
        parte de este monto.
      </Txt>

      {perLeague && !forcedLeague && (
        <Field label="Liga de esta banca">
          {available.length ? (
            <Select
              value={league || available[0].id}
              options={available.map((l) => ({ value: l.id, label: l.shortLabel }))}
              onChange={(v) => setLeague(v)}
            />
          ) : (
            <Txt size={12} color={c.amber}>
              Ya tienes una banca activa para cada liga.
            </Txt>
          )}
        </Field>
      )}
      {perLeague && forcedLeague && (
        <View
          style={{
            backgroundColor: 'rgba(30,41,59,0.4)',
            borderRadius: radius.md,
            padding: 10,
          }}
        >
          <Txt size={12} dim>
            Banca para {LEAGUES[forcedLeague].label}
          </Txt>
        </View>
      )}

      <Field label="Nombre">
        <Input value={name} placeholder={suggestedName} onChangeText={setName} />
      </Field>

      <Field label="Monto inicial (CLP)" hint={valid ? formatCLP(numeric) : 'inválido'}>
        <Input
          value={amount}
          keyboardType="number-pad"
          onChangeText={setAmount}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {PRESETS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setAmount(String(p))}
              style={{
                borderWidth: 1,
                borderColor: c.border2,
                borderRadius: radius.sm,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Txt size={12} dim>
                {formatCLP(p)}
              </Txt>
            </Pressable>
          ))}
        </View>
      </Field>

      {error ? <ErrorText error={error} /> : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {!mandatory && (
          <Button
            variant="ghost"
            title="Cancelar"
            onPress={onClose}
            style={{ flex: 1 }}
          />
        )}
        <Button
          title="Crear banca"
          loading={submitting}
          disabled={!valid}
          style={{ flex: 1 }}
          onPress={() =>
            valid &&
            onSubmit({
              initialAmount: Math.round(numeric),
              name: name.trim() || suggestedName,
              league: effectiveLeague,
            })
          }
        />
      </View>
    </Sheet>
  )
}
