// Dosya Yolu: events/messageUpdate.js
const { EmbedBuilder } = require('discord.js');
const { getGuildSettings } = require('../utils/settingsHelper');

module.exports = {
    name: 'messageUpdate',
    async execute(oldMessage, newMessage, client) { // Client parametresi eklendi
        if (oldMessage.partial) {
            try { await oldMessage.fetch(); } catch { return; }
        }
        if (!newMessage.guild || !newMessage.author || newMessage.author.bot || oldMessage.content === newMessage.content) {
            if (oldMessage.pinned !== newMessage.pinned) return; 
            return;
        }

        const { guild, author, channel, url } = newMessage;
        const guildSettings = getGuildSettings(client, guild.id);
        const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('Log: Mesaj Düzenlendi')
            .setAuthor({ name: author.tag, iconURL: author.displayAvatarURL() })
            .setDescription(`**Kullanıcı:** ${author}\n**Kanal:** ${channel}\n[Mesaja Git](${url})`)
            .addFields(
                { name: 'Eski Mesaj', value: `\`\`\`${oldMessage.content?.slice(0, 1020) || ' '}\`\`\`` },
                { name: 'Yeni Mesaj', value: `\`\`\`${newMessage.content?.slice(0, 1020) || ' '}\`\`\`` }
            )
            .setTimestamp()
            .setFooter({ text: `Kullanıcı ID: ${author.id}` });
            
        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};