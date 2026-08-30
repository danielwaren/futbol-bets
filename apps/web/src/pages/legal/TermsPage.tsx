import { SITE } from '@futbolismo/core'
import { H2, LegalLayout, UL } from './LegalLayout'

export function TermsPage() {
  return (
    <LegalLayout title="Términos de uso">
      <H2>1. Qué es {SITE.appName}</H2>
      <p>
        {SITE.appName} es una herramienta de <strong>registro y análisis</strong> de
        estrategias de apuestas deportivas usando <strong>dinero ficticio</strong>. No
        es una casa de apuestas, no permite apostar dinero real, no procesa apuestas ni
        pagos, y no enlaza a operadores de juego para apostar. Los datos de cuotas y
        partidos son informativos y pueden contener errores o retrasos.
      </p>

      <H2>2. Edad</H2>
      <p>
        Debes ser mayor de {SITE.minAge} años para usar la app.
      </p>

      <H2>3. Tu cuenta</H2>
      <p>
        Eres responsable de la actividad de tu cuenta de Google asociada. Puedes
        eliminar tu cuenta en cualquier momento desde <em>Ajustes → Cuenta</em>.
      </p>

      <H2>4. Suscripción Premium</H2>
      <UL>
        <li>Premium desbloquea más ligas, una banca por liga y elimina los anuncios.</li>
        <li>
          El pago se realiza a través de tu cuenta de Google Play. La suscripción se
          <strong> renueva automáticamente</strong> al precio y periodo indicados salvo
          que la canceles al menos 24 horas antes del fin del periodo en curso.
        </li>
        <li>
          Gestiona o cancela la suscripción desde{' '}
          <em>Google Play → Pagos y suscripciones</em>. Al cancelar mantienes Premium
          hasta el final del periodo ya pagado.
        </li>
        <li>Los reembolsos se rigen por las políticas de Google Play.</li>
      </UL>

      <H2>5. Uso aceptable</H2>
      <p>
        No intentes vulnerar la seguridad del servicio, manipular tu plan o los límites,
        ni usar la app para actividades ilegales.
      </p>

      <H2>6. Sin garantías</H2>
      <p>
        La app se ofrece “tal cual”. No garantizamos disponibilidad ininterrumpida ni
        la exactitud de las cuotas o resultados. {SITE.appName} no ofrece asesoramiento
        financiero ni de apuestas; cualquier decisión que tomes es de tu exclusiva
        responsabilidad.
      </p>

      <H2>7. Cambios y cierre</H2>
      <p>
        Podemos modificar o discontinuar funciones. Publicaremos los términos vigentes
        en esta página.
      </p>

      <H2>8. Contacto</H2>
      <p>
        {SITE.publisher} —{' '}
        <a
          className="text-sky-400 hover:text-sky-300"
          href={`mailto:${SITE.supportEmail}`}
        >
          {SITE.supportEmail}
        </a>
      </p>
    </LegalLayout>
  )
}
