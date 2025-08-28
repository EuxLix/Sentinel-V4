// Dosya Yolu: commands/setup/loglar.js
const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getGuildSettings, updateGuildSetting } = require('../../utils/settingsHelper');
const embeds = require('../../utils/embedhelper');

module.exports = {
    name: 'loglar',
    description: 'Tüm logların gönderileceği kanalı interaktif bir panel ile ayarlar.',
    category: 'setup',
    usage: 'loglar',
    aliases: ['logs', 'log-ayarla'],
    permission: PermissionsBitField.Flags.Administrator,

    async execute(message, args, client) { // Client parametresi eklendi
        if (!message.member.permissions.has(this.permission)) {
            return message.reply({ embeds: [embeds.error('Bu komutu kullanmak için `Yönetici` yetkisine sahip olmalısın.')] });
        }

        const generatePanel = () => {
            // Ayarlar artık client üzerinden, önbellekten okunuyor
            const guildSettings = getGuildSettings(client, message.guild.id);
            const currentLogChannel = message.guild.channels.cache.get(guildSettings.logChannelId);

            const panelEmbed = new EmbedBuilder()
                .setColor(currentLogChannel ? '#2ECC71' : '#E74C3C')
                .setTitle('📝 Log Kanalı Kontrol Paneli')
                .setDescription('Bu panelden, tüm denetim ve eylem loglarının gönderileceği metin kanalını ayarlayabilir veya bu ayarı temizleyebilirsiniz.')
                .addFields({ name: 'Mevcut Log Kanalı', value: currentLogChannel ? `${currentLogChannel}` : 'Ayarlanmamış' });

            const components = [];
            components.push(new ActionRowBuilder().addComponents(
                new ChannelSelectMenuBuilder()
                    .setCustomId('log_panel_select')
                    .setPlaceholder(currentLogChannel ? `Değiştirmek için yeni kanal seç...` : 'Bir log kanalı seçin...')
                    .addChannelTypes(ChannelType.GuildText)
            ));
            components.push(new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('log_panel_clear').setLabel('Ayarı Temizle').setStyle(ButtonStyle.Danger).setDisabled(!currentLogChannel),
                new ButtonBuilder().setCustomId('log_panel_close').setLabel('Paneli Kapat').setStyle(ButtonStyle.Secondary)
            ));

            return { embeds: [panelEmbed], components };
        };

        const panelMessage = await message.channel.send(generatePanel());
        const collector = panelMessage.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 120000 });

        collector.on('collect', async i => {
            await i.deferUpdate();
            let feedback = null;

            if (i.isChannelSelectMenu()) {
                await updateGuildSetting(client, message.guild.id, 'logChannelId', i.values[0]);
                feedback = 'Log kanalı başarıyla ayarlandı!';
            } else if (i.isButton()) {
                if (i.customId === 'log_panel_clear') {
                    await updateGuildSetting(client, message.guild.id, 'logChannelId', null);
                    feedback = 'Log kanalı ayarı temizlendi. Artık loglar gönderilmeyecek.';
                } else if (i.customId === 'log_panel_close') {
                    collector.stop('closed');
                    return;
                }
            }
            if (feedback) await i.followUp({ content: feedback, ephemeral: true });
            await panelMessage.edit(generatePanel());
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'closed') {
                panelMessage.delete().catch(() => {});
            } else {
                panelMessage.edit({ embeds: [embeds.warning('Log kanalı ayarlama paneli zaman aşımına uğradı.')], components: [] }).catch(() => {});
            }
        });
    },
};