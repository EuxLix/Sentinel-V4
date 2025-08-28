// Dosya Yolu: commands/moderation/ban.js
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embedhelper');
const { getTargetMember, checkModerationAction } = require('../../utils/moderationHelper');
const { hasPermission } = require('../../utils/permissionHelper');

module.exports = {
    name: 'ban',
    description: 'Bir kullanıcıyı sunucudan kalıcı olarak yasaklar.',
    category: 'moderation',
    usage: 'ban <@kullanıcı veya ID> [sebep]',
    cooldown: 5,
    permission: PermissionsBitField.Flags.BanMembers,

    async execute(message, args, client) {
        if (!args[0]) {
            return message.reply({ embeds: [embeds.error(`Lütfen yasaklanacak bir kullanıcıyı etiketle veya ID'sini gir.\n**Kullanım:** \`${this.usage}\``)] });
        }
        
        const targetMember = await getTargetMember(message, args);
        let targetUser;

        if (targetMember) {
            // Durum 1: Üye sunucuda bulundu. Hem izin hem hiyerarşi kontrolü yap.
            const { canAct, reason } = checkModerationAction(client, message.member, targetMember, this.permission);
            if (!canAct) {
                return message.reply({ embeds: [embeds.error(reason)] });
            }
            targetUser = targetMember.user;
        } else {
            // Durum 2: Üye sunucuda yok. Sadece komutu kullananın yetkisini kontrol et.
            const hasBanPerm = hasPermission(client, message.member, this.permission);
            if (!hasBanPerm) {
                 return message.reply({ embeds: [embeds.error('Bu komutu kullanmak için `Üyeleri Yasakla` yetkisine veya görevli rolüne sahip değilsin!')] });
            }
            try {
                targetUser = await client.users.fetch(args[0]);
            } catch {
                return message.reply({ embeds: [embeds.error('Bu ID\'ye sahip bir kullanıcı bulunamadı.')] });
            }
        }

        const banList = await message.guild.bans.fetch();
        if (banList.get(targetUser.id)) {
            return message.reply({ embeds: [embeds.info('Bu kullanıcı zaten sunucudan yasaklanmış.')] });
        }
        
        const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi.';
        const auditLogReason = `Yetkili: ${message.author.tag} | Sebep: ${reason}`;

        try {
            const dmEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('Sunucudan Yasaklandın')
                .setThumbnail(message.guild.iconURL())
                .setDescription(`**${message.guild.name}** adlı sunucudan kalıcı olarak yasaklandın.`)
                .addFields(
                    { name: 'Yasaklayan Yetkili', value: `${message.author.tag}` },
                    { name: 'Sebep', value: reason }
                )
                .setTimestamp();
            await targetUser.send({ embeds: [dmEmbed] }).catch(() => {
                console.log(`${targetUser.tag} kullanıcısına DM gönderilemedi (DM'leri kapalı olabilir).`);
            });

            await message.guild.members.ban(targetUser.id, { reason: auditLogReason });

            const responseEmbed = embeds.error(`**${targetUser.tag}** başarıyla sunucudan yasaklandı.\n**Sebep:** ${reason}`, '⛔ Üye Yasaklandı');
            await message.channel.send({ embeds: [responseEmbed] });

        } catch (error) {
            console.error(`[HATA] Ban komutunda hata:`, error);
            message.reply({ embeds: [embeds.error('Kullanıcıyı yasaklarken beklenmedik bir hata oluştu.')] });
        }
    },
};