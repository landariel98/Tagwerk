// Erzeugt App-Icons und iOS-Startbilder aus public/icon.svg.
// Aufruf: npm run icons
import sharp from 'sharp'
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pub = path.join(root, 'public')
const svg = await readFile(path.join(pub, 'icon.svg'))
const BG = '#0f1117'

const icons = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-maskable-512.png', 512],
  ['apple-touch-icon.png', 180],
]
for (const [name, size] of icons) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(path.join(pub, name))
}

// iPhone-Bildschirmgrößen im Hochformat (Pixel). Muss zu den <link>-Einträgen in index.html passen.
export const splashSizes = [
  [750, 1334],
  [828, 1792],
  [1125, 2436],
  [1242, 2688],
  [1170, 2532],
  [1284, 2778],
  [1179, 2556],
  [1290, 2796],
  [1206, 2622],
  [1320, 2868],
]
await mkdir(path.join(pub, 'splash'), { recursive: true })
for (const [w, h] of splashSizes) {
  const logo = Math.round(w * 0.36)
  const logoPng = await sharp(svg, { density: 300 }).resize(logo, logo).png().toBuffer()
  await sharp({ create: { width: w, height: h, channels: 3, background: BG } })
    .composite([{ input: logoPng, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(pub, 'splash', `splash-${w}x${h}.png`))
}
console.log('Icons und Startbilder erzeugt.')
