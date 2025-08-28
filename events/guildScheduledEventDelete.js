// Dosya Yolu: events/guildScheduledEventDelete.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'guildScheduledEventDelete',
    async execute(guildScheduledEvent, client) { // Client parametresi eklendi
        const { guild, id, name, creatorId } = guildScheduledEvent;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.GuildScheduledEventDelete, id);

        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('Log: Etkinlik İptal Edildi')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .addFields(
                { name: 'İptal Edilen Etkinlik', value: `\`${name}\`` },
                { name: 'Oluşturan', value: `<@${creatorId}>`, inline: true },
                { name: 'Etkinlik ID', value: `\`${id}\``, inline: true }
            )
            .setTimestamp();
        
        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};