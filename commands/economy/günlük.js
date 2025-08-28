// Dosya Yolu: commands/economy/günlük.js
const economyHelper = require('../../utils/economyHelper');
const embeds = require('../../utils/embedhelper');
const ms = require('ms');

const DAILY_REWARD = 500;
const COOLDOWN = 24 * 60 * 60 * 1000; // 24 saat

module.exports = {
    name: 'günlük',
    description: '24 saatte bir günlük ödülünüzü alırsınız.',
    category: 'economy',
    usage: 'günlük',
    aliases: ['daily'],
    cooldown: 10,
    async execute(message, args, client) {
        const { author, guild } = message;

        try {
            // 1. Kullanıcı verisini 'await' ile veritabanından çekiyoruz.
            const userAccount = await economyHelper.getUser(author.id, guild.id);
            const now = Date.now();
            
            // 2. Tarih objesinden '.getTime()' ile milisaniye alarak daha güvenli bir hesaplama yapıyoruz.
            const timeSinceLastDaily = now - (userAccount.lastDaily?.getTime() || 0);

            if (timeSinceLastDaily < COOLDOWN) {
                const remainingTime = ms(COOLDOWN - timeSinceLastDaily, { long: true });
                return message.reply({ embeds: [embeds.warning(`Günlük ödülünü tekrar alabilmek için **${remainingTime}** daha beklemelisin.`)] });
            }

            // 3. Para ekleme ve bekleme süresini ayarlama işlemlerini 'await' ile bekliyoruz.
            // Bu, işlemlerin başarıyla tamamlandığından emin olmamızı sağlar.
            const newBalance = await economyHelper.addBalance(author.id, guild.id, DAILY_REWARD);
            await economyHelper.setCooldown(author.id, guild.id, 'daily');

            const successEmbed = embeds.success(`**${DAILY_REWARD.toLocaleString('tr-TR')}** coin günlük ödülünü başarıyla aldın!`, '🎉 Günlük Ödül!')
                .addFields({ name: 'Yeni Bakiyen', value: `**${newBalance.toLocaleString('tr-TR')}** coin` });

            await message.channel.send({ embeds: [successEmbed] });
        } catch (err) {
            console.error("[HATA] Günlük komutunda hata:", err);
            await message.reply({ embeds: [embeds.error('Ödülünü alırken bir hata oluştu.')] });
        }
    }
};