// Dosya Yolu: events/guildMemberRemove.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { isWhitelisted } = require('../utils/permissionHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) { // Client parametresi eklendi
        const { guild, user } = member;
        if (user.bot) return;

        // Ayarlar artık client üzerinden, önbellekten okunuyor
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);

        const kickExecutor = await fetchExecutor(guild, AuditLogEvent.MemberKick, member.id);
        const banExecutor = await fetchExecutor(guild, AuditLogEvent.MemberBanAdd, member.id);

        if (banExecutor) return; // Ban logunu guildBanAdd halleder.

        if (kickExecutor) {
            if (!logChannel) return;
            if (!isWhitelisted(guild, kickExecutor.id)) {
                try {
                    await guild.members.ban(kickExecutor.id, { reason: `Guard: Yetkisiz kullanıcı atma (${user.tag})` });
                    const guardEmbed = new EmbedBuilder().setColor('#FF0000').setTitle('GUARD - YETKİSİZ EYLEM').setDescription(`**Kullanıcı:** ${kickExecutor.tag}\n**Eylem:** Kullanıcı Atma (\`${user.tag}\`)\n\n**Sonuç:** Yetkisiz işlem yapan kullanıcı yasaklandı.`).setTimestamp();
                    return logChannel.send({ embeds: [guardEmbed] });
                } catch (error) {
                    console.error(`[GUARD] ${kickExecutor.tag} kullanıcısını yasaklarken hata oluştu:`, error);
                }
                return;
            }
            
            const embed = new EmbedBuilder().setColor('#E67E22').setTitle('Log: Üye Atıldı (Kick)').setDescription(`**Atılan:** ${user.tag}\n**Yetkili:** ${kickExecutor.tag}`).setTimestamp();
            return logChannel.send({ embeds: [embed] });
        }

        // Normal ayrılma
        if (logChannel) {
            const logEmbed = new EmbedBuilder().setColor('#E74C3C').setTitle('Log: Üye Ayrıldı').setDescription(`**Ayrılan:** ${user.tag} (${user.id})`).setThumbnail(user.displayAvatarURL()).setTimestamp();
            logChannel.send({ embeds: [logEmbed] }).catch(console.error);
        }
        
        const welcomeChannel = guild.channels.cache.get(guildSettings.welcomeChannelId);
        if (guildSettings.welcomeEnabled && welcomeChannel) {
            const goodbyeEmbed = new EmbedBuilder().setColor('#95a5a6').setTitle(`Görüşürüz, ${user.username}...`).setDescription(`**${user.tag}** aramızdan ayrıldı. Sunucumuz şimdi **${guild.memberCount}** kişi.`).setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 })).setTimestamp();
            welcomeChannel.send({ embeds: [goodbyeEmbed] }).catch(console.error);
        }
    },
};