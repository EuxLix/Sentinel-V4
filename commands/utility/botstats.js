// Dosya Yolu: commands/utility/botstats.js
const { EmbedBuilder, version: djsVersion } = require('discord.js');
const os = require('os');
const embeds = require('../../utils/embedhelper'); // Standart embed'ler için

module.exports = {
    name: 'botstats',
    description: 'Botun detaylı istatistiklerini gösterir.',
    category: 'utility',
    aliases: ['bot-info', 'stats'],
    usage: 'botstats',
    cooldown: 10,
    async execute(message, args) {
        const { client } = message;

        try {
            // --- Verileri Toplama ---
            const owner = client.application.owner;
            const uptime = os.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor(uptime / 3600) % 24;
            const minutes = Math.floor(uptime / 60) % 60;
            const seconds = Math.floor(uptime % 60);
            const uptimeString = `**${days}** gün, **${hours}** saat, **${minutes}** dakika, **${seconds}** saniye`;

            const memoryUsage = process.memoryUsage().rss / 1024 / 1024;
            const totalMemory = os.totalmem() / 1024 / 1024;
            
            // --- RAM Barı Oluşturma ---
            const createBar = (current, max, blocks = 10) => {
                const percentage = Math.max(0, Math.min(100, (current / max) * 100));
                const filledBlocks = Math.round((percentage / 100) * blocks);
                const emptyBlocks = blocks - filledBlocks;
                return `\`[${'▓'.repeat(filledBlocks)}${'░'.repeat(emptyBlocks)}]\``;
            };
            const ramBar = createBar(memoryUsage, totalMemory);

            // --- Embed Oluşturma ---
            const botStatsEmbed = new EmbedBuilder()
                .setColor(embeds.info().data.color)
                .setAuthor({ name: `${client.user.username} Bot Bilgileri`, iconURL: client.user.displayAvatarURL() })
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '🕒 Çalışma Süresi', value: uptimeString, inline: false },
                    { name: '📊 Sunucu & Kullanıcı', value: `**${client.guilds.cache.size.toLocaleString()}** sunucu, **${client.users.cache.size.toLocaleString()}** kullanıcı`, inline: true },
                    { name: '⚡ Gecikme', value: `**${Math.max(0, client.ws.ping)}ms**`, inline: true },
                    { name: '👑 Bot Sahibi', value: `${owner || 'Bilinmiyor'}`, inline: true },
                    { name: '📚 Kütüphane', value: `**Discord.js** v${djsVersion}\n**Node.js** ${process.version}`, inline: false },
                    { name: `💻 Bellek Kullanımı (${(memoryUsage / totalMemory * 100).toFixed(1)}%)`, value: `${ramBar} **${memoryUsage.toFixed(1)} MB** / **${(totalMemory / 1024).toFixed(1)} GB**`, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: `Sorgulayan: ${message.author.tag}` });

            await message.channel.send({ embeds: [botStatsEmbed] });
        } catch (error) {
            console.error('[HATA] botstats komutunda hata:', error);
            message.reply({ embeds: [embeds.error('Bot istatistikleri alınırken bir hata oluştu.')] });
        }
    },
};