import { useEntitlements } from '@/hooks/useEntitlements'
import { isNative } from '@/lib/platform'

/**
 * En web (plan free) muestra un placeholder de anuncio.
 * En la app nativa el banner real de AdMob flota sobre el WebView
 * (lo gestiona MonetizationProvider), así que aquí no renderizamos nada:
 * el espacio inferior lo reserva <Layout> con `pb`.
 */
export function AdSlot({ label = 'Espacio publicitario' }: { label?: string }) {
  const { ads } = useEntitlements()
  if (!ads || isNative) return null

  return (
    <div className="flex h-14 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/40 text-[11px] uppercase tracking-wide text-slate-600">
      {label}
    </div>
  )
}
