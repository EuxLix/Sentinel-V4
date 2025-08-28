// Dosya Yolu: events/guildScheduledEventUpdate.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'guildScheduledEventUpdate',
    async execute(oldEvent, newEvent, client) { // Client parametresi eklendi
        const { guild, id, name, url } = newEvent;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.GuildScheduledEventUpdate, id);
        const changes = [];
        if (oldEvent.name !== newEvent.name) {
            changes.push(`**İsim:** \`${oldEvent.name}\` → \`${newEvent.name}\``);
        }
        if (oldEvent.status !== newEvent.status) {
             changes.push(`**Durum:** \`${oldEvent.status}\` → \`${newEvent.status}\``);
        }
        if (changes.length === 0) return;

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('Log: Etkinlik Güncellendi')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .setDescription(`**Etkinlik:** [${name}](${url})\n\n${changes.join('\n')}`)
            .setTimestamp();
            
        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};