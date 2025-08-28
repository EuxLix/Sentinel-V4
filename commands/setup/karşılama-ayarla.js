// Dosya Yolu: commands/setup/karşılama-ayarla.js
const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getGuildSettings, updateGuildSetting } = require('../../utils/settingsHelper');
const embeds = require('../../utils/embedhelper');

module.exports = {
    name: 'karşılama',
    description: 'Karşılama ve görüşürüz mesajlarının gönderileceği kanalı ayarlar.',
    category: 'setup',
    usage: 'karşılama',
    permission: PermissionsBitField.Flags.Administrator,

    async execute(message, args, client) { // Client parametresi eklendi
        if (!message.member.permissions.has(this.permission)) {
            return message.reply({ embeds: [embeds.error('Bu komutu kullanmak için `Yönetici` yetkisine sahip olmalısın.')] });
        }

        const generatePanel = () => {
            // Ayarlar artık client üzerinden, önbellekten okunuyor
            const guildSettings = getGuildSettings(client, message.guild.id);
            const selectedChannel = message.guild.channels.cache.get(guildSettings.welcomeChannelId);
            
            const panelEmbed = new EmbedBuilder()
                .setColor(guildSettings.welcomeEnabled && selectedChannel ? '#2ECC71' : '#E74C3C')
                .setTitle('👋 Karşılama Sistemi Kontrol Paneli')
                .addFields(
                    { name: 'Durum', value: guildSettings.welcomeEnabled && selectedChannel ? '✅ Aktif' : '❌ Devre Dışı', inline: true },
                    { name: 'Ayarlı Kanal', value: selectedChannel ? `${selectedChannel}` : 'Ayarlanmamış', inline: true }
                );

            const components = [];
            components.push(new ActionRowBuilder().addComponents(
                new ChannelSelectMenuBuilder()
                    .setCustomId('welcome_channel_select')
                    .setPlaceholder(selectedChannel ? `Mevcut Kanal: #${selectedChannel.name}` : 'Bir kanal seçin...')
                    .addChannelTypes(ChannelType.GuildText)
            ));
            components.push(new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('welcome_enable').setLabel('Aktifleştir').setStyle(ButtonStyle.Success).setDisabled(guildSettings.welcomeEnabled),
                new ButtonBuilder().setCustomId('welcome_disable').setLabel('Devre Dışı Bırak').setStyle(ButtonStyle.Danger).setDisabled(!guildSettings.welcomeEnabled),
                new ButtonBuilder().setCustomId('welcome_close').setLabel('Paneli Kapat').setStyle(ButtonStyle.Secondary)
            ));

            return { embeds: [panelEmbed], components };
        };

        const panelMessage = await message.channel.send(generatePanel());
        const collector = panelMessage.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 120000 });

        collector.on('collect', async i => {
            await i.deferUpdate();
            let feedback = null;

            if (i.isChannelSelectMenu()) {
                await updateGuildSetting(client, message.guild.id, 'welcomeChannelId', i.values[0]);
                feedback = 'Karşılama kanalı başarıyla ayarlandı!';
            } else if (i.isButton()) {
                if (i.customId === 'welcome_enable') {
                    if (!getGuildSettings(client, message.guild.id).welcomeChannelId) {
                        return i.followUp({ embeds: [embeds.error('Önce bir karşılama kanalı seçmelisiniz!')], ephemeral: true });
                    }
                    await updateGuildSetting(client, message.guild.id, 'welcomeEnabled', true);
                    feedback = 'Karşılama sistemi aktifleştirildi.';
                } else if (i.customId === 'welcome_disable') {
                    await updateGuildSetting(client, message.guild.id, 'welcomeEnabled', false);
                    feedback = 'Karşılama sistemi devre dışı bırakıldı.';
                } else if (i.customId === 'welcome_close') {
                    collector.stop('closed');
                    return;
                }
            }
            
            if(feedback) await i.followUp({ content: feedback, ephemeral: true });
            
            await panelMessage.edit(generatePanel());
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'closed') {
                panelMessage.delete().catch(() => {});
            } else {
                panelMessage.edit({ embeds: [embeds.warning('Karşılama paneli zaman aşımına uğradı.')], components: [] }).catch(() => {});
            }
        });
    },
};