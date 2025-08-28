// Dosya Yolu: commands/moderation/unban.js
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embedhelper');
const { hasPermission } = require('../../utils/permissionHelper');

module.exports = {
    name: 'unban',
    description: 'Bir kullanıcının sunucudaki yasağını kaldırır.',
    category: 'moderation',
    usage: 'unban <kullanıcı ID> [sebep]',
    cooldown: 5,
    permission: PermissionsBitField.Flags.BanMembers,

    async execute(message, args, client) {
        const userCanUnban = hasPermission(client, message.member, this.permission);
        if (!userCanUnban) {
            return message.reply({ embeds: [embeds.error('Bu komutu kullanmak için `Üyeleri Yasakla` yetkisine veya ayarlanmış görevli rolüne sahip değilsin!')] });
        }

        const targetId = args[0];
        if (!targetId || !/^\d{17,19}$/.test(targetId)) {
            return message.reply({ embeds: [embeds.error(`Lütfen yasağı kaldırılacak kullanıcının geçerli bir ID'sini gir.\n**Not:** Yasaklı kullanıcıları etiketleyemezsin, ID kullanmalısın.`)] });
        }
        
        const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi.';
        const auditLogReason = `Yetkili: ${message.author.tag} | Sebep: ${reason}`;

        try {
            const bannedUser = await message.guild.bans.fetch(targetId).catch(() => null);

            if (!bannedUser) {
                return message.reply({ embeds: [embeds.info('Bu ID\'ye sahip bir kullanıcı yasaklı değil.')] });
            }

            const targetUser = bannedUser.user;

            await message.guild.members.unban(targetUser, auditLogReason);
            
            const responseEmbed = embeds.success(`**${targetUser.tag}** kullanıcısının yasağı başarıyla kaldırıldı.`, '✅ Yasak Kaldırıldı')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Yasağı Kaldıran', value: `${message.author}`, inline: true },
                    { name: 'Sebep', value: reason, inline: true }
                );

            await message.channel.send({ embeds: [responseEmbed] });
            
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('Yasağın Kaldırıldı')
                    .setThumbnail(message.guild.iconURL())
                    .setDescription(`**${message.guild.name}** adlı sunucudaki yasağın kaldırıldı. Artık sunucuya geri dönebilirsin.`)
                    .addFields({ name: 'Yasağı Kaldıran Yetkili', value: `${message.author.tag}` })
                    .setTimestamp();
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log(`${targetUser.tag} kullanıcısına DM gönderilemedi (DM'leri kapalı olabilir).`);
            }

        } catch (error) {
            console.error('[HATA] Unban komutunda hata:', error);
            message.reply({ embeds: [embeds.error('Yasağı kaldırırken bir hata oluştu.')] });
        }
    },
};