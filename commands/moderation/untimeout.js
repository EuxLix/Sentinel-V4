// Dosya Yolu: commands/moderation/untimeout.js
const { PermissionsBitField } = require('discord.js');
const embeds = require('../../utils/embedhelper');
const { getTargetMember, checkModerationAction } = require('../../utils/moderationHelper');

module.exports = {
    name: 'untimeout',
    description: 'Bir kullanıcının zaman aşımını kaldırır.',
    category: 'moderation',
    usage: 'untimeout <@kullanıcı veya ID> [sebep]',
    aliases: ['susturma-kaldır', 'unmute'],
    cooldown: 5,
    permission: PermissionsBitField.Flags.ModerateMembers,

    async execute(message, args, client) {
        if (!args[0]) {
            return message.reply({ embeds: [embeds.error(`Lütfen zaman aşımını kaldıracağın kullanıcıyı belirt.\n**Kullanım:** \`${this.usage}\``)] });
        }

        const targetMember = await getTargetMember(message, args);
        if (!targetMember) {
            return message.reply({ embeds: [embeds.error('Bu ID\'ye sahip kullanıcı sunucuda bulunamadı.')] });
        }

        const { canAct, reason: aReason } = checkModerationAction(client, message.member, targetMember, this.permission);
        if (!canAct) {
            return message.reply({ embeds: [embeds.error(aReason)] });
        }
        
        if (!targetMember.isCommunicationDisabled()) {
            return message.reply({ embeds: [embeds.info('Bu kullanıcının zaten bir zaman aşımı yok.')] });
        }

        const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi.';
        const auditLogReason = `Yetkili: ${message.author.tag} | Sebep: ${reason}`;

        try {
            await targetMember.timeout(null, auditLogReason);
            
            const successEmbed = embeds.success(`**${targetMember.user.tag}** kullanıcısının zaman aşımı başarıyla kaldırıldı.`, '✅ Susturma Kaldırıldı')
                 .addFields({ name: 'Sebep', value: reason });
            
            await message.channel.send({ embeds: [successEmbed] });
        } catch (error) {
            console.error('[HATA] Untimeout komutunda hata:', error);
            message.reply({ embeds: [embeds.error('Kullanıcının zaman aşımını kaldırırken bir hata oluştu.')] });
        }
    },
};