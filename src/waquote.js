// ============================================
// 💬 WA QUOTE MAKER
// ============================================

import axios from 'axios';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FONT_MEDIUM_URL = 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/Font/Inter-Medium.otf';
const FONT_REGULAR_URL = 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/Font/interregular.ttf';
const APPLE_EMOJI_JSON_URL = 'https://media.githubusercontent.com/media/Ditzzx-vibecoder/entahlah/main/emoji-apple.json';
const BACKGROUND_DARK_URL = 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/Image/hoh.jpeg';
const BACKGROUND_LIGHT_URL = 'https://cdn.jsdelivr.net/gh/Ditzzx-vibecoder/Assets@main/Font/sisis.jpeg';

const ASSET_DIR = join(__dirname, '..', 'assets', 'waquote');
const FONT_DIR = join(ASSET_DIR, 'fonts');
const TMP_DIR = join(__dirname, '..', 'temp');

const APPLE_EMOJI_JSON_LOCAL = join(FONT_DIR, 'emoji-apple-image.json');
const FONT_MEDIUM_LOCAL = join(FONT_DIR, 'Inter-Medium.otf');
const FONT_REGULAR_LOCAL = join(FONT_DIR, 'Inter-Regular.ttf');
const BACKGROUND_DARK_LOCAL = join(ASSET_DIR, 'wab.jpeg');
const BACKGROUND_LIGHT_LOCAL = join(ASSET_DIR, 'sisis.jpeg');

const THEMES = {
  dark: {
    bubble: '#242625',
    text: '#f1f3f5',
    phone: '#7a8285',
    time: '#aeb4b8'
  },
  light: {
    bubble: '#ffffff',
    text: '#2f3032',
    phone: '#767a7b',
    time: '#767a7b'
  }
};

const USERNAME_COLORS_DARK = [
  '#25d366', '#53bdeb', '#ffb02e', '#ff6b81', '#b197fc',
  '#63e6be', '#ffd43b', '#74c0fc', '#f783ac', '#69db7c'
];

const USERNAME_COLORS_LIGHT = [
  '#1fa855', '#1070e0', '#d97706', '#dc2626',
  '#9333ea', '#db2777', '#0d9488', '#b45309'
];

const EMOJI_REGEX = /(\p{Emoji_Modifier_Base}\p{Emoji_Modifier}|\p{Emoji_Presentation}\uFE0F?|\p{Emoji}\uFE0F|[\u{1F1E0}-\u{1F1FF}]{2}|\p{Extended_Pictographic}\uFE0F?)/gu;

let fontsReady = false;
let appleEmojiMap = null;
const emojiImageCache = new Map();
const backgroundImageCache = { dark: null, light: null };

async function downloadFile(url, desc = 'File') {
  console.log(`[⬇️] Mengunduh ${desc}...`);
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: { 'User-Agent': 'Mozilla/5.0' },
    maxRedirects: 5
  });
  console.log(`[✅] Berhasil mengunduh ${desc}`);
  return Buffer.from(res.data);
}

async function ensureFile(url, localPath, desc) {
  if (!existsSync(localPath)) {
    await writeFile(localPath, await downloadFile(url, desc));
  } else {
    console.log(`[📁] ${desc} sudah ada di lokal, skip unduhan.`);
  }
}

async function loadFonts() {
  if (fontsReady) return;
  await mkdir(FONT_DIR, { recursive: true });
  await ensureFile(FONT_MEDIUM_URL, FONT_MEDIUM_LOCAL, 'Font Inter-Medium');
  await ensureFile(FONT_REGULAR_URL, FONT_REGULAR_LOCAL, 'Font Inter-Regular');
  GlobalFonts.registerFromPath(FONT_MEDIUM_LOCAL, 'WAQuoteInterMedium');
  GlobalFonts.registerFromPath(FONT_REGULAR_LOCAL, 'WAQuoteInterRegular');
  fontsReady = true;
}

async function loadBackground(mode) {
  if (backgroundImageCache[mode]) return backgroundImageCache[mode];
  await mkdir(ASSET_DIR, { recursive: true });
  const url = mode === 'light' ? BACKGROUND_LIGHT_URL : BACKGROUND_DARK_URL;
  const localPath = mode === 'light' ? BACKGROUND_LIGHT_LOCAL : BACKGROUND_DARK_LOCAL;
  await ensureFile(url, localPath, `Background (${mode})`);
  backgroundImageCache[mode] = await loadImage(await readFile(localPath));
  return backgroundImageCache[mode];
}

function randomUsernameColor(mode) {
  const colors = mode === 'light' ? USERNAME_COLORS_LIGHT : USERNAME_COLORS_DARK;
  return colors[Math.floor(Math.random() * colors.length)];
}

function emojiToUnicode(emoji) {
  return [...emoji].map(v => v.codePointAt(0).toString(16).padStart(4, '0')).join('-');
}

async function loadAppleEmojiMap() {
  if (appleEmojiMap) return appleEmojiMap;
  await mkdir(FONT_DIR, { recursive: true });
  if (!existsSync(APPLE_EMOJI_JSON_LOCAL)) {
    await writeFile(APPLE_EMOJI_JSON_LOCAL, await downloadFile(APPLE_EMOJI_JSON_URL, 'Apple Emoji JSON'));
  }
  const raw = await readFile(APPLE_EMOJI_JSON_LOCAL, 'utf-8');
  appleEmojiMap = JSON.parse(raw);
  return appleEmojiMap;
}

async function getEmojiImage(emoji) {
  if (emojiImageCache.has(emoji)) return emojiImageCache.get(emoji);
  const map = await loadAppleEmojiMap();
  const base = emojiToUnicode(emoji);
  const variants = [
    base, base.replace(/-fe0f/gi, ''), `${base.replace(/-fe0f/gi, '')}-fe0f`,
    base.toUpperCase(), base.replace(/-fe0f/gi, '').toUpperCase(), `${base.replace(/-fe0f/gi, '').toUpperCase()}-FE0F`
  ];
  let b64 = null;
  for (const variant of variants) {
    if (map[variant]) { b64 = map[variant]; break; }
  }
  if (!b64) return null;
  const img = await loadImage(Buffer.from(b64, 'base64'));
  emojiImageCache.set(emoji, img);
  return img;
}

async function drawAppleEmoji(ctx, emoji, x, y, size) {
  const img = await getEmojiImage(emoji);
  if (!img) { ctx.fillText(emoji, x, y); return; }
  ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
}

function measureTextCustom(ctx, text, fontSize) {
  const parts = String(text).split(EMOJI_REGEX);
  let width = 0;
  for (const part of parts) {
    if (!part) continue;
    EMOJI_REGEX.lastIndex = 0;
    if (EMOJI_REGEX.test(part)) { width += fontSize * 1.05; }
    else { width += ctx.measureText(part).width; }
    EMOJI_REGEX.lastIndex = 0;
  }
  return width;
}

async function drawTextWithEmojis(ctx, text, x, y, fontSize) {
  const parts = String(text).split(EMOJI_REGEX);
  let currentX = x;
  for (const part of parts) {
    if (!part) continue;
    EMOJI_REGEX.lastIndex = 0;
    if (EMOJI_REGEX.test(part)) {
      const emojiSize = fontSize * 1.05;
      await drawAppleEmoji(ctx, part, currentX + emojiSize / 2, y, emojiSize);
      currentX += emojiSize;
    } else {
      ctx.fillText(part, currentX, y);
      currentX += ctx.measureText(part).width;
    }
    EMOJI_REGEX.lastIndex = 0;
  }
}

function drawBackgroundCover(ctx, img, canvasW, canvasH) {
  const imgAspect = img.width / img.height;
  const canvasAspect = canvasW / canvasH;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgAspect > canvasAspect) {
    sw = img.height * canvasAspect;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / canvasAspect;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
}

function bubblePath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + 26);
  ctx.quadraticCurveTo(x - 4, y + 10, x - 18, y + 4);
  ctx.quadraticCurveTo(x - 22, y + 2, x - 20, y);
  ctx.quadraticCurveTo(x - 10, y, x + r, y);
  ctx.closePath();
}

function drawCircleImage(ctx, img, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}

function imageAreaPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapTextFullWidth(ctx, text, maxWidth, fontSize) {
  const words = String(text).split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if (word.includes('\n')) {
      const parts = word.split('\n');
      for (let i = 0; i < parts.length; i++) {
        const test = current ? `${current} ${parts[i]}` : parts[i];
        if (measureTextCustom(ctx, test, fontSize) > maxWidth && current) {
          lines.push(current);
          current = parts[i];
        } else { current = test; }
        if (i < parts.length - 1) { lines.push(current); current = ''; }
      }
      continue;
    }
    const test = current ? `${current} ${word}` : word;
    if (measureTextCustom(ctx, test, fontSize) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else { current = test; }
  }
  if (current) lines.push(current);
  return lines;
}

export async function createWAQuote(config = {}) {
  console.log('\n[⏳] Memulai proses render WA Quote...');
  
  await loadFonts();
  await loadAppleEmojiMap();
  await mkdir(TMP_DIR, { recursive: true });

  const data = {
    username: '~ Someone',
    phone: '+62 838-2312-6543',
    tag: 'suaminya rosiee',
    ppUrl: 'https://d.uguu.se/qRTJRFiQ.jpg',
    text: 'Perkenalkan ini tuh my gwh mbg ya 🌹',
    imgUrl: null,
    mode: 'dark',
    ...config
  };

  const currentMode = data.mode === 'light' ? 'light' : 'dark';
  const themeColors = THEMES[currentMode];

  if (!data.username) throw new Error('Username kosong');
  if (!data.phone) throw new Error('Phone kosong');
  if (!data.ppUrl) throw new Error('PP URL kosong');

  const hasImage = Boolean(data.imgUrl);
  const hasTag = Boolean(data.tag);
  if (!data.text && !hasImage) throw new Error('Teks kosong');

  const width = 1024;
  const usernameSize = 31;
  const phoneSize = 29;
  const tagSize = 29;
  const textSize = 40;
  const timeSize = 29;

  const bubbleX = 108;
  const bubbleY = 60;
  const bubbleRadius = 24;
  const paddingX = 38;
  const paddingRight = 36;
  const lineHeight = 56;

  const avatarSize = 72;
  const avatarX = 12;
  const avatarY = bubbleY;

  const time = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(':', '.');

  const measureCanvas = createCanvas(10, 10);
  const mctx = measureCanvas.getContext('2d');

  mctx.font = `${usernameSize}px WAQuoteInterMedium`;
  const usernameWidth = measureTextCustom(mctx, data.username, usernameSize);
  
  mctx.font = `${phoneSize}px WAQuoteInterRegular`;
  const phoneWidth = measureTextCustom(mctx, data.phone, phoneSize);
  
  mctx.font = `${tagSize}px WAQuoteInterRegular`;
  const tagWidth = hasTag ? measureTextCustom(mctx, data.tag, tagSize) : 0;

  mctx.font = `${timeSize}px WAQuoteInterRegular`;
  const timeWidth = mctx.measureText(time).width;

  const headerGap = 40;
  const minHeaderWidth = usernameWidth + headerGap + phoneWidth + paddingX + paddingRight;
  const minTagWidth = hasTag ? (tagWidth + paddingX + paddingRight) : 0;

  const maxBubbleW = width - bubbleX - 24;
  const textRightLimit = bubbleX + maxBubbleW - paddingRight - 18;
  const contentX = bubbleX + paddingX - 5;
  const textMaxWidth = Math.max(260, textRightLimit - contentX);
  
  mctx.font = `${textSize}px WAQuoteInterRegular`;
  const lines = data.text ? wrapTextFullWidth(mctx, data.text, textMaxWidth, textSize) : [];
  const hasCaption = lines.length > 0;

  let bubbleWidth = maxBubbleW;
  if (!hasImage) {
    let maxLineWidth = 0;
    for (const line of lines) {
      const w = measureTextCustom(mctx, line, textSize);
      if (w > maxLineWidth) maxLineWidth = w;
    }
    let neededTextWidth = maxLineWidth + paddingX + paddingRight + 25;
    if (lines.length === 1) {
      neededTextWidth += timeWidth + 15;
    }
    bubbleWidth = Math.max(neededTextWidth, minHeaderWidth, minTagWidth);
    if (bubbleWidth > maxBubbleW) {
      bubbleWidth = maxBubbleW;
    }
  }

  const phoneX = bubbleX + bubbleWidth - phoneWidth - paddingRight;

  let avatar;
  try {
    avatar = await loadImage(await downloadFile(data.ppUrl, 'Profile Picture'));
  } catch {
    avatar = await loadImage(await downloadFile('https://telegra.ph/file/320b066dc81928b782c7b.png', 'PP Default'));
  }

  const background = await loadBackground(currentMode);

  let mainImage = null;
  let imageAreaX = bubbleX + 8;
  let imageAreaW = bubbleWidth - 16;
  let imageDrawH = 0;

  if (hasImage) {
    let imgBuf;
    if (data.imgUrl.startsWith('http')) {
      imgBuf = await downloadFile(data.imgUrl, 'Gambar Utama');
    } else {
      imgBuf = await readFile(data.imgUrl);
    }
    mainImage = await loadImage(imgBuf);
    const imgAspect = mainImage.width / mainImage.height;
    imageDrawH = Math.round(imageAreaW / imgAspect);
  }

  let headerY, tagY, headerBlockH;
  if (hasTag) {
    headerY = bubbleY + 52;
    tagY = headerY + 43;
    headerBlockH = 130;
  } else {
    headerBlockH = 76;
    headerY = bubbleY + 34;
  }

  const imageTopGap = 0;
  const imageBottomGap = hasImage ? (hasCaption ? 20 : 8) : 0;
  const imageBlockH = hasImage ? (imageTopGap + imageDrawH + imageBottomGap) : 0;
  const textBlockH = lines.length * lineHeight;
  const bottomPad = hasImage ? (hasCaption ? 20 : 8) : 0;

  const bubbleHeight = Math.max(
    100,
    headerBlockH + imageBlockH + textBlockH + bottomPad
  );

  const imageY = bubbleY + headerBlockH + imageTopGap;
  const textStartY = hasImage
    ? imageY + imageDrawH + imageBottomGap + (lineHeight / 2) - 6
    : bubbleY + headerBlockH + (textSize / 2) + 2;

  const height = Math.round(bubbleY + bubbleHeight + 70);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  drawBackgroundCover(ctx, background, width, height);

  ctx.fillStyle = themeColors.bubble;
  bubblePath(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleRadius);
  ctx.fill();

  drawCircleImage(ctx, avatar, avatarX, avatarY, avatarSize);

  ctx.textAlign = 'left';
  ctx.textBaseline = hasTag ? 'alphabetic' : 'middle';

  ctx.font = `${usernameSize}px WAQuoteInterMedium`;
  ctx.fillStyle = randomUsernameColor(currentMode);
  await drawTextWithEmojis(ctx, data.username, contentX, headerY, usernameSize);

  ctx.font = `${phoneSize}px WAQuoteInterRegular`;
  ctx.fillStyle = themeColors.phone;
  await drawTextWithEmojis(ctx, data.phone, phoneX, headerY, phoneSize);

  if (hasTag) {
    ctx.textBaseline = 'alphabetic';
    ctx.font = `${tagSize}px WAQuoteInterRegular`;
    ctx.fillStyle = themeColors.phone;
    await drawTextWithEmojis(ctx, data.tag, contentX, tagY, tagSize);
  }

  if (hasImage && mainImage) {
    ctx.save();
    imageAreaPath(ctx, imageAreaX, imageY, imageAreaW, imageDrawH, 20);
    ctx.clip();
    ctx.drawImage(mainImage, imageAreaX, imageY, imageAreaW, imageDrawH);
    ctx.restore();
  }

  ctx.font = `${textSize}px WAQuoteInterRegular`;
  ctx.fillStyle = themeColors.text;
  ctx.textBaseline = 'middle';

  for (let i = 0; i < lines.length; i++) {
    await drawTextWithEmojis(ctx, lines[i], contentX, textStartY + i * lineHeight, textSize);
  }

  ctx.font = `${timeSize}px WAQuoteInterRegular`;
  ctx.textBaseline = 'alphabetic';

  if (hasImage && !hasCaption) {
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    const imgTimeX = imageAreaX + imageAreaW - 20;
    const imgTimeY = imageY + imageDrawH - 18;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(time, imgTimeX, imgTimeY);
    ctx.restore();
  } else {
    ctx.fillStyle = themeColors.time;
    ctx.textAlign = 'right';
    const timeYOffset = !hasImage ? 13 : 16;
    const timeY = bubbleY + bubbleHeight - timeYOffset;
    ctx.fillText(time, bubbleX + bubbleWidth - 20, timeY);
  }

  const output = join(TMP_DIR, `waquote-${Date.now()}.png`);
  await writeFile(output, await canvas.encode('png'));
  console.log(`[✨] Render berhasil! File tersimpan di: ${output}\n`);
  return output;
}