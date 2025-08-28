// Dosya Yolu: utils/permissionHelper.js
const { getGuildSettings } = require("./settingsHelper");

/**
 * Bir üyenin belirli bir komutu kullanmak için gerekli izne sahip olup olmadığını kontrol eder.
 * Kontrol sırası: Sunucu sahibi mi? -> Genel izni var mı? -> Görevli rolü var mı?
 * @param {import('discord.js').Client} client - Discord client nesnesi.
 * @param {import('discord.js').GuildMember} member - Yetkisi kontrol edilecek üye.
 * @param {import('discord.js').PermissionResolvable} requiredPermission - Gerekli olan Discord yetkisi.
 * @returns {boolean} - Üyenin izni olup olmadığı.
 */
function hasPermission(client, member, requiredPermission) {
    // 1. Sunucu sahibi her zaman tüm izinlere sahiptir.
    if (member.id === member.guild.ownerId) return true;

    // 2. Üyenin Discord'un kendi izin sistemindeki yetkilerini kontrol et.
    if (member.permissions.has(requiredPermission)) return true;

    // 3. Önbelleğe alınmış sunucu ayarlarından "Görevli" rolünü kontrol et.
    // Bu işlem artık veritabanına gitmez, anında sonuç verir.
    const guildSettings = getGuildSettings(client, member.guild.id);
    const modRoleId = guildSettings.modRoleId;

    if (!modRoleId) return false;

    // Üyenin görevli rolüne sahip olup olmadığını kontrol et.
    return member.roles.cache.has(modRoleId);
}

/**
 * Guard sistemleri için beyaz liste (whitelist) kontrolü.
 * @param {import('discord.js').Guild} guild - Sunucu nesnesi.
 * @param {string} userId - Kontrol edilecek kullanıcının ID'si.
 * @returns {boolean} - Kullanıcının beyaz listede olup olmadığı.
 */
function isWhitelisted(guild, userId) {
    // .env dosyasından beyaz listeyi al.
    const whitelistedIds = (process.env.WHITELISTED_IDS || "").split(",");

    // Sunucu sahibi ve botun kendisi her zaman beyaz listededir.
    if (userId === guild.ownerId || userId === guild.client.user.id) {
        return true;
    }

    // Kullanıcının ID'sinin beyaz listede olup olmadığını kontrol et.
    return whitelistedIds.map((id) => id.trim()).includes(userId);
}

module.exports = { hasPermission, isWhitelisted };