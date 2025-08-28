// Dosya Yolu: commands/moderation/lock.js
const { PermissionsBitField } = require('discord.js');
const embeds = require('../../utils/embedhelper');
const { hasPermission } = require('../../utils/permissionHelper');

module.exports = {
    name: 'lock',
    description: 'Bulunulan kanalı kilitler.',
    category: 'moderation',
    usage: 'lock',
    cooldown: 10,
    permission: PermissionsBitField.Flags.ManageChannels,

    async execute(message, args, client) {
        const { channel, guild, member } = message;

        const userCanLock = hasPermission(client, member, this.permission);
        if (!userCanLock) {
             return message.reply({ embeds: [embeds.error('Bu komutu kullanmak için `Kanalları Yönet` yetkisine veya ayarlanmış görevli rolüne sahip değilsin!')] });
        }

        const everyoneRole = guild.roles.everyone;
        const currentOverwrites = channel.permissionOverwrites.cache.get(everyoneRole.id);

        if (currentOverwrites?.deny.has(PermissionsBitField.Flags.SendMessages)) {
            return message.reply({ embeds: [embeds.info('Bu kanal zaten kilitli.')] });
        }

        try {
            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false
            }, { reason: `Kanal ${message.author.tag} tarafından kilitlendi.` });

            await message.reply({ embeds: [embeds.success(`🔒 **${channel}** kanalı başarıyla kilitlendi.`, 'Kanal Kilitlendi')] });

        } catch (error) {
            console.error('[HATA] Kanal kilitlenirken hata oluştu:', error);
            await message.reply({ embeds: [embeds.error('Kanalı kilitlerken bir hata oluştu. Lütfen yetkilerimi kontrol et.')] });
        }
    },
};