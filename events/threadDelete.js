// Dosya Yolu: events/threadCreate.js
const { EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');

module.exports = {
    name: 'threadCreate',
    async execute(threadChannel, newlyCreated, client) { // Client parametresi eklendi
        if (!newlyCreated) return;

        const { guild, name, parent } = threadChannel;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        let author = null;
        try {
            // Forum postlarından oluşturulan thread'lerde starterMessage olmayabilir.
            const starterMessage = await threadChannel.fetchStarterMessage().catch(() => null);
            if (starterMessage) {
                author = starterMessage.author;
            } else {
                // Eğer başlangıç mesajı yoksa, konuyu oluşturanı owner'dan almayı dene
                const owner = await threadChannel.fetchOwner();
                if(owner && owner.user) author = owner.user;
            }
        } catch (error) {
            console.log(`[BİLGİ] "${name}" konusu için yazar bilgisi alınamadı.`);
        }

        const embed = new EmbedBuilder()
            .setColor('#99AAB5')
            .setTitle('Log: Konu (Thread) Oluşturuldu')
            .setAuthor({ name: author?.tag || 'Bilinmiyor', iconURL: author?.displayAvatarURL() })
            .setDescription(`**Konu:** ${threadChannel} (\`${name}\`)\n**Ana Kanal:** ${parent || 'Bilinmiyor'}`)
            .setTimestamp();
            
        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};