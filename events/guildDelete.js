// Dosya Yolu: events/guildDelete.js
const { EmbedBuilder, WebhookClient } = require('discord.js');

// Veri temizliği için tüm Mongoose modellerimizi import ediyoruz
const GuildSettings = require('../models/GuildSettings');
const Economy = require('../models/Economy');
const Giveaway = require('../models/Giveaway');
const PrivateRoom = require('../models/PrivateRoom');
const Warning = require('../models/Warning');


module.exports = {
    name: 'guildDelete',
    async execute(guild) {
        if (guild.partial) {
            try {
                await guild.fetch();
            } catch (error) {
                console.error(`[HATA] Ayrılan sunucu verisi fetch edilemedi (ID: ${guild.id}):`, error);
            }
        }
        
        console.log(`[BİLGİ] ${guild.name || `ID: ${guild.id}`} sunucusundan ayrıldım.`);

        // 1. Webhook ile bildirim gönder.
        const webhookUrl = process.env.SERVER_LOGS_WEBHOOK_URL;
        if (webhookUrl) {
            try {
                const owner = await guild.fetchOwner().catch(() => ({ user: { tag: 'Bilinmiyor' } }));
                const webhookClient = new WebhookClient({ url: webhookUrl });
                const embed = new EmbedBuilder()
                    .setTitle('❌ Sunucudan Ayrıldım')
                    .setColor('#E74C3C')
                    .setThumbnail(guild.iconURL({ dynamic: true }))
                    .addFields(
                        { name: 'Sunucu Adı', value: guild.name, inline: true },
                        { name: 'Sunucu ID', value: `\`${guild.id}\``, inline: true },
                        { name: 'Üye Sayısı', value: `\`${guild.memberCount?.toLocaleString() || 'Bilinmiyor'}\``, inline: true },
                        { name: 'Sunucu Sahibi', value: `${owner.user.tag}`, inline: false }
                    )
                    .setTimestamp();
                
                await webhookClient.send({ username: 'Sunucu Logları', embeds: [embed] });
            } catch (error) {
                console.error(`[HATA] Sunucudan ayrılma webhook'u gönderilirken hata oluştu:`, error);
            }
        }

        // --- GÜNCELLEME: Mongoose ile veritabanı temizliği ---
        try {
            console.log(`[DB TEMİZLİK] ${guild.name} sunucusuna ait veriler siliniyor...`);
            
            // Bu sunucuya ait tüm verileri ilgili koleksiyonlardan sil.
            await GuildSettings.deleteOne({ guildId: guild.id });
            await Economy.deleteMany({ guildId: guild.id });
            await Giveaway.deleteMany({ guildId: guild.id });
            const privateRooms = await PrivateRoom.find({ channelId: { $in: guild.channels.cache.map(c => c.id) } });
            if (privateRooms.length > 0) {
                await PrivateRoom.deleteMany({ channelId: { $in: privateRooms.map(r => r.channelId) } });
            }
            await Warning.deleteMany({ guildId: guild.id });

            console.log(`[DB TEMİZLİK] ${guild.name} için veritabanı temizliği başarıyla tamamlandı.`);

        } catch (error) {
            console.error(`[HATA] ${guild.name} için veritabanı temizliği sırasında kritik bir hata oluştu:`, error);
        }
    },
};