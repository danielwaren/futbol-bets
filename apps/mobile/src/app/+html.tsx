import { ScrollViewStyleReset } from 'expo-router/html'
import type { PropsWithChildren } from 'react'

/**
 * Documento HTML raíz de la build web (PWA). Solo se usa en web y solo en
 * tiempo de compilación: no se ejecuta en el cliente.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* viewport-fit=cover para respetar las safe areas del notch en iOS */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        <meta name="description" content="Diario de banca y análisis de estrategias de apuestas de fútbol con dinero ficticio." />
        <meta name="theme-color" content="#0A0E0D" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" href="/icons/icon-192.png" />

        {/* iOS: sin esto "Añadir a inicio" abre dentro de Safari con su barra */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Futbolismo" />

        {/* Desactiva el scroll del body: en RN scrollean los contenedores */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: BASE_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: REGISTER_SW }} />
      </head>
      <body>{children}</body>
    </html>
  )
}

/**
 * El fondo se pinta también aquí, no solo en los componentes: durante el
 * arranque el body es visible antes de que React monte, y en blanco daría un
 * flash brillante en una app oscura.
 */
const BASE_CSS = `
  html, body { background-color: #0A0E0D; color-scheme: dark; }
  body { overscroll-behavior-y: none; }
  /* La app está diseñada en ancho de teléfono: centrada en pantallas grandes. */
  @media (min-width: 720px) {
    body { display: flex; justify-content: center; }
    #root { width: 100%; max-width: 480px; box-shadow: 0 0 60px rgba(0,0,0,.6); }
  }
`

const REGISTER_SW = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }
`
