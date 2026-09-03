# Futbolismo como PWA (app instalable desde el navegador)

La misma base de código de `apps/mobile` se exporta a web con react-native-web y
queda instalable en el móvil como una app: icono propio, pantalla completa y sin
depender de que tu PC esté encendido.

**Es la única forma gratuita de tener la app en un iPhone.** Instalar un `.ipa`
exige el Apple Developer Program (99 USD/año); una PWA no.

## Qué incluye

| Archivo | Para qué |
|---|---|
| `public/manifest.json` | Nombre, colores, iconos, `display: standalone` |
| `public/sw.js` | Service worker. Chrome exige un handler `fetch` para ofrecer "Instalar" |
| `public/icons/` | 192, 512, maskable 512 y apple-touch-icon 180 |
| `src/app/+html.tsx` | Documento HTML raíz: metas de PWA, iOS y registro del SW |
| `vercel.json` | Build y cabeceras de caché |

El service worker **no cachea el JS de la app** a propósito: así cada despliegue
se recoge al instante en vez de servir una versión vieja. Solo cachea el shell
para que responda sin conexión.

## Construir en local

```bash
cd apps/mobile
npx expo export --platform web --output-dir dist-web
```

Para probarlo hace falta servirlo por HTTP (abrir el `index.html` con `file://`
no vale: el service worker exige origen http/https).

## Desplegar en Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo.
2. **Root Directory: `apps/mobile`** ← importante, es un monorepo.
3. El resto lo toma de `vercel.json` (build, salida y cabeceras).
4. Deploy.

Cada `git push` vuelve a desplegar. La app se actualiza sola sin reinstalar nada.

## Después del primer despliegue

Añade la URL a **Supabase → Authentication → URL Configuration → Redirect URLs**,
o el login con Google volverá sin sesión:

```
https://<tu-dominio>.vercel.app/**
```

## Instalar en el teléfono

- **iPhone (Safari):** abre la URL → Compartir → **Añadir a pantalla de inicio**.
  Tiene que ser Safari; Chrome en iOS no instala PWAs.
- **Android (Chrome):** sale solo un botón **Instalar app**, o menú → Instalar.

## Límites conocidos

- **Sin anuncios ni compras premium.** AdMob y RevenueCat no existen en web. Si
  algún día se monetiza la PWA hace falta una pasarela web (Stripe).
- **Google Sign-In por navegador**, no el selector nativo de cuentas.
- **iOS puede borrar los datos** de una PWA si el dispositivo va justo de espacio.
  La sesión de Supabase vive en `localStorage`, así que habría que volver a entrar.
- El date picker usa `<input type="date">` del sistema
  (`src/components/DatePicker.web.tsx`), porque
  `@react-native-community/datetimepicker` no tiene implementación web.
