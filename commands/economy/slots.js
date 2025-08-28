// Dosya Yolu: commands/economy/slots.js
const { EmbedBuilder } = require('discord.js');
const economyHelper = require('../../utils/economyHelper');
const embeds = require('../../utils/embedhelper');

// --- Oyun Ayarları ---
const MIN_BET = 10;
const SYMBOLS = [
    { emoji: '🍒', payout: [1.5, 5],  weight: 10, text: "Kirazlar!", color: 'Green' },
    { emoji: '🍋', payout: [1.5, 5],  weight: 9,  text: "Limonlar!", color: 'Green' },
    { emoji: '🔔', payout: [3, 15],   weight: 8,  text: "Çanlar!", color: 'Green' },
    { emoji: '💎', payout: [5, 50],   weight: 4,  text: "Elmaslar!", color: 'Aqua' },
    { emoji: '7️⃣', payout: [10, 100], weight: 2,  text: "Şanslı Yediler!", color: 'Gold' },
    { emoji: '💀', payout: [0, 0],   weight: 12, text: "Kaybettin...", color: 'Red' }
];

// --- Yardımcı Fonksiyonlar ---
function spinReels() {
    const pool = [];
    SYMBOLS.forEach(s => { for (let i = 0; i < s.weight; i++) pool.push(s); });
    return [
        pool[Math.floor(Math.random() * pool.length)],
        pool[Math.floor(Math.random() * pool.length)],
        pool[Math.floor(Math.random() * pool.length)]
    ];
}

function calculateResult(result) {
    const [s1, s2, s3] = result;
    if (s1.emoji === s2.emoji && s2.emoji === s3.emoji) {
        return { multiplier: s1.payout[1], text: `ÜÇLÜ! ${s1.text}`, color: s1.color };
    }
    const emojiCounts = result.reduce((acc, { emoji }) => ({ ...acc, [emoji]: (acc[emoji] || 0) + 1 }), {});
    for (const emoji in emojiCounts) {
        if (emojiCounts[emoji] === 2) {
            const pairedSymbol = SYMBOLS.find(s => s.emoji === emoji);
            if (pairedSymbol) return { multiplier: pairedSymbol.payout[0], text: `İkili! ${pairedSymbol.text}`, color: pairedSymbol.color };
        }
    }
    return { multiplier: 0, text: "Kaybettin! Bir dahaki sefere...", color: 'Red' };
}

function generateReelString(reels) {
    return `| ${reels.map(s => s.emoji).join(' | ')} |`;
}

// --- Ana Komut ---
module.exports = {
    name: 'slots',
    description: 'Slot makinesini çevir ve şansını dene!',
    category: 'economy',
    usage: 'slots <bahis>',
    aliases: ['slot'],
    cooldown: 10,
    async execute(message, args, client) {
        const { author, guild } = message;

        const bet = parseInt(args[0]);
        if (isNaN(bet) || bet < MIN_BET) {
            return message.reply({ embeds: [embeds.error(`Lütfen en az **${MIN_BET}** coin olacak şekilde geçerli bir bahis girin.`)] });
        }

        try {
            // KRİTİK DÜZELTME: Kullanıcı verisi 'await' ile beklenmeli.
            const userAccount = await economyHelper.getUser(author.id, guild.id);
            if (userAccount.balance < bet) {
                return message.reply({ embeds: [embeds.error(`Yetersiz bakiye! Bu bahis için **${bet.toLocaleString()}** coin gerekli.`)] });
            }

            const initialEmbed = new EmbedBuilder()
                .setColor('Grey')
                .setTitle('🎰 Slot Makinesi')
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .setDescription('Makaralar dönüyor...');
            const gameMessage = await message.channel.send({ embeds: [initialEmbed] });
            
            // Metin tabanlı dinamik animasyon
            const spinCount = 15;
            for (let i = 0; i < spinCount; i++) {
                const randomReels = spinReels(); // Her seferinde rastgele semboller göster
                initialEmbed.setDescription(generateReelString(randomReels));
                await gameMessage.edit({ embeds: [initialEmbed] });
                await new Promise(resolve => setTimeout(resolve, i * 20 + 100));
            }
            
            const finalResult = spinReels();
            const { multiplier, text, color } = calculateResult(finalResult);
            const netChange = Math.floor(bet * multiplier) - bet;
            let newBalance;

            // KRİTİK DÜZELTME: Doğru bakiye fonksiyonlarını 'await' ile kullanma
            if (netChange > 0) {
                newBalance = await economyHelper.addBalance(author.id, guild.id, netChange);
            } else if (netChange < 0) {
                newBalance = await economyHelper.removeBalance(author.id, guild.id, Math.abs(netChange));
            } else {
                newBalance = userAccount.balance; // Bakiye değişmedi
            }
            
            const resultEmbed = new EmbedBuilder()
                .setColor(color)
                .setTitle('🎰 Sonuçlar Geldi! 🎰')
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .setDescription(generateReelString(finalResult))
                .addFields(
                    { name: 'Sonuç', value: `> **${text}**` },
                    { name: `Kazanç/Kayıp`, value: `> **${netChange >= 0 ? '+' : ''}${netChange.toLocaleString()}** coin`},
                    { name: 'Yeni Bakiye', value: `> **${newBalance.toLocaleString()}** coin` }
                )
                .setFooter({ text: `Bahis: ${bet.toLocaleString()}`})
                .setTimestamp();
            
            await gameMessage.edit({ embeds: [resultEmbed] });

        } catch (error) {
            console.error("[HATA] Slots komutunda hata:", error);
            await message.reply({ embeds: [embeds.error('Slot makinesi çevrilirken bir hata oluştu.')] });
        }
    }
};