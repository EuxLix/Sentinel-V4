// Dosya Yolu: events/roleUpdate.js
const { AuditLogEvent, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

// Yetki isimlerini okunabilir hale getiren devasa bir harita :)
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
    ViewCreatorMonetizationAnalytics: 'İçerik Üretici Para Kazanma Analizlerini Görüntüle', UseSoundboard: 'Ses Tahtası Kullan', UseExternalSounds: 'Harici Sesleri Kullan', SendVoiceMessages: 'Sesli Mesaj Gönder'
};

module.exports = {
    name: 'roleUpdate',
    async execute(oldRole, newRole, client) { // Client parametresi eklendi
        const { guild } = newRole;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.RoleUpdate, newRole.id);
        const changes = [];

        if (oldRole.name !== newRole.name) {
            changes.push(`**İsim:** \`${oldRole.name}\` → \`${newRole.name}\``);
        }
        if (oldRole.hexColor !== newRole.hexColor) {
            changes.push(`**Renk:** \`${oldRole.hexColor}\` → \`${newRole.hexColor}\``);
        }
        
        if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
            changes.push('**Yetkiler** güncellendi.');
        }
        
        if (changes.length === 0) return;

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('Log: Rol Güncellendi')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .setDescription(`**Rol:** ${newRole}\n\n${changes.join('\n')}`)
            .setTimestamp();
        
        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};