/**
 * Service worker mínimo.
 *
 * Chrome exige un handler de `fetch` para ofrecer el botón "Instalar". No
 * cachea el JS de la app a propósito: así cada despliegue se recoge al instante
 * en vez de servir una versión vieja. Solo garantiza que el shell responda
 * cuando el dispositivo está sin conexión.
 */
const CACHE = 'futbolismo-shell-v1'
const SHELL = ['/', '/manifest.json', '/icons/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  // Navegación: red primero, con el shell cacheado como red de seguridad.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/').then((r) => r ?? Response.error())),
    )
    return
  }

  // Iconos y manifest: cache primero, son estables.
  const url = new URL(req.url)
  if (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.json') {
    event.respondWith(caches.match(req).then((r) => r ?? fetch(req)))
  }
})
