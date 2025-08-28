// Dosya Yolu: events/guildScheduledEventCreate.js
const { AuditLogEvent, EmbedBuilder, GuildScheduledEventEntityType } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

const eventLocations = {
    [GuildScheduledEventEntityType.StageInstance]: 'Sahne Kanalı',
    [GuildScheduledEventEntityType.Voice]: 'Ses Kanalı',
    [GuildScheduledEventEntityType.External]: 'Harici Konum',
};

module.exports = {
    name: 'guildScheduledEventCreate',
    async execute(guildScheduledEvent, client) { // Client parametresi eklendi
        const { guild, id, name, channel, scheduledStartTimestamp } = guildScheduledEvent;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.GuildScheduledEventCreate, id);
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('Log: Etkinlik Oluşturuldu')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .addFields(
                { name: 'Etkinlik Adı', value: `\`${name}\``},
                { name: 'Başlangıç', value: `<t:${Math.floor(scheduledStartTimestamp / 1000)}:F>`},
                { name: 'Konum', value: `${channel || guildScheduledEvent.entityMetadata.location || 'Bilinmiyor'}`, inline: true },
                { name: 'Oluşturan', value: `<@${guildScheduledEvent.creatorId}>`, inline: true }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};