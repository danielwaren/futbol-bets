# Dev build nativo (EAS) — Fase 8

Expo Go alcanza para el flujo base (email + `expo-auth-session`). Para **Google
Sign-In nativo**, **RevenueCat** y **AdMob** hace falta un *development build*: un APK
propio con los módulos nativos, que se recarga por QR igual que Expo Go.

Estado actual del repo:
- `eas.json` con perfiles `development` / `preview` / `production` — listo.
- `@react-native-google-signin/google-signin` + su config plugin en `app.json` — listo.
- `src/lib/auth.ts` usa el SDK nativo cuando **no** es Expo Go y hay `GOOGLE_WEB_CLIENT_ID`;
  si no, cae al flujo de navegador (`expo-auth-session`).
- RevenueCat / AdMob siguen *stubbeados* (`src/lib/purchases.ts`, `src/lib/ads.ts`) —
  se cablean en un paso posterior, cuando exista la cuenta de Play Console.

---

## 1. Requisitos

- Cuenta en [expo.dev](https://expo.dev) (gratis).
- `eas-cli`: no hace falta instalarlo, se usa con `npx eas-cli@latest`.
- Un teléfono Android para instalar el APK.

## 2. Vincular el proyecto a EAS

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest init          # crea el proyecto en tu cuenta y escribe extra.eas.projectId en app.json
```

`eas init` añade `expo.extra.eas.projectId` a `app.json`. Commitéalo.

## 3. Primer development build (Android)

```bash
npx eas-cli@latest build --profile development --platform android
```

- La primera vez EAS pregunta por las **credenciales de firma**: deja que las
  **genere él** (keystore gestionado). Guárdalo — la huella SHA-1 de ese keystore
  es la que necesita el OAuth client de Android.
- El build corre en la nube (~10-20 min). Al terminar te da un QR / enlace para
  instalar el APK en el teléfono.

Luego, para desarrollar contra ese APK:

```bash
npx expo start --dev-client
```

Escaneas el QR con el APK (no con Expo Go). Recarga en caliente igual que antes.

## 4. Google Sign-In nativo

### 4.1 Google Cloud Console

1. Crea (o reusa) un proyecto en [console.cloud.google.com](https://console.cloud.google.com).
2. **APIs y servicios → Pantalla de consentimiento de OAuth**: tipo *Externo*, rellena
   nombre de la app, correo de soporte, dominio (cuando exista) y el enlace a la
   política de privacidad. Añádete como *usuario de prueba* mientras esté en modo test.
3. **Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - **Aplicación web** → guarda el *Client ID* y *Client secret*.
     Redirect URI autorizada: `https://dngolugwcemkexbeagzu.supabase.co/auth/v1/callback`
   - **Android** → *Package name* `app.futbolismo` + la **huella SHA-1** del keystore
     de EAS. La obtienes con:
     ```bash
     npx eas-cli@latest credentials    # Android → selecciona el perfil → muestra SHA-1 / SHA-256
     ```
     (El client de Android no tiene "secret"; sólo valida el origen.)

### 4.2 Supabase

**Dashboard → Authentication → Providers → Google**: pega el *Client ID* y *Client
secret* de la **aplicación web** (no el de Android). En *Authorized Client IDs* añade
también el **Client ID de Android** (separado por comas) para que acepte el `idToken`
que emite el SDK nativo.

### 4.3 Rellenar `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

Es el **Client ID de la aplicación web** (termina en `.apps.googleusercontent.com`).
Añádelo al perfil `base` de `eas.json` (lo heredan `development` / `preview` / `production`):

```json
"base": {
  "node": "20.18.0",
  "env": {
    "EXPO_PUBLIC_SUPABASE_URL": "…",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY": "…",
    "EXPO_PUBLIC_ODDS_PROVIDER": "supabase",
    "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "1234-abcd.apps.googleusercontent.com"
  }
}
```

(EAS no admite valores vacíos: la clave no existe hasta que tienes el ID real.)

O, si prefieres no tenerlo en el repo, con variables de entorno de EAS:

```bash
npx eas-cli@latest env:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "…" --environment development --visibility plaintext
```

Para probar en local (`npx expo start --dev-client`) también en `apps/mobile/.env`.

Vuelve a hacer `eas build --profile development` para que el APK recoja el nuevo valor
(el config plugin de google-signin sólo se aplica en build, no en recarga).

## 5. Verificación

- Login con Google en el APK → abre el selector nativo de cuentas (no un navegador).
- En Expo Go el mismo botón sigue funcionando por navegador (fallback).
- Email/contraseña funciona en ambos.

## 6. Después (necesita Google Play Console, $25)

RevenueCat y AdMob requieren la app publicada al menos en *pruebas internas* con
productos de suscripción creados. Cuando llegues ahí:

1. `npx expo install react-native-purchases react-native-google-mobile-ads`
2. Config plugin de `react-native-google-mobile-ads` en `app.json` con el *App ID* de AdMob.
3. Sustituir los stubs de `src/lib/purchases.ts` y `src/lib/ads.ts` por las libs reales
   (mismo patrón que la web en `apps/web/src/lib/`).
4. RevenueCat: proyecto, app Android, entitlement `premium`, conectar Play Console,
   *public SDK key* (`goog_…`) → `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
5. Secrets del proyecto Supabase: `REVENUECAT_SECRET_KEY`, `REVENUECAT_WEBHOOK_SECRET`.
6. AdMob: cuenta, app, *ad units*, **bloquear la categoría de apuestas/gambling**.

Ver `docs/MONETIZATION.md` para el detalle del backend (edge functions ya desplegadas).
