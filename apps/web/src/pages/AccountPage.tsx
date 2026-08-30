import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorState } from '@/components/ui/misc'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useMonetization } from '@/context/MonetizationContext'
import { supabase } from '@futbolismo/core'
import { openExternal } from '@/lib/external'
import { PLAY_SUBSCRIPTIONS_URL, SITE } from '@futbolismo/core'
import { formatDateTime } from '@futbolismo/core'

export function AccountPage() {
  const { signOut } = useAuth()
  const { data: profile } = useProfile()
  const entitlements = useEntitlements()
  const { storeAvailable, restore, busy } = useMonetization()

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<unknown>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const { error: fnErr } = await supabase.functions.invoke('delete-account', {
        body: {},
      })
      if (fnErr) throw fnErr
      await signOut()
    } catch (e) {
      setError(e)
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-white">Cuenta</h1>
        <p className="text-xs text-slate-500">Perfil, suscripción y datos</p>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center gap-3">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              className="h-11 w-11 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-sm">
              {(profile?.displayName ?? '?').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-100">
              {profile?.displayName ?? 'Cuenta'}
            </p>
            <p className="truncate text-xs text-slate-500">{profile?.email}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-100">
              Plan {entitlements.plan === 'premium' ? 'Premium' : 'Free'}
            </p>
            {entitlements.plan === 'premium' && profile?.planExpiresAt && (
              <p className="text-xs text-slate-500">
                Renueva/expira el {formatDateTime(profile.planExpiresAt)}
              </p>
            )}
          </div>
        </div>

        {storeAvailable ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void openExternal(PLAY_SUBSCRIPTIONS_URL)}
            >
              Gestionar suscripción
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="border border-slate-700"
              disabled={busy}
              onClick={() => void restore()}
            >
              Restaurar compras
            </Button>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            La suscripción se gestiona desde la app de Android (Google Play).
          </p>
        )}
      </section>

      <section className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
        <Link to="/privacidad" className="block text-slate-300 hover:text-white">
          Política de privacidad
        </Link>
        <Link to="/terminos" className="block text-slate-300 hover:text-white">
          Términos de uso
        </Link>
        <a
          href={`mailto:${SITE.supportEmail}`}
          className="block text-slate-300 hover:text-white"
        >
          Contacto y soporte
        </a>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <Button
          variant="ghost"
          className="w-full border border-slate-700"
          onClick={() => void signOut()}
        >
          Cerrar sesión
        </Button>
        <Button
          variant="ghost"
          className="w-full border border-rose-900/60 text-rose-300"
          onClick={() => setConfirmDelete(true)}
        >
          Eliminar cuenta
        </Button>
        {error ? <ErrorState error={error} /> : null}
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar cuenta"
        danger
        confirmLabel="Eliminar definitivamente"
        loading={deleting}
        message={
          <>
            Se borrarán tu perfil, todas tus bancas y apuestas. Esta acción es
            <strong> permanente</strong>. Si tienes una suscripción activa,
            cancélala aparte en Google Play para que no se renueve.
          </>
        }
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
