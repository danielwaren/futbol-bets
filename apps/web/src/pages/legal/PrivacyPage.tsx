import { SITE } from '@futbolismo/core'
import { H2, LegalLayout, UL } from './LegalLayout'

export function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidad">
      <p>
        {SITE.publisher} (“nosotros”) desarrolla la app <strong>{SITE.appName}</strong>,
        una herramienta para registrar y analizar estrategias de apuestas deportivas
        con <strong>dinero ficticio</strong>. Esta política explica qué datos tratamos
        y con qué fin. Al usar la app aceptas lo aquí descrito.
      </p>

      <H2>1. Datos que recogemos</H2>
      <UL>
        <li>
          <strong>Cuenta:</strong> al iniciar sesión con Google recibimos tu correo,
          nombre y foto de perfil.
        </li>
        <li>
          <strong>Contenido que creas:</strong> tus bancas ficticias, apuestas
          registradas, montos, cuotas, notas y resultados.
        </li>
        <li>
          <strong>Datos de compra:</strong> el estado de tu suscripción Premium
          (activa/expirada y fecha), gestionado a través de Google Play y RevenueCat.
          No recibimos ni almacenamos datos de tu tarjeta.
        </li>
        <li>
          <strong>Datos técnicos y de uso:</strong> identificadores de dispositivo,
          registros de errores y de actividad básica para operar el servicio.
        </li>
        <li>
          <strong>Publicidad (solo plan gratuito):</strong> Google AdMob puede acceder
          al identificador de publicidad del dispositivo para mostrar anuncios. El plan
          Premium no muestra anuncios.
        </li>
      </UL>
      <p>No recogemos ubicación precisa, contactos ni archivos personales.</p>

      <H2>2. Para qué usamos los datos</H2>
      <UL>
        <li>Autenticarte y sincronizar tus datos entre dispositivos.</li>
        <li>Prestar las funciones de la app (bancas, historial, estadísticas).</li>
        <li>Gestionar la suscripción Premium y desactivar los anuncios.</li>
        <li>Mostrar publicidad (plan gratuito) y prevenir abuso.</li>
        <li>Diagnóstico de errores y mejora del producto.</li>
      </UL>

      <H2>3. Terceros que procesan datos</H2>
      <UL>
        <li>
          <strong>Supabase</strong> — autenticación y base de datos (alojamiento de tu
          cuenta y tu contenido).
        </li>
        <li>
          <strong>Google Play Billing</strong> y <strong>RevenueCat</strong> — cobro y
          verificación de la suscripción.
        </li>
        <li>
          <strong>Google AdMob</strong> — anuncios en el plan gratuito.
        </li>
        <li>
          <strong>The Odds API</strong> — cuotas y calendario de partidos (no recibe
          datos tuyos).
        </li>
      </UL>
      <p>
        No vendemos tus datos personales. La publicidad puede implicar compartir
        identificadores con Google conforme a sus políticas; puedes configurar el
        consentimiento y restablecer el identificador de publicidad desde los ajustes
        de tu dispositivo.
      </p>

      <H2>4. Conservación</H2>
      <p>
        Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta,
        borramos tu perfil, bancas y apuestas de nuestra base de datos. Los registros
        de facturación se conservan el tiempo exigido por la ley.
      </p>

      <H2>5. Tus derechos</H2>
      <p>
        Puedes acceder y editar tus datos dentro de la app, y{' '}
        <strong>eliminar tu cuenta</strong> desde <em>Ajustes → Cuenta → Eliminar
        cuenta</em>, o solicitándolo en{' '}
        <a
          className="text-sky-400 hover:text-sky-300"
          href={`${SITE.url}/eliminar-cuenta`}
        >
          {SITE.url}/eliminar-cuenta
        </a>
        . También puedes escribirnos a{' '}
        <a
          className="text-sky-400 hover:text-sky-300"
          href={`mailto:${SITE.supportEmail}`}
        >
          {SITE.supportEmail}
        </a>{' '}
        para ejercer tus derechos de acceso, rectificación, oposición o portabilidad.
      </p>

      <H2>6. Menores</H2>
      <p>
        La app está dirigida a personas mayores de {SITE.minAge} años. No la usan ni
        deben usarla menores de edad.
      </p>

      <H2>7. Cambios</H2>
      <p>
        Podemos actualizar esta política. Publicaremos la versión vigente en esta
        misma página con su fecha de actualización.
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
