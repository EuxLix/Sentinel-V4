// Dosya Yolu: commands/moderation/uyar.js
const { PermissionsBitField } = require('discord.js');
const { getTargetMember, checkModerationAction } = require('../../utils/moderationHelper');
const warningsHelper = require('../../utils/warningsHelper');
const embeds = require('../../utils/embedhelper');
const ms = require('ms');

async function applyAutoPunishment(message, targetMember, warnLimit) {
    const punishmentDuration = process.env.WARN_PUNISHMENT_DURATION || '10m';
    const durationMs = ms(punishmentDuration);
    if (!durationMs) return;

    try {
        if (targetMember.moderatable && !targetMember.isCommunicationDisabled()) {
            await targetMember.timeout(durationMs, `Uyarı limitine ulaşıldı (${warnLimit} uyarı).`);
            
            const autoPunishEmbed = embeds.warning(`**${targetMember.user.tag}**, ${warnLimit} uyarı limitine ulaştığı için **${punishmentDuration}** boyunca otomatik olarak susturuldu.`);
            message.channel.send({ embeds: [autoPunishEmbed] }).catch(() => {});
        }
    } catch (error) {
        console.error(`[HATA] Otomatik ceza verilirken hata oluştu:`, error);
    }
}

module.exports = {
    name: 'uyar',
    description: 'Bir kullanıcıya uyarı verir.',
    category: 'moderation',
    usage: 'uyar <@kullanıcı veya ID> [sebep]',
    aliases: ['warn'],
    cooldown: 5,
    permission: PermissionsBitField.Flags.ModerateMembers,

    async execute(message, args, client) {
        if (!args[0]) {
            return message.reply({ embeds: [embeds.error(`Lütfen uyarılacak bir kullanıcı belirt.\n**Kullanım:** \`${this.usage}\``)] });
        }

        const targetMember = await getTargetMember(message, args);
        if (!targetMember) {
            return message.reply({ embeds: [embeds.error('Bu ID\'ye sahip kullanıcı sunucuda bulunamadı.')] });
        }

        const { canAct, reason: aReason } = checkModerationAction(client, message.member, targetMember, this.permission);
        if (!canAct) {
            return message.reply({ embeds: [embeds.error(aReason)] });
        }

        const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi.';
        
        try {
            await warningsHelper.addWarning(message.guild.id, targetMember.id, message.author.id, reason);
            const userWarnings = await warningsHelper.getWarnings(message.guild.id, targetMember.id);

            const successEmbed = embeds.success(`**${targetMember.user.tag}** kullanıcısı uyarıldı.\nBu kullanıcının toplam **${userWarnings.length}** uyarısı oldu.`, '✅ Uyarı Verildi')
                .addFields({ name: 'Sebep', value: reason });
            await message.channel.send({ embeds: [successEmbed] });

            const warnLimit = parseInt(process.env.WARN_LIMIT, 10) || 3;
            if (userWarnings.length >= warnLimit) {
                await applyAutoPunishment(message, targetMember, warnLimit);
            }
        } catch (error) {
            console.error('[HATA] Uyar komutunda hata:', error);
            message.reply({ embeds: [embeds.error('Uyarı verilirken beklenmedik bir hata oluştu.')] });
        }
    },
};