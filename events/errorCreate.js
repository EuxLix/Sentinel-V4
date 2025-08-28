// Dosya Yolu: events/errorCreate.js
const { EmbedBuilder, WebhookClient } = require('discord.js');
const embeds = require('../utils/embedhelper');

module.exports = {
    name: 'errorCreate',
    /**
     * Komutlar çalıştırılırken oluşan hataları yakalar ve raporlar.
     * @param {Error} error - Oluşan hata nesnesi.
     * @param {object} command - Hataya neden olan komut nesnesi.
     * @param {import('discord.js').Message} message - Hataya neden olan mesaj.
     */
    async execute(error, command, message) { 
        // 1. Konsola hatayı daha detaylı yazdır.
        console.error(`[HATA] '${command?.name || 'Bilinmeyen Komut'}' komutunda bir hata oluştu:`, error);

        // 2. Kullanıcıya genel bir hata mesajı gönder.
        //    Eğer bota yanıt verme izni yoksa veya kanal silinmişse oluşacak hatayı yoksay.
        message.reply({ 
            embeds: [embeds.error('Bu komutu çalıştırırken beklenmedik bir hata oluştu. Geliştiriciye bilgi verildi.')] 
        }).catch(() => {});

        // 3. Geliştirici için detaylı hata logunu webhook'a gönder.
        const webhookUrl = process.env.ERROR_LOGS_WEBHOOK_URL;
        if (!webhookUrl) {
            console.warn('[UYARI] ERROR_LOGS_WEBHOOK_URL .env dosyasında tanımlanmamış. Hata detayı gönderilemedi.');
            return;
        }

        try {
            const webhookClient = new WebhookClient({ url: webhookUrl });

            // Hatanın oluştuğu yer (Sunucu veya DM) için dinamik alanlar oluştur.
            const sourceInfo = message.inGuild() 
                ? [
                    { name: 'Sunucu', value: `${message.guild.name} (\`${message.guild.id}\`)`, inline: true },
                    { name: 'Kanal', value: `${message.channel.name} (\`${message.channel.id}\`)`, inline: true }
                  ]
                : [
                    { name: 'Kaynak', value: 'Özel Mesaj (DM)', inline: true }
                  ];

            const errorEmbed = new EmbedBuilder()
                .setTitle(`❌ Komut Hatası: ${command?.name || 'Bilinmeyen'}`)
                .setColor('#FF0000')
                .setURL(message.url) // Tıklandığında doğrudan mesaja gitmesi için link ekle.
                .addFields(
                    ...sourceInfo,
                    { name: 'Kullanıcı', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
                    { name: 'Mesaj İçeriği', value: `\`\`\`${message.content.slice(0, 1020) || 'Yok'}\`\`\``},
                    { name: 'Hata Mesajı', value: `\`\`\`${error.message}\`\`\`` },
                    { name: 'Hata Detayı (Stack)', value: `\`\`\`javascript\n${error.stack.slice(0, 1000)}\n...\`\`\`` }
                )
                .setTimestamp();

            await webhookClient.send({ username: 'Hata Logları', embeds: [errorEmbed] });

        } catch (webhookError) {
            console.error('[HATA] Webhook\'a hata logu gönderilirken başka bir hata oluştu:', webhookError);
        }
    }
};