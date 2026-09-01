import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as Linking from 'expo-linking'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@futbolismo/core'
import {
  createSessionFromUrl,
  signInWithGoogle,
  signInWithEmail,
  signOut,
} from '@/lib/auth'

interface AuthContextValue {
  session: Session | null
  userId: string | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  /**
   * Vuelta del OAuth por navegador. Si la app siguió viva la resuelve
   * `openAuthSessionAsync`, pero si el sistema la mató mientras el usuario
   * estaba en Google, los tokens llegan como enlace profundo y hay que
   * canjearlos aquí.
   */
  const url = Linking.useURL()
  useEffect(() => {
    if (!url) return
    createSessionFromUrl(url).catch(() => {
      /* el enlace no traía tokens: no es un retorno de OAuth */
    })
  }, [url])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      userId: session?.user.id ?? null,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signOut: async () => {
        await signOut()
      },
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
