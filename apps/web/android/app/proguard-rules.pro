# Reglas ProGuard/R8 para el build de release.
# minifyEnabled está en false por defecto (activar tras probar un build interno).

-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# --- Capacitor / plugins ---
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class ee.forgr.capacitor.social.login.** { *; }

# --- RevenueCat ---
-keep class com.revenuecat.purchases.** { *; }

# --- Google Play Billing ---
-keep class com.android.billingclient.api.** { *; }

# --- Google Mobile Ads (AdMob) ---
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.internal.ads.** { *; }
-dontwarn com.google.android.gms.**

# --- Google Identity / Credential Manager (login) ---
-keep class com.google.android.libraries.identity.googleid.** { *; }
-dontwarn com.google.android.libraries.identity.googleid.**
