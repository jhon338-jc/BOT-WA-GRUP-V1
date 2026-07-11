// ============================================
// 📸 IG STORY - INSTAGRAM STORY MAKER
// ============================================

import axios from 'axios'
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const IGIMG_BG_URL       = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/igimg.png'
const FONT_SEMIBOLD_URL = 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2'
const FONT_REGULAR_URL  = 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2'

const ASSETS_DIR    = join(__dirname, '..', 'assets', 'igimg')
const FONTS_DIR     = join(ASSETS_DIR, 'fonts')
const BG_LOCAL      = join(ASSETS_DIR, 'igimg.jpeg')
const FONT_SEMIBOLD = join(FONTS_DIR, 'Inter-SemiBold.woff2')
const FONT_REGULAR  = join(FONTS_DIR, 'Inter-Regular.woff2')

const BG_W = 898
const BG_H = 1600

function isUrl(src) {
  return /^https?:\/\//i.test(src)
}

async function download(url) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: { 'User-Agent': 'Mozilla/5.0' },
    maxRedirects: 5,
  })
  return Buffer.from(res.data)
}

async function resolveCachedFile(src, cachePath) {
  if (!isUrl(src)) {
    if (!existsSync(src)) throw new Error(`File lokal tidak ditemukan: ${src}`)
    return src
  }
  if (!existsSync(cachePath)) {
    await writeFile(cachePath, await download(src))
  }
  return cachePath
}

async function resolveFreshImage(src) {
  if (!isUrl(src)) {
    if (!existsSync(src)) throw new Error(`File lokal tidak ditemukan: ${src}`)
    return src
  }
  return await download(src)
}

async function setup() {
  await mkdir(ASSETS_DIR, { recursive: true })
  await mkdir(FONTS_DIR, { recursive: true })
  await mkdir(join(process.cwd(), 'temp'), { recursive: true })

  await resolveCachedFile(IGIMG_BG_URL, BG_LOCAL)

  if (!existsSync(FONT_SEMIBOLD)) {
    await writeFile(FONT_SEMIBOLD, await download(FONT_SEMIBOLD_URL))
  }

  if (!existsSync(FONT_REGULAR)) {
    await writeFile(FONT_REGULAR, await download(FONT_REGULAR_URL))
  }

  GlobalFonts.registerFromPath(FONT_SEMIBOLD, 'InterSemiBold')
  GlobalFonts.registerFromPath(FONT_REGULAR, 'InterRegular')
}

function roundedBottomClipPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y)
  ctx.closePath()
}

function roundedBottomOuterPath(ctx, x, y, w, h, r, bw) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.rect(x - bw, y, bw, h - radius)
  ctx.rect(x + w, y, bw, h - radius)
  ctx.moveTo(x - bw, y + h - radius)
  ctx.lineTo(x, y + h - radius)
  ctx.quadraticCurveTo(x, y + h, x + radius, y + h)
  ctx.lineTo(x + radius, y + h + bw)
  ctx.quadraticCurveTo(x - bw, y + h + bw, x - bw, y + h - radius)
  ctx.closePath()
  ctx.moveTo(x + w + bw, y + h - radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + w - radius, y + h + bw)
  ctx.quadraticCurveTo(x + w + bw, y + h + bw, x + w + bw, y + h - radius)
  ctx.closePath()
  ctx.rect(x + radius, y + h, w - radius * 2, bw)
}

function getContainSize(img, w, h) {
  const imgRatio = img.width / img.height
  const boxRatio = w / h
  let fw, fh
  if (imgRatio > boxRatio) {
    fw = w
    fh = fw / imgRatio
  } else {
    fh = h
    fw = fh * imgRatio
  }
  return { fw, fh }
}

function getCoverSize(img, w, h) {
  const imgRatio = img.width / img.height
  const boxRatio = w / h
  let fw, fh
  if (imgRatio > boxRatio) {
    fh = h
    fw = fh * imgRatio
  } else {
    fw = w
    fh = fw / imgRatio
  }
  return { fw, fh }
}

async function drawFoto(ctx, img, zone) {
  const { a, b, c, d, radius } = zone
  const x = c
  const y = a
  const w = d - c
  const h = b - a

  ctx.save()
  roundedBottomClipPath(ctx, x, y, w, h, radius ?? 0)
  ctx.clip()

  ctx.filter = 'blur(28px)'
  ctx.drawImage(img, x - 40, y - 40, w + 80, h + 80)
  ctx.filter = 'none'

  const { fw, fh } = getContainSize(img, w, h)
  ctx.drawImage(img, x + (w - fw) / 2, y + (h - fh) / 2, fw, fh)

  ctx.restore()
}

async function drawEdgeBlur(ctx, img, zone, edgeBlur) {
  const { a, b, c, d, radius } = zone
  const x = c
  const y = a
  const w = d - c
  const h = b - a

  const { fw, fh } = getCoverSize(img, w, h)
  const imgX = x + (w - fw) / 2
  const imgY = y + (h - fh) / 2

  ctx.save()
  roundedBottomOuterPath(ctx, x, y, w, h, radius ?? 0, edgeBlur.width)
  ctx.clip()
  ctx.filter = `blur(${edgeBlur.blur}px)`
  ctx.drawImage(img, imgX, imgY, fw, fh)
  ctx.filter = 'none'
  ctx.restore()
}

async function drawPP(ctx, img, pp) {
  const { x, y, size } = pp
  const r = size / 2

  const dim = Math.min(img.width, img.height)
  const sx = (img.width - dim) / 2
  const sy = (img.height - dim) / 2

  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(img, sx, sy, dim, dim, x - r, y - r, size, size)
  ctx.restore()
}

function resolveFontSize(ctx, cfg, fontFamily) {
  const { text, maxWidth, fontSize, minFontSize = 10 } = cfg
  if (!maxWidth) return fontSize

  const words = text.split(' ')
  let size = fontSize

  while (size > minFontSize) {
    ctx.font = `${size}px ${fontFamily}`
    const totalWidth = ctx.measureText(text).width
    if (totalWidth <= maxWidth) break

    const slotPerWord = maxWidth / words.length
    const overflow = words.some(w => ctx.measureText(w).width > slotPerWord * 1.5)
    if (!overflow && totalWidth <= maxWidth) break

    size -= 1
  }

  return Math.max(size, minFontSize)
}

function drawTeksNama(ctx, cfg, fontFamily) {
  ctx.save()
  const size = resolveFontSize(ctx, cfg, fontFamily)
  ctx.font = `${size}px ${fontFamily}`
  ctx.fillStyle = cfg.color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(cfg.text, cfg.x, cfg.y)
  ctx.restore()
}

function drawTeks(ctx, cfg, fontFamily) {
  ctx.save()
  ctx.font = `${cfg.fontSize}px ${fontFamily}`
  ctx.fillStyle = cfg.color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(cfg.text, cfg.x, cfg.y)
  ctx.restore()
}

export async function createIgStory(fotoUrl, ppUrl, nama, username) {
  try {
    await setup()

    const photoSrc = await resolveFreshImage(fotoUrl)
    const ppSrc = await resolveFreshImage(ppUrl)

    const canvas = createCanvas(BG_W, BG_H)
    const ctx = canvas.getContext('2d')
    const bgImg = await loadImage(BG_LOCAL)
    ctx.drawImage(bgImg, 0, 0, BG_W, BG_H)

    const photoImg = await loadImage(photoSrc)
    const ppImg = await loadImage(ppSrc)

    const config = {
      foto: {
        source: fotoUrl,
        a: 136,
        b: 912,
        c: 38,
        d: 860,
        radius: 20,
      },
      edgeBlur: {
        width: 3,
        blur: 10,
      },
      pp: {
        source: ppUrl,
        x: 110,
        y: 82,
        size: 80,
      },
      namaTeks: {
        x: 170,
        y: 58,
        fontSize: 25,
        maxWidth: 500,
        minFontSize: 16,
        text: nama || 'Someone',
        color: '#feffff',
      },
      usernameTeks: {
        x: 170,
        y: 90,
        fontSize: 17,
        text: username || '@username',
        color: '#8c8d91',
      },
    }

    await drawFoto(ctx, photoImg, config.foto)
    await drawEdgeBlur(ctx, photoImg, config.foto, config.edgeBlur)
    await drawPP(ctx, ppImg, config.pp)

    drawTeksNama(ctx, config.namaTeks, 'InterSemiBold')
    drawTeks(ctx, config.usernameTeks, 'InterRegular')

    const outFile = join(process.cwd(), 'temp', `igstory-${Date.now()}.png`)
    await writeFile(outFile, await canvas.encode('png'))
    console.log('✅ IG Story dibuat:', outFile)
    return outFile

  } catch (err) {
    console.error('❌ Error createIgStory:', err.message || err)
    throw new Error(`Gagal buat IG Story: ${err.message}`)
  }
}