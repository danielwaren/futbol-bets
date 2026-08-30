# Android (Capacitor) — Hito 2

La app web se empaqueta con **Capacitor** en un APK/AAB. `appId = app.futbolismo`,
nombre visible **Futbolismo**.

```
android/                       proyecto nativo (se commitea; los builds están en .gitignore)
capacitor.config.ts            config de Capacitor
scripts/gen-android-icons.mjs  genera íconos + splash desde SVG  (npm run icons)
src/lib/platform.ts            detección web vs nativo
src/lib/nativeAuth.ts          login Google nativo -> supabase.auth.signInWithIdToken
src/native/setup.ts            status bar, splash, botón atrás de Android
```

## Requisitos (en tu máquina, no en esta)

- **JDK 17**
- **Android Studio** (incluye el SDK). Abre Studio una vez para que instale el SDK y acepte licencias.

## 1. Google OAuth para Android

Usa **el mismo proyecto de Google Cloud** que configuraste para el login web en el Hito 1.

1. **Web client** (ya lo tienes): su Client ID va en dos sitios —
   - `.env.local` → `VITE_GOOGLE_WEB_CLIENT_ID=xxxxx.apps.googleusercontent.com`
   - Supabase → Authentication → Providers → Google (ya está ahí).
2. **Android client** (nuevo): Google Cloud Console → Credentials → *Create OAuth client ID* → **Android**.
   - Package name: `app.futbolismo`
   - SHA-1 de firma:
     - Debug: `cd android && ./gradlew signingReport` (busca `Variant: debug` → `SHA1`).
     - Release: el SHA-1 de tu *upload keystore* (ver §4) **y** el que te da Google Play
       en *Play Console → Setup → App signing* una vez subas el primer AAB.
   - No hace falta pegar este Client ID en ningún lado: el plugin pide el token con el
     **web** client ID; el Android client solo autoriza el paquete + firma.

## 2. Variables

`.env.local`:

```
VITE_GOOGLE_WEB_CLIENT_ID=<web client id>
```

(El resto —Supabase URL/anon key, `VITE_ODDS_PROVIDER`— es el mismo que en web.)

## 3. Compilar y probar

```bash
npm run cap:sync         # build web + copia a android/ + sincroniza plugins
npm run android:open     # abre Android Studio en la carpeta android/
```

En Android Studio: *Run* en un emulador/dispositivo, o *Build → Build App Bundle(s) / APK(s)*.

Por CLI (con el SDK en PATH):

```bash
cd android && ./gradlew assembleDebug
# APK -> android/app/build/outputs/apk/debug/app-debug.apk
```

**Live reload en dispositivo** (misma red WiFi):

```bash
# 1) arranca Vite escuchando en la red:  npm run dev -- --host
# 2) apunta la app al dev server:
CAP_SERVER_URL=http://192.168.1.X:5173 npm run android:run
```

## 4. Release para Play Store

1. Crea el *upload keystore* (una sola vez):
   ```bash
   keytool -genkey -v -keystore futbolismo-upload.jks -alias upload \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
   Guárdalo fuera del repo. Añade su SHA-1 al Android OAuth client (§1).
2. En `android/app/build.gradle` añade un `signingConfigs.release` que lea las credenciales
   de `~/.gradle/gradle.properties` (o usa *Build → Generate Signed Bundle/APK* en Studio).
3. Genera el **AAB** (`bundleRelease`) y súbelo a la pista de **pruebas internas** de Play Console.
4. Activa **Play App Signing**; copia el SHA-1 que te da Google y añádelo también al Android OAuth client.

## 5. Checklist Play Console (Hito 4, resumen)

- Ficha: describir como *diario de banca / registro de estrategias con dinero ficticio*.
  **No** mencionar dinero real ni enlazar casas de apuestas.
- Content rating: **+18** (referencia a apuestas, aunque sea simulado).
- Data safety: se recogen email y datos de uso; cuenta borrable (implementar borrado de cuenta).
- Política de privacidad: publicar una página (en el deploy web) y enlazarla.
- `play-store-icon.png` (512×512, en la raíz) para la ficha.

## Notas

- El login web sigue usando el redirect OAuth normal; solo el APK usa el flujo de token
  nativo (`src/lib/nativeAuth.ts`, patrón de nonce de Capgo/Supabase).
- `npm run icons` regenera todos los íconos/splash si cambias el SVG de la marca en
  `scripts/gen-android-icons.mjs`. Luego `npm run cap:sync`.
- Vuln de `npm audit` en `uuid`/`xcode`: es una dependencia **solo de dev** de
  `@capacitor/cli` para proyectos iOS; no se compila en el APK.
