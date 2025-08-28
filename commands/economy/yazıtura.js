// Dosya Yolu: commands/economy/yazıtura.js
const { EmbedBuilder } = require('discord.js');
const economyHelper = require('../../utils/economyHelper');
const embeds = require('../../utils/embedhelper');

// --- Oyun Ayarları ---
const MIN_BET = 10;
const COIN_FLIP_GIF = 'https://media1.tenor.com/m/c-s3-1b_L2AAAAAC/coin-flip.gif'; // Daha sade bir GIF

module.exports = {
    name: 'yazıtura',
    description: '%50 şansla paranı ikiye katlamayı dene.',
    category: 'economy',
    usage: 'yazıtura <bahis>',
    aliases: ['cf', 'coinflip'],
    cooldown: 10,
    async execute(message, args, client) {
        const { author, guild } = message;

        // 1. Bahis miktarını alıyor ve doğruluyoruz.
        const bet = parseInt(args[0]);
        if (isNaN(bet) || bet < MIN_BET) {
            return message.reply({ embeds: [embeds.error(`Lütfen en az **${MIN_BET}** coin olacak şekilde geçerli bir bahis gir.`)] });
        }

        try {
            // 2. Kullanıcının bakiyesini 'await' ile doğru şekilde kontrol ediyoruz.
            const userAccount = await economyHelper.getUser(author.id, guild.id);
            if (userAccount.balance < bet) {
                return message.reply({ embeds: [embeds.error(`Yetersiz bakiye! Bu bahis için **${bet.toLocaleString()}** coin gerekli.`)] });
            }

            // 3. Animasyonlu başlangıç mesajını gönderiyoruz.
            const flippingEmbed = new EmbedBuilder()
                .setColor('Grey')
                .setAuthor({ name: `${author.username} şansını deniyor...`, iconURL: author.displayAvatarURL() })
                .setDescription(`**Bahis:** ${bet.toLocaleString('tr-TR')} coin`)
                .setImage(COIN_FLIP_GIF);

            const gameMessage = await message.channel.send({ embeds: [flippingEmbed] });
            
            // Animasyonun görünmesi için kısa bir bekleme süresi.
            await new Promise(resolve => setTimeout(resolve, 2500));

            // 4. Sonucu %50 şansla belirliyoruz.
            const isWin = Math.random() < 0.5;
            let newBalance;
            let resultEmbed;

            // 5. Bakiye işlemlerini 'await' ile güvenli bir şekilde yapıyoruz.
            if (isWin) {
                newBalance = await economyHelper.addBalance(author.id, guild.id, bet);
                resultEmbed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('🎉 Kazandın!')
                    .setDescription(`Şans senden yana! **+${bet.toLocaleString('tr-TR')}** coin kazandın!`);
            } else {
                newBalance = await economyHelper.removeBalance(author.id, guild.id, bet);
                resultEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('💸 Kaybettin!')
                    .setDescription(`Bir dahaki sefere... **-${bet.toLocaleString('tr-TR')}** coin kaybettin.`);
            }

            // 6. Sonuç embed'ini oluşturup, yeni bakiyeyi gösteriyoruz.
            resultEmbed
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .setTimestamp()
                .addFields({ name: 'Yeni Bakiye', value: `**${newBalance.toLocaleString('tr-TR')}** coin` });

            // Başlangıç mesajını sonuç mesajıyla güncelliyoruz.
            await gameMessage.edit({ embeds: [resultEmbed] });

        } catch (error) {
            console.error("[HATA] Yazı Tura komutunda hata:", error);
            await message.reply({ embeds: [embeds.error('Oyun sırasında beklenmedik bir hata oluştu.')] });
        }
    }
};