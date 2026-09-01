# Futbolismo — app móvil (Expo / React Native)

La UI móvil vive en `apps/mobile` (Expo SDK 54, React Native 0.81, expo-router).
SDK 54 es la versión que soporta el Expo Go publicado en la Play Store — si más
adelante Expo Go se actualiza, se puede subir de SDK con `npx expo install expo@latest --fix`.
El backend (Supabase `fantasy-bets`, edge functions, migraciones) **no cambia** y se
comparte con la web vía el paquete `packages/core` (`@futbolismo/core`).

## Monorepo

```
fantasy-bets/
  packages/core/    @futbolismo/core — lógica agnóstica (types, utils, services, hooks, supabase)
  apps/web/         @futbolismo/web  — SPA Vite (solo se mantiene por las URLs legales de Google Play)
  apps/mobile/      @futbolismo/mobile — app Expo
```

- `npm install` en la raíz instala los 3 workspaces.
- `react` / `react-dom` están fijados como `dependencies` **en el `package.json` raíz**
  para que haya una sola copia (Metro y expo-doctor fallan con copias duplicadas).
  `packages/core` solo declara `react` como `peerDependency`.

## Requisitos

- Node 20+, npm 10+.
- App **Expo Go** en un teléfono Android (Play Store), **client 54.x / SDK 54**. El
  teléfono y el PC deben estar en la misma red Wi-Fi (o usar `--tunnel`).
- El proyecto debe usar la misma SDK mayor que soporta tu Expo Go. Comprobar la SDK del
  Expo Go instalado: abrir la app → aparece en la pantalla inicial / en "Ajustes".

## Arrancar en Expo Go

```bash
cd apps/mobile
npx expo start
```

Escanea el QR con Expo Go. Comandos útiles en la terminal de Metro:

- `r` — recargar
- `j` — abrir el debugger
- `npx expo start --tunnel` — si el QR por LAN no conecta (redes con AP isolation)
- `npx expo start --clear` — limpiar la caché de Metro

Si en el primer arranque sale `Failed to start watch mode` (timeout del file-map de
Metro en Windows sin Watchman), vuelve a lanzar `npx expo start` — suele ser transitorio.
Para eliminarlo del todo: `choco install watchman` o `npx expo start --offline` con
`CI=1` (deshabilita hot-reload).

## Variables de entorno (`apps/mobile/.env`)

| Var | Valor | Nota |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://dngolugwcemkexbeagzu.supabase.co` | |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...` | clave publicable |
| `EXPO_PUBLIC_ODDS_PROVIDER` | `supabase` | `mock` = fixtures locales |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | *(vacío)* | vacío ⇒ en Expo Go solo login por email |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | *(vacío)* | vacío ⇒ paywall informativo |
| `EXPO_PUBLIC_ADMOB_BANNER_ID` | *(vacío)* | vacío ⇒ sin anuncios (usa el ID de test) |

Todo lo que empieza por `EXPO_PUBLIC_` se inyecta en el bundle; no pongas secretos.

## Login para probar

- **Email:** `tester@fantasybets.local` / `test123456` (el formulario aparece prellenado
  en modo dev; en release se revela tocando el logo 5 veces). **Borrar este usuario antes
  de publicar.**
- **Google:** funciona en Expo Go por el navegador. Requiere el proveedor Google activado
  en Supabase y `exp://**` en las URLs de redirección permitidas — pasos en
  `docs/SETUP.md` §2. En el dev build usa el selector de cuentas nativo.

## Qué funciona en Expo Go

| Función | Expo Go | Dev build (EAS) |
|---|---|---|
| Login email / Supabase | ✅ | ✅ |
| Login Google | ✅ por navegador (OAuth de Supabase) | ✅ nativo, selector de cuentas |
| Partidos reales (matches_cache) | ✅ | ✅ |
| Registrar / editar / resolver apuestas | ✅ | ✅ |
| Estadísticas (6 charts) | ✅ | ✅ |
| Eliminar cuenta | ✅ | ✅ |
| Compras premium (RevenueCat) | ❌ stub (paywall informativo) | ✅ |
| Anuncios (AdMob) | ❌ stub | ✅ |

## Verificación local sin teléfono

```bash
# bundle de producción completo (detecta errores de resolución / sintaxis)
cd apps/mobile
npx expo export --platform android --output-dir /tmp/export-check

# doctor
npx expo-doctor

# tests de lógica compartida
npm --workspace @futbolismo/core run test
```

## Fase 8 (diferida): build nativo con EAS

Para RevenueCat, AdMob y Google Sign-In nativo hace falta un **development build**:

```bash
npm i -g eas-cli
cd apps/mobile
eas build --profile development --platform android
```

Requiere: cuenta Expo, `eas.json`, config plugins de `react-native-purchases`,
`react-native-google-mobile-ads` y `@react-native-google-signin/google-signin`, y
sustituir los stubs de `src/lib/purchases.ts` / `src/lib/ads.ts` por las libs reales.
