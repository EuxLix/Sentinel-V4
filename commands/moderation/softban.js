// Dosya Yolu: commands/moderation/softban.js
const { PermissionsBitField } = require('discord.js');
const embeds = require('../../utils/embedhelper');
const { getTargetMember, checkModerationAction } = require('../../utils/moderationHelper');

module.exports = {
    name: 'softban',
    description: 'Bir kullanıcıyı sunucudan atar ve son 7 günlük mesajlarını siler.',
    category: 'moderation',
    usage: 'softban <@kullanıcı veya ID> [sebep]',
    cooldown: 10,
    permission: PermissionsBitField.Flags.BanMembers, // Bu işlem bir ban gerektirdiği için BanMembers izni kullanılır.

    async execute(message, args, client) {
        // 1. Argüman Kontrolü: Komutla birlikte bir kullanıcı belirtilmiş mi?
        if (!args[0]) {
            return message.reply({ embeds: [embeds.error(`Lütfen mesajları silinecek ve atılacak kullanıcıyı belirt.\n**Kullanım:** \`${this.usage}\``)] });
        }

        // 2. Hedef Kullanıcıyı Bulma: Belirtilen ID veya etiketten üyeyi buluyoruz.
        const targetMember = await getTargetMember(message, args);
        if (!targetMember) {
            return message.reply({ embeds: [embeds.error('Bu ID\'ye sahip kullanıcı sunucuda bulunamadı.')] });
        }

        // 3. Yetki ve Hiyerarşi Kontrolü: Komutu kullananın yetkisi var mı?
        // Bu kontrol hem BanMembers iznini hem de rol hiyerarşisini denetler.
        const { canAct, reason: aReason } = checkModerationAction(client, message.member, targetMember, this.permission);
        if (!canAct) {
            return message.reply({ embeds: [embeds.error(aReason)] });
        }

        // 4. Sebep Belirleme: Komuta bir sebep girilmişse onu al, yoksa varsayılanı kullan.
        const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi.';
        const auditLogReason = `Softban | Yetkili: ${message.author.tag} | Sebep: ${reason}`;

        try {
            // 5. Softban İşlemi:
            // Önce kullanıcıyı yasaklıyoruz. `deleteMessageSeconds` seçeneği ile son 7 günün mesajlarını siliyoruz.
            await message.guild.members.ban(targetMember.user.id, {
                deleteMessageSeconds: 604800, // 7 gün = 7 * 24 * 60 * 60 saniye
                reason: auditLogReason
            });

            // Hemen ardından kullanıcının yasağını kaldırıyoruz.
            await message.guild.members.unban(targetMember.user.id, `Softban işlemi tamamlandı.`);

            // 6. Başarı Mesajı: İşlemin başarılı olduğunu kanala bildiriyoruz.
            const successEmbed = embeds.success(
                `**${targetMember.user.tag}** kullanıcısı sunucudan atıldı ve son mesajları başarıyla silindi.`,
                '✅ Softban Başarılı'
            ).addFields({ name: 'Sebep', value: reason });
            
            await message.channel.send({ embeds: [successEmbed] });

        } catch (error) {
            console.error('[HATA] Softban komutunda hata:', error);
            message.reply({ embeds: [embeds.error('Kullanıcıya softban uygularken beklenmedik bir hata oluştu. Yetkilerimi kontrol et.')] });
        }
    },
};
