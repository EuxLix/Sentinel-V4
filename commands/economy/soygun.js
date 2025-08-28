// Dosya Yolu: commands/economy/soygun.js
const economyHelper = require('../../utils/economyHelper');
const embeds = require('../../utils/embedhelper');
const ms = require('ms');

// --- Komut Ayarları ---
const COOLDOWN = 6 * 60 * 60 * 1000; // 6 saat
const PENALTY = 1000; // Yakalanma cezası
const MIN_WIN = 2000; // Minimum kazanç
const MAX_WIN = 30000; // Maksimum kazanç
const SUCCESS_RATE = 0.40; // %40 başarı şansı

module.exports = {
    name: 'soygun',
    description: 'Risk al ve para çalmayı dene! (6 saat bekleme süresi)',
    category: 'economy',
    usage: 'soygun',
    aliases: ['çal', 'steal'],
    cooldown: 60, // Ana komut spam'ını önlemek için
    async execute(message, args, client) {
        const { author, guild } = message;

        try {
            // 1. Kullanıcı verisini 'await' ile veritabanından doğru şekilde çekiyoruz.
            const userAccount = await economyHelper.getUser(author.id, guild.id);
            const now = Date.now();
            
            // 2. Bekleme süresini '.getTime()' ile güvenli bir şekilde kontrol ediyoruz.
            const timeSinceLastRob = now - (userAccount.lastRob?.getTime() || 0);

            if (timeSinceLastRob < COOLDOWN) {
                const remaining = ms(COOLDOWN - timeSinceLastRob, { long: true });
                return message.reply({ embeds: [embeds.warning(`Tekrar denemek için çok erken! **${remaining}** daha beklemelisin.`)] });
            }

            if (userAccount.balance < PENALTY) {
                return message.reply({ embeds: [embeds.error(`Yakalanırsan ödeyecek kadar bile paran yok! Bu riski alamazsın. (Gereken: ${PENALTY} coin)`)] });
            }
            
            // 3. Bekleme süresini en başta 'await' ile ayarlayarak, spam denemelerini engelliyoruz.
            await economyHelper.setCooldown(author.id, guild.id, 'rob');

            const isSuccess = Math.random() < SUCCESS_RATE;
            let resultEmbed;
            let newBalance;

            if (isSuccess) {
                const winnings = Math.floor(Math.random() * (MAX_WIN - MIN_WIN + 1)) + MIN_WIN;
                // 4. Bakiye güncelleme işlemini 'await' ile yapıyoruz.
                newBalance = await economyHelper.addBalance(author.id, guild.id, winnings);
                resultEmbed = embeds.success(`Gizlice içeri sızdın ve **+${winnings.toLocaleString('tr-TR')}** coin çaldın!`, '✅ Başarılı Operasyon!')
                    .addFields({ name: 'Yeni Bakiye', value: `**${newBalance.toLocaleString('tr-TR')}** coin` });
            } else {
                // 5. Bakiye güncelleme işlemini 'await' ile yapıyoruz.
                newBalance = await economyHelper.removeBalance(author.id, guild.id, PENALTY);
                resultEmbed = embeds.error(`İşler ters gitti ve yakalandın! **-${PENALTY.toLocaleString('tr-TR')}** coin ceza ödedin.`, '🚨 Yakalandın!')
                    .addFields({ name: 'Yeni Bakiye', value: `**${newBalance.toLocaleString('tr-TR')}** coin` });
            }

            // Kullanıcıya sonucu bildiriyoruz.
            await message.channel.send({ embeds: [resultEmbed] });

        } catch (error) {
            console.error("[HATA] Soygun komutunda hata:", error);
            await message.reply({ embeds: [embeds.error('Bu komutu çalıştırırken bir hata oluştu.')] });
        }
    }
};