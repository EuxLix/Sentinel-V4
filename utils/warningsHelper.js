// Dosya Yolu: utils/warningsHelper.js
const Warning = require('../models/Warning.js'); // .js uzantısını ekledik
const { randomUUID } = require('crypto'); // Benzersiz ID için

async function addWarning(guildId, userId, moderatorId, reason) {
    try {
        const newWarning = await Warning.create({
            guildId,
            userId,
            moderatorId,
            reason,
            warningId: randomUUID(), // Rastgele benzersiz bir ID oluştur
        });
        return newWarning;
    } catch (error) {
        console.error('Veritabanına uyarı eklenirken hata oluştu:', error);
        return null;
    }
}

async function getWarnings(guildId, userId) {
    try {
        // .lean() metodu daha hızlı sonuçlar için saf JavaScript objeleri döndürür
        return await Warning.find({ guildId, userId }).sort({ timestamp: -1 }).lean();
    } catch (error) {
        console.error('Veritabanından uyarılar alınırken hata oluştu:', error);
        return [];
    }
}

async function deleteWarning(guildId, userId, warningId) {
    try {
        const result = await Warning.deleteOne({ guildId, userId, warningId });
        return result.deletedCount > 0;
    } catch (error) {
        console.error('Veritabanından uyarı silinirken hata oluştu:', error);
        return false;
    }
}

// Toplu uyarı silme komutu için yeni bir fonksiyon
async function deleteAllWarnings(guildId) {
    try {
        const result = await Warning.deleteMany({ guildId });
        return result.deletedCount;
    } catch (error) {
        console.error('Toplu uyarı silinirken hata oluştu:', error);
        return 0;
    }
}


module.exports = { addWarning, getWarnings, deleteWarning, deleteAllWarnings };
