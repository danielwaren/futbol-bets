// Genera los íconos y splash de Android desde SVG (sin @capacitor/assets).
// Uso: npm run icons   (después de `npx cap add android`)
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const RES = resolve('android/app/src/main/res')
if (!existsSync(RES)) {
  console.error('No existe android/. Corre `npx cap add android` primero.')
  process.exit(1)
}

const BG = '#0b1120'
const ACCENT = '#38bdf8'
const BALL = '#f8fafc'

// Marca: línea ascendente + balón como último punto.
const mark = (s = 100) => `
  <g transform="scale(${s / 100})">
    <polyline points="12,76 35,52 54,61 82,26" fill="none" stroke="${ACCENT}"
      stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="82" cy="24" r="13" fill="${BALL}"/>
    <polygon points="82,17.5 88.2,22 85.8,29.4 78.2,29.4 75.8,22" fill="${BG}"/>
  </g>`

const iconSvg = (px) => `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">
  <rect width="${px}" height="${px}" fill="${BG}"/>
  <g transform="translate(${px * 0.18},${px * 0.18})">${mark(px * 0.64)}</g>
</svg>`

// Foreground de icono adaptativo: solo la marca, transparente, en la zona segura (~60%).
const foregroundSvg = (px) => `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">
  <g transform="translate(${px * 0.28},${px * 0.28})">${mark(px * 0.44)}</g>
</svg>`

const splashSvg = (w, h) => {
  const m = Math.min(w, h) * 0.28
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <g transform="translate(${(w - m) / 2},${(h - m) / 2})">${mark(m)}</g>
</svg>`
}

async function png(svg, file) {
  await mkdir(dirname(file), { recursive: true })
  await sharp(Buffer.from(svg)).png().toFile(file)
  console.log('·', file.replace(RES + '/', '').replace(RES + '\\', ''))
}

// Launcher (square + round) y foreground por densidad
const LAUNCHER = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }
for (const [d, px] of Object.entries(LAUNCHER)) {
  const icon = iconSvg(px)
  await png(icon, `${RES}/mipmap-${d}/ic_launcher.png`)
  await png(icon, `${RES}/mipmap-${d}/ic_launcher_round.png`)
  const fg = Math.round(px * 2.25) // capa adaptativa 108dp
  await png(foregroundSvg(fg), `${RES}/mipmap-${d}/ic_launcher_foreground.png`)
}

// Play Store icon 512 (para la ficha de la tienda) → raíz del repo
await png(iconSvg(512), resolve('play-store-icon.png'))

// Feature graphic 1024x500 para la ficha de Play Store
const featureSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1120"/><stop offset="1" stop-color="#111a2e"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  <g transform="translate(96,170)">${mark(160)}</g>
  <text x="300" y="235" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="700" fill="#f8fafc">Futbolismo</text>
  <text x="302" y="285" font-family="Inter, Arial, sans-serif" font-size="27" fill="#94a3b8">Diario de banca · estrategias de apuestas · dinero ficticio</text>
</svg>`
await png(featureSvg, resolve('store-feature-graphic.png'))

// Fondo del icono adaptativo → color de marca
await writeFile(
  `${RES}/values/ic_launcher_background.xml`,
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG}</color>\n</resources>\n`,
)

// Splash (port / land / neutro) por densidad
const SPLASH = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] }
for (const [d, [a, b]] of Object.entries(SPLASH)) {
  await png(splashSvg(a, b), `${RES}/drawable-port-${d}/splash.png`)
  await png(splashSvg(b, a), `${RES}/drawable-land-${d}/splash.png`)
}
await png(splashSvg(480, 320), `${RES}/drawable/splash.png`)

console.log('\nÍconos y splash generados. Ejecuta `npx cap sync android`.')
