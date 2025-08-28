// Dosya Yolu: commands/giveaway/giveaway.js
// MongoDB ve Mongoose için güncellenmiş sürüm.
const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embedhelper');
const { endGiveaway } = require('../../utils/giveawayManager');
const Giveaway = require('../../models/Giveaway'); // Yeni modelimizi import ediyoruz

function parseMessageId(arg) {
    if (!arg) return null;
    const match = arg.match(/(?:\/channels\/\d+\/(\d+)\/)?(\d{17,19})/);
    return match ? (match[1] || match[2]) : null;
}

module.exports = {
    name: 'giveaway',
    description: 'Çekiliş sistemini yönetir (start, reroll, end).',
    category: 'fun',
    usage: 'giveaway <start|reroll|end> [mesaj ID/link]',
    cooldown: 10,
    permission: PermissionsBitField.Flags.ManageGuild,
    async execute(message, args) {
        const subcommand = args[0]?.toLowerCase();

        if (!subcommand) {
            // ... (yardım menüsü aynı kalabilir)
            const helpEmbed = embeds.info('Çekiliş Sistemi Komutları', null)
               .addFields(
                   { name: `\`${process.env.PREFIX}giveaway start\``, value: 'Yeni bir çekiliş oluşturma panelini gönderir.' },
                   { name: `\`${process.env.PREFIX}giveaway reroll <mesaj ID/link>\``, value: 'Biten bir çekiliş için yeni kazanan seçer.' },
                   { name: `\`${process.env.PREFIX}giveaway end <mesaj ID/link>\``, value: 'Aktif bir çekilişi zamanından önce bitirir.' }
               );
            return message.channel.send({ embeds: [helpEmbed] });
        }

        switch (subcommand) {
            case 'start': {
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('giveaway_start_button').setLabel('Yeni Çekiliş Oluştur').setStyle(ButtonStyle.Success).setEmoji('🎉')
                );
                const panelEmbed = embeds.info('Yeni bir çekiliş oluşturmak için aşağıdaki butona tıkla.', 'Çekiliş Yönetim Paneli');
                return message.channel.send({ embeds: [panelEmbed], components: [row] });
            }

            case 'reroll': {
                const messageId = parseMessageId(args[1]);
                if (!messageId) return message.reply({ embeds: [embeds.error('Lütfen yeniden çekiliş yapılacak mesajın ID\'sini veya linkini girin.')] });
                
                // Biten çekilişi Mongoose ile bul
                const giveaway = await Giveaway.findOne({ messageId: messageId, ended: true });
                if (!giveaway) return message.reply({ embeds: [embeds.error('Bu ID ile bitmiş bir çekiliş bulunamadı.')] });

                const channel = await message.guild.channels.fetch(giveaway.channelId).catch(() => null);
                if (!channel) return message.reply({ embeds: [embeds.error('Çekilişin yapıldığı kanal bulunamadı.')] });
                
                const giveawayMessage = await channel.messages.fetch(messageId).catch(() => null);
                if (!giveawayMessage) return message.reply({ embeds: [embeds.error('Çekiliş mesajı bulunamadı.')] });
                
                const reaction = giveawayMessage.reactions.cache.get('🎉');
                if (!reaction) return message.reply({ embeds: [embeds.error('Çekiliş mesajında katılım emojisi bulunamadı.')] });

                const users = await reaction.users.fetch();
                // Eski kazananları ve botları listeden çıkar
                const validParticipants = users.filter(user => !user.bot && !giveaway.winners.includes(user.id));

                if (validParticipants.size < 1) return message.reply({ embeds: [embeds.error('Yeniden çekiliş için uygun başka bir katılımcı bulunamadı!')] });

                const newWinner = validParticipants.random();
                
                // Yeni kazananı da kazananlar listesine ekle
                await Giveaway.updateOne({ messageId: messageId }, { $push: { winners: newWinner.id } });

                await message.channel.send({ embeds: [embeds.success(`Tebrikler ${newWinner}! **${giveaway.prize}** ödülü için yapılan yeniden çekilişi kazandın! 🎉`, '🎉 Çekiliş Yeniden Çekildi 🎉')] });
                return;
            }

            case 'end': {
                const messageId = parseMessageId(args[1]);
                if (!messageId) return message.reply({ embeds: [embeds.error('Lütfen bitirilecek çekilişin mesaj ID\'sini veya linkini girin.')] });

                const giveaway = await Giveaway.findOne({ messageId: messageId, ended: false });
                if (!giveaway) return message.reply({ embeds: [embeds.error('Bu ID ile aktif bir çekiliş bulunamadı.')] });
                
                await endGiveaway(messageId, message.client); // endGiveaway fonksiyonu zaten veritabanını güncelliyor
                return message.reply({ embeds: [embeds.success('Çekiliş manuel olarak sonlandırıldı.')] });
            }

            default: {
                return message.reply({ embeds: [embeds.error(`Geçersiz alt komut. Kullanılabilir komutlar: \`start\`, \`reroll\`, \`end\`.`)] });
            }
        }
    },
};