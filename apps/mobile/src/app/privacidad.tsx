import { SITE } from '@futbolismo/core'
import { Screen } from '@/components/Screen'
import { Button, Txt } from '@/components/ui'
import { openExternal } from '@/lib/external'

export default function Privacy() {
  return (
    <Screen title="Política de privacidad">
      <Txt variant="small">
        {SITE.appName} usa tu cuenta de Google (correo, nombre, foto) para
        identificarte y sincronizar tus bancas y apuestas ficticias. El plan
        gratuito muestra anuncios de Google AdMob. No vendemos tus datos y puedes
        eliminar tu cuenta cuando quieras desde <Txt variant="h2">Cuenta →
        Eliminar cuenta</Txt>.
      </Txt>
      <Txt variant="label" size={12}>
        Datos procesados por: Supabase (cuenta y contenido), Google Play Billing y
        RevenueCat (suscripción), Google AdMob (anuncios), The Odds API (cuotas).
      </Txt>
      <Button
        title="Leer la política completa"
        variant="secondary"
        onPress={() => openExternal(`${SITE.url}/privacidad`)}
      />
      <Txt variant="label" size={11}>
        Contacto: {SITE.supportEmail} · Actualizado: {SITE.legalUpdatedAt}
      </Txt>
    </Screen>
  )
}
