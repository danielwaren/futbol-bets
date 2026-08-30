import { SITE } from '@futbolismo/core'
import { Screen } from '@/components/Screen'
import { Button, Txt } from '@/components/ui'
import { openExternal } from '@/lib/external'

export default function Terms() {
  return (
    <Screen title="Términos de uso">
      <Txt dim>
        {SITE.appName} es una herramienta de registro y análisis con{' '}
        <Txt weight="600">dinero ficticio</Txt>. No es una casa de apuestas, no
        permite apostar dinero real y no enlaza a operadores de juego. Debes ser
        mayor de {SITE.minAge} años.
      </Txt>
      <Txt size={12} faint>
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
      <Txt size={11} faint>
        Contacto: {SITE.supportEmail}
      </Txt>
    </Screen>
  )
}
