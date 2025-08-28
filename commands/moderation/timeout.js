// Dosya Yolu: commands/moderation/timeout.js
const { PermissionsBitField } = require('discord.js');
const ms = require('ms');
const embeds = require('../../utils/embedhelper');
const { getTargetMember, checkModerationAction } = require('../../utils/moderationHelper');

module.exports = {
    name: 'timeout',
    description: 'Bir kullanıcıyı belirtilen süreyle susturur (zaman aşımına uğratır).',
    category: 'moderation',
    usage: 'timeout <@kullanıcı veya ID> <süre> [sebep]',
    aliases: ['sustur', 'mute'],
    cooldown: 5,
    permission: PermissionsBitField.Flags.ModerateMembers,

    async execute(message, args, client) {
        const durationString = args[1];
        if (!args[0] || !durationString) {
            return message.reply({ embeds: [embeds.error(`Lütfen bir kullanıcı ve süre belirtin.\n**Kullanım:** \`${this.usage}\``)] });
        }

        const targetMember = await getTargetMember(message, args);
        if (!targetMember) {
            return message.reply({ embeds: [embeds.error('Bu ID\'ye sahip kullanıcı sunucuda bulunamadı.')] });
        }

        const { canAct, reason: aReason } = checkModerationAction(client, message.member, targetMember, this.permission);
        if (!canAct) {
            return message.reply({ embeds: [embeds.error(aReason)] });
        }
        
        if (targetMember.isCommunicationDisabled()) {
            const remainingTime = ms(targetMember.communicationDisabledUntilTimestamp - Date.now(), { long: true });
            return message.reply({ embeds: [embeds.info(`Bu kullanıcı zaten susturulmuş. Kalan süre: **${remainingTime}**`)] });
        }

        const duration = ms(durationString);
        if (!duration || duration < 5000) { // Minimum 5 saniye
            return message.reply({ embeds: [embeds.error('Geçersiz bir süre formatı girdin. Lütfen "10s", "5m", "1h", "2d" gibi geçerli ve en az 5 saniyelik bir format kullan.')] });
        }
        if (duration > ms('28d')) {
            return message.reply({ embeds: [embeds.error('En fazla 28 günlük bir zaman aşımı uygulayabilirsin.')] });
        }

        const reason = args.slice(2).join(' ') || 'Sebep belirtilmedi.';
        const auditLogReason = `Yetkili: ${message.author.tag} | Sebep: ${reason}`;

        try {
            await targetMember.timeout(duration, auditLogReason);
            
            const successEmbed = embeds.success(`**${targetMember.user.tag}** kullanıcısı, **${ms(duration, { long: true })}** boyunca başarıyla susturuldu.`, '✅ Kullanıcı Susturuldu')
                .addFields({ name: 'Sebep', value: reason });

            await message.channel.send({ embeds: [successEmbed] });
        } catch (error) {
            console.error('[HATA] Timeout komutunda hata:', error);
            message.reply({ embeds: [embeds.error('Kullanıcıya zaman aşımı uygularken bir hata oluştu.')] });
        }
    },
};