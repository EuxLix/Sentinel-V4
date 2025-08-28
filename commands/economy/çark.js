// Dosya Yolu: commands/economy/çark.js
const { EmbedBuilder } = require('discord.js');
const economyHelper = require('../../utils/economyHelper');
const embeds = require('../../utils/embedhelper');

// --- Çark Ayarları ---
// weight: Bu dilimin gelme olasılığı. Toplam ağırlık ne kadar yüksekse, bir dilimin şansı o kadar düşer.
const WHEEL_SLICES = [
    { emoji: '💀', multiplier: 0, weight: 50, text: "Hiçlik! Bahsin buharlaştı.", color: 'DarkRed' },
    { emoji: '⭐', multiplier: 1, weight: 30, text: "Nötr! Bahsin iade edildi.", color: 'Yellow' },
    { emoji: '🍒', multiplier: 2, weight: 15, text: "Kirazlar! Bahsinin 2 katını kazandın!", color: 'Green' },
    { emoji: '🍋', multiplier: 3, weight: 7, text: "Limonlar! Bahsinin 3 katını kazandın!", color: 'Green' },
    { emoji: '🍉', multiplier: 5, weight: 4, text: "Karpuz! Bahsinin 5 katını kazandın!", color: 'Green' },
    { emoji: '💎', multiplier: 10, weight: 1, text: "JACKPOT! Bahsinin tam 10 katını kazandın!", color: 'Gold' }
];
const MIN_BET = 20;

/**
 * Ağırlıklı şans sistemine göre çarkı döndürür ve sonuç dilimini seçer.
 */
function spinWheel() {
    const pool = [];
    // Her dilimi, 'weight' değeri kadar havuza ekleyerek olasılıkları belirliyoruz.
    WHEEL_SLICES.forEach(slice => {
        for (let i = 0; i < slice.weight; i++) {
            pool.push(slice);
        }
    });
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Çarkın görselini, seçilen dilimi vurgulayarak oluşturur.
 */
function createWheelDisplay(activeIndex) {
    return WHEEL_SLICES.map((slice, index) => 
        index === activeIndex ? `[ **${slice.emoji}** ]` : slice.emoji
    ).join(' ');
}

module.exports = {
    name: 'çark',
    description: 'Şans çarkını çevir ve şansını dene!',
    category: 'economy',
    usage: 'çark <bahis>',
    aliases: ['wheel', 'spin'],
    cooldown: 10,
    async execute(message, args, client) {
        const { author, guild } = message;

        const bet = parseInt(args[0]);
        if (isNaN(bet) || bet < MIN_BET) {
            return message.reply({ embeds: [embeds.error(`Lütfen en az **${MIN_BET}** coin olacak şekilde geçerli bir bahis girin.`)] });
        }

        try {
            const userAccount = await economyHelper.getUser(author.id, guild.id);
            if (userAccount.balance < bet) {
                return message.reply({ embeds: [embeds.error(`Yetersiz bakiye! Bu bahis için **${bet.toLocaleString()}** coin gerekli.`)] });
            }

            // --- Animasyon ve Oyun Mantığı ---
            const initialEmbed = new EmbedBuilder()
                .setColor('Grey')
                .setTitle('🎡 Şans Çarkı')
                .setDescription('Çark dönüyor...')
                .addFields({ name: 'Mevcut Bahis', value: `**${bet.toLocaleString()}** coin` });

            const gameMessage = await message.channel.send({ embeds: [initialEmbed] });

            // Animasyonlu çark dönüşü
            const totalSpins = 15; // Animasyonun uzunluğu
            for (let i = 0; i < totalSpins; i++) {
                const activeIndex = i % WHEEL_SLICES.length;
                initialEmbed.setDescription(createWheelDisplay(activeIndex));
                await gameMessage.edit({ embeds: [initialEmbed] });
                await new Promise(resolve => setTimeout(resolve, 100 + (i * 15))); // Giderek yavaşlayan efekt
            }
            
            // --- Sonuç Hesaplama ---
            const chosenSlice = spinWheel();
            const finalWheelDisplay = createWheelDisplay(WHEEL_SLICES.indexOf(chosenSlice));
            
            const netChange = bet * (chosenSlice.multiplier - 1);
            let newBalance;

            if (netChange > 0) {
                newBalance = await economyHelper.addBalance(author.id, guild.id, netChange);
            } else if (netChange < 0) {
                newBalance = await economyHelper.removeBalance(author.id, guild.id, Math.abs(netChange));
            } else {
                newBalance = userAccount.balance; // Bakiye değişmez (multiplier = 1)
            }

            // --- Sonuç Embed'i ---
            const resultEmbed = new EmbedBuilder()
                .setColor(chosenSlice.color)
                .setTitle('🎡 Çark Durdu! 🎡')
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .setDescription(finalWheelDisplay)
                .addFields(
                    { name: 'Sonuç', value: `> **${chosenSlice.text}**` },
                    { name: `Net Kazanç/Kayıp`, value: `> **${netChange >= 0 ? '+' : ''}${netChange.toLocaleString()}** coin`},
                    { name: 'Yeni Bakiye', value: `> **${newBalance.toLocaleString()}** coin` }
                )
                .setTimestamp();
            
            await gameMessage.edit({ embeds: [resultEmbed] });

        } catch (error) {
            console.error("[HATA] Çark komutunda hata:", error);
            await message.reply({ embeds: [embeds.error('Çark çevrilirken bir hata oluştu.')] });
        }
    }
};