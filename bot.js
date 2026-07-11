// ============================================
// 🚀 bot.js - JHON BOT
// ============================================

import { WhatsAppBot } from 'whatsapp-automator';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

dotenv.config();

// ============================================
// 📦 IMPORT MODULES
// ============================================
import { CONFIG, ALLOWED_GROUPS, setAllowedGroups, botStatus } from './src/config.js';
import { 
    handleMenu, 
    handleStiker,
    handleDrake,
    handleTwoButtons,
    handleQuote,
    handleWAQuote,
    handleBratVid,
    handleRinChat,
    handleIgStory,
    handleTikTokChat,
    handleDownload,

    handleUnknown
} from './src/commands.js';

// ============================================
// 📋 READLINE UNTUK INPUT TERMINAL
// ============================================
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

let botInstance = null;
let sock = null;
let isGroupSelected = false;

// ============================================
// 🔄 FUNGSI AMBIL GRUP DENGAN RETRY
// ============================================
async function fetchGroupsWithRetry(sock, maxRetries = 5, delay = 3000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`📊 Mencoba ambil daftar grup (percobaan ${i + 1}/${maxRetries})...`);
            const groupChats = await sock.groupFetchAllParticipating();
            const groups = Object.values(groupChats || {});
            
            if (groups.length > 0) {
                console.log(`✅ ${groups.length} grup ditemukan!`);
                return groups;
            }
            
            console.log('⚠️ Belum ada grup, tunggu sebentar...');
        } catch (error) {
            console.log(`⚠️ Gagal ambil grup: ${error.message}`);
        }
        
        if (i < maxRetries - 1) {
            console.log(`⏳ Tunggu ${delay/1000} detik sebelum coba lagi...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    return null;
}

async function selectGroup(groups) {
    console.log('\n' + '='.repeat(50));
    console.log('📋 DAFTAR GRUP YANG TERSEDIA:');
    console.log('='.repeat(50));
    
    groups.forEach((g, i) => {
        console.log(`  ${i + 1}. ${g.subject || 'Grup Tanpa Nama'}`);
        console.log(`     ID: ${g.id}`);
        console.log(`     👥 ${g.participants?.length || 0} anggota`);
        console.log('');
    });
    
    console.log('='.repeat(50));
    
    let selected = null;
    while (!selected) {
        const answer = await question('🔢 Pilih nomor grup (1-' + groups.length + '): ');
        const index = parseInt(answer) - 1;
        
        if (index >= 0 && index < groups.length) {
            selected = groups[index];
        } else {
            console.log('❌ Pilihan tidak valid! Coba lagi.');
        }
    }
    
    console.log('\n✅ Grup dipilih:');
    console.log(`   📱 Nama: ${selected.subject || 'Grup Tanpa Nama'}`);
    console.log(`   🆔 ID: ${selected.id}`);
    console.log(`   👥 Anggota: ${selected.participants?.length || 0}`);
    console.log('='.repeat(50));
    
    setAllowedGroups([selected.id]);
    console.log(`✅ Grup ${selected.id} berhasil disimpan!`);
    console.log('🚀 Bot sekarang aktif di grup tersebut!\n');
    
    isGroupSelected = true;
    return selected;
}

// ============================================
// 📞 FUNGSI GANTI NOMOR
// ============================================
async function changeNumber() {
    console.log('\n' + '='.repeat(50));
    console.log('📞 *GANTI NOMOR BOT*');
    console.log('='.repeat(50));
    console.log('⚠️ PERINGATAN:');
    console.log('   - Nomor saat ini akan di-logout');
    console.log('   - Anda harus scan QR Code dengan nomor baru');
    console.log('   - Grup yang dipilih akan direset');
    console.log('='.repeat(50));
    
    const confirm = await question('❓ Yakin ingin ganti nomor? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
        console.log('❌ Ganti nomor dibatalkan.\n');
        return;
    }
    
    console.log('🔄 Menghentikan bot...');
    if (botInstance) {
        botInstance = null;
        sock = null;
    }
    
    const authPath = path.join(process.cwd(), 'auth_info');
    if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log('✅ Session lama dihapus!');
    }
    
    setAllowedGroups([]);
    isGroupSelected = false;
    botStatus.isConnected = false;
    
    console.log('✅ Siap untuk nomor baru!');
    console.log('🔄 Restart bot dengan perintah: node bot.js');
    console.log('📱 Scan QR Code dengan nomor baru.\n');
    
    process.exit(0);
}

// ============================================
// 🚀 START BOT
// ============================================
async function startBot() {
    console.log('🚀 STARTING JHON BOT...');
    console.log('='.repeat(40));
    
    try {
        const hasSession = fs.existsSync(path.join(process.cwd(), 'auth_info', 'creds.json'));
        
        console.log('\n📌 MENU TERMINAL:');
        console.log('   [1] Jalankan Bot');
        console.log('   [2] Ganti Nomor');
        console.log('   [3] Keluar');
        console.log('='.repeat(40));
        
        const menuChoice = await question('🔢 Pilih menu (1-3): ');
        
        if (menuChoice === '2') {
            await changeNumber();
            return;
        } else if (menuChoice === '3') {
            console.log('👋 Keluar...');
            process.exit(0);
            return;
        } else if (menuChoice !== '1') {
            console.log('❌ Pilihan tidak valid! Jalankan bot default...');
        }
        
        botInstance = new WhatsAppBot({
            onQR: async (qr) => {
                if (hasSession) {
                    console.log('📱 Session ditemukan! Bot akan langsung konek tanpa scan.');
                    console.log('💡 Kalo mau ganti nomor, pilih menu [2] Ganti Nomor.\n');
                } else {
                    console.log('\n📱 SCAN QR CODE INI DENGAN WHATSAPP:\n');
                    console.log(qr);
                    console.log('\n' + '='.repeat(40));
                    console.log('💡 Scan QR code di atas dengan WhatsApp HP');
                    console.log('📌 CUKUP SCAN SEKALI SAJA!');
                    console.log('='.repeat(40) + '\n');
                }
            },
            onMessage: async ({ sock: s, messageContent, senderId, isGroup }) => {
                console.log(`\n📨 [PESAN] Dari: ${senderId}`);
                console.log(`📨 Isi: ${messageContent}`);
                console.log(`📨 Grup: ${isGroup ? '✅' : '❌'}`);
                
                if (!isGroup) {
                    console.log('⏭️ Bukan dari grup, diabaikan');
                    return;
                }
                
                if (!ALLOWED_GROUPS.includes(senderId)) {
                    console.log(`⏭️ Grup ${senderId} tidak diizinkan`);
                    return;
                }
                
                console.log('✅ Grup diizinkan! Memproses...');
                
                if (messageContent && messageContent.startsWith('.')) {
                    if (messageContent.trim() === '.menu') {
                        await handleMenu(s, senderId, messageContent);
                    } else if (messageContent.startsWith('.stiker ')) {
                        await handleStiker(s, senderId, messageContent);
                    } else if (messageContent.startsWith('.drake ')) {
                        await handleDrake(s, senderId, messageContent);
                    } else if (messageContent.startsWith('.button ')) {
                        await handleTwoButtons(s, senderId, messageContent);
                    } else if (messageContent.startsWith('.quote ')) {
                        await handleQuote(s, senderId, messageContent);
                    } else if (messageContent.startsWith('.waquote ')) {
                        await handleWAQuote(s, senderId, messageContent);
                    } else if (messageContent.startsWith('.bratvid ')) {
                        await handleBratVid(s, senderId, messageContent);
                    } else if (messageContent.startsWith('.rinchat ')) {
                        await handleRinChat(s, senderId, messageContent);
                    } else if (messageContent.startsWith('.igstory ')) {
                        await handleIgStory(s, senderId, messageContent);
                    } else if (messageContent.startsWith('.tiktokchat ')) {
                        await handleTikTokChat(s, senderId, messageContent);
                    } else if (messageContent.startsWith('.download ')) {
                        await handleDownload(s, senderId, messageContent);
                    } else {
                        
                        await handleUnknown(s, senderId, messageContent);
                    }
                }
                 else {
                    console.log('⏭️ Bukan command, diabaikan');
                }
            }
        });
        
        sock = await botInstance.start();
        
        console.log('\n' + '='.repeat(40));
        console.log(`✅ ${CONFIG.botName} ONLINE!`);
        console.log(`👑 Owner: ${CONFIG.owner}`);
        console.log(`📱 Nomor: ${sock?.user?.id?.split(':')[0] || '-'}`);
        console.log('='.repeat(40));
        
        if (ALLOWED_GROUPS.length > 0) {
            console.log(`\n📌 Grup sudah dipilih sebelumnya: ${ALLOWED_GROUPS[0]}`);
            console.log('🚀 Bot langsung aktif!\n');
            
            console.log('🔥 COMMAND YANG TERSEDIA:');
            console.log('   .menu        - Tampilkan menu');
            console.log('   .stiker [teks] - Buat stiker BRAT');
            console.log('   .drake [teks1]|[teks2] - Buat Drake Meme');
            console.log('   .button [teks1]|[teks2]|[teks3] - Buat Two Buttons Meme');
            console.log('   .quote [teks]|[username]|[bg] - Quote Anime Card');
            console.log('   .waquote [teks]|[username]|[phone] - WA Quote Chat');
            console.log('   .bratvid [teks]|[theme]|[blur] - BRAT Video/GIF');
            console.log('='.repeat(40));
            console.log('💀 GASKEUN BRO! 🔥\n');
            
            isGroupSelected = true;
            botStatus.isConnected = true;
            return { success: true };
        }
        
        console.log('\n📊 MENGAMBIL DAFTAR GRUP...');
        
        const groups = await fetchGroupsWithRetry(sock, 5, 3000);
        
        if (groups && groups.length > 0) {
            await selectGroup(groups);
            
            console.log('🔥 COMMAND YANG TERSEDIA:');
            console.log('   .menu        - Tampilkan menu');
            console.log('   .stiker [teks] - Buat stiker BRAT');
            console.log('   .drake [teks1]|[teks2] - Buat Drake Meme');
            console.log('   .button [teks1]|[teks2]|[teks3] - Buat Two Buttons Meme');
            console.log('   .quote [teks]|[username]|[bg] - Quote Anime Card');
            console.log('   .waquote [teks]|[username]|[phone] - WA Quote Chat');
            console.log('   .bratvid [teks]|[theme]|[blur] - BRAT Video/GIF');
            console.log('='.repeat(40));
            console.log('💀 GASKEUN BRO! 🔥\n');
        } else {
            console.log('⚠️ Tidak ada grup ditemukan.');
            console.log('💡 Pastikan nomor sudah masuk ke minimal 1 grup.');
            console.log('📌 Ketik .menu di grup setelah bot ditambahkan.\n');
            isGroupSelected = false;
        }
        
        botStatus.isConnected = true;
        
        return { success: true };
    } catch (error) {
        console.error('❌ Error start bot:', error);
        botStatus.isConnected = false;
        return { success: false, error: error.message };
    }
}

// ============================================
// 🚀 JALANKAN BOT
// ============================================
startBot();

// ============================================
// 🧹 CLEANUP
// ============================================
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down JHON BOT...');
    rl.close();
    if (botInstance) {
        // Clean up
    }
    process.exit(0);
});

export { startBot, sock, botInstance };