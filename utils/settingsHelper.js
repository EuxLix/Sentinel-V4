// Dosya Yolu: utils/settingsHelper.js
const GuildSettings = require('../models/GuildSettings');

/**
 * Bir sunucunun ayarlarını önbellekten getirir.
 * Ayar yoksa, varsayılan değerleri içeren boş bir nesne döndürür.
 * @param {import('discord.js').Client} client - Discord client nesnesi.
 * @param {string} guildId - Sunucunun Discord ID'si.
 * @returns {object} Sunucunun ayarlarını içeren sade bir JavaScript nesnesi.
 */
function getGuildSettings(client, guildId) {
    // Önbellekten veriyi al. Yoksa, sahte boş ayar döndür ki kod hata vermesin.
    return client.guildSettings.get(guildId) || {
        guildId,
        logChannelId: null,
        welcomeChannelId: null,
        welcomeEnabled: false,
        autoRoleId: null,
        autoRoleEnabled: false,
        modRoleId: null,
        privateRoomsCategoryId: null,
        joinToCreateChannelId: null,
    };
}

/**
 * Bir sunucunun belirli bir ayarını günceller.
 * Güncelleme hem veritabanına hem de önbelleğe anında yansıtılır.
 * @param {import('discord.js').Client} client - Discord client nesnesi.
 * @param {string} guildId - Sunucunun Discord ID'si.
 * @param {string} key - Güncellenecek ayarın adı (örn: 'logChannelId').
 * @param {*} value - Ayarın yeni değeri.
 * @returns {Promise<object>} Sunucunun güncellenmiş tüm ayarları.
 */
async function updateGuildSetting(client, guildId, key, value) {
    const update = { [key]: value };

    // Veritabanını güncelle veya yeni kayıt oluştur.
    const newSettings = await GuildSettings.findOneAndUpdate(
        { guildId },
        { $set: update },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    // Önbelleği de anında güncelle.
    client.guildSettings.set(guildId, newSettings);
    
    return newSettings;
}

module.exports = { getGuildSettings, updateGuildSetting };