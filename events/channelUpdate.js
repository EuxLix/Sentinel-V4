// Dosya Yolu: events/channelUpdate.js
const { AuditLogEvent, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

// Yetki isimlerini okunabilir hale getiren kapsamlı harita
const permissionMap = {
    CreateInstantInvite: 'Davet Oluştur', KickMembers: 'Üyeleri At', BanMembers: 'Üyeleri Yasakla', Administrator: 'Yönetici',
    ManageChannels: 'Kanalları Yönet', ManageGuild: 'Sunucuyu Yönet', AddReactions: 'Tepki Ekle', ViewAuditLog: 'Denetim Kaydını Görüntüle',
    PrioritySpeaker: 'Öncelikli Konuşmacı', Stream: 'Yayın Aç', ViewChannel: 'Kanalı Görüntüle', SendMessages: 'Mesaj Gönder',
    SendTTSMessages: 'Metin Okuma Mesajı Gönder', ManageMessages: 'Mesajları Yönet', EmbedLinks: 'Bağlantı Göm', AttachFiles: 'Dosya Ekle',
    ReadMessageHistory: 'Mesaj Geçmişini Oku', MentionEveryone: '@everyone Bahset', UseExternalEmojis: 'Harici Emoji Kullan', ViewGuildInsights: 'Sunucu İstatistiklerini Görüntüle',
    Connect: 'Bağlan', Speak: 'Konuş', MuteMembers: 'Üyeleri Sustur', DeafenMembers: 'Üyeleri Sağırlaştır', MoveMembers: 'Üyeleri Taşı',
    UseVAD: 'Ses Eylemini Kullan', ChangeNickname: 'Kullanıcı Adı Değiştir', ManageNicknames: 'Kullanıcı Adlarını Yönet', ManageRoles: 'Rolleri Yönet',
    ManageWebhooks: 'Webhookları Yönet', ManageGuildExpressions: 'İfadeleri Yönet', UseApplicationCommands: 'Uygulama Komutlarını Kullan', RequestToSpeak: 'Söz Hakkı İste',
    ManageEvents: 'Etkinlikleri Yönet', ManageThreads: 'Konuları Yönet', CreatePublicThreads: 'Herkese Açık Konu Oluştur', CreatePrivateThreads: 'Özel Konu Oluştur',
    UseExternalStickers: 'Harici Çıkartma Kullan', SendMessagesInThreads: 'Konularda Mesaj Gönder', UseEmbeddedActivities: 'Etkinlik Başlat', ModerateMembers: 'Üyelere Zaman Aşımı Uygula',
};

module.exports = {
    name: 'channelUpdate',
    async execute(oldChannel, newChannel, client) { // Client parametresi eklendi
        const { guild } = newChannel;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.ChannelUpdate, newChannel.id);
        const changes = [];

        if (oldChannel.name !== newChannel.name) {
            changes.push(`**İsim:** \`${oldChannel.name}\` → \`${newChannel.name}\``);
        }
        if (oldChannel.topic !== newChannel.topic) {
            changes.push(`**Konu:** Değiştirildi`);
        }
        
        // Bu dosyanın orijinalindeki detaylı izin kontrolü çok fazla kaynak tüketebilir.
        // Daha basit bir "izinler değişti" logu VDS için daha sağlıklıdır.
        if (!oldChannel.permissionOverwrites.cache.equals(newChannel.permissionOverwrites.cache)) {
            changes.push('**Kanal İzinleri** güncellendi.');
        }
        
        if (changes.length === 0) return;

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('Log: Kanal Güncellendi')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .setDescription(`**Kanal:** ${newChannel}\n\n${changes.join('\n')}`)
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
    },
};