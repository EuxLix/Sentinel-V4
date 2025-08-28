// Dosya Yolu: events/threadUpdate.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'threadUpdate',
    async execute(oldThread, newThread, client) { // Client parametresi eklendi
        const { guild, id } = newThread;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.ThreadUpdate, id);

        const changes = [];
        if (oldThread.name !== newThread.name) {
            changes.push(`**İsim:** \`${oldThread.name}\` → \`${newThread.name}\``);
        }
        if (oldThread.archived !== newThread.archived) {
            changes.push(`**Arşiv Durumu:** \`${oldThread.archived ? 'Arşivli' : 'Aktif'}\` → \`${newThread.archived ? 'Arşivli' : 'Aktif'}\``);
        }
        if (oldThread.locked !== newThread.locked) {
            changes.push(`**Kilit Durumu:** \`${oldThread.locked ? 'Kilitli' : 'Açık'}\` → \`${newThread.locked ? 'Kilitli' : 'Açık'}\``);
        }

        if (changes.length === 0) return;

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('Log: Konu Güncellendi')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .setDescription(`**Konu:** ${newThread}\n\n${changes.join('\n')}`)
            .setTimestamp();
        
        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};