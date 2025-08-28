// Dosya Yolu: events/messageDelete.js
const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');
const { fetchExecutor } = require('../utils/auditlogHelper');

module.exports = {
    name: 'messageDelete',
    async execute(message, client) { // Client parametresi eklendi
        if (message.partial) {
            try { await message.fetch(); } catch { return; }
        }
        if (!message.guild || !message.author || message.author.bot || (!message.content && message.attachments.size === 0)) return;

        const { guild, author, channel } = message;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const executor = await fetchExecutor(guild, AuditLogEvent.MessageDelete, author.id);
        const silenKisi = executor || author;

        const deleteEmbed = new EmbedBuilder()
            .setColor('#FF4747')
            .setTitle('Log: Mesaj Silindi')
            .setDescription(`**Mesaj Sahibi:** ${author}\n**Silen Kişi:** ${silenKisi}\n**Kanal:** ${channel}`)
            .setTimestamp()
            .setFooter({ text: `Mesaj Sahibi ID: ${author.id}` });
        
        if (message.content) {
            deleteEmbed.addFields({ name: 'Silinen Mesaj', value: `\`\`\`${message.content.slice(0, 1020)}\`\`\`` });
        }

        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            deleteEmbed.addFields({ name: 'Silinen Ek', value: `[Eki Görüntüle](${attachment.proxyURL})` });
            if (attachment.contentType?.startsWith('image')) {
                deleteEmbed.setImage(attachment.proxyURL);
            }
        }

        logChannel.send({ embeds: [deleteEmbed] }).catch(console.error);
    },
};