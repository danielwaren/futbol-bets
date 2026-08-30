import { useState } from 'react'
import type { Bet } from '@futbolismo/core'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useBetForm } from '@/context/BetFormContext'
import {
  useDeleteBet,
  useReopenBet,
  useSettleBet,
} from '@futbolismo/core'

export function SettleBetControl({ bet }: { bet: Bet }) {
  const settle = useSettleBet()
  const reopen = useReopenBet()
  const del = useDeleteBet()
  const { openEdit } = useBetForm()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const busy = settle.isPending || reopen.isPending || del.isPending

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {bet.status === 'pending' ? (
        <>
          <Button
            variant="success"
            size="sm"
            disabled={busy}
            onClick={() => settle.mutate({ id: bet.id, status: 'won' })}
          >
            Ganada
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={() => settle.mutate({ id: bet.id, status: 'lost' })}
          >
            Perdida
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="border border-slate-700"
            disabled={busy}
            onClick={() => settle.mutate({ id: bet.id, status: 'void' })}
          >
            Anular
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="border border-slate-700"
          disabled={busy}
          onClick={() => reopen.mutate(bet.id)}
        >
          Reabrir
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="border border-slate-700"
        disabled={busy}
        onClick={() => openEdit(bet)}
      >
        Editar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="border border-slate-700 text-rose-300"
        disabled={busy}
        onClick={() => setConfirmDelete(true)}
      >
        Eliminar
      </Button>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar apuesta"
        danger
        confirmLabel="Eliminar"
        loading={del.isPending}
        message={
          <>
            Se eliminará la apuesta {bet.homeTeam} vs {bet.awayTeam} (
            {bet.selectionLabel}). La banca se recalcula automáticamente.
          </>
        }
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          del.mutate(bet.id, { onSuccess: () => setConfirmDelete(false) })
        }
      />
    </div>
  )
}
