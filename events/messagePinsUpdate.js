// Dosya Yolu: events/messagePinsUpdate.js
const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'messagePinsUpdate',
    async execute(channel, time, client) { // Client parametresi eklendi
        const { guild } = channel;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const pinExecutor = await fetchExecutor(guild, AuditLogEvent.MessagePin, channel.id);
        const unpinExecutor = await fetchExecutor(guild, AuditLogEvent.MessageUnpin, channel.id);
        const executor = pinExecutor || unpinExecutor;

        const embed = new EmbedBuilder()
            .setColor('#FEE75C')
            .setTitle('Log: Sabitlenmiş Mesajlar Güncellendi')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .setDescription(`**Kanal:** ${channel}`)
            .addFields({ name: 'Eylem Zamanı', value: `<t:${Math.floor(time / 1000)}:R>` })
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};