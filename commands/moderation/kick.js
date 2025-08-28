// Dosya Yolu: commands/moderation/kick.js
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embedhelper');
const { getTargetMember, checkModerationAction } = require('../../utils/moderationHelper');

module.exports = {
    name: 'kick',
    description: 'Bir kullanıcıyı sunucudan atar.',
    category: 'moderation',
    usage: 'kick <@kullanıcı veya ID> [sebep]',
    cooldown: 5,
    permission: PermissionsBitField.Flags.KickMembers,

    async execute(message, args, client) {
        if (!args[0]) {
            return message.reply({ embeds: [embeds.error(`Lütfen atılacak bir kullanıcıyı etiketle veya ID'sini gir.\n**Kullanım:** \`${this.usage}\``)] });
        }

        const target = await getTargetMember(message, args);
        if (!target) {
            return message.reply({ embeds: [embeds.error('Bu ID\'ye sahip kullanıcı sunucuda bulunamadı.')] });
        }

        const { canAct, reason: aReason } = checkModerationAction(client, message.member, target, this.permission);
        if (!canAct) {
            return message.reply({ embeds: [embeds.error(aReason)] });
        }

        const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi.';
        const auditLogReason = `Yetkili: ${message.author.tag} | Sebep: ${reason}`;

        try {
            const dmEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('Sunucudan Atıldın')
                .setThumbnail(message.guild.iconURL())
                .setDescription(`**${message.guild.name}** adlı sunucudan atıldın. İstersen sunucuya yeniden katılabilirsin.`)
                .addFields(
                    { name: 'Atan Yetkili', value: `${message.author.tag}` },
                    { name: 'Sebep', value: reason }
                )
                .setTimestamp();
            await target.send({ embeds: [dmEmbed] }).catch(() => {
                console.log(`${target.user.tag} kullanıcısına DM gönderilemedi.`);
            });

            await target.kick(auditLogReason);

            const successEmbed = embeds.success(`**${target.user.tag}** başarıyla sunucudan atıldı.\n**Sebep:** ${reason}`, '✅ Üye Atıldı');
            await message.channel.send({ embeds: [successEmbed] });

        } catch (error) {
            console.error(`[HATA] Kick komutunda hata:`, error);
            message.reply({ embeds: [embeds.error('Kullanıcıyı atarken beklenmedik bir hata oluştu.')] });
        }
    },
};