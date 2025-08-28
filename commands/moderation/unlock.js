// Dosya Yolu: commands/moderation/unlock.js
const { PermissionsBitField } = require('discord.js');
const embeds = require('../../utils/embedhelper');
const { hasPermission } = require('../../utils/permissionHelper');

module.exports = {
    name: 'unlock',
    description: 'Bulunulan kanalın kilidini açar.',
    category: 'moderation',
    usage: 'unlock',
    cooldown: 10,
    permission: PermissionsBitField.Flags.ManageChannels,

    async execute(message, args, client) {
        const { channel, guild, member } = message;

        const userCanUnlock = hasPermission(client, member, this.permission);
        if (!userCanUnlock) {
            return message.reply({ embeds: [embeds.error('Bu komutu kullanmak için `Kanalları Yönet` yetkisine veya ayarlanmış görevli rolüne sahip değilsin!')] });
        }

        const everyoneRole = guild.roles.everyone;
        const currentOverwrites = channel.permissionOverwrites.cache.get(everyoneRole.id);

        if (!currentOverwrites?.deny.has(PermissionsBitField.Flags.SendMessages)) {
            return message.reply({ embeds: [embeds.info('Bu kanal zaten kilitli değil.')] });
        }

        try {
            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: null 
            }, { reason: `Kanal kilidi ${message.author.tag} tarafından açıldı.` });

            await message.reply({ embeds: [embeds.success(`🔓 **${channel}** kanalının kilidi başarıyla açıldı.`, 'Kilit Açıldı')] });

        } catch (error) {
            console.error('[HATA] Kanal kilidi açılırken hata oluştu:', error);
            await message.reply({ embeds: [embeds.error('Kanal kilidini açarken bir hata oluştu. Lütfen yetkilerimi kontrol et.')] });
        }
    },
};