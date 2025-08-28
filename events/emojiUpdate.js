// Dosya Yolu: events/emojiUpdate.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'emojiUpdate',
    async execute(oldEmoji, newEmoji, client) { // Client parametresi eklendi
        const { guild } = newEmoji;
        if (oldEmoji.name === newEmoji.name) return;
        
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.EmojiUpdate, newEmoji.id);

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('Log: Emoji Güncellendi')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .setThumbnail(newEmoji.url)
            .addFields(
                { name: 'Emoji', value: `${newEmoji}`, inline: false },
                { name: 'Eski İsim', value: `\`${oldEmoji.name}\``, inline: true },
                { name: 'Yeni İsim', value: `\`${newEmoji.name}\``, inline: true }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};