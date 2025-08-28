// Dosya Yolu: events/inviteDelete.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'inviteDelete',
    async execute(invite, client) { // Client parametresi eklendi
        const { guild, code, channel } = invite;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.InviteDelete, null);

        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('Log: Davet Silindi')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .addFields(
                { name: 'Silinen Davet Kodu', value: `\`${code}\``, inline: true },
                { name: 'Hedef Kanal', value: `${channel || 'Bilinmiyor'}`, inline: true }
            )
            .setTimestamp();
        
        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};