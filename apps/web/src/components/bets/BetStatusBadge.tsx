import type { BetStatus } from '@futbolismo/core'
import { cn } from '@futbolismo/core'

const CONFIG: Record<BetStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendiente',
    className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  won: {
    label: 'Ganada',
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  lost: {
    label: 'Perdida',
    className: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  void: {
    label: 'Anulada',
    className: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  },
}

export function BetStatusBadge({ status }: { status: BetStatus }) {
  const { label, className } = CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        className,
      )}
    >
      {label}
    </span>
  )
}

export function LeagueBadge({
  label,
  color,
}: {
  label: string
  color: string
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium"
      style={{
        borderColor: `${color}55`,
        backgroundColor: `${color}1a`,
        color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
