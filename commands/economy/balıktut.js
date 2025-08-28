// Dosya Yolu: commands/economy/balıktut.js
const { EmbedBuilder } = require('discord.js');
const economyHelper = require('../../utils/economyHelper');
const embeds = require('../../utils/embedhelper');

// Balık tutma oyunu için sabitler
const FISHING_COST = 10; // Her balık tutma denemesinin maliyeti
const FISHING_COOLDOWN = 1; // 1 saniye cooldown

// Yakalanabilecek balıklar, değerleri ve olasılıkları (ağırlıklar)
const FISH_TABLE = [
    { name: "Hiçbir Şey", value: 0, weight: 45, emoji: "🗑️", text: "sadece oltana biraz yosun takılmış." },
    { name: "Sardalya", value: 5, weight: 20, emoji: "🐟", text: "bir sardalya yakaladın!" },
    { name: "Somon", value: 20, weight: 15, emoji: "🐠", text: "bir somon yakaladın!" },
    { name: "Orkinos", value: 50, weight: 15, emoji: "🐡", text: "koca bir orkinos yakaladın!" },
    { name: "Piranha", value: 150, weight: 5, emoji: "🦈", text: "tehlikeli bir piranha yakaladın!" },
    { name: "Efsanevi Altın Balık", value: 1000, weight: 2, emoji: "👑", text: "efsanevi altın balığı yakaladın!" },
    { name: "Pantolon balığı", value: 10000, weight: 1, emoji: "🍆", text: "azgın bir pantolon balığı yakaladın!" }
];

/**
 * Ağırlıklı şans sistemine göre yakalanan balığı seçer.
 */
function getRandomCatch() {
    const totalWeight = FISH_TABLE.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.floor(Math.random() * totalWeight);

    for (const item of FISH_TABLE) {
        if (random < item.weight) {
            return item;
        }
        random -= item.weight;
    }
}

module.exports = {
    name: 'balıktut',
    description: 'Şansını dene ve balık tutarak para kazan.',
    category: 'economy',
    usage: 'balıktut',
    aliases: ['fish'],
    cooldown: FISHING_COOLDOWN,

    async execute(message, args, client) {
        const { author, guild } = message;

        try {
            const userAccount = await economyHelper.getUser(author.id, guild.id);
            if (userAccount.balance < FISHING_COST) {
                return message.reply({ embeds: [embeds.error(`Balık tutmak için yeterli bakiyen yok! **${FISHING_COST}** coin gerekli.`)] });
            }

            // Balık tutma maliyetini düşürüyoruz
            await economyHelper.removeBalance(author.id, guild.id, FISHING_COST);
            
            // Rastgele balığı seçiyoruz
            const caughtFish = getRandomCatch();

            // Balığın değerini alıp bakiyeye ekliyoruz (Boşsa 0 eklenir)
            const newBalance = await economyHelper.addBalance(author.id, guild.id, caughtFish.value);

            const resultEmbed = new EmbedBuilder()
                .setTitle("🎣 Balık Tutma")
                .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
                .setDescription(`${caughtFish.emoji} Vay canına, ${author} ${caughtFish.text}`)
                .addFields(
                    { name: "Maliyet", value: `**-${FISHING_COST}** coin`, inline: true },
                    { name: "Kazanç", value: `**+${caughtFish.value}** coin`, inline: true },
                    { name: "Yeni Bakiye", value: `**${newBalance.toLocaleString('tr-TR')}** coin` }
                )
                .setColor(caughtFish.value > 0 ? '#2ECC71' : '#E74C3C')
                .setTimestamp();
                
            await message.channel.send({ embeds: [resultEmbed] });

        } catch (error) {
            console.error('[HATA] Balık tut komutunda hata:', error);
            await message.reply({ embeds: [embeds.error('Balık tutma işlemi sırasında bir hata oluştu.')] });
        }
    },
};