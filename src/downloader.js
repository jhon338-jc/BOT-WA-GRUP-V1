// ============================================
// 📥 DOWNLOADER - DOWNLOAD GAMBAR DARI URL
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function downloadImage(imageUrl) {
    try {
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Ambil nama file dari URL
        const urlObj = new URL(imageUrl);
        let fileName = path.basename(urlObj.pathname);
        
        // Kalo gak ada ekstensi, tambahin .jpg
        if (!fileName.includes('.')) {
            fileName = `${fileName}.jpg`;
        }

        // Cegah path traversal
        fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '');
        
        const filePath = path.join(tempDir, fileName);

        const res = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Gagal download gambar`);
        }

        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        const stats = fs.statSync(filePath);
        
        console.log(`✅ Gambar didownload: ${fileName} (${(stats.size / 1024).toFixed(2)} KB)`);
        
        return filePath;

    } catch (error) {
        console.error('❌ Error downloadImage:', error.message);
        throw new Error(`Gagal download gambar: ${error.message}`);
    }
}