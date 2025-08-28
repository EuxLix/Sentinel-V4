// Dosya Yolu: commands/setup/otorol.js
const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getGuildSettings, updateGuildSetting } = require('../../utils/settingsHelper');
const embeds = require('../../utils/embedhelper');

module.exports = {
    name: 'otorol',
    description: 'Otorol sistemini interaktif bir panel ile yönetir.',
    category: 'setup',
    usage: 'otorol',
    permission: PermissionsBitField.Flags.Administrator,

    async execute(message, args, client) { // Client parametresi eklendi
        if (!message.member.permissions.has(this.permission)) {
            return message.reply({ embeds: [embeds.error('Bu komutu kullanmak için `Yönetici` yetkisine sahip olmalısın.')] });
        }

        const generatePanel = () => {
            // Ayarlar artık client üzerinden, önbellekten okunuyor
            const guildSettings = getGuildSettings(client, message.guild.id);
            const selectedRole = message.guild.roles.cache.get(guildSettings.autoRoleId);
            
            const panelEmbed = new EmbedBuilder()
                .setColor(guildSettings.autoRoleEnabled && selectedRole ? '#2ECC71' : '#E74C3C')
                .setTitle('Otorol Kontrol Paneli')
                .addFields(
                    { name: 'Durum', value: guildSettings.autoRoleEnabled && selectedRole ? '✅ Aktif' : '❌ Devre Dışı', inline: true },
                    { name: 'Ayarlı Rol', value: selectedRole ? `${selectedRole}` : 'Ayarlanmamış', inline: true }
                )
                .setFooter({ text: 'Not: Botun rolü, ayarlayacağınız rolün üzerinde olmalıdır.' });

            const filteredRoles = message.guild.roles.cache.filter(role => !role.managed && role.name !== '@everyone' && role.position < message.guild.members.me.roles.highest.position);
            const roles = Array.from(filteredRoles.values()).slice(0, 25);
            const components = [];

            if (roles.length > 0) {
                components.push(new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('autorole_select_role')
                        .setPlaceholder(selectedRole ? `Mevcut Rol: ${selectedRole.name}` : 'Ayarlamak için bir rol seçin...')
                        .addOptions(roles.map(role => ({ label: role.name, value: role.id, description: `ID: ${role.id}` })))
                ));
            }
            
            components.push(new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('autorole_enable').setLabel('Aktifleştir').setStyle(ButtonStyle.Success).setDisabled(guildSettings.autoRoleEnabled),
                new ButtonBuilder().setCustomId('autorole_disable').setLabel('Devre Dışı Bırak').setStyle(ButtonStyle.Danger).setDisabled(!guildSettings.autoRoleEnabled),
                new ButtonBuilder().setCustomId('autorole_close').setLabel('Paneli Kapat').setStyle(ButtonStyle.Secondary)
            ));

            return { embeds: [panelEmbed], components };
        };

        const panelMessage = await message.channel.send(generatePanel());
        const collector = panelMessage.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 120000 });

        collector.on('collect', async i => {
            await i.deferUpdate();
            let feedback = null;

            if (i.isStringSelectMenu()) {
                await updateGuildSetting(client, message.guild.id, 'autoRoleId', i.values[0]);
                feedback = 'Otorol rolü başarıyla ayarlandı!';
            } else if (i.isButton()) {
                if (i.customId === 'autorole_enable') {
                    if (!getGuildSettings(client, message.guild.id).autoRoleId) {
                        return i.followUp({ embeds: [embeds.error('Önce bir rol seçmelisiniz!')], ephemeral: true });
                    }
                    await updateGuildSetting(client, message.guild.id, 'autoRoleEnabled', true);
                    feedback = 'Otorol sistemi aktifleştirildi.';
                } else if (i.customId === 'autorole_disable') {
                    await updateGuildSetting(client, message.guild.id, 'autoRoleEnabled', false);
                    feedback = 'Otorol sistemi devre dışı bırakıldı.';
                } else if (i.customId === 'autorole_close') {
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
                panelMessage.edit({ embeds: [embeds.warning('Otorol ayarlama paneli zaman aşımına uğradı.')], components: [] }).catch(() => {});
            }
        });
    },
};