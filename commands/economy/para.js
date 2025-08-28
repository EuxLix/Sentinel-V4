// Dosya Yolu: commands/economy/para.js
// Bu dosya, para-ekle.js ve para-sil.js'nin yerini alır.
const { PermissionsBitField } = require('discord.js');
const economyHelper = require('../../utils/economyHelper');
const embeds = require('../../utils/embedhelper');
const { parseAmount } = require('../../utils/stringHelper');

module.exports = {
    name: 'para',
    description: 'Bir kullanıcının bakiyesini yönetirsiniz (ekle/sil).',
    category: 'economy',
    usage: 'para <ekle|sil> <@kullanıcı> <miktar>',
    aliases: ['money', 'eco'],
    cooldown: 3,
    permission: PermissionsBitField.Flags.Administrator, 
    async execute(message, args, client) {
        // 1. Yetki Kontrolü
        if (!message.member.permissions.has(this.permission)) {
            return message.reply({ embeds: [embeds.error('Bu komutu kullanmak için `Yönetici` yetkisine sahip olmalısın.')] });
        }

        const subCommand = args[0]?.toLowerCase();
        const targetUser = message.mentions.users.first();
        const amount = args[2] ? parseAmount(args[2]) : null;

        // 2. Argümanların Doğruluğunu Kontrol Etme
        if (!['ekle', 'sil'].includes(subCommand) || !targetUser || !amount || amount <= 0) {
            return message.reply({ embeds: [embeds.error(`Eksik veya hatalı argüman! **Kullanım:** \`${this.usage}\``)] });
        }

        try {
            // 3. Alt Komutlara Göre İşlem Yapma
            if (subCommand === 'ekle') {
                // Para ekleme işlemi 'await' ile güvenli bir şekilde yapılıyor.
                const newBalance = await economyHelper.addBalance(targetUser.id, message.guild.id, amount);
                
                const successEmbed = embeds.success(`**${targetUser.username}** kullanıcısına **+${amount.toLocaleString('tr-TR')} coin** eklendi.`)
                    .addFields({ name: 'Yeni Bakiye', value: `**${newBalance.toLocaleString('tr-TR')}** coin` });

                return message.channel.send({ embeds: [successEmbed] });
            }

            if (subCommand === 'sil') {
                // Önce kullanıcının mevcut bakiyesini 'await' ile alıyoruz.
                const userAccount = await economyHelper.getUser(targetUser.id, message.guild.id);
                
                if (userAccount.balance <= 0) {
                    return message.reply({ embeds: [embeds.info(`**${targetUser.username}** kullanıcısının zaten hiç parası yok.`)] });
                }

                // Kullanıcının bakiyesinden daha fazla para silinmesini engelliyoruz.
                const amountToRemove = Math.min(amount, userAccount.balance); 

                // Para silme işlemi 'await' ile güvenli bir şekilde yapılıyor.
                const newBalance = await economyHelper.removeBalance(targetUser.id, message.guild.id, amountToRemove);

                const successEmbed = embeds.warning(`**${targetUser.username}** kullanıcısından **${amountToRemove.toLocaleString('tr-TR')} coin** silindi.`)
                    .addFields({ name: 'Yeni Bakiye', value: `**${newBalance.toLocaleString('tr-TR')}** coin` });

                return message.channel.send({ embeds: [successEmbed] });
            }
        } catch (error) {
            console.error(`[HATA] Para yönetme komutunda hata (${subCommand}):`, error);
            await message.reply({ embeds: [embeds.error('İşlem sırasında beklenmedik bir hata oluştu.')] });
        }
    }
};