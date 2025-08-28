// Dosya Yolu: commands/moderation/uyarilar.js
const { EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embeds = require('../../utils/embedhelper');
const warningsHelper = require('../../utils/warningsHelper');
const { hasPermission } = require('../../utils/permissionHelper');

module.exports = {
    name: 'uyarılar',
    description: 'Bir kullanıcının uyarılarını listeler.',
    category: 'moderation',
    usage: 'uyarılar [@kullanıcı veya ID]',
    aliases: ['warnings', 'infractions'],
    cooldown: 5,
    permission: PermissionsBitField.Flags.ModerateMembers,

    async execute(message, args, client) {
        const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : message.author);

        if (!targetUser) {
            return message.reply({ embeds: [embeds.error('Kullanıcı bulunamadı.')] });
        }

        if (targetUser.id !== message.author.id) {
            const userCanCheck = hasPermission(client, message.member, this.permission);
            if (!userCanCheck) {
                return message.reply({ embeds: [embeds.error('Başkalarının uyarılarını görmek için gerekli yetkiye sahip değilsin.')] });
            }
        }

        // ÖNEMLİ DÜZELTME: warningsHelper.getWarnings asenkron olduğu için 'await' eklenmeli.
        const userWarnings = await warningsHelper.getWarnings(message.guild.id, targetUser.id);
        if (!userWarnings || userWarnings.length === 0) {
            return message.channel.send({ embeds: [embeds.info(`**${targetUser.tag}** kullanıcısının hiç uyarısı bulunmuyor.`)] });
        }

        const warningsPerPage = 3;
        const totalPages = Math.ceil(userWarnings.length / warningsPerPage);
        let currentPage = 0;

        const generateEmbed = (page) => {
            const start = page * warningsPerPage;
            const end = start + warningsPerPage;
            const currentWarnings = userWarnings.slice(start, end);

            const embed = new EmbedBuilder()
                .setColor('#F39C12')
                .setTitle(`${targetUser.username} Adlı Kullanıcının Uyarıları`)
                .setThumbnail(targetUser.displayAvatarURL())
                .setFooter({ text: `Sayfa ${page + 1} / ${totalPages} | Toplam ${userWarnings.length} uyarı` });

            for (const warning of currentWarnings) {
                // 'warning.id' yerine veritabanındaki benzersiz ID olan 'warning.warningId' kullanılmalı.
                const moderator = message.guild.members.cache.get(warning.moderatorId)?.user.tag || 'Bilinmeyen Yetkili';
                embed.addFields({
                    name: `🆔 Uyarı ID: ${warning.warningId}`,
                    value: `**Yetkili:** ${moderator}\n**Sebep:** ${warning.reason}\n**Tarih:** <t:${Math.floor(new Date(warning.timestamp).getTime() / 1000)}:F>`
                });
            }
            return embed;
        };
        
        const generateButtons = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev_page').setLabel('◀️ Önceki').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId('next_page').setLabel('Sonraki ▶️').setStyle(ButtonStyle.Primary).setDisabled(page === totalPages - 1)
            );
        };

        const embedMessage = await message.channel.send({
            embeds: [generateEmbed(currentPage)],
            components: [generateButtons(currentPage)]
        });

        const collector = embedMessage.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 90000
        });

        collector.on('collect', async i => {
            await i.deferUpdate();
            if (i.customId === 'prev_page') {
                currentPage--;
            } else if (i.customId === 'next_page') {
                currentPage++;
            }
            await embedMessage.edit({ embeds: [generateEmbed(currentPage)], components: [generateButtons(currentPage)] });
        });

        collector.on('end', () => {
            const disabledButtons = new ActionRowBuilder().addComponents(
                ...embedMessage.components[0].components.map(c => ButtonBuilder.from(c).setDisabled(true))
            );
            embedMessage.edit({ components: [disabledButtons] }).catch(() => {});
        });
    },
};