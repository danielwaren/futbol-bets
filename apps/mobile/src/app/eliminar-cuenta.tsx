import { SITE } from '@futbolismo/core'
import { Screen } from '@/components/Screen'
import { Button, Txt } from '@/components/ui'
import { openExternal } from '@/lib/external'

export default function DeleteAccountInfo() {
  return (
    <Screen title="Eliminar tu cuenta y tus datos">
      <Txt variant="small">
        Puedes eliminar tu cuenta de {SITE.appName} y todos los datos asociados en
        cualquier momento.
      </Txt>
      <Txt variant="h2">Desde la app</Txt>
      <Txt variant="small" size={13}>
        Cuenta → Eliminar cuenta → confirmar. Se borran tu perfil, todas tus
        bancas y tus apuestas.
      </Txt>
      <Txt variant="h2">Por correo</Txt>
      <Txt variant="small" size={13}>
        Si no puedes acceder, escribe a {SITE.supportEmail} desde tu correo de
        Google indicando que quieres eliminar tu cuenta. Lo procesamos en 30 días.
      </Txt>
      <Txt variant="label" size={12}>
        Nota: cancela aparte la suscripción en Google Play para que no se renueve.
        La eliminación es permanente.
      </Txt>
      <Button
        title="Ver esta página en la web"
        variant="secondary"
        onPress={() => openExternal(`${SITE.url}/eliminar-cuenta`)}
      />
    </Screen>
  )
}
