// Dosya Yolu: events/roleCreate.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { isWhitelisted } = require('../utils/permissionHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'roleCreate',
    async execute(role, client) { // Client parametresi eklendi
        const { guild } = role;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.RoleCreate, role.id);

        if (executor && !isWhitelisted(guild, executor.id)) {
            try {
                await role.delete({ reason: 'Guard: Yetkisiz rol oluşturma.' });
                await guild.members.ban(executor.id, { reason: `Guard: Yetkisiz rol oluşturma (@${role.name})` });
                const guardEmbed = new EmbedBuilder().setColor('#FF0000').setTitle('GUARD - YETKİSİZ EYLEM').setDescription(`**Kullanıcı:** ${executor.tag}\n**Eylem:** Rol Oluşturma (\`@${role.name}\`)\n\n**Sonuç:** Rol silindi, kullanıcı yasaklandı.`).setTimestamp();
                return logChannel.send({ embeds: [guardEmbed] });
            } catch (error) {
                console.error(`[GUARD] ${executor.tag} kullanıcısını yasaklarken hata oluştu:`, error);
            }
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('Log: Rol Oluşturuldu')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .setDescription(`${role} (\`${role.name}\`) rolü oluşturuldu.`)
            .addFields(
                { name: 'Rol ID', value: `\`${role.id}\``, inline: true },
                { name: 'Renk', value: `\`${role.hexColor}\``, inline: true }
            )
            .setTimestamp();
            
        return logChannel.send({ embeds: [embed] });
    },
};