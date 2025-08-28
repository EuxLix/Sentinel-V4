// Dosya Yolu: commands/economy/lider.js
const { EmbedBuilder } = require('discord.js');
const economyHelper = require('../../utils/economyHelper');
const embeds = require('../../utils/embedhelper');

module.exports = {
    name: 'lider',
    description: 'Sunucudaki en zengin kullanıcıları listeler.',
    category: 'economy',
    usage: 'lider',
    aliases: ['leaderboard', 'zenginler', 'top'],
    cooldown: 30,
    async execute(message, args, client) {
        try {
            // KRİTİK DÜZELTME: Veritabanı işlemi 'await' ile beklenmeli.
            const topUsers = await economyHelper.getLeaderboard(message.guild.id, 10);

            if (!topUsers || topUsers.length === 0) {
                return message.reply({ embeds: [embeds.info('Liderlik tablosunda gösterilecek kimse yok.')] });
            }

            // OPTİMİZASYON: Tüm üyeleri tek bir API isteği ile çek.
            // Bu, döngü içinde tek tek çekmekten çok daha verimlidir.
            const userIds = topUsers.map(u => u.userId);
            await message.guild.members.fetch({ user: userIds }).catch(() => {}); // Bulunamayanları yoksay

            const leaderboardEmbed = new EmbedBuilder()
                .setTitle(`🏆 ${message.guild.name} Sunucusunun Zenginler Kulübü`)
                .setColor('Gold')
                .setTimestamp()
                .setFooter({ text: 'Sentinel Ekonomi' });

            // Kod okunabilirliği için .map() ve .join() kullanıldı.
            const leaderboardEntries = topUsers.map((user, index) => {
                const member = message.guild.members.cache.get(user.userId);
                const rankMedals = ['🥇', '🥈', '🥉'];
                const rank = rankMedals[index] || `**${index + 1}.**`;
                
                // Üye sunucudan ayrılmış veya bulunamazsa farklı bir metin göster.
                const userName = member ? member.user.username : 'Ayrılmış Kullanıcı';
                const balance = user.balance.toLocaleString('tr-TR');

                return `${rank} **${userName}** • \`${balance}\` coin`;
            });

            leaderboardEmbed.setDescription(leaderboardEntries.join('\n'));
            await message.channel.send({ embeds: [leaderboardEmbed] });

        } catch (error) {
            console.error("[HATA] Lider komutunda hata:", error);
            await message.reply({ embeds: [embeds.error('Liderlik tablosu alınırken bir hata oluştu.')] });
        }
    }
};