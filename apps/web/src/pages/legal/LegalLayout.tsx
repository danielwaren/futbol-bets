import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '@futbolismo/core'

export function LegalLayout({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Link
          to="/"
          className="text-xs font-medium text-sky-400 hover:text-sky-300"
        >
          ← {SITE.appName}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-xs text-slate-500">
          Última actualización: {SITE.legalUpdatedAt}
        </p>
        <div className="legal mt-6 space-y-4 text-sm leading-relaxed text-slate-300">
          {children}
        </div>
        <footer className="mt-10 border-t border-slate-800 pt-4 text-xs text-slate-500">
          {SITE.publisher} ·{' '}
          <a
            href={`mailto:${SITE.supportEmail}`}
            className="text-sky-400 hover:text-sky-300"
          >
            {SITE.supportEmail}
          </a>
          <div className="mt-2 flex gap-3">
            <Link to="/privacidad" className="hover:text-slate-300">
              Privacidad
            </Link>
            <Link to="/terminos" className="hover:text-slate-300">
              Términos
            </Link>
            <Link to="/eliminar-cuenta" className="hover:text-slate-300">
              Eliminar cuenta
            </Link>
          </div>
        </footer>
      </div>
    </div>
  )
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="pt-3 text-base font-semibold text-white">{children}</h2>
  )
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1 pl-5">{children}</ul>
}
