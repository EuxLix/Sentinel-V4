// sentinel/utils/lotteryManager.js

const Lottery = require('../models/Lottery');
const { drawWinner } = require('../commands/economy/piyango');

/**
 * Bot başladığında, veritabanındaki bitmemiş piyangoları bulur ve yeniden zamanlar.
 * @param {import('discord.js').Client} client - Discord client nesnesi.
 */
async function scheduleLotteries(client) {
    const lotteries = await Lottery.find({ ended: false });
    if (lotteries.length === 0) {
        console.log('[BİLGİ] Yeniden zamanlanacak aktif piyango bulunamadı.');
        return;
    }

    console.log(`[BİLGİ] ${lotteries.length} adet aktif piyango kontrol ediliyor ve zamanlanıyor...`);
    
    for (const lottery of lotteries) {
        const duration = lottery.startTime.getTime() + (10 * 60 * 1000) - Date.now();
        const guild = client.guilds.cache.get(lottery.guildId);

        if (!guild) {
            await Lottery.deleteOne({ _id: lottery._id });
            continue;
        }
        
        if (duration < 0) {
            // Süresi dolmuşsa hemen çekilişi yap
            drawWinner(lottery.guildId, guild); // guildId gönderiyoruz
        } else {
            // Süresi dolmamışsa zamanlayıcıyı yeniden kur
            // --- DEĞİŞİKLİK ---
            // Zamanlayıcıya artık tüm obje yerine sadece sunucu ID'sini veriyoruz.
            setTimeout(() => drawWinner(lottery.guildId, guild), duration);
            // --- DEĞİŞİKLİK SONU ---
        }
    }
}

module.exports = { scheduleLotteries };