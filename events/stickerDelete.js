// Dosya Yolu: events/stickerDelete.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'stickerDelete',
    async execute(sticker, client) { // Client parametresi eklendi
        const { guild, id, name, url } = sticker;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.StickerDelete, id);

        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('Log: Çıkartma Silindi')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .setThumbnail(url)
            .addFields(
                { name: 'Silinen Çıkartma Adı', value: `\`${name}\``, inline: true },
                { name: 'Çıkartma ID', value: `\`${id}\``, inline: true }
            )
            .setTimestamp();
        
        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};