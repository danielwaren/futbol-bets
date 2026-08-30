import type { Market, Match } from '@futbolismo/core'
import { LEAGUES, MARKETS } from '@futbolismo/core'
import { LeagueBadge } from '@/components/bets/BetStatusBadge'
import { Button } from '@/components/ui/Button'
import { useBetForm } from '@/context/BetFormContext'
import { formatMatchDate, formatMatchTime, formatOdds } from '@futbolismo/core'
import { cn } from '@futbolismo/core'

function OddsButton({
  label,
  odds,
  onClick,
}: {
  label: string
  odds: number | undefined
  onClick: () => void
}) {
  const disabled = odds == null
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-1 flex-col items-center rounded-lg border px-2 py-1.5 text-center transition-colors',
        disabled
          ? 'cursor-not-allowed border-slate-800 text-slate-600'
          : 'border-slate-700 hover:border-sky-500 hover:bg-sky-500/10',
      )}
    >
      <span className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums text-slate-100">
        {odds != null ? formatOdds(odds) : '—'}
      </span>
    </button>
  )
}

function MarketRow({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-slate-400">{title}</p>
      <div className="flex gap-1.5">{children}</div>
    </div>
  )
}

export function MatchCard({ match }: { match: Match }) {
  const league = LEAGUES[match.league]
  const { openNew } = useBetForm()
  const { odds } = match

  const pick = (
    market: Market,
    selection: string,
    value: number | undefined,
    line?: number | null,
  ) => {
    if (value == null) return
    openNew({
      match,
      market,
      selection,
      line: line ?? null,
      odds: value,
    })
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">
            {match.homeTeam} <span className="text-slate-500">vs</span>{' '}
            {match.awayTeam}
          </p>
          <p className="text-[11px] text-slate-400">
            <span className="capitalize">
              {formatMatchDate(match.commenceTime)}
            </span>{' '}
            · {formatMatchTime(match.commenceTime)}
          </p>
          {match.bookmaker && (
            <p className="text-[10px] text-slate-600">{match.bookmaker}</p>
          )}
        </div>
        <LeagueBadge label={league.shortLabel} color={league.color} />
      </div>

      <div className="space-y-2.5">
        <MarketRow title={MARKETS['1x2'].label}>
          <OddsButton
            label="1"
            odds={odds['1x2']?.home}
            onClick={() => pick('1x2', 'home', odds['1x2']?.home)}
          />
          <OddsButton
            label="X"
            odds={odds['1x2']?.draw}
            onClick={() => pick('1x2', 'draw', odds['1x2']?.draw)}
          />
          <OddsButton
            label="2"
            odds={odds['1x2']?.away}
            onClick={() => pick('1x2', 'away', odds['1x2']?.away)}
          />
        </MarketRow>

        <MarketRow
          title={`${MARKETS.goals.label}${odds.goals ? ` · ${odds.goals.line}` : ''}`}
        >
          <OddsButton
            label={`Over ${odds.goals?.line ?? ''}`}
            odds={odds.goals?.over}
            onClick={() =>
              pick('goals', 'over', odds.goals?.over, odds.goals?.line)
            }
          />
          <OddsButton
            label={`Under ${odds.goals?.line ?? ''}`}
            odds={odds.goals?.under}
            onClick={() =>
              pick('goals', 'under', odds.goals?.under, odds.goals?.line)
            }
          />
        </MarketRow>

        {odds.corners && (
          <MarketRow title={`${MARKETS.corners.label} · ${odds.corners.line}`}>
            <OddsButton
              label={`Over ${odds.corners.line}`}
              odds={odds.corners.over}
              onClick={() =>
                pick('corners', 'over', odds.corners?.over, odds.corners?.line)
              }
            />
            <OddsButton
              label={`Under ${odds.corners.line}`}
              odds={odds.corners.under}
              onClick={() =>
                pick('corners', 'under', odds.corners?.under, odds.corners?.line)
              }
            />
          </MarketRow>
        )}

        {odds.btts && (
          <MarketRow title={MARKETS.btts.label}>
            <OddsButton
              label="Sí"
              odds={odds.btts.yes}
              onClick={() => pick('btts', 'yes', odds.btts?.yes)}
            />
            <OddsButton
              label="No"
              odds={odds.btts.no}
              onClick={() => pick('btts', 'no', odds.btts?.no)}
            />
          </MarketRow>
        )}
      </div>

      <div className="mt-3">
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => openNew({ match })}
        >
          Agregar apuesta
        </Button>
      </div>
    </div>
  )
}
