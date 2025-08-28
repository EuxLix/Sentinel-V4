// Dosya Yolu: events/messageCreate.js
const { PermissionsBitField, EmbedBuilder, Collection, WebhookClient, ChannelType } = require('discord.js');
const prefix = process.env.PREFIX || 's!';
const embeds = require('../utils/embedhelper.js'); 
const { getGuildSettings } = require('../utils/settingsHelper');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) { // Client parametresini buraya ekledik
        if (message.author.bot) return;

        // --- BÖLÜM 1: ÖZEL MESAJ (DM) İŞLEMLERİ ---
        if (message.channel.type === ChannelType.DM) {
            console.log(`[DM] ${message.author.tag}: ${message.content}`);
            const webhookUrl = process.env.DM_LOGS_WEBHOOK_URL;
            if (webhookUrl) {
                try {
                    const webhookClient = new WebhookClient({ url: webhookUrl });
                    const dmEmbed = new EmbedBuilder().setColor('#FFFFFF').setTitle('Yeni Özel Mesaj').setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() }).setDescription(message.content || '[İçerik Yok]').setTimestamp();
                    if (message.attachments.size > 0) dmEmbed.setImage(message.attachments.first().url);
                    await webhookClient.send({ username: 'DM Logları', embeds: [dmEmbed] });
                } catch (error) {
                    console.error('[HATA] DM log webhook\'u gönderilemedi:', error);
                }
            }
            return;
        }
        
        // --- BÖLÜM 2: SUNUCU İÇİ İŞLEMLER ---
        if (!message.guild) return;

        // --- Alt Bölüm 2.1: GUARD - Davet Linki Engelleme ---
        // Yöneticileri bu kuraldan muaf tut
        if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
            // Davet linki regex'i
            const inviteRegex = /discord(?:\.com|app\.com|\.gg)[\/invite\/]?(?:[a-zA-Z0-9\-]{2,32})/i;
            if (inviteRegex.test(message.content)) {
                try {
                    await message.delete();
                    const warningMsg = await message.channel.send({ embeds: [embeds.warning(`${message.author}, bu sunucuda davet linki paylaşmak yasaktır!`)] });
                    setTimeout(() => warningMsg.delete().catch(() => {}), 5000);

                    // getGuildSettings artık client parametresi alıyor ve önbellekten okuyor
                    const guildSettings = getGuildSettings(client, message.guild.id);
                    if (guildSettings.logChannelId) {
                        const logChannel = message.guild.channels.cache.get(guildSettings.logChannelId);
                        if (logChannel) {
                            const guardEmbed = new EmbedBuilder().setColor('#FFD700').setTitle('Guard: Davet Linki Engellendi').setDescription(`**Kullanıcı:** ${message.author}\n**Kanal:** ${message.channel}\n**Engellenen Mesaj:** \`\`\`${message.content.slice(0, 1900)}\`\`\``).setTimestamp();
                            logChannel.send({ embeds: [guardEmbed] }).catch(() => {});
                        }
                    }
                } catch (error) {
                    console.error("[HATA] Davet linki silinirken bir hata oluştu:", error);
                }
                return; // İşlemi burada sonlandır
            }
        }
        
        // --- Alt Bölüm 2.2: Komut Yöneticisi ---
        if (!message.content.startsWith(prefix)) return;
        
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) return;

        // --- Alt Bölüm 2.3: Cooldown (Spam) Kontrolü ---
        const { cooldowns } = client;
        const cooldownKey = command.cooldown_group || command.name;
        if (!cooldowns.has(cooldownKey)) cooldowns.set(cooldownKey, new Collection());
        
        const now = Date.now();
        const timestamps = cooldowns.get(cooldownKey);
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                // Cooldown mesajının silinmesi için try-catch bloğu eklendi
                try {
                    const warningEmbed = embeds.warning(`Lütfen bu komutu tekrar kullanmak için **${timeLeft.toFixed(1)} saniye** daha bekleyin.`);
                    const replyMsg = await message.reply({ embeds: [warningEmbed] });
                    setTimeout(() => replyMsg.delete().catch(() => {}), 4000);
                } catch (e) { /* Mesaj silinirse veya kanal yoksa hata vermesini engelle */ }
                return;
            }
        }
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        // --- Alt Bölüm 2.4: Komutu Çalıştır ---
        try {
            // Komutlara artık client objesini de iletiyoruz
            await command.execute(message, args, client);
        } catch (error) {
            // Hata oluşursa, merkezi hata yöneticimizi tetikle.
            client.emit('errorCreate', error, command, message);
        }
    },
};