// Dosya Yolu: commands/moderation/name.js
const { PermissionsBitField } = require('discord.js');
const embeds = require('../../utils/embedhelper');
const { getTargetMember, checkModerationAction } = require('../../utils/moderationHelper'); 

module.exports = {
    name: 'name',
    description: 'Bir kullanıcının sunucu içi ismini değiştirir veya sıfırlar.',
    category: 'moderation',
    usage: 'name <@kullanıcı veya ID> [yeni isim]',
    aliases: ['isim', 'nick', 'nickname'],
    cooldown: 5,
    permission: PermissionsBitField.Flags.ManageNicknames,

    async execute(message, args, client) {
        if (!args[0]) {
            return message.reply({ embeds: [embeds.error(`Lütfen isim değiştirilecek bir kullanıcı belirt.\n**Kullanım:** \`${this.usage}\``)] });
        }

        const targetMember = await getTargetMember(message, args);
        if (!targetMember) {
            return message.reply({ embeds: [embeds.error('Bu ID\'ye sahip kullanıcı sunucuda bulunamadı.')] });
        }

        const { canAct, reason: aReason } = checkModerationAction(client, message.member, targetMember, this.permission);
        if (!canAct) {
            return message.reply({ embeds: [embeds.error(aReason)] });
        }

        const newNickname = args.slice(1).join(' ');
        const auditLogReason = `Yetkili: ${message.author.tag}`;

        if (newNickname) {
            if (newNickname.length > 32) {
                return message.reply({ embeds: [embeds.error('Takma adlar en fazla 32 karakter olabilir.')] });
            }
            try {
                const oldNickname = targetMember.displayName;
                await targetMember.setNickname(newNickname, auditLogReason);
                
                const embed = embeds.success(`**${targetMember.user.tag}** kullanıcısının ismi başarıyla değiştirildi.`, 'İsim Değiştirildi')
                    .addFields(
                        { name: 'Eski İsim', value: `\`${oldNickname}\``, inline: true },
                        { name: 'Yeni İsim', value: `\`${newNickname}\``, inline: true }
                    )
                    .setFooter({ text: `İşlemi Yapan: ${message.author.tag}` });
                
                await message.channel.send({ embeds: [embed] });

            } catch (error) {
                console.error('[HATA] İsim değiştirilirken hata oluştu:', error);
                message.reply({ embeds: [embeds.error('Kullanıcının ismini değiştirirken bir hata oluştu.')] });
            }
        } 
        else {
            try {
                const oldNickname = targetMember.displayName;
                if (oldNickname === targetMember.user.username) {
                    return message.reply({ embeds: [embeds.info('Bu kullanıcının zaten özel bir sunucu ismi yok.')] });
                }

                await targetMember.setNickname(null, auditLogReason);

                const embed = embeds.info(`**${targetMember.user.tag}** kullanıcısının ismi varsayılan haline döndürüldü.`, 'İsim Sıfırlandı')
                    .addFields(
                        { name: 'Kaldırılan İsim', value: `\`${oldNickname}\``, inline: true },
                        { name: 'Yeni Durum', value: `\`${targetMember.user.username}\``, inline: true }
                    )
                    .setFooter({ text: `İşlemi Yapan: ${message.author.tag}` });

                await message.channel.send({ embeds: [embed] });

            } catch (error) {
                console.error('[HATA] İsim sıfırlanırken hata oluştu:', error);
                message.reply({ embeds: [embeds.error('Kullanıcının ismini sıfırlarken bir hata oluştu.')] });
            }
        }
    },
};