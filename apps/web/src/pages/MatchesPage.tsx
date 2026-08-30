import { useEffect, useState } from 'react'
import type { League } from '@futbolismo/core'
import { DateLeagueBar } from '@/components/matches/DateLeagueBar'
import { MatchCard } from '@/components/matches/MatchCard'
import { AdSlot } from '@/components/ads/AdSlot'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/misc'
import { usingMockOdds } from '@futbolismo/core'
import { useMatches, useRefreshMatches } from '@futbolismo/core'
import { useEntitlements } from '@/hooks/useEntitlements'
import { usePaywall } from '@/context/PaywallContext'
import { toDateInputValue } from '@futbolismo/core'

export function MatchesPage() {
  const entitlements = useEntitlements()
  const { openPaywall } = usePaywall()
  const allowed = entitlements.leagues

  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [leagues, setLeagues] = useState<League[]>(allowed)

  // Si cambia el plan (y con él las ligas permitidas), vuelve a "Todas".
  const allowedKey = allowed.join(',')
  useEffect(() => {
    setLeagues(allowed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedKey])

  const matchesQuery = useMatches(leagues, date)
  const refresh = useRefreshMatches(leagues)
  const matches = matchesQuery.data?.matches ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Partidos</h1>
          <p className="text-xs text-slate-500">
            1X2 · Goles · Córners · Ambos anotan
          </p>
        </div>
        {!refresh.disabled && (
          <div className="flex items-center gap-2">
            {refresh.requestsRemaining != null && (
              <span className="text-[11px] text-slate-500">
                {refresh.requestsRemaining} req.
              </span>
            )}
            <Button
              variant="secondary"
              size="sm"
              loading={refresh.isPending}
              onClick={() => refresh.mutate()}
            >
              Actualizar cuotas
            </Button>
          </div>
        )}
      </div>

      {usingMockOdds() && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          <strong>Modo desarrollo (mock).</strong> Partidos generados al azar. En
          producción los datos vienen de la caché <code>matches_cache</code> que
          alimenta la función <code>refresh-odds</code>.
        </div>
      )}

      <DateLeagueBar
        date={date}
        leagues={leagues}
        allowedLeagues={allowed}
        onDateChange={setDate}
        onLeaguesChange={setLeagues}
        onLockedClick={() =>
          openPaywall('Esa liga está disponible en el plan Premium.')
        }
      />

      <AdSlot />

      {refresh.isError && <ErrorState error={refresh.error} />}

      {matchesQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7" />
        </div>
      ) : matchesQuery.isError ? (
        <ErrorState error={matchesQuery.error} />
      ) : matches.length === 0 ? (
        <EmptyState
          title="No hay partidos para esta fecha"
          hint={
            usingMockOdds()
              ? 'Prueba con otra fecha: el generador mock crea partidos para casi cualquier día.'
              : 'La caché se actualiza cada pocas horas. Prueba otra fecha o pulsa "Actualizar cuotas".'
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  )
}
