// Dosya Yolu: events/channelDelete.js
const { AuditLogEvent, EmbedBuilder, ChannelType } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { isWhitelisted } = require('../utils/permissionHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

const channelTypes = {
    [ChannelType.GuildText]: 'Metin Kanalı', [ChannelType.GuildVoice]: 'Ses Kanalı',
    [ChannelType.GuildCategory]: 'Kategori', [ChannelType.GuildAnnouncement]: 'Duyuru Kanalı',
    [ChannelType.GuildStageVoice]: 'Sahne Kanalı', [ChannelType.GuildForum]: 'Forum Kanalı',
};

module.exports = {
    name: 'channelDelete',
    async execute(channel, client) { // Client parametresi eklendi
        const { guild } = channel;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.ChannelDelete, channel.id);

        if (executor && !isWhitelisted(guild, executor.id)) {
            try {
                await guild.members.ban(executor.id, { reason: `Guard: Yetkisiz kanal silme (#${channel.name})` });
                const guardEmbed = new EmbedBuilder().setColor('#FF0000').setTitle('GUARD - YETKİSİZ EYLEM').setDescription(`**Kullanıcı:** ${executor.tag} (${executor.id})\n**Eylem:** Kanal Silme (\`#${channel.name}\`)\n\n**Sonuç:** Kullanıcı yasaklandı.`).setTimestamp();
                return logChannel.send({ embeds: [guardEmbed] });
            } catch (error) {
                console.error(`[GUARD] ${executor.tag} kullanıcısını yasaklarken hata oluştu:`, error);
            }
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('Log: Kanal Silindi')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .addFields(
                { name: 'Silinen Kanal Adı', value: `\`#${channel.name}\`` },
                { name: 'Kanal ID', value: `\`${channel.id}\``, inline: true },
                { name: 'Kanal Türü', value: `\`${channelTypes[channel.type] || 'Bilinmiyor'}\``, inline: true }
            )
            .setTimestamp();
            
        return logChannel.send({ embeds: [embed] });
    },
};