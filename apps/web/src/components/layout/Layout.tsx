import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { CreateBankrollModal } from '@/components/bankroll/CreateBankrollModal'
import { Spinner } from '@/components/ui/misc'
import { useBankrollContext } from '@/context/BankrollContext'
import { useCreateBankroll } from '@futbolismo/core'
import { useBets } from '@futbolismo/core'
import { useEntitlements } from '@/hooks/useEntitlements'
import { isNative } from '@/lib/platform'
import { cn } from '@futbolismo/core'

export function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { selected, isLoading, needsFirstBankroll } = useBankrollContext()
  const betsQuery = useBets(selected?.id)
  const bets = betsQuery.data ?? []
  const createBankroll = useCreateBankroll()
  const { ads } = useEntitlements()
  const nativeBanner = isNative && ads

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="safe-top safe-bottom fixed inset-y-0 left-0 hidden w-72 border-r border-slate-800 bg-slate-900/60 lg:block">
        <Sidebar bets={bets} />
      </aside>

      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-slate-950/70 transition-opacity',
            drawerOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={cn(
            'safe-top safe-bottom absolute inset-y-0 left-0 w-72 border-r border-slate-800 bg-slate-900 transition-transform',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <Sidebar bets={bets} onNavigate={() => setDrawerOpen(false)} />
        </aside>
      </div>

      <div className="lg:pl-72">
        <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg border border-slate-700 p-2 text-slate-300"
            aria-label="Abrir menú"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-white">Futbolismo</span>
        </header>

        <main
          className={cn(
            'mx-auto max-w-5xl px-4 py-6',
            nativeBanner
              ? 'pb-[calc(4rem+var(--safe-bottom))]'
              : 'pb-[calc(1.5rem+var(--safe-bottom))]',
          )}
        >
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <CreateBankrollModal
        open={needsFirstBankroll}
        mandatory
        title="Bienvenido · crea tu banca"
        submitting={createBankroll.isPending}
        error={createBankroll.error}
        onSubmit={(params) => createBankroll.mutate(params)}
      />
    </div>
  )
}
