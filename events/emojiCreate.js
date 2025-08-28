// Dosya Yolu: events/emojiCreate.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'emojiCreate',
    async execute(emoji, client) { // 1. Client parametresini ekle
        const { guild } = emoji;
        
        // 2. Ayarları client üzerinden, önbellekten oku
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.EmojiCreate, emoji.id);

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('Log: Emoji Oluşturuldu')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .setThumbnail(emoji.url)
            .addFields(
                { name: 'Emoji', value: `${emoji}`, inline: true },
                { name: 'Emoji Adı', value: `\`${emoji.name}\``, inline: true }
            )
            .setTimestamp();
        
        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};