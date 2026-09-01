# Setup — Fantasy Bets (Hito 1: multiusuario + pipeline server-side)

## 1. Proyecto Supabase

Proyecto dedicado ya creado: **`fantasy-bets`** (ref `dngolugwcemkexbeagzu`, región `sa-east-1`).

Migraciones aplicadas (también versionadas en `supabase/migrations/`):

| Archivo | Qué hace |
|---|---|
| `0001_init.sql` | tablas `profiles`, `bankrolls`, `bets`, `matches_cache`, `odds_refresh_log`; triggers de plan; RLS |
| `0002_cron_and_downgrade.sql` | `pg_cron`/`pg_net`; job diario que baja premium→free al expirar |
| `0003_harden_functions.sql` | fija `search_path`, revoca EXECUTE de funciones internas |
| `0004_schedule_refresh_odds.sql.template` | **plantilla** — cron de refresh de cuotas + settle (ver §4) |
| `0005_revenuecat_sync.sql` | tabla `subscription_events`; el cliente no puede tocar `plan` |
| `0006_auto_settle.sql` | recálculo de banca en la BD (trigger `bets_recalc`) + resolución automática (`settled_by`, `result_detail`, `settle_runs`) |
| `0007_free_league_choice.sql` | `profiles.free_leagues text[]` (el plan free elige 3 de 10 ligas); trigger de validación; `free_leagues(uid)`; `enforce_bet_plan` respeta la elección del usuario |
| `0008_standings.sql` | `standings_cache` + `standings_refresh_log` (tablas de posiciones cacheadas) |
| `0009_lock_free_leagues.sql` | en plan free las 3 ligas se eligen una vez; cambiarlas es función premium |

## 3-bis. Secret de API-Football (tablas de posiciones)

Las posiciones vienen de [API-Football](https://dashboard.api-football.com) (plan gratis:
100 requests/día; cubre las 10 ligas, **incluidas Chile y Argentina**). El pipeline consume
~20 req/día.

1. Crea una cuenta gratis en `dashboard.api-football.com` y copia tu API key.
2. Dashboard de Supabase → Project Settings → Edge Functions → Secrets:
   `API_FOOTBALL_KEY = <tu key>`
3. En la app, pestaña **Tabla** → botón **Actualizar** llena la caché de esa liga.

Sin la key la pantalla muestra un estado vacío; no rompe nada más.

## 2. Google Sign-In

La app tiene **dos caminos** y ambos usan el mismo proveedor de Supabase:

| Dónde | Camino | Necesita |
|---|---|---|
| **Expo Go** | OAuth de Supabase en el navegador | solo los pasos 1-3 |
| **Dev build / release** | SDK nativo de Google (selector de cuentas) | además el paso 4 |

El camino del navegador **no lleva ninguna credencial en el cliente**: el Client ID y
el Secret viven solo en el dashboard de Supabase.

### 1. Google Cloud Console

1. Crea (o reusa) un proyecto en [console.cloud.google.com](https://console.cloud.google.com).
2. **Pantalla de consentimiento de OAuth**: tipo *Externo*, nombre de la app, correo de
   soporte y enlace a la política de privacidad. Mientras esté en modo prueba, añádete
   como *usuario de prueba*.
3. **Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web**.
   - URI de redirección autorizada:
     `https://dngolugwcemkexbeagzu.supabase.co/auth/v1/callback`
   - Guarda el **Client ID** y el **Client secret**.

### 2. Supabase → proveedor Google

Dashboard → Authentication → Providers → **Google**: activa, pega el Client ID y el
Client secret de la *aplicación web*, guarda.

### 3. Supabase → URLs de redirección

Authentication → URL Configuration → **Redirect URLs**, añade:

```
futbolismo://**
exp://**
```

- `futbolismo://**` — dev build y release.
- `exp://**` — Expo Go. Metro imprime la URL exacta al arrancar
  (`exp://192.168.x.x:8081`); si el comodín no te lo acepta, pega esa URL con `/--/**`
  al final. **Ojo: cambia si cambias de red Wi-Fi.**

Sin este paso el navegador vuelve a la app pero sin tokens, y verás el error
"Google no devolvió una sesión".

### 4. Cliente Android — MÁS ADELANTE, no ahora

> **Con los pasos 1-3 el login por Google ya funciona en Expo Go.** Este paso es
> solo para el selector de cuentas *nativo* del dev build.
>
> **No lo intentes todavía:** la huella SHA-1 que pide Google **no existe** hasta que
> EAS genera el keystore en tu primer build. No hay dónde consultarla antes.

Cuando ya quieras el dev build, en este orden:

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest init      # crea extra.eas.projectId en app.json — commitéalo
npx eas-cli@latest build --profile development --platform android
```

Durante ese primer build EAS pregunta por las credenciales de firma: deja que **las
genere él**. Recién entonces:

```bash
npx eas-cli@latest credentials
```

Menú interactivo → **Android** → perfil **development** → muestra el keystore y su
`SHA-1 Fingerprint` (20 pares hexadecimales, `AB:CD:...`).

Con esa huella ya en mano:

1. Google Cloud → Credenciales → **ID de cliente de OAuth → Android**.
   - Nombre del paquete: `app.futbolismo`
   - Huella SHA-1: la del paso anterior
2. En el proveedor Google de Supabase, añade ese **Client ID de Android** al campo
   *Authorized Client IDs* (separado por comas), para que acepte el `idToken` nativo.
3. Pon el **Client ID de la aplicación web** como `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
   en el perfil `base` de `apps/mobile/eas.json` y vuelve a compilar.

### 5. Recomendado

Authentication → Policies → activa **Leaked password protection**.

### Sobre "Iniciar sesión con Apple"

Requiere el **Apple Developer Program: 99 USD al año**; no hay nivel gratuito que
permita configurarlo. Y solo es obligatorio si publicas en la App Store de iOS
ofreciendo otros logins sociales. Para una app solo de Google Play **no hace falta**.

## 3. Secret de The Odds API

La key ya **no** vive en el cliente. Configúrala como secret del proyecto:

```bash
supabase secrets set THE_ODDS_API_KEY=tu_key --project-ref dngolugwcemkexbeagzu
supabase secrets set ODDS_REGION=eu --project-ref dngolugwcemkexbeagzu
supabase secrets set REFRESH_CRON_SECRET=$(openssl rand -hex 24) --project-ref dngolugwcemkexbeagzu
```

o en Dashboard → Project Settings → Edge Functions → *Secrets*.
`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase automáticamente.

## 4. Edge function `refresh-odds` + cron

La función ya está desplegada (`supabase/functions/refresh-odds/`). Redeploy:

```bash
supabase functions deploy refresh-odds --project-ref dngolugwcemkexbeagzu
```

Prueba manual (necesita un JWT de usuario o el service key):

```bash
curl -X POST 'https://dngolugwcemkexbeagzu.supabase.co/functions/v1/refresh-odds' \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H 'Content-Type: application/json' \
  -d '{"cron":true,"deep":true,"secret":"<REFRESH_CRON_SECRET>","leagues":["premier"]}'
```

Luego revisa `select * from odds_refresh_log order by ran_at desc;` y `select count(*) from matches_cache;`.

**Cron:** copia `0004_schedule_refresh_odds.sql.template`, reemplaza los `<placeholders>` y
ejecútalo en el SQL editor. Programa `refresh-odds` (cuotas) y `settle-bets` (resultados).

Coste estimado (10 ligas): ~2 créditos/liga en el refresh ligero (cada 3 h) + ~2/evento en
el profundo (2×/día, tope 20 eventos/liga) + ~2/liga en `settle-bets` (solo si hay apuestas
pendientes con partido pasado) ≈ **12–18k créditos/mes** → plan *Starter* de The Odds API
($24.99, 20k).

### Resolución automática de apuestas

`settle-bets` marca ganada/perdida/anulada las apuestas pendientes cuyo partido ya terminó,
usando el marcador real (`/scores` de The Odds API, hasta 3 días atrás). La banca se
recalcula sola (trigger `bets_recalc`). **Córners no se resuelven automáticamente** (The
Odds API no da conteo de córners) — quedan para marcar a mano. El usuario también puede
forzarlo con el botón "Actualizar resultados" en Historial.

```bash
curl -X POST 'https://dngolugwcemkexbeagzu.supabase.co/functions/v1/settle-bets' \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" -H 'Content-Type: application/json' \
  -d '{"cron":true,"secret":"<REFRESH_CRON_SECRET>"}'
# revisa: select * from settle_runs order by ran_at desc;
```

## 5. Frontend

```bash
cp .env.example .env.local     # ya trae la URL y anon key del proyecto
npm install
npm run dev
```

Variables (`.env.local`):

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — proyecto `fantasy-bets`.
- `VITE_ODDS_PROVIDER`:
  - `supabase` → lee `matches_cache` (usa esto en cuanto el cron esté corriendo).
  - `mock` → fixtures locales para desarrollar sin pipeline.

### Usuario de prueba local

Hay un usuario email/password sembrado para pruebas: `tester@fantasybets.local` / `test123456`.
La pantalla de login muestra un formulario "Dev login" **solo en `npm run dev`**.

> **Antes de producción**, elimínalo:
> `delete from auth.users where email = 'tester@fantasybets.local';`

Para probar premium en local: `update profiles set plan='premium', plan_expires_at=now()+interval '30 days' where id = (select id from auth.users where email='tester@fantasybets.local');`

## 6. Qué falta para la store (Hitos 2-4)

- **Hito 2:** Capacitor Android, ícono/splash, login Google nativo (`@capgo/capacitor-social-login`).
- **Hito 3:** RevenueCat (`@revenuecat/purchases-capacitor`) + webhook → `profiles.plan`; AdMob (`@capacitor-community/admob`) con categoría *gambling* bloqueada.
- **Hito 4:** Play Console, política de privacidad, Data Safety, rating +18, borrado de cuenta, pistas de prueba.
