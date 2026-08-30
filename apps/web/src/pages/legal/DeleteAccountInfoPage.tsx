import { SITE } from '@futbolismo/core'
import { H2, LegalLayout, UL } from './LegalLayout'

export function DeleteAccountInfoPage() {
  return (
    <LegalLayout title="Eliminar tu cuenta y tus datos">
      <p>
        Puedes eliminar tu cuenta de <strong>{SITE.appName}</strong> y todos los datos
        asociados en cualquier momento.
      </p>

      <H2>Desde la app (recomendado)</H2>
      <UL>
        <li>Abre {SITE.appName} e inicia sesión.</li>
        <li>
          Ve a <em>Menú → Cuenta → Eliminar cuenta</em> y confirma.
        </li>
      </UL>

      <H2>Por correo</H2>
      <p>
        Si no puedes acceder a la app, escribe a{' '}
        <a
          className="text-sky-400 hover:text-sky-300"
          href={`mailto:${SITE.supportEmail}?subject=Eliminar%20mi%20cuenta%20de%20${SITE.appName}`}
        >
          {SITE.supportEmail}
        </a>{' '}
        desde el correo de Google con el que iniciaste sesión, indicando que deseas
        eliminar tu cuenta. Lo procesaremos en un máximo de 30 días.
      </p>

      <H2>Qué se elimina</H2>
      <UL>
        <li>Tu perfil (correo, nombre, foto).</li>
        <li>Todas tus bancas ficticias y apuestas registradas.</li>
        <li>El vínculo con tu suscripción en nuestros sistemas.</li>
      </UL>

      <H2>Qué no podemos eliminar</H2>
      <UL>
        <li>
          Registros de facturación que Google Play o la ley nos obliguen a conservar
          (sin datos de contenido de la app).
        </li>
        <li>
          Tu suscripción en Google Play: cancélala aparte desde{' '}
          <em>Google Play → Pagos y suscripciones</em> para que no se renueve.
        </li>
      </UL>

      <p className="text-xs text-slate-500">
        La eliminación es permanente e irreversible.
      </p>
    </LegalLayout>
  )
}
