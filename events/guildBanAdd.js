// Dosya Yolu: events/guildBanAdd.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { isWhitelisted } = require('../utils/permissionHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'guildBanAdd',
    async execute(ban, client) { // Client parametresi eklendi
        const { guild, user, reason } = ban;
        
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;
        
        const executor = await fetchExecutor(guild, AuditLogEvent.MemberBanAdd, user.id);

        if (executor && !isWhitelisted(guild, executor.id)) {
            try {
                await guild.members.ban(executor.id, { reason: `Guard: Yetkisiz kullanıcı yasaklama (${user.tag})` });
                const guardEmbed = new EmbedBuilder().setColor('#FF0000').setTitle('GUARD - YETKİSİZ EYLEM').setDescription(`**Kullanıcı:** ${executor.tag} (${executor.id})\n**Eylem:** Kullanıcı Yasaklama (\`${user.tag}\`)\n\n**Sonuç:** Yetkisiz işlem yapan kullanıcı yasaklandı.`).setTimestamp();
                return logChannel.send({ embeds: [guardEmbed] });
            } catch (error) {
                console.error(`[GUARD] ${executor.tag} kullanıcısını yasaklarken hata oluştu:`, error);
            }
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('Log: Kullanıcı Yasaklandı')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .setDescription(`**Yasaklanan:** ${user.tag} (\`${user.id}\`)`)
            .addFields({ name: 'Sebep', value: `\`\`\`${reason || 'Belirtilmedi.'}\`\`\`` })
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();
            
        return logChannel.send({ embeds: [embed] });
    },
};