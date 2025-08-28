// Dosya Yolu: events/inviteCreate.js
const { EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');

function formatMaxAge(seconds) {
    if (seconds === 0) return 'Kalıcı';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor(seconds % 86400 / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const parts = [];
    if (d > 0) parts.push(`${d} gün`);
    if (h > 0) parts.push(`${h} saat`);
    if (m > 0) parts.push(`${m} dakika`);
    return parts.join(', ') || 'Belirtilmemiş';
}

module.exports = {
    name: 'inviteCreate',
    async execute(invite, client) { // Client parametresi eklendi
        if (!invite.inviter || !invite.channel) return;

        const { guild, inviter, code, channel, maxUses, maxAge } = invite;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('Log: Davet Oluşturuldu')
            .setAuthor({ name: inviter.tag, iconURL: inviter.displayAvatarURL() })
            .addFields(
                { name: 'Oluşturan', value: `${inviter}`, inline: true },
                { name: 'Hedef Kanal', value: `${channel}`, inline: true },
                { name: 'Davet Kodu', value: `\`${code}\``, inline: true },
                { name: 'Kullanım Limiti', value: `\`${maxUses === 0 ? 'Sınırsız' : maxUses}\``, inline: true },
                { name: 'Geçerlilik Süresi', value: `\`${formatMaxAge(maxAge)}\``, inline: true }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};