// Dosya Yolu: events/roleDelete.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { isWhitelisted } = require('../utils/permissionHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'roleDelete',
    async execute(role, client) { // Client parametresi eklendi
        const { guild } = role;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.RoleDelete, role.id);
        
        if (executor && !isWhitelisted(guild, executor.id)) {
            try {
                await guild.members.ban(executor.id, { reason: `Guard: Yetkisiz rol silme (@${role.name})` });
                const guardEmbed = new EmbedBuilder().setColor('#FF0000').setTitle('GUARD - YETKİSİZ EYLEM').setDescription(`**Kullanıcı:** ${executor.tag} (${executor.id})\n**Eylem:** Rol Silme (\`@${role.name}\`)\n\n**Sonuç:** Kullanıcı yasaklandı.`).setTimestamp();
                return logChannel.send({ embeds: [guardEmbed] });
            } catch (error) {
                console.error(`[GUARD] ${executor.tag} kullanıcısını yasaklarken hata oluştu:`, error);
            }
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('Log: Rol Silindi')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .setDescription(`\`@${role.name}\` rolü silindi.`)
            .addFields(
                { name: 'Rol ID', value: `\`${role.id}\``, inline: true },
                { name: 'Renk', value: `\`${role.hexColor}\``, inline: true }
            )
            .setTimestamp();
            
        return logChannel.send({ embeds: [embed] });
    },
};