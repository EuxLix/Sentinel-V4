// Dosya Yolu: events/stickerUpdate.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'stickerUpdate',
    async execute(oldSticker, newSticker, client) { // Client parametresi eklendi
        const { guild, url } = newSticker;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.StickerUpdate, newSticker.id);
        
        const changes = [];
        if (oldSticker.name !== newSticker.name) {
            changes.push(`**İsim:** \`${oldSticker.name}\` → \`${newSticker.name}\``);
        }
        if (oldSticker.description !== newSticker.description) {
            changes.push(`**Açıklama:** \`${oldSticker.description || 'Yok'}\` → \`${newSticker.description || 'Yok'}\``);
        }
        if (oldSticker.tags !== newSticker.tags) {
            changes.push(`**İlişkili Emoji:** \`:${oldSticker.tags}:\` → \`:${newSticker.tags}:\``);
        }
        
        if (changes.length === 0) return;
        
        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('Log: Çıkartma Güncellendi')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .setThumbnail(url)
            .setDescription(changes.join('\n'))
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};