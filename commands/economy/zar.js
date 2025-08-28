// Dosya Yolu: commands/economy/zar.js
const { EmbedBuilder } = require('discord.js');
const economyHelper = require('../../utils/economyHelper');
const embeds = require('../../utils/embedhelper');

// --- Oyun Ayarları ---
const MIN_BET = 10;
const DICE_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣']; // Dilersen özel emojiler ekleyebilirsin
const ROLLING_DICE_GIF = 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZzJpaHR6cXRzemNmM3k1OXNpcjE5NXE5c29jZWZiM3psZ2h4bmxrYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/RwBY2pCSy4ID7rzQpm/giphy.gif';

/**
 * 1 ile 6 arasında rastgele bir zar atar.
 * @returns {number} 1-6 arası bir sayı.
 */
function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
}

module.exports = {
    name: 'zar',
    description: 'Bota karşı zar at! Yüksek atan kazanır.',
    category: 'economy',
    usage: 'zar <bahis>',
    aliases: ['dice', 'zarat'],
    cooldown: 10,
    async execute(message, args, client) {
        const { author, guild } = message;

        const bet = parseInt(args[0]);
        if (isNaN(bet) || bet < MIN_BET) {
            return message.reply({ embeds: [embeds.error(`Lütfen en az **${MIN_BET}** coin olacak şekilde geçerli bir bahis gir.`)] });
        }

        try {
            const userAccount = await economyHelper.getUser(author.id, guild.id);
            if (userAccount.balance < bet) {
                return message.reply({ embeds: [embeds.error(`Yetersiz bakiye! Bu bahis için **${bet.toLocaleString()}** coin gerekli.`)] });
            }

            const rollingEmbed = new EmbedBuilder()
                .setColor('Grey')
                .setAuthor({ name: `${author.username} zarları atıyor...` })
                .setDescription(`**Bahis:** ${bet.toLocaleString('tr-TR')} coin`)
                .setImage(ROLLING_DICE_GIF);
            const gameMessage = await message.channel.send({ embeds: [rollingEmbed] });

            await new Promise(resolve => setTimeout(resolve, 2500));

            const userRoll = rollDie();
            const botRoll = rollDie();
            let newBalance;
            let resultEmbed;

            if (userRoll > botRoll) {
                // KAZANMA DURUMU
                newBalance = await economyHelper.addBalance(author.id, guild.id, bet);
                resultEmbed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('🎉 Kazandın!');
            } else if (botRoll > userRoll) {
                // KAYBETME DURUMU
                newBalance = await economyHelper.removeBalance(author.id, guild.id, bet);
                resultEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('💸 Kaybettin!');
            } else {
                // BERABERLİK DURUMU
                newBalance = userAccount.balance; // Bakiye değişmez
                resultEmbed = new EmbedBuilder()
                    .setColor('Yellow')
                    .setTitle('⚖️ Berabere!');
            }

            resultEmbed
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .setDescription(`**Senin Zarın:** ${DICE_EMOJIS[userRoll - 1]} ( ${userRoll} )\n**Botun Zarı:** ${DICE_EMOJIS[botRoll - 1]} ( ${botRoll} )`)
                .addFields({ name: 'Yeni Bakiye', value: `**${newBalance.toLocaleString('tr-TR')}** coin` })
                .setTimestamp();
            
            await gameMessage.edit({ embeds: [resultEmbed] });

        } catch (error) {
            console.error("[HATA] Zar komutunda hata:", error);
            await message.reply({ embeds: [embeds.error('Zar atılırken bir hata oluştu.')] });
        }
    }
};