// Dosya Yolu: handlers/giveawayHandler.js
// MongoDB ve Mongoose için güncellenmiş sürüm.
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const embeds = require('../utils/embedhelper');
const Giveaway = require('../models/Giveaway'); // Yeni modelimizi import ediyoruz
const ms = require('ms');
const { endGiveaway } = require('../utils/giveawayManager');

async function execute(interaction) {
    const { customId, client } = interaction;

    if (interaction.isButton() && customId === 'giveaway_start_button') {
        const modal = new ModalBuilder().setCustomId(`giveaway-modal-${interaction.id}`).setTitle('Yeni Çekiliş Oluştur');
        // ... (Modal oluşturma kodu aynı kalabilir)
        const durationInput = new TextInputBuilder().setCustomId('duration').setLabel('Süre (örn: 10m, 1h, 2d)').setStyle(TextInputStyle.Short).setRequired(true);
        const winnersInput = new TextInputBuilder().setCustomId('winners').setLabel('Kazanacak Kişi Sayısı').setStyle(TextInputStyle.Short).setRequired(true);
        const prizeInput = new TextInputBuilder().setCustomId('prize').setLabel('Çekiliş Ödülü').setStyle(TextInputStyle.Paragraph).setRequired(true);
        
        modal.setComponents(
            new ActionRowBuilder().addComponents(durationInput),
            new ActionRowBuilder().addComponents(winnersInput),
            new ActionRowBuilder().addComponents(prizeInput)
        );
        
        return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && customId.startsWith('giveaway-modal-')) {
        await interaction.deferReply({ ephemeral: true });
        const durationStr = interaction.fields.getTextInputValue('duration');
        const duration = ms(durationStr);
        const winnerCount = parseInt(interaction.fields.getTextInputValue('winners'));
        const prize = interaction.fields.getTextInputValue('prize');

        if (isNaN(duration) || duration < 10000) return interaction.editReply({ embeds: [embeds.error('Geçersiz süre! Minimum 10 saniye olmalıdır.')] });
        if (isNaN(winnerCount) || winnerCount < 1) return interaction.editReply({ embeds: [embeds.error('Geçersiz kazanan sayısı! Minimum 1 olmalıdır.')] });

        const endTime = new Date(Date.now() + duration);

        const giveawayEmbed = new EmbedBuilder()
            .setColor(embeds.info().data.color)
            .setTitle(`🎉 ${prize} Çekilişi Başladı!`)
            .setDescription(`Katılmak için **🎉** tepkisine tıklayın.\n\n> **Bitiş Zamanı:** <t:${Math.floor(endTime.getTime() / 1000)}:R>`)
            .addFields(
                { name: '🏆 Kazanan Sayısı', value: `**${winnerCount}** kişi`, inline: true },
                { name: '🎁 Başlatan', value: `${interaction.user}`, inline: true }
            )
            .setTimestamp(endTime);

        const giveawayMessage = await interaction.channel.send({ embeds: [giveawayEmbed] });
        await giveawayMessage.react('🎉');

        // Yeni çekilişi Mongoose ile veritabanına kaydet
        await Giveaway.create({
            messageId: giveawayMessage.id,
            channelId: interaction.channel.id,
            guildId: interaction.guild.id,
            prize,
            winnerCount,
            endTime,
        });

        setTimeout(() => endGiveaway(giveawayMessage.id, client), duration);

        return interaction.editReply({ content: 'Çekiliş başarıyla başlatıldı!' });
    }
}

module.exports = { execute };