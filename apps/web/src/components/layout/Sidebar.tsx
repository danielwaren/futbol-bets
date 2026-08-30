import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import type { Bet } from '@futbolismo/core'
import { Button } from '@/components/ui/Button'
import { BankrollSummary } from '@/components/bankroll/BankrollSummary'
import { ResetBankrollButton } from '@/components/bankroll/ResetBankrollButton'
import { CreateBankrollModal } from '@/components/bankroll/CreateBankrollModal'
import { BankrollSwitcher } from '@/components/bankroll/BankrollSwitcher'
import { useBetForm } from '@/context/BetFormContext'
import { useBankrollContext } from '@/context/BankrollContext'
import { usePaywall } from '@/context/PaywallContext'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useCreateBankroll } from '@futbolismo/core'
import { usingMockOdds } from '@futbolismo/core'
import { cn } from '@futbolismo/core'

const NAV = [
  { to: '/', label: 'Partidos', end: true },
  { to: '/historial', label: 'Historial', end: false },
  { to: '/estadisticas', label: 'Estadísticas', end: false },
  { to: '/cuenta', label: 'Cuenta', end: false },
]

export function Sidebar({
  bets,
  onNavigate,
}: {
  bets: Bet[]
  onNavigate?: () => void
}) {
  const { openNew } = useBetForm()
  const { openPaywall } = usePaywall()
  const { selected, bankrolls } = useBankrollContext()
  const { signOut } = useAuth()
  const { data: profile } = useProfile()
  const entitlements = useEntitlements()
  const createBankroll = useCreateBankroll()
  const [addingBankroll, setAddingBankroll] = useState(false)

  const canAddBankroll =
    entitlements.bankrollPerLeague &&
    bankrolls.filter((b) => b.isActive).length < entitlements.maxBankrolls

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold tracking-tight text-white">
            Futbolismo
          </p>
          <p className="text-[11px] text-slate-500">dinero ficticio · +18</p>
        </div>
        <PlanChip
          plan={entitlements.plan}
          onUpgrade={() => openPaywall()}
        />
      </div>

      {entitlements.bankrollPerLeague && bankrolls.length > 0 && (
        <BankrollSwitcher />
      )}

      {selected ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <BankrollSummary bankroll={selected} bets={bets} />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-700 p-3 text-xs text-slate-500">
          Sin banca activa.
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => {
            openNew()
            onNavigate?.()
          }}
          disabled={!selected}
          className="flex-1"
        >
          + Apuesta
        </Button>
        {canAddBankroll && (
          <Button
            variant="secondary"
            onClick={() => setAddingBankroll(true)}
            title="Nueva banca por liga"
          >
            + Banca
          </Button>
        )}
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sky-500/15 text-sky-300'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        {selected && <ResetBankrollButton bankroll={selected} />}

        <p
          className={cn(
            'rounded-lg px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wide',
            usingMockOdds()
              ? 'bg-amber-500/10 text-amber-400'
              : 'bg-emerald-500/10 text-emerald-400',
          )}
        >
          {usingMockOdds() ? 'Cuotas: mock (dev)' : 'Cuotas: The Odds API'}
        </p>

        <div className="flex items-center gap-2 border-t border-slate-800 pt-3">
          <NavLink
            to="/cuenta"
            onClick={onNavigate}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg p-1 hover:bg-slate-800"
          >
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-7 w-7 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-xs">
                {(profile?.displayName ?? '?').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-200">
                {profile?.displayName ?? 'Cuenta'}
              </p>
              <p className="truncate text-[10px] text-slate-500">
                {profile?.email}
              </p>
            </div>
          </NavLink>
          <button
            onClick={() => signOut()}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M16 17l5-5-5-5M21 12H9M12 19H5V5h7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <CreateBankrollModal
        open={addingBankroll}
        title="Nueva banca por liga"
        submitting={createBankroll.isPending}
        error={createBankroll.error}
        onClose={() => setAddingBankroll(false)}
        onSubmit={(params) =>
          createBankroll.mutate(params, {
            onSuccess: () => setAddingBankroll(false),
          })
        }
      />
    </div>
  )
}

function PlanChip({
  plan,
  onUpgrade,
}: {
  plan: 'free' | 'premium'
  onUpgrade: () => void
}) {
  if (plan === 'premium') {
    return (
      <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
        Premium
      </span>
    )
  }
  return (
    <button
      onClick={onUpgrade}
      className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300 hover:bg-sky-500/20"
    >
      Free · Mejorar
    </button>
  )
}
