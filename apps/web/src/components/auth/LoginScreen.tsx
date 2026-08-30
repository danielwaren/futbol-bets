import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Field'
import { ErrorState } from '@/components/ui/misc'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@futbolismo/core'
import { SITE } from '@futbolismo/core'

export function LoginScreen() {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  // Login por email/password: visible en `npm run dev` o tras tocar el logo 5 veces
  // (para la revisión de Google Play sin exponerlo a usuarios normales).
  const [taps, setTaps] = useState(0)
  const showEmailLogin = import.meta.env.DEV || taps >= 5

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (e) {
      setError(e)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <button
            onClick={() => setTaps((t) => t + 1)}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15 text-2xl"
            aria-label={SITE.appName}
          >
            📊
          </button>
          <h1 className="text-xl font-bold text-white">{SITE.appName}</h1>
          <p className="mt-1 text-sm text-slate-400">
            Diario de banca y análisis de estrategias de apuestas deportivas con
            dinero ficticio.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <Button
            onClick={handleGoogle}
            loading={loading}
            className="w-full"
            variant="secondary"
          >
            <GoogleGlyph />
            Continuar con Google
          </Button>
          {error ? <ErrorState error={error} /> : null}
          <p className="text-[11px] leading-relaxed text-slate-500">
            Solo para mayores de {SITE.minAge} años. No involucra dinero real ni
            apuestas reales: es una herramienta de registro y análisis personal.
          </p>
          <p className="text-[11px] text-slate-600">
            Al continuar aceptas los{' '}
            <Link to="/terminos" className="text-sky-500 hover:text-sky-400">
              términos
            </Link>{' '}
            y la{' '}
            <Link to="/privacidad" className="text-sky-500 hover:text-sky-400">
              política de privacidad
            </Link>
            .
          </p>
        </div>

        {showEmailLogin && <EmailLogin />}
      </div>
    </div>
  )
}

function EmailLogin() {
  const [email, setEmail] = useState(
    import.meta.env.DEV ? 'tester@fantasybets.local' : '',
  )
  const [password, setPassword] = useState(
    import.meta.env.DEV ? 'test123456' : '',
  )
  const [err, setErr] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-left">
      <p className="text-[10px] uppercase tracking-wide text-slate-600">
        Acceso por email
      </p>
      <TextInput
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextInput
        type="password"
        placeholder="contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        size="sm"
        variant="ghost"
        className="w-full border border-slate-700"
        loading={loading}
        onClick={async () => {
          setLoading(true)
          setErr(null)
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          if (error) {
            setErr(error)
            setLoading(false)
          }
        }}
      >
        Entrar
      </Button>
      {err ? <ErrorState error={err} /> : null}
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.44-1.7 4.22-5.5 4.22a6.32 6.32 0 0 1 0-12.64c1.98 0 3.3.84 4.06 1.57l2.77-2.67C17.05 2.15 14.76 1.2 12 1.2A10.8 10.8 0 1 0 12 22.8c6.24 0 10.36-4.38 10.36-10.55 0-.71-.08-1.25-.18-1.79z"
      />
    </svg>
  )
}
