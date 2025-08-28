// Dosya Yolu: events/channelCreate.js
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
    name: 'channelCreate',
    async execute(channel, client) { // Client parametresi eklendi
        const { guild } = channel;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.ChannelCreate, channel.id);

        if (executor && !isWhitelisted(guild, executor.id)) {
            try {
                await channel.delete({ reason: 'Guard: Yetkisiz kanal oluşturma.' });
                await guild.members.ban(executor.id, { reason: `Guard: Yetkisiz kanal oluşturma (#${channel.name})` });

                const guardEmbed = new EmbedBuilder().setColor('#FF0000').setTitle('GUARD - YETKİSİZ EYLEM').setDescription(`**Kullanıcı:** ${executor.tag} (${executor.id})\n**Eylem:** Kanal Oluşturma (\`${channel.name}\`)\n\n**Sonuç:** Kanal silindi, kullanıcı yasaklandı.`).setTimestamp();
                return logChannel.send({ embeds: [guardEmbed] });
            } catch (error) {
                console.error(`[GUARD] ${executor.tag} kullanıcısını yasaklarken/kanalı silerken hata oluştu:`, error);
            }
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('Log: Kanal Oluşturuldu')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .addFields(
                { name: 'Oluşturulan Kanal', value: `${channel} (\`${channel.name}\`)` },
                { name: 'Kanal ID', value: `\`${channel.id}\``, inline: true },
                { name: 'Kanal Türü', value: `\`${channelTypes[channel.type] || 'Bilinmiyor'}\``, inline: true },
                { name: 'Kategori', value: channel.parent ? `${channel.parent.name}` : 'Yok', inline: true }
            )
            .setTimestamp();
            
        return logChannel.send({ embeds: [embed] });
    },
};