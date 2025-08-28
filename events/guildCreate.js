// Dosya Yolu: events/guildCreate.js
const { EmbedBuilder, WebhookClient } = require('discord.js');

module.exports = {
    name: 'guildCreate',
    async execute(guild) {
        console.log(`[BİLGİ] Yeni sunucuya katıldım: ${guild.name} (ID: ${guild.id})`);

        // Webhook bildirimini göndermeyi dene.
        const webhookUrl = process.env.SERVER_LOGS_WEBHOOK_URL;
        if (!webhookUrl) return; // Webhook URL'si yoksa devam etme.

        try {
            // Sunucu sahibini güvenli bir şekilde al, bulunamazsa varsayılan bir değer kullan.
            const owner = await guild.fetchOwner().catch(() => ({ user: { tag: 'Bilinmiyor', id: 'Bilinmiyor' } }));

            const webhookClient = new WebhookClient({ url: webhookUrl });
            const embed = new EmbedBuilder()
                .setTitle('✅ Yeni Sunucuya Katıldım!')
                .setColor('#2ECC71')
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .addFields(
                    { name: 'Sunucu Adı', value: guild.name, inline: true },
                    { name: 'Sunucu ID', value: `\`${guild.id}\``, inline: true },
                    { name: 'Üye Sayısı', value: `\`${guild.memberCount.toLocaleString()}\``, inline: true },
                    { name: 'Sunucu Sahibi', value: `${owner.user.tag} (\`${owner.id}\`)`, inline: false },
                    { name: 'Oluşturulma Tarihi', value: `<t:${parseInt(guild.createdTimestamp / 1000)}:R>`, inline: false }
                )
                .setTimestamp();
            
            await webhookClient.send({ username: 'Sunucu Logları', embeds: [embed] });

        } catch (error) {
            console.error('[HATA] Yeni sunucu katılım webhook\'u gönderilirken hata oluştu:', error);
        }
    },
};