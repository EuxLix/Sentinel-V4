// Dosya Yolu: events/guildUpdate.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'guildUpdate',
    async execute(oldGuild, newGuild, client) { // Client parametresi eklendi
        const guildSettings = getGuildSettings(client, newGuild.id);
        const logChannel = newGuild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(newGuild, AuditLogEvent.GuildUpdate, newGuild.id);
        const changes = [];
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTimestamp()
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() });

        if (oldGuild.name !== newGuild.name) {
            changes.push(`**İsim:** \`${oldGuild.name}\` → \`${newGuild.name}\``);
        }
        if (oldGuild.afkChannelId !== newGuild.afkChannelId) {
            changes.push(`**AFK Kanalı:** ${oldGuild.afkChannel || 'Yok'} → ${newGuild.afkChannel || 'Yok'}`);
        }
        if (oldGuild.afkTimeout !== newGuild.afkTimeout) {
            changes.push(`**AFK Zaman Aşımı:** \`${oldGuild.afkTimeout / 60}dk\` → \`${newGuild.afkTimeout / 60}dk\``);
        }
        if (oldGuild.banner !== newGuild.banner) {
            changes.push(`**Sunucu Banner'ı** değiştirildi.`);
            if (newGuild.banner) {
                embed.setImage(newGuild.bannerURL({ dynamic: true, size: 1024 }));
            }
        }
        
        if (oldGuild.premiumTier !== newGuild.premiumTier) {
            const tierMap = { 0: 'Seviye 0', 1: 'Seviye 1', 2: 'Seviye 2', 3: 'Seviye 3' };
            const title = newGuild.premiumTier > oldGuild.premiumTier ? '📈 Sunucu Seviye Yükseldi!' : '📉 Sunucu Seviye Düştü!';
            const boostEmbed = new EmbedBuilder()
                 .setColor(newGuild.premiumTier > oldGuild.premiumTier ? '#F47FFF' : '#99AAB5')
                 .setTitle(title)
                 .setDescription(`**Takviye Seviyesi:** \`${tierMap[oldGuild.premiumTier]}\` → \`${tierMap[newGuild.premiumTier]}\``)
                 .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
                 .setTimestamp();
            logChannel.send({ embeds: [boostEmbed] }).catch(console.error);
        }

        if (changes.length === 0) return;

        embed.setTitle('Log: Sunucu Ayarları Güncellendi').setDescription(changes.join('\n'));
        logChannel.send({ embeds: [embed] });
    },
};