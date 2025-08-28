// Dosya Yolu: events/guildMemberUpdate.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember, client) { // Client parametresi eklendi
        const { guild, user } = newMember;
        if (user.bot) return;

        // Ayarlar artık client üzerinden, önbellekten okunuyor
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const oldBoost = oldMember.premiumSinceTimestamp;
        const newBoost = newMember.premiumSinceTimestamp;

        if (!oldBoost && newBoost) {
            const boostEmbed = new EmbedBuilder().setColor('#F47FFF').setTitle('🚀 Sunucuya Takviye Yapıldı!').setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() }).setDescription(`${newMember} sunucumuzu takviyeledi! Teşekkürler! 🎉`).setTimestamp();
            return logChannel.send({ embeds: [boostEmbed] });
        }
        if (oldBoost && !newBoost) {
            const unboostEmbed = new EmbedBuilder().setColor('#99AAB5').setTitle('😢 Sunucu Takviyeden Ayrıldı').setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() }).setDescription(`${newMember} sunucumuzu takviyelemeyi bıraktı.`).setTimestamp();
            return logChannel.send({ embeds: [unboostEmbed] });
        }

        if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
            const executor = await fetchExecutor(guild, AuditLogEvent.MemberRoleUpdate, newMember.id);
            if (!executor || executor.id === user.id) return; 

            const embed = new EmbedBuilder().setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() }).setTimestamp().setFooter({ text: `Yetkili: ${executor.tag}` });
            
            if (newMember.roles.cache.size > oldMember.roles.cache.size) {
                const addedRole = newMember.roles.cache.find(role => !oldMember.roles.cache.has(role.id));
                embed.setColor('#2ECC71').setTitle('Log: Üyeye Rol Eklendi').setDescription(`**Üye:** ${user}\n**Eklenen Rol:** ${addedRole}`);
            } else {
                const removedRole = oldMember.roles.cache.find(role => !newMember.roles.cache.has(role.id));
                embed.setColor('#E74C3C').setTitle('Log: Üyeden Rol Kaldırıldı').setDescription(`**Üye:** ${user}\n**Kaldırılan Rol:** ${removedRole}`);
            }
            return logChannel.send({ embeds: [embed] });
        }
        
        const executor = await fetchExecutor(guild, AuditLogEvent.MemberUpdate, newMember.id);
        if (!executor || executor.id === user.id) return;
        
        if (oldMember.nickname !== newMember.nickname) {
            const embed = new EmbedBuilder().setColor('#3498DB').setTitle('Log: Takma Ad Güncellendi').setDescription(`**Üye:** ${user}\n**Yetkili:** ${executor.tag}`).addFields({ name: 'İsim Değişikliği', value: `\`${oldMember.nickname || oldMember.user.username}\` -> \`${newMember.nickname || newMember.user.username}\`` }).setTimestamp();
            return logChannel.send({ embeds: [embed] });
        }

        if (oldMember.isCommunicationDisabled() && !newMember.isCommunicationDisabled()) {
            const embed = new EmbedBuilder().setColor('#2ECC71').setTitle('Log: Zaman Aşımı Kaldırıldı (Manuel)').setDescription(`**Kullanıcı:** ${user}\n**Yetkili:** ${executor.tag}`).setTimestamp();
            return logChannel.send({ embeds: [embed] });
        }
    },
};