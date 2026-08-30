# Publicación en Google Play — Hito 4

Checklist para subir **Futbolismo** a Google Play. Requiere una cuenta de Google Play
Console (pago único de US$25) y completar la verificación de identidad del desarrollador.

## Antes de empezar — rellenar placeholders

| Placeholder | Dónde | Valor |
|---|---|---|
| `[NOMBRE DEL EDITOR]` | `src/config/site.ts` → `SITE.publisher` | tu nombre / razón social |
| `SITE.url` | `src/config/site.ts` | dominio real donde despliegas la web |
| App ID de AdMob | `android/app/src/main/AndroidManifest.xml` | `ca-app-pub-…~…` |
| `pub-0000…` | `public/app-ads.txt` | tu Publisher ID de AdMob |
| Ad unit IDs, RevenueCat key | `.env.local` | ver `docs/MONETIZATION.md` |

Tras cambiarlos: `npm run cap:sync`.

## 1. Desplegar la web (para las URLs públicas)

La política de privacidad, los términos y `/eliminar-cuenta` son **rutas de la SPA**
accesibles sin login, más `public/app-ads.txt` y `public/robots.txt`.

- Deploy en Vercel/Netlify: framework Vite, build `npm run build`, output `dist`.
- Añade las variables `VITE_*` en el panel del hosting.
- Verifica que cargan:
  - `https://<dominio>/privacidad`
  - `https://<dominio>/terminos`
  - `https://<dominio>/eliminar-cuenta`
  - `https://<dominio>/app-ads.txt`

## 2. Build de release (AAB)

1. Crea el keystore de subida (una vez) y `android/keystore.properties` (ver
   `keystore.properties.example` y `docs/ANDROID.md §4`).
2. `npm run cap:sync`
3. En Android Studio: *Build → Generate Signed Bundle / APK → Android App Bundle*,
   o `cd android && ./gradlew bundleRelease` → `android/app/build/outputs/bundle/release/app-release.aab`.
4. `versionCode` y `versionName` están en `android/app/build.gradle` (empieza en 1 / "1.0.0").
   Súbelos en cada release.

## 3. Crear la app en Play Console

- **Nombre:** Futbolismo
- **Idioma predeterminado:** Español (es-419 o es-ES)
- **App o juego:** App · **Gratis** (con compras dentro de la app)
- **Categoría:** Deportes

## 4. Ficha de Play Store (español)

**Descripción corta (≤80):**
> Registra tus apuestas con dinero ficticio y analiza si tu estrategia es rentable.

**Descripción completa (borrador):**
> Futbolismo es un diario de banca para practicar y analizar estrategias de apuestas
> deportivas **con dinero ficticio**. No es una casa de apuestas: no se apuesta dinero
> real, no se procesan pagos de apuestas y no hay enlaces a operadores de juego.
>
> • Simula una banca y registra posiciones sobre partidos reales (1X2, córners, ambos
>   anotan, goles) con cuotas reales.
> • Historial completo con filtros y resolución de apuestas.
> • Estadísticas: evolución de la banca, P&L, ROI y winrate por mercado y por liga.
> • Plan gratuito: 3 ligas y una banca. Premium: 10 ligas, una banca por liga y sin
>   anuncios.
>
> Solo para mayores de 18 años. Herramienta de registro y análisis personal; no
> constituye asesoramiento financiero ni de apuestas.

**Gráficos:**
| Recurso | Archivo |
|---|---|
| Ícono 512×512 | `play-store-icon.png` |
| Gráfico de funciones 1024×500 | `store-feature-graphic.png` |
| Capturas de teléfono (2–8, 16:9 o 9:16) | capturar en un dispositivo/emulador |

**Datos de contacto:** email `danigayoso41@gmail.com` · sitio web `SITE.url` ·
política de privacidad `SITE.url/privacidad`.

## 5. Contenido de la app (Play Console → "Contenido de la aplicación")

### Acceso a la app
"Todas o algunas funciones están restringidas". Añade credenciales de revisión:
- Instrucciones: *"En la pantalla de inicio de sesión, toca el logo (📊) 5 veces para
  mostrar el acceso por email."*
- Usuario: `tester@fantasybets.local` · Contraseña: `test123456`
  (créalo/verifícalo en Supabase antes; ver nota al final).

### Política de privacidad
`SITE.url/privacidad`

### Anuncios
**Sí, contiene anuncios** (solo plan gratuito, AdMob).

### Seguridad de los datos (Data safety)
| Dato | Se recoge | Se comparte | Propósito | Opcional |
|---|---|---|---|---|
| Dirección de correo | Sí | No | Funcionalidad de la app, gestión de cuenta | No |
| Nombre | Sí | No | Funcionalidad de la app | No |
| Fotos (avatar de Google) | Sí | No | Funcionalidad de la app | Sí |
| Actividad en la app (apuestas, bancas) | Sí | No | Funcionalidad de la app | No |
| ID de dispositivo o de otro tipo | Sí | Sí (Google, publicidad) | Publicidad, análisis | No (plan free) |
| Info de compras dentro de la app | Sí | No | Funcionalidad de la app | No |
| Registros de fallos / diagnóstico | Sí | No | Análisis | No |

- Cifrado en tránsito: **Sí**.
- El usuario puede solicitar la eliminación de datos: **Sí** → `SITE.url/eliminar-cuenta`.
- Borrado de cuenta dentro de la app: **Sí** (Menú → Cuenta → Eliminar cuenta).

### Clasificación de contenido (cuestionario IARC)
- Categoría: *App de referencia / utilidad*.
- ¿Referencias a juegos de azar / apuestas? **Sí** (simuladas, sin dinero real).
- ¿Se puede apostar/ganar dinero real? **No**.
- Resultado esperado: apta para adultos. Ajusta el **público objetivo a 18+**.

### Público objetivo y contenido
- Grupos de edad: **solo 18 y más**.
- No dirigida a niños.

### Apps de gobierno / finanzas / salud / VPN, etc.: **No**.

## 6. Suscripciones (Monetización → Productos → Suscripciones)

Crea los productos (p. ej. `premium_monthly`, `premium_annual`), fija precios y base
plans, luego impórtalos en RevenueCat y engánchalos al entitlement `premium`
(ver `docs/MONETIZATION.md`). Añade la URL de términos con las condiciones de
renovación (ya están en `/terminos`).

## 7. Pistas de lanzamiento

1. **Pruebas internas**: sube el primer AAB, añádete como tester, instala, y verifica:
   login Google, crear banca, apuesta, resolver, estadísticas, paywall, borrar cuenta.
2. Copia el **SHA-1 de Play App Signing** (Setup → App signing) al OAuth client de
   Android en Google Cloud.
3. **Pruebas cerradas** (opcional) con más testers.
4. **Producción**: completa la revisión de contenido, envía. La primera revisión de una
   cuenta nueva puede tardar varios días; apps con temática de apuestas suelen recibir
   revisión manual — de ahí la importancia del framing "sin dinero real / +18 / sin
   enlaces a bookmakers".

## Nota sobre el usuario de revisión

El usuario `tester@fantasybets.local` se sembró para desarrollo. Para producción:
- Mantenlo (o crea otro) con una contraseña sólida y déjalo como cuenta de revisión.
- El acceso por email en producción solo aparece tras el gesto de 5 toques en el logo;
  los usuarios normales solo ven "Continuar con Google".
