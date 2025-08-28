// Dosya Yolu: events/emojiDelete.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'emojiDelete',
    async execute(emoji, client) { // Client parametresi eklendi
        const { guild } = emoji;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.EmojiDelete, emoji.id);

        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('Log: Emoji Silindi')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .setThumbnail(emoji.url)
            .addFields(
                { name: 'Silinen Emoji Adı', value: `\`${emoji.name}\``, inline: true },
                { name: 'Emoji ID', value: `\`${emoji.id}\``, inline: true }
            )
            .setTimestamp();
        
        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};