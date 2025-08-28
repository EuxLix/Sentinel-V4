const { EmbedBuilder, ChannelType, GuildVerificationLevel, GuildExplicitContentFilter, GuildNSFWLevel } = require('discord.js');

module.exports = {
    name: 'guildinfo',
    description: 'Sunucu hakkında detaylı bilgi verir.',
    category: 'utility',
    usage: 'guildinfo',
    cooldown: 10,
    async execute(message, args) {
        const { guild } = message;
        await guild.members.fetch(); 
        const owner = await guild.fetchOwner();

        // Haritalar (Metne Çevirme)
        const verificationLevels = {
            [GuildVerificationLevel.None]: 'Yok',
            [GuildVerificationLevel.Low]: 'Düşük',
            [GuildVerificationLevel.Medium]: 'Orta',
            [GuildVerificationLevel.High]: 'Yüksek',
            [GuildVerificationLevel.VeryHigh]: 'Çok Yüksek',
        };
        const nsfwLevels = {
            [GuildNSFWLevel.Default]: 'Varsayılan',
            [GuildNSFWLevel.Explicit]: 'Sakıncalı (Explicit)',
            [GuildNSFWLevel.Safe]: 'Güvenli (Safe)',
            [GuildNSFWLevel.AgeRestricted]: 'Yaş Sınırlamalı',
        };
        const tierMap = { 0: 'Seviye 0', 1: 'Seviye 1', 2: 'Seviye 2', 3: 'Seviye 3' };
        
        // Kanal sayıları
        const channels = guild.channels.cache;
        const textChannels = channels.filter(c => c.type === ChannelType.GuildText).size;
        const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice).size;
        const categoryChannels = channels.filter(c => c.type === ChannelType.GuildCategory).size;
        const otherChannels = channels.size - textChannels - voiceChannels - categoryChannels;

        // Emoji ve Sticker Sayıları
        const regularEmojis = guild.emojis.cache.filter(e => !e.animated).size;
        const animatedEmojis = guild.emojis.cache.filter(e => e.animated).size;
        const totalEmojis = guild.emojis.cache.size;
        const maxEmojis = guild.premiumTier === 3 ? 250 : guild.premiumTier === 2 ? 150 : guild.premiumTier === 1 ? 100 : 50;

        const createBar = (current, max) => {
            const percentage = (current / max) * 100;
            const filledBlocks = Math.round((percentage / 100) * 10);
            const emptyBlocks = 10 - filledBlocks;
            return `\`${'▓'.repeat(filledBlocks)}${'░'.repeat(emptyBlocks)}\` **${current}/${max}**`;
        };

        const embed = new EmbedBuilder()
            .setColor(guild.premiumTier > 1 ? '#FF73FA' : '#5865F2') // Takviye varsa renk değişsin
            .setTitle(`${guild.name} Sunucu Bilgileri`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
            .addFields(
                // Sol Sütun
                { name: '👑 Sahip', value: `${owner}`, inline: true },
                { name: '👥 Üyeler', value: `**${guild.memberCount.toLocaleString()}** Toplam\n**${guild.members.cache.filter(m => !m.user.bot).size.toLocaleString()}** İnsan\n**${guild.members.cache.filter(m => m.user.bot).size.toLocaleString()}** Bot`, inline: true },
                { name: `💬 Kanallar (${channels.size})`, value: `**${textChannels}** Metin\n**${voiceChannels}** Ses\n**${categoryChannels}** Kategori\n**${otherChannels}** Diğer`, inline: true },
                // Sağ Sütun
                { name: '🗓️ Oluşturulma', value: `<t:${parseInt(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: `💎 Takviye (${guild.premiumSubscriptionCount || 0})`, value: `**${tierMap[guild.premiumTier]}**`, inline: true },
                { name: '🛡️ Güvenlik', value: `**Doğrulama:** ${verificationLevels[guild.verificationLevel]}\n**NSFW Düzeyi:** ${nsfwLevels[guild.nsfwLevel]}`, inline: true },
                // Alt Kısım
                { name: `😀 Emojiler (${totalEmojis}/${maxEmojis})`, value: createBar(totalEmojis, maxEmojis), inline: false },
                { name: `✨ Stickerlar (${guild.stickers.cache.size}/60)`, value: createBar(guild.stickers.cache.size, 60), inline: false },
                { name: '📜 Rol Sayısı', value: `**${guild.roles.cache.size}**`, inline: false },
            )
            .setTimestamp()
            .setFooter({ text: `Sunucu ID: ${guild.id}` });

        if (guild.banner) {
            embed.setImage(guild.bannerURL({ size: 4096, dynamic: true }));
        }

        await message.channel.send({ embeds: [embed] });
    },
};