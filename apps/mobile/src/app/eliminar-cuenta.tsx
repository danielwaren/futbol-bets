import { SITE } from '@futbolismo/core'
import { Screen } from '@/components/Screen'
import { Button, Txt } from '@/components/ui'
import { openExternal } from '@/lib/external'

export default function DeleteAccountInfo() {
  return (
    <Screen title="Eliminar tu cuenta y tus datos">
      <Txt dim>
        Puedes eliminar tu cuenta de {SITE.appName} y todos los datos asociados en
        cualquier momento.
      </Txt>
      <Txt weight="600">Desde la app</Txt>
      <Txt size={13} dim>
        Cuenta → Eliminar cuenta → confirmar. Se borran tu perfil, todas tus
        bancas y tus apuestas.
      </Txt>
      <Txt weight="600">Por correo</Txt>
      <Txt size={13} dim>
        Si no puedes acceder, escribe a {SITE.supportEmail} desde tu correo de
        Google indicando que quieres eliminar tu cuenta. Lo procesamos en 30 días.
      </Txt>
      <Txt size={12} faint>
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
