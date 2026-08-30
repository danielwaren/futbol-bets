# Monetización — Hito 3 (RevenueCat + AdMob)

Solo en la **app Android**. En web el paywall es informativo y no hay anuncios.

```
src/config/monetization.ts        entitlement id, ad unit ids, flags
src/lib/purchases.ts              wrapper de @revenuecat/purchases-capacitor (import dinámico)
src/lib/ads.ts                    wrapper de @capacitor-community/admob
src/context/MonetizationContext.tsx  configura RC al login, sincroniza plan, muestra/oculta banner
src/components/premium/PaywallScreen.tsx  ofertas reales + compra + restaurar
supabase/functions/sync-entitlement/    verifica RC y actualiza profiles.plan (lo llama la app)
supabase/functions/revenuecat-webhook/  fuente de verdad; RC lo llama en cada evento
```

## Flujo del entitlement

```
Compra en Google Play
   │
   ├─► RevenueCat SDK  → customerInfo.entitlements.active['premium']
   │        │
   │        └─► la app llama a  sync-entitlement  (feedback inmediato)
   │                 └─► verifica con RC REST API + set profiles.plan = 'premium'
   │
   └─► RevenueCat  → webhook  revenuecat-webhook  (autoritativo, ~segundos después)
            └─► verifica con RC REST API + set profiles.plan
```

`profiles.plan` es la única fuente que lee la UI (`useEntitlements`). El cliente **no
puede** modificar `plan` / `plan_expires_at` (trigger `protect_profile_plan`).
Un job diario (`expire_premium`, migración 0002) baja a `free` los premium vencidos.

## 1. RevenueCat

1. Crea el proyecto en [app.revenuecat.com](https://app.revenuecat.com).
2. **Entitlement**: identifier exactamente `premium`.
3. **Products / Offering**: crea los productos de suscripción en Google Play Console
   (p. ej. `premium_monthly`, `premium_annual`), impórtalos en RevenueCat, añádelos al
   *current offering* como packages Monthly / Annual, y engánchalos al entitlement `premium`.
4. **API keys** (Project settings → API keys):
   - *Public app key (Android, `goog_...`)* → `.env.local` → `VITE_REVENUECAT_ANDROID_KEY`
   - *Secret key* → secret de Supabase `REVENUECAT_SECRET_KEY`
5. **Webhook** (Integrations → Webhooks):
   - URL: `https://dngolugwcemkexbeagzu.supabase.co/functions/v1/revenuecat-webhook`
   - Authorization header: inventa un valor y ponlo también en el secret
     `REVENUECAT_WEBHOOK_SECRET`.

```bash
supabase secrets set \
  REVENUECAT_SECRET_KEY=sk_xxx \
  REVENUECAT_WEBHOOK_SECRET=$(openssl rand -hex 24) \
  --project-ref dngolugwcemkexbeagzu
```

## 2. AdMob

1. Crea la app en [AdMob](https://apps.admob.com) y una unidad **Banner** (y opcionalmente
   Interstitial).
2. **App ID** → `android/app/src/main/AndroidManifest.xml`
   (`<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" ...>`), reemplaza
   el de prueba.
3. Ad unit IDs → `.env.local`: `VITE_ADMOB_BANNER_ID`, `VITE_ADMOB_INTERSTITIAL_ID`.
   Vacío = IDs de prueba de Google.
4. **Bloqueo de categoría gambling** (obligatorio por política): AdMob → *Blocking
   controls* → *Sensitive categories* → bloquea **Gambling / Betting** para la app.
5. Consentimiento (UMP): configura un mensaje GDPR en AdMob → *Privacy & messaging*.
   El código ya llama a `requestConsentInfo()` / `showConsentForm()`.
6. `app-ads.txt`: publícalo en el dominio del sitio con la línea que te da AdMob.

Intersticiales: implementados pero **desactivados** (`INTERSTITIAL_ENABLED = false` en
`monetization.ts`). Actívalos con cuidado; hay tope de frecuencia.

## 3. Probar

- **Compra**: usa un [license tester](https://play.google.com/console) en Play Console
  (Setup → License testing) para compras sin cargo real. Instala un build interno,
  compra, y verifica que la app pasa a Premium (10 ligas, sin banner).
- **Webhook**: RevenueCat → Webhooks → *Send test event*; revisa
  `select * from subscription_events order by received_at desc;`.
- **Downgrade**: cancela la suscripción de prueba; al expirar (o con el test event
  `EXPIRATION`) el perfil vuelve a `free`.

## Notas para Google Play (Hito 4)

- La suscripción debe describirse claramente (precio, periodo, renovación automática,
  cómo cancelar). El texto del paywall ya lo incluye.
- Enlace a política de privacidad y términos desde el paywall (añadir URLs reales).
- Las apps con anuncios + login declaran recogida de datos en *Data safety*.
