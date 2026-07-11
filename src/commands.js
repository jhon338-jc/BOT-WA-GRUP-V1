// ============================================
// 📋 COMMANDS - SEMUA FITUR BOT
// ============================================

import { createCanvas } from 'canvas';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { CONFIG } from './config.js';
import { createDrakeMeme } from './drake.js';
import { createTwoButtonsMeme } from './twobuttons.js';
import { createQuote } from './quote.js';
import { createWAQuote } from './waquote.js';
import { generateBratVideo } from './bratvid.js';
import { createRinChat } from './rinchat.js';
import { createIgStory } from './igstory.js';
import { createTikTokChat } from './tiktokchat.js';
import { downloadImage } from './downloader.js';


// ============================================
// 📋 MENU TEKS
// ============================================
const MENU_TEKS = `
╔══════════════════════════════════════╗
║          🤖 *JHON BOT* 🤖           ║
║      ⚡ Smart • Fast • Secure ⚡    ║
╚══════════════════════════════════════╝

👑 *Owner:* ${CONFIG.owner}
📦 *Mode:* Group Assistant
🟢 *Status:* Online

━━━ 📂 MAIN MENU ━━━━━━━━━━━━

.menu - Tampilkan menu ini
.stiker [teks] - Buat stiker BRAT
.drake [teks1]|[teks2] - Buat Drake Meme
.button [teks1]|[teks2]|[teks3] - Buat Two Buttons Meme
.quote [teks]|[username]|[bg] - Quote Anime Card
.waquote [teks]|[username]|[phone] - WA Quote Chat
.bratvid [teks]|[theme]|[blur] - BRAT Video/GIF
.rinchat [teks]|[imgUrl]|[time] - Fake WhatsApp Chat
.igstory [foto]|[pp]|[nama]|[username] - IG Story
.tiktokchat [username]|[teks]|[avatar] - TikTok Chat Generator
.download [url] - Download gambar dari URL

━━━ 💬 CATATAN ━━━━━━━━━━━━━━

• Gunakan *.menu* untuk melihat menu.
• Jangan spam bot.

━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 *JHON BOT - GASKEUN!* 🔥
`;

// ============================================
// 🎨 .stiker - BRAT STIKER (CANVAS + WebP)
// ============================================
async function createBratSticker(text) {
    try {
        const width = 512;
        const height = 512;
        const padding = 60;
        const maxWidth = width - (padding * 2);
        
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        const gradient = ctx.createRadialGradient(
            width/2, height/2, 50,
            width/2, height/2, 300
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const words = text.split(' ');
        let lines = [];
        let currentLine = '';
        let testFontSize = 80;
        ctx.font = `bold ${testFontSize}px Arial`;
        
        for (let word of words) {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine.length > 0) {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine.length > 0) {
            lines.push(currentLine.trim());
        }
        
        let fontSize = 120;
        let lineHeight = fontSize * 1.3;
        let totalHeight = lines.length * lineHeight;
        
        while (fontSize > 20) {
            lineHeight = fontSize * 1.3;
            totalHeight = lines.length * lineHeight;
            ctx.font = `bold ${fontSize}px Arial`;
            let allFit = true;
            for (let line of lines) {
                const metrics = ctx.measureText(line);
                if (metrics.width > maxWidth) {
                    allFit = false;
                    break;
                }
            }
            if (allFit && totalHeight <= height - (padding * 2)) {
                break;
            }
            fontSize -= 2;
        }
        
        if (fontSize < 20) fontSize = 20;
        lineHeight = fontSize * 1.3;
        totalHeight = lines.length * lineHeight;
        
        const startY = (height - totalHeight) / 2 + (lineHeight / 2);
        
        for (let i = 0; i < lines.length; i++) {
            const y = startY + (i * lineHeight);
            ctx.font = `bold ${fontSize}px Arial`;
            
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(lines[i], width/2, y);
            
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 3;
            ctx.strokeText(lines[i], width/2, y);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(lines[i], width/2, y);
        }
        
        const pngBuffer = canvas.toBuffer('image/png');
        
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        
        const tempWebp = path.join(tempDir, `sticker_${Date.now()}.webp`);
        
        await sharp(pngBuffer)
            .webp({ quality: 90, effort: 6 })
            .toFile(tempWebp);
        
        const webpBuffer = fs.readFileSync(tempWebp);
        
        setTimeout(() => {
            try { fs.unlinkSync(tempWebp); } catch (e) {}
        }, 3000);
        
        return webpBuffer;
        
    } catch (error) {
        console.error('❌ Error createBratSticker:', error.message);
        throw new Error(`Gagal buat stiker: ${error.message}`);
    }
}

// ============================================
// 🔧 HANDLER FUNCTIONS
// ============================================

export async function handleMenu(sock, senderId, messageContent) {
    try {
        if (!messageContent || messageContent.trim() !== '.menu') {
            return;
        }
        
        console.log('📋 [handleMenu] dipanggil!');
        await sock.sendMessage(senderId, { text: MENU_TEKS });
        console.log('✅ Menu terkirim!');
    } catch (error) {
        console.error('❌ handleMenu error:', error);
        await sock.sendMessage(senderId, { text: `❌ Error: ${error.message}` });
    }
}

export async function handleStiker(sock, senderId, messageContent) {
    try {
        if (!messageContent || !messageContent.startsWith('.stiker ')) {
            return;
        }
        
        const text = messageContent.substring(8).trim();
        
        if (!text || text.length < 1) {
            await sock.sendMessage(senderId, { 
                text: '❌ *Teksnya mana?*\n\nContoh: .stiker Jhon Ganteng'
            });
            return;
        }
        
        console.log(`🎨 [handleStiker] Membuat stiker: "${text}"`);
        
        const webpBuffer = await createBratSticker(text);
        
        await sock.sendMessage(senderId, {
            sticker: webpBuffer,
            mimetype: 'image/webp'
        });
        
        console.log('✅ Stiker WebP terkirim!');
        
    } catch (error) {
        console.error('❌ handleStiker error:', error);
        await sock.sendMessage(senderId, { 
            text: `❌ *Gagal buat stiker!*\n\nError: ${error.message}`
        });
    }
}

// ============================================
// 🎵 .tiktokchat - TIKTOK CHAT
// ============================================
export async function handleTikTokChat(sock, senderId, messageContent) {
    try {
        if (!messageContent || !messageContent.startsWith('.tiktokchat ')) return;
        
        const text = messageContent.substring(12).trim();
        const parts = text.split('|');
        const username = parts[0]?.trim() || 'Someone';
        const chatText = parts[1]?.trim() || 'Halo guys! 😂';
        const avatarUrl = parts[2]?.trim() || null;
        
        console.log(`🎵 [handleTikTokChat] Membuat TikTok Chat: "${username}" | "${chatText}"`);
        
        const imagePath = await createTikTokChat(username, chatText, avatarUrl);
        const imageBuffer = fs.readFileSync(imagePath);
        
        await sock.sendMessage(senderId, {
            image: imageBuffer
        });
        
        setTimeout(() => {
            try { fs.unlinkSync(imagePath); } catch (e) {}
        }, 5000);
        
    } catch (error) {
        console.error('❌ handleTikTokChat error:', error);
        await sock.sendMessage(senderId, { 
            text: `❌ *Gagal buat TikTok Chat!*\n\nError: ${error.message}`
        });
    }
}


// ============================================
// 📥 .download - DOWNLOAD GAMBAR DARI URL
// ============================================
export async function handleDownload(sock, senderId, messageContent) {
    try {
        if (!messageContent || !messageContent.startsWith('.download ')) {
            return;
        }
        
        const url = messageContent.substring(10).trim();
        
        if (!url || !url.startsWith('http')) {
            await sock.sendMessage(senderId, { 
                text: '❌ *URL nya mana?*\n\nContoh: .download https://i.pinimg.com/originals/48/fe/75/48fe755aa57956af421a3901489d6e9f.jpg'
            });
            return;
        }
        
        console.log(`📥 [handleDownload] Download gambar dari: ${url}`);
        
        const filePath = await downloadImage(url);
        const imageBuffer = fs.readFileSync(filePath);
        
        await sock.sendMessage(senderId, {
            image: imageBuffer,
            caption: `📥 *Gambar didownload!*\n\n🔗 ${url}`
        });
        
        setTimeout(() => {
            try { fs.unlinkSync(filePath); } catch (e) {}
        }, 5000);
        
    } catch (error) {
        console.error('❌ handleDownload error:', error);
        await sock.sendMessage(senderId, { 
            text: `❌ *Gagal download gambar!*\n\nError: ${error.message}`
        });
    }
}

// ============================================
// 💬 .rinchat - FAKE WHATSAPP CHAT
// ============================================
export async function handleRinChat(sock, senderId, messageContent) {
    try {
        if (!messageContent || !messageContent.startsWith('.rinchat ')) return;
        
        const text = messageContent.substring(9).trim();
        const parts = text.split('|');
        const chatText = parts[0]?.trim() || 'Kosong';
        const imgUrl = parts[1]?.trim() || null;
        const time = parts[2]?.trim() || null;
        
        console.log(`💬 [handleRinChat] Membuat Rinchats: "${chatText}"`);
        
        const imagePath = await createRinChat(chatText, imgUrl, time);
        const imageBuffer = fs.readFileSync(imagePath);
        
        await sock.sendMessage(senderId, {
            image: imageBuffer
        });
        
        setTimeout(() => {
            try { fs.unlinkSync(imagePath); } catch (e) {}
        }, 5000);
        
    } catch (error) {
        console.error('❌ handleRinChat error:', error);
        await sock.sendMessage(senderId, { 
            text: `❌ *Gagal buat Rinchats!*\n\nError: ${error.message}`
        });
    }
}

// ============================================
// 📸 .igstory - INSTAGRAM STORY
// ============================================
export async function handleIgStory(sock, senderId, messageContent) {
    try {
        if (!messageContent || !messageContent.startsWith('.igstory ')) return;
        
        const text = messageContent.substring(9).trim();
        const parts = text.split('|');
        const fotoUrl = parts[0]?.trim() || 'https://d.uguu.se/spwhiPOZ.jpeg';
        const ppUrl = parts[1]?.trim() || 'https://o.uguu.se/lzeQTTMw.jpeg';
        const nama = parts[2]?.trim() || 'Someone';
        const username = parts[3]?.trim() || '@username';
        
        console.log(`📸 [handleIgStory] Membuat IG Story: "${nama}" | @${username}`);
        
        const imagePath = await createIgStory(fotoUrl, ppUrl, nama, username);
        const imageBuffer = fs.readFileSync(imagePath);
        
        await sock.sendMessage(senderId, {
            image: imageBuffer
        });
        
        setTimeout(() => {
            try { fs.unlinkSync(imagePath); } catch (e) {}
        }, 5000);
        
    } catch (error) {
        console.error('❌ handleIgStory error:', error);
        await sock.sendMessage(senderId, { 
            text: `❌ *Gagal buat IG Story!*\n\nError: ${error.message}`
        });
    }
}


// ============================================
// 🎴 .quote - QUOTE ANIME CARD
// ============================================
export async function handleQuote(sock, senderId, messageContent) {
    try {
        if (!messageContent || !messageContent.startsWith('.quote ')) return;
        
        const text = messageContent.substring(7).trim();
        const parts = text.split('|');
        const quoteText = parts[0]?.trim() || 'Kosong';
        const username = parts[1]?.trim() || 'Anonymous';
        const bgNumber = parseInt(parts[2]?.trim()) || 10;
        
        console.log(`🎴 [handleQuote] Membuat quote: "${quoteText}" | ${username} | bg: ${bgNumber}`);
        
        const imagePath = await createQuote(quoteText, username, bgNumber);
        const imageBuffer = fs.readFileSync(imagePath);
        
await sock.sendMessage(senderId, {
    image: imageBuffer,
    caption: `🎴 *QUOTE CARD*\n\n📝 ${quoteText}\n👤 ${username}`
});
        
        setTimeout(() => {
            try { fs.unlinkSync(imagePath); } catch (e) {}
        }, 5000);
        
    } catch (error) {
        console.error('❌ handleQuote error:', error);
        await sock.sendMessage(senderId, { 
            text: `❌ *Gagal buat quote!*\n\nError: ${error.message}`
        });
    }
}

// ============================================
// 💬 .waquote - WA QUOTE CHAT
// ============================================
export async function handleWAQuote(sock, senderId, messageContent) {
    try {
        if (!messageContent || !messageContent.startsWith('.waquote ')) return;
        
        const text = messageContent.substring(9).trim();
        const parts = text.split('|');
        const quoteText = parts[0]?.trim() || 'Kosong';
        const username = parts[1]?.trim() || 'Someone';
        const phone = parts[2]?.trim() || '+62 838-2312-6543';
        
        console.log(`💬 [handleWAQuote] Membuat WA quote: "${quoteText}" | ${username}`);
        
        const imagePath = await createWAQuote({
            text: quoteText,
            username: username,
            phone: phone,
            mode: 'dark'
        });
        const imageBuffer = fs.readFileSync(imagePath);
        
        await sock.sendMessage(senderId, {
            image: imageBuffer
        });
        
        setTimeout(() => {
            try { fs.unlinkSync(imagePath); } catch (e) {}
        }, 5000);
        
    } catch (error) {
        console.error('❌ handleWAQuote error:', error);
        await sock.sendMessage(senderId, { 
            text: `❌ *Gagal buat WA quote!*\n\nError: ${error.message}`
        });
    }
}

// ============================================
// 🎬 .bratvid - BRAT VIDEO/GIF
// ============================================
export async function handleBratVid(sock, senderId, messageContent) {
    try {
        if (!messageContent || !messageContent.startsWith('.bratvid ')) return;
        
        const text = messageContent.substring(9).trim();
        const parts = text.split('|');
        const bratText = parts[0]?.trim() || 'Brat';
        const theme = parts[1]?.trim() || 'white';
        const blur = parseInt(parts[2]?.trim()) || 0;
        
        console.log(`🎬 [handleBratVid] Membuat BRAT video: "${bratText}" | theme: ${theme} | blur: ${blur}`);
        
        const videoPath = await generateBratVideo({
            text: bratText,
            theme: theme,
            blur: blur,
            format: 'mp4',
            frameDuration: 0.35,
            holdDuration: 1.2
        });
        
        const videoBuffer = fs.readFileSync(videoPath);
        
        await sock.sendMessage(senderId, {
            video: videoBuffer,
        });
        
        setTimeout(() => {
            try { fs.unlinkSync(videoPath); } catch (e) {}
        }, 5000);
        
    } catch (error) {
        console.error('❌ handleBratVid error:', error);
        await sock.sendMessage(senderId, { 
            text: `❌ *Gagal buat BRAT video!*\n\nError: ${error.message}\n\nPastikan FFmpeg terinstall!`
        });
    }
}

// ============================================
// 🎭 .drake - DRAKE MEME
// ============================================
export async function handleDrake(sock, senderId, messageContent) {
    try {
        if (!messageContent || !messageContent.startsWith('.drake ')) {
            return;
        }
        
        const text = messageContent.substring(7).trim();
        
        if (!text || text.length < 1) {
            await sock.sendMessage(senderId, { 
                text: '❌ *Teksnya mana?*\n\nContoh: .drake Femboy|Tomboy'
            });
            return;
        }
        
        const parts = text.split('|');
        const teks1 = parts[0]?.trim() || 'Teks 1';
        const teks2 = parts[1]?.trim() || 'Teks 2';
        
        console.log(`🎭 [handleDrake] Membuat Drake Meme: "${teks1}" | "${teks2}"`);
        
        const imagePath = await createDrakeMeme(teks1, teks2);
        const imageBuffer = fs.readFileSync(imagePath);
        
        await sock.sendMessage(senderId, {
            image: imageBuffer
        });
        
        console.log('✅ Drake Meme terkirim!');
        
        setTimeout(() => {
            try { fs.unlinkSync(imagePath); } catch (e) {}
        }, 5000);
        
    } catch (error) {
        console.error('❌ handleDrake error:', error);
        await sock.sendMessage(senderId, { 
            text: `❌ *Gagal buat Drake Meme!*\n\nError: ${error.message}`
        });
    }
}

// ============================================
// 🔘 .button - TWO BUTTONS MEME
// ============================================
export async function handleTwoButtons(sock, senderId, messageContent) {
    try {
        if (!messageContent || !messageContent.startsWith('.button ')) {
            return;
        }
        
        const text = messageContent.substring(7).trim();
        
        if (!text || text.length < 1) {
            await sock.sendMessage(senderId, { 
                text: '❌ *Teksnya mana?*\n\nContoh: .button Red bull|Mercedes|GWH'
            });
            return;
        }
        
        const parts = text.split('|');
        const teks1 = parts[0]?.trim() || 'Teks 1';
        const teks2 = parts[1]?.trim() || 'Teks 2';
        const teks3 = parts[2]?.trim() || 'Teks 3';
        
        console.log(`🔘 [handleTwoButtons] Membuat Two Buttons Meme: "${teks1}" | "${teks2}" | "${teks3}"`);
        
        const imagePath = await createTwoButtonsMeme(teks1, teks2, teks3);
        const imageBuffer = fs.readFileSync(imagePath);
        
        await sock.sendMessage(senderId, {
            image: imageBuffer
        });
        
        console.log('✅ Two Buttons Meme terkirim!');
        
        setTimeout(() => {
            try { fs.unlinkSync(imagePath); } catch (e) {}
        }, 5000);
        
    } catch (error) {
        console.error('❌ handleTwoButtons error:', error);
        await sock.sendMessage(senderId, { 
            text: `❌ *Gagal buat Two Buttons Meme!*\n\nError: ${error.message}`
        });
    }
}

export async function handleUnknown(sock, senderId, messageContent) {
    await sock.sendMessage(senderId, { 
        text: `❌ Command *${messageContent}* tidak dikenal.\n\nKetik *.menu* untuk melihat daftar command!`
    });
}