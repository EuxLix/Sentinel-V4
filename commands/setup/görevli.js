// Dosya Yolu: commands/setup/görevli.js
const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getGuildSettings, updateGuildSetting } = require('../../utils/settingsHelper');
const embeds = require('../../utils/embedhelper');

module.exports = {
    name: 'görevli',
    description: 'Moderasyon komutlarını kullanabilecek görevli rolünü ayarlar.',
    category: 'setup',
    usage: 'görevli',
    permission: PermissionsBitField.Flags.Administrator,

    async execute(message, args, client) { // Client parametresi eklendi
        if (!message.member.permissions.has(this.permission)) {
            return message.reply({ embeds: [embeds.error('Bu komutu kullanmak için `Yönetici` yetkisine sahip olmalısın.')] });
        }

        const generatePanel = () => {
            // Ayarlar artık client üzerinden, önbellekten okunuyor
            const guildSettings = getGuildSettings(client, message.guild.id);
            const currentModRole = message.guild.roles.cache.get(guildSettings.modRoleId);
            
            const panelEmbed = new EmbedBuilder()
                .setColor(currentModRole ? '#2ECC71' : '#E74C3C')
                .setTitle('🛠️ Görevli Rolü Kontrol Paneli')
                .setDescription('Bu panelden, moderasyon komutlarını kullanabilecek özel görevli rolünü ayarlayabilir veya temizleyebilirsiniz.')
                .addFields({ name: 'Mevcut Görevli Rolü', value: currentModRole ? `${currentModRole}` : 'Ayarlanmamış' });

            const filteredRoles = message.guild.roles.cache.filter(role => 
                !role.managed && 
                role.id !== message.guild.id &&
                role.position < message.guild.members.me.roles.highest.position
            );
            const roles = Array.from(filteredRoles.values()).slice(0, 25);
            const components = [];
            
            if (roles.length > 0) {
                 components.push(new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('modrole_panel_select')
                        .setPlaceholder(currentModRole ? `Değiştirmek için yeni rol seç...` : 'Bir görevli rolü seçin...')
                        .addOptions(roles.map(role => ({ label: role.name, value: role.id })))
                ));
            } else {
                panelEmbed.setFooter({
                    text: 'Listelenecek rol yok. Botun rolü, görevli rolünün üzerinde olmalıdır.'
                });
            }
            
            components.push(new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('modrole_panel_clear').setLabel('Ayarı Temizle').setStyle(ButtonStyle.Danger).setDisabled(!currentModRole),
                new ButtonBuilder().setCustomId('modrole_panel_close').setLabel('Paneli Kapat').setStyle(ButtonStyle.Secondary)
            ));

            return { embeds: [panelEmbed], components };
        };

        const panelMessage = await message.channel.send(generatePanel());
        const collector = panelMessage.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 120000 });

        collector.on('collect', async i => {
            await i.deferUpdate();
            let feedback = null;

            if (i.isStringSelectMenu()) {
                // Ayarlar artık client üzerinden güncelleniyor
                await updateGuildSetting(client, message.guild.id, 'modRoleId', i.values[0]);
                feedback = 'Görevli rolü başarıyla ayarlandı!';
            } else if (i.isButton()) {
                if (i.customId === 'modrole_panel_clear') {
                    await updateGuildSetting(client, message.guild.id, 'modRoleId', null);
                    feedback = 'Görevli rolü ayarı temizlendi.';
                } else if (i.customId === 'modrole_panel_close') {
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
                panelMessage.edit({ embeds: [embeds.warning('Görevli rolü ayarlama paneli zaman aşımına uğradı.')], components: [] }).catch(() => {});
            }
        });
    },
};