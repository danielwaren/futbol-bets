import { useState } from 'react'
import type { Bankroll } from '@futbolismo/core'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CreateBankrollModal } from './CreateBankrollModal'
import { useResetBankroll } from '@futbolismo/core'

export function ResetBankrollButton({ bankroll }: { bankroll: Bankroll }) {
  const [confirming, setConfirming] = useState(false)
  const [creating, setCreating] = useState(false)
  const reset = useResetBankroll()

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="w-full border border-slate-800"
        onClick={() => setConfirming(true)}
      >
        Reiniciar banca
      </Button>

      <ConfirmDialog
        open={confirming}
        title="Reiniciar banca"
        danger
        confirmLabel="Sí, reiniciar"
        message={
          <>
            La banca actual <strong>{bankroll.name}</strong> se archivará junto
            con su historial de apuestas. Podrás seguir consultándola, pero la
            nueva banca empieza desde cero. ¿Continuar?
          </>
        }
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false)
          setCreating(true)
        }}
      />

      <CreateBankrollModal
        open={creating}
        title="Nueva banca"
        submitting={reset.isPending}
        error={reset.error}
        forcedLeague={bankroll.league}
        onClose={() => setCreating(false)}
        onSubmit={({ initialAmount, name, league }) =>
          reset.mutate(
            { currentId: bankroll.id, initialAmount, name, league },
            { onSuccess: () => setCreating(false) },
          )
        }
      />
    </>
  )
}
