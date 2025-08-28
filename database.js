// Dosya Yolu: utils/database.js
const mongoose = require('mongoose');

async function connectDatabase() {
    if (!process.env.MONGO_URI) {
        console.error('[HATA] MONGO_URI .env dosyasında bulunamadı! Veritabanı bağlantısı kurulamıyor.');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('[VERİTABANI] MongoDB Atlas\'a başarıyla bağlanıldı.');
    } catch (error) {
        console.error('[HATA] MongoDB bağlantısı sırasında kritik bir hata oluştu:', error);
        process.exit(1);
    }
}

module.exports = connectDatabase;