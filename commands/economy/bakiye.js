// Dosya Yolu: commands/economy/bakiye.js
const { EmbedBuilder } = require('discord.js');
const economyHelper = require('../../utils/economyHelper');
const embeds = require('../../utils/embedhelper');

module.exports = {
    name: 'bakiye',
    description: 'Kendi veya başka bir kullanıcının bakiyesini gösterir.',
    category: 'economy',
    usage: 'bakiye [@kullanıcı veya ID]',
    aliases: ['cüzdan', 'param', 'balance'],
    cooldown: 5,
    async execute(message, args, client) {
        try {
            // Hedef kullanıcıyı bulma mantığı basitleştirildi.
            // Önce etiketlenen kullanıcı, sonra ID, hiçbiri yoksa komutu yazan kişi hedeftir.
            const targetUser = message.mentions.users.first() 
                || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null)
                || message.author;

            if (!targetUser) {
                return message.reply({ embeds: [embeds.error('Geçerli bir kullanıcı bulunamadı.')] });
            }
            if (targetUser.bot) {
                return message.reply({ embeds: [embeds.info('Botların bir cüzdanı yoktur.')] });
            }

            // KRİTİK DÜZELTME: economyHelper.getUser asenkron bir işlemdir ve 'await' ile beklenmelidir.
            const userAccount = await economyHelper.getUser(targetUser.id, message.guild.id);

            const balanceEmbed = new EmbedBuilder()
                .setColor('#FFD700') // Altın sarısı
                .setAuthor({ name: `${targetUser.username} Adlı Kullanıcının Cüzdanı`, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
                .addFields({ name: '💰 Bakiye', value: `**${userAccount.balance.toLocaleString('tr-TR')}** coin` })
                .setTimestamp()
                .setFooter({ text: 'Sentinel Ekonomi' });

            await message.channel.send({ embeds: [balanceEmbed] });
        } catch (err) {
            console.error("[HATA] Bakiye komutunda hata:", err);
            // Merkezi hata yakalayıcının yanı sıra kullanıcıya da bilgi verelim.
            await message.reply({ embeds: [embeds.error('Bakiye bilgisi alınırken bir hata oluştu.')] });
        }
    }
};