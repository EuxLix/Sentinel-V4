// Dosya Yolu: utils/moderationHelper.js
const { hasPermission } = require('./permissionHelper');

/**
 * Bir komutun hedeflediği üyeyi mesajdan bulur (etiket veya ID).
 * @param {import('discord.js').Message} message - Komutun kullanıldığı mesaj.
 * @param {Array<string>} args - Komut argümanları.
 * @returns {Promise<import('discord.js').GuildMember|null>} - Hedef üye veya bulunamazsa null.
 */
async function getTargetMember(message, args) {
    const targetId = args[0]?.match(/\d{17,19}/)?.[0];
    if (!targetId) return null;

    try {
        // fetch metodu her zaman en güncel veriyi getirir.
        return await message.guild.members.fetch(targetId);
    } catch (error) {
        // Kullanıcı sunucuda bulunamadığında hata döner, null ile karşılıyoruz.
        return null;
    }
}

/**
 * Moderatörün hedef üyeye işlem yapıp yapamayacağını hiyerarşik olarak kontrol eder.
 * @param {import('discord.js').GuildMember} moderator - İşlemi yapan moderatör.
 * @param {import('discord.js').GuildMember} target - İşlem yapılacak hedef üye.
 * @returns {{canAct: boolean, reason: string|null}} - İşlem yapılıp yapılamayacağı ve sebebi.
 */
function checkHierarchy(moderator, target) {
    const guild = moderator.guild;

    if (target.id === guild.ownerId) {
        return { canAct: false, reason: 'Sunucu sahibine işlem yapamazsın!' };
    }
    if (target.id === moderator.id) {
        return { canAct: false, reason: 'Kendine işlem yapamazsın!' };
    }
    if (target.id === moderator.client.user.id) {
        return { canAct: false, reason: 'Bana işlem yapamazsın!' };
    }
    // Sunucu sahibi hiyerarşi kontrolünden muaftır.
    if (moderator.roles.highest.position <= target.roles.highest.position && guild.ownerId !== moderator.id) {
        return { canAct: false, reason: 'Kendi rolünden daha yüksek veya aynı seviyedeki bir üyeye işlem yapamazsın.' };
    }
    if (guild.members.me.roles.highest.position <= target.roles.highest.position) {
        return { canAct: false, reason: 'Bu üyeye işlem yapamam. Rolü benim rolümden daha yüksek veya aynı seviyede.' };
    }

    return { canAct: true, reason: null };
}

/**
 * YENİ FONKSİYON: Bir moderasyon eyleminin yapılabilirliğini tek seferde kontrol eder.
 * Önce komut iznini, sonra hiyerarşiyi kontrol eder.
 * @param {import('discord.js').Client} client - Discord client nesnesi.
 * @param {import('discord.js').GuildMember} moderator - İşlemi yapan moderatör.
 * @param {import('discord.js').GuildMember} target - İşlem yapılacak hedef üye.
 * @param {import('discord.js').PermissionResolvable} requiredPermission - Komut için gereken Discord izni.
 * @returns {{canAct: boolean, reason: string|null}} - İşlem yapılıp yapılamayacağı ve nedeni.
 */
function checkModerationAction(client, moderator, target, requiredPermission) {
    // 1. Genel İzin Kontrolü (Önbellek üzerinden çalışır)
    const hasPerm = hasPermission(client, moderator, requiredPermission);
    if (!hasPerm) {
        return { canAct: false, reason: 'Bu komutu kullanmak için gerekli yetkiye (veya görevli rolüne) sahip değilsin.' };
    }

    // 2. Hiyerarşi Kontrolü
    const hierarchyCheck = checkHierarchy(moderator, target);
    if (!hierarchyCheck.canAct) {
        return hierarchyCheck;
    }

    // Tüm kontrollerden geçti
    return { canAct: true, reason: null };
}


module.exports = { getTargetMember, checkHierarchy, checkModerationAction };