import { Link } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ErrorState, Spinner } from '@/components/ui/misc'
import { useMonetization } from '@/context/MonetizationContext'
import { useEntitlements } from '@/hooks/useEntitlements'
import type { PurchasesPackage } from '@/lib/purchases'

const PERKS = [
  '10 ligas (vs. 3 del plan free)',
  'Una banca independiente por cada liga',
  'Sin anuncios',
  'Apoyas el desarrollo y el pago de las APIs',
]

const PACKAGE_LABEL: Record<string, string> = {
  MONTHLY: 'Mensual',
  ANNUAL: 'Anual',
  SIX_MONTH: 'Semestral',
  THREE_MONTH: 'Trimestral',
  WEEKLY: 'Semanal',
  LIFETIME: 'Pago único',
}

export function PaywallScreen({
  open,
  onClose,
  reason,
}: {
  open: boolean
  onClose: () => void
  reason?: string
}) {
  const entitlements = useEntitlements()
  const { storeAvailable, offerings, loadingOfferings, purchase, restore, busy, error } =
    useMonetization()

  const packages: PurchasesPackage[] =
    offerings?.current?.availablePackages ?? []

  const alreadyPremium = entitlements.plan === 'premium'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Futbolismo Premium"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {alreadyPremium ? 'Cerrar' : 'Ahora no'}
          </Button>
          {storeAvailable && !alreadyPremium && (
            <Button variant="ghost" onClick={() => void restore()} disabled={busy}>
              Restaurar compras
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {reason && (
          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {reason}
          </p>
        )}

        <ul className="space-y-2 text-sm text-slate-200">
          {PERKS.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-400">✓</span>
              {p}
            </li>
          ))}
        </ul>

        {alreadyPremium ? (
          <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            Ya tienes Premium activo. ¡Gracias!
          </p>
        ) : !storeAvailable ? (
          <p className="text-xs text-slate-500">
            La suscripción se compra desde la app de Android (Google Play). En la
            versión web esta pantalla es informativa.
          </p>
        ) : loadingOfferings ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : packages.length === 0 ? (
          <p className="text-xs text-slate-500">
            No hay planes disponibles ahora mismo. Inténtalo más tarde.
          </p>
        ) : (
          <div className="space-y-2">
            {packages.map((pkg) => (
              <button
                key={pkg.identifier}
                disabled={busy}
                onClick={() => void purchase(pkg)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 text-left transition-colors hover:border-sky-500 disabled:opacity-50"
              >
                <span className="text-sm font-medium text-slate-100">
                  {PACKAGE_LABEL[pkg.packageType] ?? pkg.product.title}
                </span>
                <span className="text-sm font-semibold text-sky-300">
                  {pkg.product.priceString}
                </span>
              </button>
            ))}
            {busy && (
              <div className="flex justify-center pt-1">
                <Spinner />
              </div>
            )}
          </div>
        )}

        {error ? <ErrorState error={error} /> : null}

        <p className="text-[11px] leading-relaxed text-slate-500">
          La suscripción se renueva automáticamente salvo que la canceles al menos
          24 h antes del fin del período, desde Google Play. Al continuar aceptas
          los{' '}
          <Link
            to="/terminos"
            onClick={onClose}
            className="text-sky-500 hover:text-sky-400"
          >
            términos
          </Link>{' '}
          y la{' '}
          <Link
            to="/privacidad"
            onClick={onClose}
            className="text-sky-500 hover:text-sky-400"
          >
            política de privacidad
          </Link>
          .
        </p>
      </div>
    </Modal>
  )
}
