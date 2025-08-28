// Dosya Yolu: commands/moderation/sil.js
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { hasPermission } = require('../../utils/permissionHelper');
const { getGuildSettings } = require('../../utils/settingsHelper');
const embeds = require('../../utils/embedhelper');

module.exports = {
    name: 'sil',
    description: 'Belirtilen miktarda mesajı siler (en fazla 100).',
    category: 'moderation',
    usage: 'sil <sayı>',
    cooldown: 5,
    permission: PermissionsBitField.Flags.ManageMessages,

    async execute(message, args, client) {
        // İzin kontrolü artık 'client' parametresi alıyor ve await gerektirmiyor
        const userCanDelete = hasPermission(client, message.member, this.permission);
        if (!userCanDelete) {
            return message.reply({ embeds: [embeds.error('Bu komutu kullanmak için `Mesajları Yönet` yetkisine veya ayarlanmış görevli rolüne sahip değilsin!')] });
        }

        const amountToDelete = parseInt(args[0]);
        if (isNaN(amountToDelete) || amountToDelete <= 0 || amountToDelete > 100) {
            return message.reply({ embeds: [embeds.error('Lütfen 1 ile 100 arasında geçerli bir sayı gir.')] });
        }

        try {
            await message.delete().catch(() => {});

            const fetchedMessages = await message.channel.bulkDelete(amountToDelete, true);
            
            if (fetchedMessages.size === 0) {
                 const replyMsg = await message.channel.send({ embeds: [embeds.info('Silinecek yeni mesaj bulunamadı (mesajlar 14 günden eski olabilir).')] });
                 setTimeout(() => replyMsg.delete().catch(() => {}), 5000);
                 return;
            }

            const successEmbed = embeds.success(`**${fetchedMessages.size}** adet mesaj başarıyla silindi.`);
            const replyMsg = await message.channel.send({ embeds: [successEmbed] });
            setTimeout(() => replyMsg.delete().catch(() => {}), 3000);

            const guildSettings = getGuildSettings(client, message.guild.id);
            const logChannelId = guildSettings.logChannelId;
            if (logChannelId) {
                const logChannel = message.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#E67E22')
                        .setTitle('Log: Toplu Mesaj Silindi (Purge)')
                        .setDescription(`**Yetkili:** ${message.author}\n**Kanal:** ${message.channel}\n**Silinen Mesaj Sayısı:** ${fetchedMessages.size}`)
                        .setTimestamp();
                    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }

        } catch (error) {
            console.error('Silme komutunda hata:', error);
            message.channel.send({ embeds: [embeds.error('Mesajları silerken bir hata oluştu. Lütfen 14 günden eski mesajları silmeye çalışmadığınızdan emin olun.')] })
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
        }
    },
};