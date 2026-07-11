// ============================================
// 🛠️ UTILS - FUNGSI BANTU
// ============================================

/**
 * Reply ke pesan user (QUOTED) - PAKE CARA YANG BENER
 */
export async function replyToMessage(sock, chatId, rawMessage, text) {
    try {
        if (!rawMessage?.key) {
            await sock.sendMessage(chatId, { text });
            console.log('✅ Reply terkirim (tanpa quote)!');
            return;
        }
        
        // PAKE CARA YANG LU KASIH: { quoted: rawMessage }
        await sock.sendMessage(chatId, { text: text }, { quoted: rawMessage });
        console.log('✅ Reply terkirim (DENGAN QUOTE)!');
    } catch (error) {
        console.error('❌ Gagal reply:', error.message);
        await sock.sendMessage(chatId, { text });
    }
}

/**
 * Kasih reaction ke pesan user (EMOJI) - PAKE CARA YANG BENER
 */
export async function reactToMessage(sock, rawMessage, emoji = '🔄') {
    try {
        if (!rawMessage?.key) {
            console.log('⚠️ Gak ada key buat reaction');
            return;
        }
        
        // PAKE CARA YANG LU KASIH
        await sock.sendMessage(rawMessage.key.remoteJid || rawMessage.chat, {
            react: {
                text: emoji,
                key: rawMessage.key
            }
        });
        console.log(`✅ Reaction ${emoji} terkirim!`);
    } catch (error) {
        console.error('❌ Gagal reaction:', error.message);
    }
}