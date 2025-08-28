const { EmbedBuilder, WebhookClient, Collection, PermissionsBitField } = require('discord.js');
const embeds = require('../../utils/embedhelper');

// Spam kontrolü için kullanıcıların son rapor zamanlarını tutacak koleksiyon
const reportCooldowns = new Collection();
const ONE_HOUR = 60 * 60 * 1000; // 1 saat milisaniye cinsinden

module.exports = {
    name: 'report',
    description: 'Bir hata veya öneri bildirirsiniz. (Saatte bir kullanılabilir)',
    category: 'utility',
    usage: 'report <mesajınız>',
    aliases: ['bildir', 'hata-bildir'],
    cooldown: 5, // Komutun normal bekleme süresi
    async execute(message, args) {
        const { author, member, guild } = message;
        const reportMessage = args.join(' ');

        if (!reportMessage) {
            return message.reply({ embeds: [embeds.error(`Lütfen bildirmek istediğiniz mesajı yazın.\n**Kullanım:** \`${process.env.PREFIX}report <mesaj>\``)] });
        }

        // --- SPAM & TIMEOUT KONTROLÜ ---
        const lastReportTime = reportCooldowns.get(author.id);
        const now = Date.now();

        if (lastReportTime) {
            const timeSinceLastReport = now - lastReportTime;
            if (timeSinceLastReport < ONE_HOUR) {
                // Eğer kullanıcı 1 saat içinde tekrar deniyorsa, timeout uygula
                try {
                    if (member.moderatable) { // Botun kullanıcıya timeout atma yetkisi var mı?
                        await member.timeout(ONE_HOUR, 'Report komutunu spamladı.');
                        const timeoutEmbed = embeds.warning(`Report komutunu 1 saat içinde birden fazla kullandığın için 1 saat boyunca susturuldun.`);
                        await message.author.send({ embeds: [timeoutEmbed] }).catch(() => {}); // Kullanıcıya DM at
                    }
                } catch (error) {
                    console.error(`${author.tag} kullanıcısına timeout atılırken hata oluştu:`, error);
                } finally {
                    // Her durumda spam mesajını sil
                    message.delete().catch(() => {});
                }
                return; // Kodu burada sonlandır
            }
        }
        
        // --- WEBHOOK İŞLEMİ ---
        const webhookUrl = process.env.REPORT_WEBHOOK_URL;
        if (!webhookUrl) {
            console.error("REPORT_WEBHOOK_URL .env dosyasında bulunamadı!");
            return message.reply({ embeds: [embeds.error('Rapor sistemi şu anda düzgün yapılandırılmamış.')] });
        }

        try {
            const webhookClient = new WebhookClient({ url: webhookUrl });

            const reportEmbed = new EmbedBuilder()
                .setTitle('📢 Yeni Rapor/Öneri')
                .setAuthor({ name: author.tag, iconURL: author.displayAvatarURL() })
                .setColor('Orange')
                .addFields(
                    { name: 'Kullanıcı', value: `${author} (\`${author.id}\`)`, inline: true },
                    { name: 'Sunucu', value: `${guild.name} (\`${guild.id}\`)`, inline: true }
                )
                .setDescription(reportMessage)
                .setTimestamp();

            // Webhook'a gönder
            await webhookClient.send({
                username: 'Hata Bildirim Botu',
                avatarURL: message.client.user.displayAvatarURL(),
                embeds: [reportEmbed],
            });

            // Kullanıcının son rapor zamanını kaydet
            reportCooldowns.set(author.id, now);
            // Başarılı olursa kullanıcının mesajını sil
            await message.delete();

            // Kullanıcıya gizli bir onay mesajı gönderelim
            const confirmation = await message.channel.send({embeds: [embeds.success(`${author}, raporun başarıyla iletildi. Teşekkürler!`)]});
            setTimeout(() => confirmation.delete(), 5000);


        } catch (error) {
            console.error('Webhook\'a gönderilirken veya mesaj silinirken hata oluştu:', error);
            await message.reply({ embeds: [embeds.error('Raporun gönderilirken bir hata oluştu.')] });
        }
    }
};