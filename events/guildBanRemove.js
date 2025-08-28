// Dosya Yolu: events/guildBanRemove.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'guildBanRemove',
    async execute(ban, client) { // Client parametresi eklendi
        const { guild, user } = ban;

        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.MemberBanRemove, user.id);

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('Log: Kullanıcı Yasağı Kaldırıldı')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .setDescription(`**Yasağı Kaldırılan:** ${user.tag} (\`${user.id}\`)`)
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
    },
};