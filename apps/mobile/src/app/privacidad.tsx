import { SITE } from '@futbolismo/core'
import { Screen } from '@/components/Screen'
import { Button, Txt } from '@/components/ui'
import { openExternal } from '@/lib/external'

export default function Privacy() {
  return (
    <Screen title="Política de privacidad">
      <Txt dim>
        {SITE.appName} usa tu cuenta de Google (correo, nombre, foto) para
        identificarte y sincronizar tus bancas y apuestas ficticias. El plan
        gratuito muestra anuncios de Google AdMob. No vendemos tus datos y puedes
        eliminar tu cuenta cuando quieras desde <Txt weight="600">Cuenta →
        Eliminar cuenta</Txt>.
      </Txt>
      <Txt size={12} faint>
        Datos procesados por: Supabase (cuenta y contenido), Google Play Billing y
        RevenueCat (suscripción), Google AdMob (anuncios), The Odds API (cuotas).
      </Txt>
      <Button
        title="Leer la política completa"
        variant="secondary"
        onPress={() => openExternal(`${SITE.url}/privacidad`)}
      />
      <Txt size={11} faint>
        Contacto: {SITE.supportEmail} · Actualizado: {SITE.legalUpdatedAt}
      </Txt>
    </Screen>
  )
}
