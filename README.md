# Futbolismo

**Diario de banca y análisis de estrategias de apuestas deportivas con dinero
ficticio.** Simula una banca, registra posiciones sobre partidos reales de fútbol
(10 ligas) con cuotas reales en los mercados **1X2, Córners, Ambos anotan (BTTS) y
Goles (Over/Under)**, y evalúa con el tiempo si tu estrategia es rentable (P&L,
ROI, winrate por mercado y por liga).

> No involucra dinero real ni apuestas reales. Herramienta de registro y análisis
> personal, +18. Sin enlaces a casas de apuestas.

## Planes

| | Free (con anuncios) | Premium (sin anuncios) |
|---|---|---|
| Ligas | 3 (Chile, LaLiga, Premier) | 10 |
| Bancas | 1 global | 1 por liga (hasta 10) |

## Stack

- Vite + React 19 + TypeScript · Tailwind CSS v4
- React Router · TanStack Query · Recharts
- Supabase: Auth (Google), Postgres + RLS por usuario, Edge Function para el
  pipeline de cuotas
- Vitest

## Arquitectura (Hito 1)

- **Auth:** Google Sign-In vía Supabase. Toda la app va detrás del login.
- **Datos:** proyecto Supabase dedicado `fantasy-bets`. Cada usuario solo ve sus
  bancas y apuestas (RLS `auth.uid() = user_id`). Los límites de plan (nº de ligas
  y de bancas) se aplican con **triggers en la base**, no solo en el cliente.
- **Cuotas:** la API key de The Odds API vive **solo en el servidor**. La edge
  function `refresh-odds` consulta la API y llena la tabla compartida
  `matches_cache`; el cliente solo lee esa tabla. Así el coste de API es
  O(ligas), no O(usuarios).

Puesta en marcha completa (Supabase, Google OAuth, secret de la API, cron): ver
[docs/SETUP.md](docs/SETUP.md).

## Desarrollo local

```bash
npm install
cp .env.example .env.local
npm run dev            # http://localhost:5173
```

`.env.local`:

| Variable | Descripción |
| --- | --- |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | proyecto `fantasy-bets` (ya rellenos en `.env.example`) |
| `VITE_ODDS_PROVIDER` | `supabase` (lee `matches_cache`) · `mock` (fixtures locales sin pipeline) |

Usuario de prueba local (formulario "Dev login", solo en `npm run dev`):
`tester@fantasybets.local` / `test123456`.

## Lógica de banca y resolución

El `stake` se descuenta al **registrar** la apuesta (queda "comprometido").

| Resultado | Efecto sobre la banca |
| --- | --- |
| Pendiente | −stake |
| Ganada | +stake × cuota |
| Perdida | −stake |
| Anulada | 0 (reembolso) |

`current_amount` = inicial + Σ deltas de sus apuestas, recalculado por el **trigger
`bets_recalc` en la BD** (fuente de verdad; el cliente no calcula nada).

**Resolución automática:** la edge function `settle-bets` (cron cada 2 h, o botón
"Actualizar resultados") marca ganada/perdida/anulada las apuestas cuyo partido terminó,
usando el marcador real de The Odds API. 1X2, goles y BTTS se resuelven solos; córners
quedan para marcar a mano (no hay fuente de datos de córners).

## Scripts

```bash
npm run dev
npm run build      # tsc -b && vite build
npm run test       # vitest (utils/calc, config/plans)
npm run lint       # oxlint
```

## Estructura

```
src/
  config/plans.ts       límites free/premium
  context/              AuthContext, BankrollContext, BetFormContext, PaywallContext
  hooks/                useProfile, useEntitlements, useBankroll, useBets, useMatches
  services/odds/        leagues (10) + mockOddsApi (dev)
  services/             bankroll.ts, bets.ts, matchCache.ts (Supabase)
  components/           auth, layout, bankroll, matches, bets, charts, ads, premium, ui
  pages/                MatchesPage, HistoryPage, StatsPage
supabase/
  migrations/           0001_init … 0003_harden (+ 0004 template para el cron)
  functions/refresh-odds/   pipeline de cuotas server-side
```

## Android (Capacitor)

Shell nativo en `android/` (`appId app.futbolismo`). Login Google nativo
(`@capgo/capacitor-social-login` → `signInWithIdToken`), safe-areas, botón atrás,
status bar y splash. Íconos: `npm run icons`. Build del APK: ver
[docs/ANDROID.md](docs/ANDROID.md).

```bash
npm run cap:sync        # build web + sync a android/
npm run android:open    # abre Android Studio
```

## Monetización (solo APK)

Suscripción **Premium** vía RevenueCat + Google Play Billing; anuncios **AdMob** en el
plan free. El entitlement se sincroniza a `profiles.plan` por webhook (fuente de verdad)
y por la función `sync-entitlement` (feedback inmediato tras la compra). El cliente no
puede modificar su plan (trigger en la BD). Setup: [docs/MONETIZATION.md](docs/MONETIZATION.md).

## Publicación (Hito 4)

Rutas públicas (sin login) `/privacidad`, `/terminos`, `/eliminar-cuenta`; pantalla de
Cuenta con borrado de cuenta (edge function `delete-account`), gestión de suscripción y
enlaces legales; `public/app-ads.txt`; firma de release en `android/` (`keystore.properties`);
gráficos de ficha (`play-store-icon.png`, `store-feature-graphic.png` vía `npm run icons`).
Checklist completo de Play Console (Data safety, clasificación, credenciales de revisión):
[docs/PLAY-STORE.md](docs/PLAY-STORE.md).

> Acceso de revisión para Google: en el login, tocar el logo 5 veces revela el acceso por
> email. Usuarios normales solo ven "Continuar con Google".

## Roadmap

- **Hito 2 (hecho):** shell Android con Capacitor + login Google nativo.
- **Hito 3 (hecho):** RevenueCat (suscripción premium) + AdMob (free).
- **Hito 4 (hecho):** páginas legales, borrado de cuenta, firma de release, ficha y
  checklist de Play Console.
