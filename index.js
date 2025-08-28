// Dosya Yolu: index.js
// Temel modülleri ve yapılandırmayı yükle
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();
const connectDatabase = require('./database.js');

// 7/24 aktif tutma ve chatbot için gerekli modüller
const keepAlive = require("./keep_alive.js");
const initializeChatbot = require("./chatbot.js");

// Discord.js modüllerini import et
const {
    Client,
    GatewayIntentBits,
    Collection,
    Partials,
} = require("discord.js");

// --- VERİTABANI BAĞLANTISI ---
connectDatabase();

// --- TOKEN KONTROLÜ ---
if (!process.env.DISCORD_TOKEN) {
    console.error(
        "[HATA] DISCORD_TOKEN .env dosyasında bulunamadı! Bot başlatılamıyor.",
    );
    process.exit(1);
}

// --- CLIENT TANIMLAMASI ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildExpressions,
    ],
    partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
    ],
});

// --- CLIENT ÜZERİNDE VERİ KOLEKSİYONLARI ---
client.commands = new Collection();
client.cooldowns = new Collection();
client.conversations = new Collection();
client.guildSettings = new Collection(); // Sunucu ayarlarını burada önbelleğe alacağız.

// --- YARDIMCI FONKSİYONLAR: HANDLER YÜKLEYİCİLERİ ---
const loadHandlers = (client) => {
    // Komut Yöneticisi
    const commandsPath = path.join(__dirname, "commands");
    const commandFolders = fs.readdirSync(commandsPath);
    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        const commandFiles = fs
            .readdirSync(folderPath)
            .filter((file) => file.endsWith(".js"));
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);
            if ("name" in command && "execute" in command) {
                command.category = folder;
                client.commands.set(command.name, command);
            } else {
                console.log(
                    `[UYARI] ${filePath} dosyasındaki komut 'name' veya 'execute' özelliğine sahip değil.`,
                );
            }
        }
    }
    console.log(
        `[BİLGİ] ${client.commands.size} adet komut başarıyla yüklendi.`,
    );

    // Olay Yöneticisi (Discord Events)
    const eventsPath = path.join(__dirname, "events");
    const eventFiles = fs
        .readdirSync(eventsPath)
        .filter((file) => file.endsWith(".js")); // errorCreate dahil tüm eventleri buradan alıyoruz
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) =>
                event.execute(...args, client), // Client objesini event'lere iletiyoruz
            );
        } else {
            // Komut hataları için özel event emit'i
            if (event.name === 'errorCreate') {
                 client.on("errorCreate", (...args) => event.execute(...args, client));
            } else {
                 client.on(event.name, (...args) => event.execute(...args, client));
            }
        }
    }
    console.log(
        `[BİLGİ] ${eventFiles.length} adet Discord olayı başarıyla yüklendi.`,
    );
};

// Handler'ları yükle
loadHandlers(client);

// Chatbot modülünü başlat
initializeChatbot(client);

// Web sunucusunu başlat (7/24 aktif tutmak için)
keepAlive();

// --- BOT GİRİŞİ ---
client.login(process.env.DISCORD_TOKEN);

// --- GLOBAL HATA YAKALAMA ---
process.on("unhandledRejection", (reason, promise) => {
    console.error("[HATA] Yakalanamayan Promise Reddi:", reason, promise);
});
process.on("uncaughtException", (err, origin) => {
    console.error("[HATA] Yakalanamayan İstisna:", err, "Kaynak:", origin);
});