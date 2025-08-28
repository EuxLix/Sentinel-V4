// Dosya Yolu: commands/economy/öde.js
const economyHelper = require('../../utils/economyHelper');
const embeds = require('../../utils/embedhelper');
// parseAmount helper'ını kullanmaya devam ediyoruz, bu iyi bir pratik.
const { parseAmount } = require('../../utils/stringHelper'); 

module.exports = {
    name: 'öde',
    description: 'Başka bir kullanıcıya para gönderirsiniz.',
    category: 'economy',
    usage: 'öde <@kullanıcı> <miktar>',
    aliases: ['transfer', 'pay'],
    cooldown: 20, // Merkezi cooldown sistemimiz bu değeri kullanacak.
    async execute(message, args, client) {
        const { author, guild } = message;

        try {
            const targetUser = message.mentions.users.first();
            // parseAmount helper'ı ile '10k', '1m' gibi girdileri de destekliyoruz.
            const amount = args[1] ? parseAmount(args[1]) : null;

            if (!targetUser || !amount) {
                return message.reply({ embeds: [embeds.error(`Eksik veya hatalı argüman! Kullanım: \`${this.usage}\``)] });
            }
            if (amount <= 0 || !Number.isInteger(amount)) {
                return message.reply({ embeds: [embeds.error('Lütfen geçerli ve pozitif bir miktar girin.')] });
            }
            if (targetUser.id === author.id) {
                return message.reply({ embeds: [embeds.error('Kendine para gönderemezsin.')] });
            }
            if (targetUser.bot) {
                return message.reply({ embeds: [embeds.error('Botlara para gönderemezsin.')] });
            }
            
            // 1. Gönderenin bakiyesini 'await' ile doğru şekilde çekiyoruz.
            const senderAccount = await economyHelper.getUser(author.id, guild.id);

            if (senderAccount.balance < amount) {
                return message.reply({ embeds: [embeds.error(`Bu transfer için yeterli bakiyen yok! Mevcut bakiyen: **${senderAccount.balance.toLocaleString('tr-TR')}** coin.`)] });
            }
            
            // 2. İşlemleri sırayla ve 'await' ile güvenli bir şekilde yapıyoruz.
            // Önce gönderenden parayı çekiyoruz.
            const senderNewBalance = await economyHelper.removeBalance(author.id, guild.id, amount);
            // Sonra alıcıya parayı ekliyoruz.
            const targetNewBalance = await economyHelper.addBalance(targetUser.id, guild.id, amount);
            
            const successEmbed = embeds.success(`**${targetUser.username}** adlı kullanıcıya başarıyla **${amount.toLocaleString('tr-TR')}** coin gönderdin.`, '✅ Transfer Başarılı!')
                .addFields(
                    { name: 'Senin Yeni Bakiyen', value: `${senderNewBalance.toLocaleString('tr-TR')} coin`, inline: true },
                    { name: 'Onun Yeni Bakiyesi', value: `${targetNewBalance.toLocaleString('tr-TR')} coin`, inline: true }
                );

            await message.channel.send({ embeds: [successEmbed] });

        } catch (err) {
            console.error("[HATA] Öde komutunda hata:", err);
            await message.reply({ embeds: [embeds.error('Transfer sırasında beklenmedik bir hata oluştu.')] });
        }
    }
};