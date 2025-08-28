// Dosya Yolu: utils/giveawayManager.js
// MongoDB ve Mongoose için güncellenmiş sürüm.
const { EmbedBuilder } = require('discord.js');
const Giveaway = require('../models/Giveaway'); // Yeni modelimizi import ediyoruz
const embeds = require('./embedhelper');

/**
 * Belirtilen ID'ye sahip bir çekilişi sonlandırır, kazananları belirler ve duyurur.
 * @param {string} giveawayId - Bitirilecek çekilişin mesaj ID'si.
 * @param {import('discord.js').Client} client - Discord client nesnesi.
 */
async function endGiveaway(giveawayId, client) {
    // Veritabanından bitmemiş çekilişi bul
    const giveaway = await Giveaway.findOne({ messageId: giveawayId, ended: false });
    if (!giveaway) {
        return;
    }

    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (!channel) {
        console.error(`[ÇEKİLİŞ HATA] Kanal (${giveaway.channelId}) bulunamadı. Çekiliş (${giveawayId}) veritabanından temizleniyor.`);
        await Giveaway.deleteOne({ messageId: giveawayId });
        return;
    }

    const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
    if (!message) {
        console.error(`[ÇEKİLİŞ HATA] Mesaj (${giveawayId}) bulunamadı. Çekiliş veritabanından temizleniyor.`);
        await Giveaway.deleteOne({ messageId: giveawayId });
        return;
    }

    try {
        const reaction = message.reactions.cache.get('🎉');
        let participants = [];

        if (reaction) {
            const users = await reaction.users.fetch();
            participants = Array.from(users.filter(user => !user.bot).map(user => user.id));
        }

        let winners = [];
        if (participants.length > 0) {
            const participantsCopy = [...participants];
            for (let i = 0; i < giveaway.winnerCount; i++) {
                if (participantsCopy.length === 0) break;
                const winnerIndex = Math.floor(Math.random() * participantsCopy.length);
                winners.push(participantsCopy.splice(winnerIndex, 1)[0]);
            }
        }
        
        const endedEmbed = new EmbedBuilder(message.embeds[0].data)
            .setColor('#5865F2')
            .setTitle(`🎉 Çekiliş Bitti: ${giveaway.prize} 🎉`)
            .setDescription(winners.length > 0 
                ? `**Kazanan(lar):** ${winners.map(w => `<@${w}>`).join(', ')}` 
                : '**Yeterli katılım olmadı!**')
            .setTimestamp();

        await message.edit({ embeds: [endedEmbed], components: [] });

        if (winners.length > 0) {
            await channel.send({ 
                content: `${winners.map(w => `<@${w}>`).join(', ')}`, 
                embeds: [embeds.success(`Tebrikler! **${giveaway.prize}** ödülünü kazandınız! 🎉`, '🎉 Kazananlar Belli Oldu! 🎉')]
            });
        }

        // Çekilişi veritabanında "bitti" olarak işaretle ve kazananları kaydet
        giveaway.ended = true;
        giveaway.winners = winners;
        await giveaway.save();

    } catch (error) {
        console.error(`[HATA] Çekiliş (${giveawayId}) bitirilirken kritik bir hata oluştu:`, error);
        channel.send({ embeds: [embeds.error(`"${giveaway.prize}" çekilişi sonlandırılırken bir hata oluştu.`)] }).catch(() => {});
    }
}

/**
 * Bot başladığında, veritabanındaki bitmemiş çekilişleri bulur ve yeniden zamanlar.
 * @param {import('discord.js').Client} client - Discord client nesnesi.
 */
async function scheduleGiveaways(client) {
    // Mongoose ile bitmemiş çekilişleri bul
    const giveaways = await Giveaway.find({ ended: false });
    if (giveaways.length === 0) return;

    console.log(`[BİLGİ] ${giveaways.length} adet aktif çekiliş kontrol ediliyor ve zamanlanıyor...`);
    
    for (const giveaway of giveaways) {
        // endTime bir Date objesi olduğu için doğrudan karşılaştırabiliriz.
        const duration = giveaway.endTime.getTime() - Date.now();
        
        if (duration < 0) {
            endGiveaway(giveaway.messageId, client);
        } else {
            setTimeout(() => endGiveaway(giveaway.messageId, client), duration);
        }
    }
}

module.exports = { scheduleGiveaways, endGiveaway };