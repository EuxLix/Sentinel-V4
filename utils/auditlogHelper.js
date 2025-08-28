// Dosya Yolu: utils/auditlogHelper.js
const { PermissionsBitField } = require('discord.js');

async function fetchExecutor(guild, eventType, targetId) {
    // İzin kontrolü her zaman önemlidir.
    if (!guild.members.me?.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
        console.error(`[İzin Hatası] '${guild.name}' sunucusunda 'Denetim Kaydını Görüntüle' izni YOK!`);
        return null;
    }

    try {
        // Son 10 kaydı getirerek olası gecikmelere karşı önlem alalım.
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 10,
            type: eventType,
        });

        // Gelen loglar içinde bizim aradığımız hedef ID'ye sahip olanı bul.
        // ZAMAN KONTROLÜNÜ TAMAMEN KALDIRDIK.
        const auditEntry = fetchedLogs.entries.find(entry => entry.targetId === targetId);

        // Eğer bir eşleşme bulunduysa, işlemi yapan kişiyi döndür.
        return auditEntry ? auditEntry.executor : null;

    } catch (error) {
        console.error(`[Yardımcı Fonksiyon HATA] Denetim kaydı getirilirken hata oluştu:`, error);
        return null;
    }
}

module.exports = { fetchExecutor };