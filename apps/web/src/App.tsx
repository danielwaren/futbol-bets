import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { queryClient } from '@futbolismo/core'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { MonetizationProvider } from '@/context/MonetizationContext'
import { PaywallProvider } from '@/context/PaywallContext'
import { BankrollProvider } from '@/context/BankrollContext'
import { BetFormProvider } from '@/context/BetFormContext'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { Layout } from '@/components/layout/Layout'
import { Spinner } from '@/components/ui/misc'
import { MatchesPage } from '@/pages/MatchesPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { StatsPage } from '@/pages/StatsPage'
import { AccountPage } from '@/pages/AccountPage'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'
import { TermsPage } from '@/pages/legal/TermsPage'
import { DeleteAccountInfoPage } from '@/pages/legal/DeleteAccountInfoPage'

function AuthedApp() {
  return (
    <MonetizationProvider>
      <PaywallProvider>
        <BankrollProvider>
          <BetFormProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<MatchesPage />} />
                <Route path="historial" element={<HistoryPage />} />
                <Route path="estadisticas" element={<StatsPage />} />
                <Route path="cuenta" element={<AccountPage />} />
                <Route path="*" element={<MatchesPage />} />
              </Route>
            </Routes>
          </BetFormProvider>
        </BankrollProvider>
      </PaywallProvider>
    </MonetizationProvider>
  )
}

function Gate() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }
  return session ? <AuthedApp /> : <LoginScreen />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Públicas: accesibles sin iniciar sesión (revisión de Google, enlaces de la ficha) */}
            <Route path="/privacidad" element={<PrivacyPage />} />
            <Route path="/terminos" element={<TermsPage />} />
            <Route path="/eliminar-cuenta" element={<DeleteAccountInfoPage />} />
            <Route path="/*" element={<Gate />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
