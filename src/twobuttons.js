// ============================================
// 🔘 TWO BUTTONS MEME MAKER
// ============================================

import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FONTS = [
  { family: 'ARIAL', url: 'https://cdn.jsdelivr.net/gh/wolfsonliu/web_typography/fonts/arial.ttf', localName: 'arial.ttf' },
  { family: 'impact', url: 'https://cdn.jsdelivr.net/gh/wolfsonliu/web_typography/fonts/impact.ttf', localName: 'impact.ttf' }
];

const BG_URL = "https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/Image/Two-Buttons.jpg";
const CANVAS_SIZE = { width: 600, height: 908 };

const ASSETS_DIR = join(__dirname, '..', 'assets', 'meme');
const FONTS_DIR = join(ASSETS_DIR, 'fonts');
const OUTPUT_DIR = join(__dirname, '..', 'temp');

async function download(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  if (!res.ok) throw new Error(`Fetch failed ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function prepareAssets() {
  await mkdir(FONTS_DIR, { recursive: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const font of FONTS) {
    const fontLocal = join(FONTS_DIR, font.localName);
    if (!existsSync(fontLocal)) {
      await writeFile(fontLocal, await download(font.url));
    }
    GlobalFonts.registerFromPath(fontLocal, font.family);
  }

  const bgLocal = join(ASSETS_DIR, 'Two-Buttons.jpg');
  if (!existsSync(bgLocal)) {
    await writeFile(bgLocal, await download(BG_URL));
  }
  return bgLocal;
}

function drawTextInSafeZone(ctx, text, zone, initialFontSize, fontFamily, align, outlineColor, outlineWidth) {
  let fontSize = initialFontSize;
  let lh = fontSize * 1.2;
  let out = [];
  let minSize = 10;
  
  while (fontSize >= minSize) {
    ctx.font = `400 ${fontSize}px ${fontFamily}`;
    lh = fontSize * 1.2;
    out = [];
    let fitsWidth = true;

    text.split('\n').forEach(p => {
      let cur = '';
      p.split(' ').forEach(w => {
        const t = cur ? cur + ' ' + w : w;
        if (ctx.measureText(t).width > zone.w && cur) { 
          out.push(cur); 
          cur = w; 
        } else {
          cur = t;
        }
      });
      out.push(cur);
    });

    for (const line of out) {
      if (ctx.measureText(line).width > zone.w) {
        fitsWidth = false;
        break;
      }
    }

    if (fitsWidth && (out.length * lh) <= zone.h) {
      break;
    }
    fontSize -= 2;
  }

  if (fontSize < minSize) {
    fontSize = minSize;
    ctx.font = `400 ${fontSize}px ${fontFamily}`;
    lh = fontSize * 1.2;
  }

  const drawX = align === 'center' ? zone.x + zone.w / 2 : align === 'right' ? zone.x + zone.w : zone.x;
  
  ctx.save();
  ctx.beginPath();
  ctx.rect(zone.x, zone.y, zone.w, zone.h);
  ctx.clip();
  
  const startY = zone.y + zone.h / 2 - (out.length * lh) / 2 + lh / 2;
  out.forEach((l, i) => {
    if (outlineColor) {
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = outlineWidth * (fontSize / initialFontSize);
      ctx.strokeText(l, drawX, startY + i * lh);
    }
    ctx.fillText(l, drawX, startY + i * lh);
  });
  ctx.restore();
}

export async function createTwoButtonsMeme(teks1, teks2, teks3) {
  try {
    const bgLocal = await prepareAssets();
    const canvas = createCanvas(CANVAS_SIZE.width, CANVAS_SIZE.height);
    const ctx = canvas.getContext('2d');

    const bgImg = await loadImage(bgLocal);
    ctx.drawImage(bgImg, 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);

    // Teks 1 - Button Kiri (dengan rotasi)
    ctx.save();
    ctx.translate(153, 135);
    ctx.rotate(-0.261799);
    ctx.translate(-153, -135);
    const safeZone_el1 = { x: 69, y: 108, w: 168, h: 54 };
    ctx.fillStyle = '#111111';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    drawTextInSafeZone(ctx, teks1, safeZone_el1, 60, 'ARIAL, sans-serif', 'center');
    ctx.restore();

    // Teks 2 - Button Kanan (dengan rotasi)
    ctx.save();
    ctx.translate(348, 97.5);
    ctx.rotate(-0.191986);
    ctx.translate(-348, -97.5);
    const safeZone_el2 = { x: 275, y: 76, w: 146, h: 43 };
    ctx.fillStyle = '#111111';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    drawTextInSafeZone(ctx, teks2, safeZone_el2, 50, 'ARIAL, sans-serif', 'center');
    ctx.restore();

    // Teks 3 - Bawah (dengan outline)
    ctx.save();
    const safeZone_el3 = { x: 28, y: 796, w: 542, h: 66 };
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    drawTextInSafeZone(ctx, teks3, safeZone_el3, 60, 'impact, sans-serif', 'center', '#000000', 8);
    ctx.restore();

    const outFile = join(OUTPUT_DIR, `twobuttons-${Date.now()}.png`);
    const pngData = await canvas.encode('png');
    await writeFile(outFile, pngData);
    console.log('✅ Two Buttons Meme dibuat:', outFile);
    
    return outFile;
  } catch (error) {
    console.error('❌ Error createTwoButtonsMeme:', error.message);
    throw new Error(`Gagal buat Two Buttons meme: ${error.message}`);
  }
}