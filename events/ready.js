// Dosya Yolu: events/ready.js
const { Events, ActivityType, EmbedBuilder, Collection } = require("discord.js");
const GuildSettings = require("../models/GuildSettings");
const { scheduleGiveaways } = require("../utils/giveawayManager");
const { scheduleLotteries } = require("../utils/lotteryManager"); 
const { version } = require("../package.json");

function setPresence(client) {
    const prefix = process.env.PREFIX || "s!";

    const activities = [
        { name: `{guilds} sunucuyu`, type: ActivityType.Watching },
        { name: `{users} kullanıcıyı`, type: ActivityType.Watching },
        { name: `${prefix}help`, type: ActivityType.Listening },
        { name: `EuxLix Development | ${version}`, type: ActivityType.Playing }
    ];
    
    const statuses = ['online', 'idle', 'dnd'];
    let activityIndex = 0;
    let statusIndex = 0;

    const updatePresence = () => {
        try {
            const guilds = client.guilds.cache.size.toLocaleString('tr-TR');
            const users = client.guilds.cache.reduce((a, b) => a + b.memberCount, 0).toLocaleString('tr-TR');
            
            const activity = activities[activityIndex];
            const newActivityName = activity.name
                .replace('{guilds}', guilds)
                .replace('{users}', users);

            client.user.setActivity(newActivityName, { type: activity.type });
            client.user.setStatus(statuses[statusIndex]);

            activityIndex = (activityIndex + 1) % activities.length;
            statusIndex = (statusIndex + 1) % statuses.length;
        } catch (error) {
            console.error("[HATA] Presence güncellenirken bir hata oluştu:", error);
        }
    };
    
    updatePresence();
    setInterval(updatePresence, 30000);
}

function enforceGuildLock(client) {
    const allowedGuildId = process.env.GUILD_ID;
    if (!allowedGuildId) return;
    client.guilds.cache.forEach((guild) => {
        if (guild.id !== allowedGuildId) {
            console.log(`[GÜVENLİK] İzin verilmeyen sunucudan ayrılıyorum: ${guild.name} (${guild.id})`);
            guild.leave().catch(err => console.error(`[HATA] Sunucudan ayrılırken hata: ${err}`));
        }
    });
}

async function sendOnlineLogs(client) {
    for (const guild of client.guilds.cache.values()) {
        const guildSettings = client.guildSettings.get(guild.id);
        if (guildSettings?.logChannelId) {
            const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
            if (logChannel) {
                const onlineEmbed = new EmbedBuilder()
                    .setColor("#2ECC71")
                    .setTitle("Bot Aktif")
                    .setDescription(`**${client.user.username}** başarıyla yeniden başlatıldı ve göreve hazır.`)
                    .setTimestamp();
                logChannel.send({ embeds: [onlineEmbed] }).catch(() => {});
            }
        }
    }
}

async function cacheAllGuildSettings(client) {
    try {
        const allSettings = await GuildSettings.find().lean();
        client.guildSettings.clear();
        allSettings.forEach(settings => client.guildSettings.set(settings.guildId, settings));
        console.log(`[BİLGİ] ${client.guildSettings.size} sunucunun ayarları başarıyla önbelleğe alındı.`);
    } catch (error) {
        console.error("[HATA] Sunucu ayarları önbelleğe alınırken bir hata oluştu:", error);
    }
}

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`[BİLGİ] ${client.user.tag} olarak giriş yapıldı ve hazır!`);
        try {
            await cacheAllGuildSettings(client);
            setPresence(client);
            enforceGuildLock(client);
            await sendOnlineLogs(client);
            console.log("[BİLGİ] Aktif çekilişler kontrol ediliyor ve zamanlanıyor...");
            await scheduleGiveaways(client);
            console.log("[BİLGİ] Aktif piyangolar kontrol ediliyor ve zamanlanıyor...");
            await scheduleLotteries(client);
        } catch (error) {
            console.error('[HATA] "ready" olayı sırasında bir hata oluştu:', error);
        }
    },
};