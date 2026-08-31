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

## 2. Google Sign-In

1. **Google Cloud Console** → crea un OAuth 2.0 Client ID (tipo *Web application*).
   - Authorized redirect URI: `https://dngolugwcemkexbeagzu.supabase.co/auth/v1/callback`
   - (Para el APK en Hito 2 se añade un client *Android* aparte.)
2. **Supabase Dashboard** → Authentication → Providers → **Google**: pega Client ID y Client Secret, guarda.
3. Authentication → URL Configuration → Site URL: `http://localhost:5173` (dev) y la URL de producción cuando exista; añade ambas a *Redirect URLs*.
4. (Recomendado) Authentication → Policies → activa **Leaked password protection**.

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
