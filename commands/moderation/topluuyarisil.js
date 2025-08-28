// Dosya Yolu: commands/moderation/topluuyarisil.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embeds = require('../../utils/embedhelper');
const { deleteAllWarnings } = require('../../utils/warningsHelper');

module.exports = {
    name: 'tümuyarılarısil',
    description: 'Sunucudaki HERKESİN tüm uyarılarını kalıcı olarak siler. (Sadece Sunucu Sahibi)',
    category: 'moderation',
    usage: 'tümuyarılarısil',
    aliases: ['clearallwarnings', 'topluuyarısil'],
    cooldown: 300, 

    async execute(message, args, client) { // Client parametresi eklendi
        if (message.author.id !== message.guild.ownerId) {
            return message.reply({ embeds: [embeds.error('Bu komut, sunucu verileri için kritik öneme sahip olduğundan sadece **Sunucu Sahibi** tarafından kullanılabilir.')] });
        }

        const confirmationEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('⚠️ DİKKAT! BU İŞLEM GERİ ALINAMAZ! ⚠️')
            .setDescription(`**${message.guild.name}** sunucusundaki **TÜM KULLANICILARA** ait **TÜM UYARILARI** kalıcı olarak silmek üzeresiniz.\n\nBu işlem sunucunuzdaki tüm uyarı geçmişini yok edecektir. Devam etmek istediğinizden emin misiniz?`);

        const confirmationButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_clear_all_warnings').setLabel('Evet, Tüm Uyarıları Sil').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('cancel_clear_all_warnings').setLabel('Hayır, İptal Et').setStyle(ButtonStyle.Secondary)
        );

        const confirmationMessage = await message.channel.send({
            content: `${message.author}`,
            embeds: [confirmationEmbed],
            components: [confirmationButtons]
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = confirmationMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            await i.deferUpdate();
            confirmationButtons.components.forEach(button => button.setDisabled(true));
            await confirmationMessage.edit({ components: [confirmationButtons] });

            if (i.customId === 'confirm_clear_all_warnings') {
                try {
                    const deletedCount = await deleteAllWarnings(message.guild.id);
                    
                    const successEmbed = embeds.success(`**${deletedCount}** adet uyarı kaydı başarıyla sunucudan silindi.`, '✅ İşlem Tamamlandı');
                    await i.followUp({ embeds: [successEmbed], ephemeral: true });

                } catch (error) {
                    console.error('[HATA] Toplu uyarı silme işleminde hata:', error);
                    await i.followUp({ embeds: [embeds.error('Uyarılar silinirken veritabanında bir hata oluştu.')], ephemeral: true });
                }
            } else if (i.customId === 'cancel_clear_all_warnings') {
                const cancelEmbed = embeds.info('İşlem kullanıcı tarafından iptal edildi.');
                await i.followUp({ embeds: [cancelEmbed], ephemeral: true });
            }
            collector.stop();
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                const timeoutEmbed = embeds.warning('Onay süresi dolduğu için işlem iptal edildi.');
                confirmationButtons.components.forEach(button => button.setDisabled(true));
                confirmationMessage.edit({ embeds: [timeoutEmbed], components: [confirmationButtons] }).catch(() => {});
            }
        });
    },
};