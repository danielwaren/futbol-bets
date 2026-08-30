import type { ReactNode } from 'react'
import type { League } from '@futbolismo/core'
import { LEAGUE_LIST, LEAGUES } from '@futbolismo/core'
import { Button } from '@/components/ui/Button'
import { cn } from '@futbolismo/core'
import { addDays, formatMatchDate, toDateInputValue } from '@futbolismo/core'

interface Props {
  date: string
  leagues: League[]
  allowedLeagues: League[]
  onDateChange: (date: string) => void
  onLeaguesChange: (leagues: League[]) => void
  onLockedClick: () => void
}

export function DateLeagueBar({
  date,
  leagues,
  allowedLeagues,
  onDateChange,
  onLeaguesChange,
  onLockedClick,
}: Props) {
  const allSelected = leagues.length === allowedLeagues.length
  const lockedLeagues = LEAGUE_LIST.filter(
    (l) => !allowedLeagues.includes(l.id),
  )

  function selectLeague(id: League) {
    if (leagues.length === 1 && leagues[0] === id) {
      onLeaguesChange(allowedLeagues)
    } else {
      onLeaguesChange([id])
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onDateChange(addDays(date, -1))}
          aria-label="Día anterior"
        >
          ‹
        </Button>
        <div className="flex flex-col items-center">
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
          />
          <span className="mt-0.5 text-[11px] capitalize text-slate-500">
            {formatMatchDate(`${date}T12:00:00`)}
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onDateChange(addDays(date, 1))}
          aria-label="Día siguiente"
        >
          ›
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDateChange(toDateInputValue(new Date()))}
        >
          Hoy
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={allSelected} onClick={() => onLeaguesChange(allowedLeagues)}>
          Todas
        </FilterChip>
        {allowedLeagues.map((id) => {
          const l = LEAGUES[id]
          return (
            <FilterChip
              key={id}
              active={!allSelected && leagues.includes(id)}
              color={l.color}
              onClick={() => selectLeague(id)}
            >
              {l.shortLabel}
            </FilterChip>
          )
        })}
        {lockedLeagues.map((l) => (
          <FilterChip key={l.id} locked onClick={onLockedClick}>
            {l.shortLabel}
          </FilterChip>
        ))}
      </div>
    </div>
  )
}

function FilterChip({
  active = false,
  locked = false,
  color,
  onClick,
  children,
}: {
  active?: boolean
  locked?: boolean
  color?: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        locked
          ? 'border-slate-800 text-slate-600 hover:border-amber-500/50 hover:text-amber-300'
          : active
            ? 'border-sky-500 bg-sky-500/15 text-sky-200'
            : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200',
      )}
      style={active && color ? { borderColor: color, color } : undefined}
    >
      {locked && (
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      )}
      {children}
    </button>
  )
}
