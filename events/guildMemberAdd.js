// Dosya Yolu: events/guildMemberAdd.js
const { EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) { // Client parametresi eklendi
        const { guild, user } = member;
        if (user.bot) return;

        // Ayarlar artık client üzerinden, önbellekten okunuyor
        const guildSettings = getGuildSettings(client, guild.id);

        // --- 1. OTOROL VERME ---
        if (guildSettings.autoRoleEnabled && guildSettings.autoRoleId) {
            const role = guild.roles.cache.get(guildSettings.autoRoleId);
            if (role) {
                if (guild.members.me.roles.highest.position > role.position) {
                    try {
                        await member.roles.add(role);
                    } catch (error) {
                        console.error(`[HATA] Otorol verilemedi (Kullanıcı: ${user.tag}, Sunucu: ${guild.name}):`, error);
                    }
                } else {
                    console.warn(`[OTOROL UYARI] ${guild.name} sunucusunda "${role.name}" rolünü vermek için yetkim yetersiz.`);
                }
            }
        }
        
        // --- 2. YÖNETİCİ LOGLAMA ---
        if (guildSettings.logChannelId) {
            const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setTitle('Log: Yeni Üye Katıldı')
                    .setDescription(`**Kullanıcı:** ${user.tag} (${user.id})\n**Hesap Oluşturma Tarihi:** <t:${parseInt(user.createdTimestamp / 1000)}:R>`)
                    .setThumbnail(user.displayAvatarURL())
                    .setTimestamp()
                    .setFooter({ text: `Sunucudaki Toplam Üye: ${guild.memberCount}` });
                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }
        }

        // --- 3. GENEL KARŞILAMA MESAJI ---
        if (guildSettings.welcomeEnabled && guildSettings.welcomeChannelId) {
            const welcomeChannel = guild.channels.cache.get(guildSettings.welcomeChannelId);
            if (welcomeChannel) {
                const welcomeEmbed = new EmbedBuilder()
                    .setColor('#3498DB')
                    .setTitle(`Aramıza Hoş Geldin, ${user.username}!`)
                    .setDescription(`<@${user.id}>, **${guild.name}** sunucusuna katıldı! Seninle birlikte sunucumuz artık **${guild.memberCount}** kişi.\n\nUmarız harika vakit geçirirsin!`)
                    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
                    .setTimestamp();
                welcomeChannel.send({ embeds: [welcomeEmbed] }).catch(console.error);
            }
        }
    },
};