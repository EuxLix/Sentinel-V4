// Dosya Yolu: commands/moderation/uyari-sil.js
const { PermissionsBitField } = require('discord.js');
const embeds = require('../../utils/embedhelper');
const warningsHelper = require('../../utils/warningsHelper');
const { getTargetMember, checkModerationAction } = require('../../utils/moderationHelper');

module.exports = {
    name: 'uyarısil',
    description: 'Bir kullanıcının belirli bir uyarısını ID ile siler.',
    category: 'moderation',
    usage: 'uyarısil <@kullanıcı veya ID> <uyarı ID>',
    aliases: ['delwarn', 'warn-delete'],
    cooldown: 5,
    permission: PermissionsBitField.Flags.ModerateMembers,

    async execute(message, args, client) {
        if (args.length < 2) {
            return message.reply({ embeds: [embeds.error(`Eksik argüman!\n**Kullanım:** \`${this.usage}\``)] });
        }
        
        const targetMember = await getTargetMember(message, args);
        if (!targetMember) {
            return message.reply({ embeds: [embeds.error('Kullanıcı bulunamadı.')] });
        }

        const { canAct, reason } = checkModerationAction(client, message.member, targetMember, this.permission);
        if (!canAct) {
            return message.reply({ embeds: [embeds.error(reason)] });
        }

        const warningId = args[1];
        // Basit bir UUID veya benzeri bir format kontrolü yapılabilir, şimdilik boş olmamasını kontrol ediyoruz.
        if (!warningId) {
             return message.reply({ embeds: [embeds.error('Geçersiz uyarı ID\'si. Lütfen silinecek uyarının ID\'sini girin.')] });
        }

        try {
            const success = await warningsHelper.deleteWarning(message.guild.id, targetMember.id, warningId);

            if (success) {
                const successEmbed = embeds.success(`**${targetMember.user.tag}** kullanıcısının \`${warningId}\` ID'li uyarısı başarıyla silindi.`, '✅ Uyarı Silindi');
                await message.channel.send({ embeds: [successEmbed] });
            } else {
                await message.reply({ embeds: [embeds.error('Belirtilen ID ile bu kullanıcıya ait bir uyarı bulunamadı.')] });
            }
        } catch (error) {
            console.error('[HATA] Uyarı silme komutunda hata:', error);
            message.reply({ embeds: [embeds.error('Uyarı silinirken beklenmedik bir hata oluştu.')] });
        }
    },
};