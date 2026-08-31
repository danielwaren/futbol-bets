import { SITE } from '@futbolismo/core'
import { Screen } from '@/components/Screen'
import { Button, Txt } from '@/components/ui'
import { openExternal } from '@/lib/external'

export default function Terms() {
  return (
    <Screen title="Términos de uso">
      <Txt variant="small">
        {SITE.appName} es una herramienta de registro y análisis con{' '}
        <Txt variant="h2">dinero ficticio</Txt>. No es una casa de apuestas, no
        permite apostar dinero real y no enlaza a operadores de juego. Debes ser
        mayor de {SITE.minAge} años.
      </Txt>
      <Txt variant="label" size={12}>
        Premium se cobra por Google Play y se renueva automáticamente salvo que lo
        canceles con 24 h de antelación desde Google Play → Pagos y suscripciones.
        La app se ofrece “tal cual”, sin garantías sobre la exactitud de las
        cuotas o resultados.
      </Txt>
      <Button
        title="Leer los términos completos"
        variant="secondary"
        onPress={() => openExternal(`${SITE.url}/terminos`)}
      />
      <Txt variant="label" size={11}>
        Contacto: {SITE.supportEmail}
      </Txt>
    </Screen>
  )
}
