// Dosya Yolu: events/messageDeleteBulk.js
const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'messageDeleteBulk',
    async execute(messages, channel, client) { // Client parametresi eklendi
        const { guild } = channel;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.MessageBulkDelete, channel.id);

        const embed = new EmbedBuilder()
            .setColor('#E67E22')
            .setTitle('Log: Toplu Mesaj Silindi')
            .setAuthor({ name: executor?.tag || 'Bilinmiyor', iconURL: executor?.displayAvatarURL() })
            .setDescription(`**Kanal:** ${channel}`)
            .addFields({ name: 'Silinen Mesaj Sayısı', value: `**${messages.size}** adet` })
            .setTimestamp();
            
        if(executor) {
            embed.setFooter({ text: `Yetkili ID: ${executor.id}` });
        }

        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};