// sentinel/commands/economy/piyango.js

const { EmbedBuilder } = require('discord.js');
const economyHelper = require('../../utils/economyHelper');
const embeds = require('../../utils/embedhelper');
const Lottery = require('../../models/Lottery');

const PACKAGE_COST = 100;
const DRAW_INTERVAL = 10 * 60 * 1000; // 10 dakika

const LOOT_TABLE = [
    { name: "Küçük Çanta", value: 50, weight: 40, emoji: "🎒" },
    { name: "Para Cüzdanı", value: 100, weight: 30, emoji: "👛" },
    { name: "Büyük Kasa", value: 200, weight: 15, emoji: "📦" },
    { name: "Altın Sandık", value: 500, weight: 10, emoji: "🏆" },
    { name: "Elmas Kasa", value: 1000, weight: 5, emoji: "💎" },
];

function getRandomLoot() {
    const totalWeight = LOOT_TABLE.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.floor(Math.random() * totalWeight);

    for (const item of LOOT_TABLE) {
        if (random < item.weight) {
            return item;
        }
        random -= item.weight;
    }
}

/**
 * Piyango çekilişini yapar ve kazananı duyurur.
 * @param {string} guildId Çekilişin yapıldığı sunucunun ID'si.
 * @param {import('discord.js').Guild} guild Sunucu nesnesi.
 */
async function drawWinner(guildId, guild) {
    // --- DEĞİŞİKLİK BAŞLANGICI ---
    // 1. Fonksiyon artık guildId alıyor ve en güncel veriyi veritabanından çekiyor.
    const lotteryDoc = await Lottery.findOne({ guildId: guildId, ended: false });
    // Eğer veri bulunamazsa (örneğin başka bir işlem tarafından silinmişse) işlemi durdur.
    if (!lotteryDoc) {
        console.log(`[PİYANGO] ${guild.name} için çekiliş zamanı geldi ancak aktif piyango bulunamadı.`);
        return;
    }
    // --- DEĞİŞİKLİK SONU ---

    const channel = guild.channels.cache.get(lotteryDoc.channelId);
    if (!channel) return Lottery.deleteOne({ _id: lotteryDoc._id });

    const { totalPot, participants } = lotteryDoc;

    if (participants.length <= 1) {
        if (participants.length === 1) {
            const soleParticipant = participants[0];
            await economyHelper.addBalance(soleParticipant.userId, guild.id, totalPot);
            const refundEmbed = new EmbedBuilder()
                .setTitle('⚖️ Piyango İptal Edildi')
                .setDescription(`<@${soleParticipant.userId}>, tek katılımcı olduğun için piyango iptal edildi ve **${totalPot.toLocaleString('tr-TR')}** coin bakiyene iade edildi.`)
                .setColor('Yellow')
                .setTimestamp();
            channel.send({ embeds: [refundEmbed] }).catch(console.error);
        } else {
             const refundEmbed = new EmbedBuilder()
                .setTitle('⚖️ Piyango İptal Edildi')
                .setDescription(`Piyangoya hiç kimse katılmadığı için çekiliş iptal edildi.`)
                .setColor('Yellow')
                .setTimestamp();
            channel.send({ embeds: [refundEmbed] }).catch(console.error);
        }
        return Lottery.deleteOne({ _id: lotteryDoc._id });
    }

    const tickets = [];
    for (const p of participants) {
        for (let i = 0; i < p.tickets; i++) {
            tickets.push(p.userId);
        }
    }

    const winnerId = tickets[Math.floor(Math.random() * tickets.length)];
    const winnerMember = await guild.members.fetch(winnerId).catch(() => null);

    if (winnerMember) {
        await economyHelper.addBalance(winnerId, guild.id, totalPot);
        const winnerEmbed = new EmbedBuilder()
            .setTitle('🎉 Piyango Sonuçlandı! 🎉')
            .setDescription(`Tebrikler ${winnerMember}! Tam **${totalPot.toLocaleString('tr-TR')} coin** kazandın!`)
            .setColor('Gold')
            .setTimestamp();
        channel.send({ embeds: [winnerEmbed] });
    } else {
         channel.send({ embeds: [embeds.info("Kazanan sunucudan ayrıldığı için piyango iptal edildi.")] });
    }

    await Lottery.deleteOne({ _id: lotteryDoc._id });
}

module.exports = {
    name: 'piyango',
    description: 'Piyango sistemi komutu.',
    category: 'economy',
    usage: 'piyango <al <adet>|durum>',
    aliases: ['lottery'],
    cooldown: 5,
    async execute(message, args, client) {
        const subCommand = args[0]?.toLowerCase();
        let lotteryData = await Lottery.findOne({ guildId: message.guild.id, ended: false });

        switch (subCommand) {
            case 'al': {
                const amount = parseInt(args[1]);
                if (isNaN(amount) || amount <= 0) {
                    return message.reply({ embeds: [embeds.error('Lütfen açılacak paket adedini girin.')] });
                }

                const totalCost = amount * PACKAGE_COST;
                const userAccount = await economyHelper.getUser(message.author.id, message.guild.id);
                if (userAccount.balance < totalCost) {
                    return message.reply({ embeds: [embeds.error(`Yetersiz bakiye! **${amount}** paket için **${totalCost.toLocaleString()}** coin gerekli.`)] });
                }

                await economyHelper.removeBalance(message.author.id, message.guild.id, totalCost);
                
                const openedItems = [];
                let totalContribution = 0;
                for (let i = 0; i < amount; i++) {
                    const loot = getRandomLoot();
                    openedItems.push(loot);
                    totalContribution += loot.value;
                }

                if (!lotteryData) {
                    lotteryData = await Lottery.create({ 
                        guildId: message.guild.id, 
                        channelId: message.channel.id
                    });
                    
                    const endTime = new Date(Date.now() + DRAW_INTERVAL);
                    // --- DEĞİŞİKLİK BAŞLANGICI ---
                    // 2. Zamanlayıcıya artık tüm obje yerine sadece sunucu ID'sini veriyoruz.
                    setTimeout(() => drawWinner(message.guild.id, message.guild), DRAW_INTERVAL);
                    // --- DEĞİŞİKLİK SONU ---

                    message.channel.send({ embeds: [embeds.info(`Piyango başladı! Çekiliş **10 dakika** sonra otomatik olarak yapılacak.`)] });
                }
                
                const updatedLottery = await Lottery.findOneAndUpdate(
                    { 
                        guildId: message.guild.id, 
                        ended: false,
                        'participants.userId': message.author.id 
                    },
                    { 
                        $inc: { 'participants.$.tickets': totalContribution, totalPot: totalContribution, totalPackagesOpened: amount } 
                    },
                    { new: true }
                );

                if (updatedLottery) {
                    const newTicketCount = updatedLottery.participants.find(p => p.userId === message.author.id).tickets;
                    const resultEmbed = new EmbedBuilder()
                        .setTitle('📦 Piyango Paketi Açıldı!')
                        .setDescription(openedItems.map(item => `${item.emoji} **${item.name}** paketi açtın ve **${item.value}** coin değerinde bilet kazandın!`).join('\n'))
                        .addFields(
                            { name: 'Toplam Katkın', value: `**${totalContribution.toLocaleString()}** coin değerinde bilet` },
                            { name: 'Yeni Toplam Bilet', value: `**${newTicketCount.toLocaleString()}**` }
                        );
                    message.reply({ embeds: [resultEmbed] });
                } else {
                     const finalLottery = await Lottery.findOneAndUpdate(
                        { guildId: message.guild.id, ended: false },
                        {
                            $inc: { totalPot: totalContribution, totalPackagesOpened: amount },
                            $push: { participants: { userId: message.author.id, tickets: totalContribution } }
                        },
                        { new: true }
                    );
                    const newTicketCount = finalLottery.participants.find(p => p.userId === message.author.id).tickets;
                    const resultEmbed = new EmbedBuilder()
                        .setTitle('📦 Piyango Paketi Açıldı!')
                        .setDescription(openedItems.map(item => `${item.emoji} **${item.name}** paketi açtın ve **${item.value}** coin değerinde bilet kazandın!`).join('\n'))
                        .addFields(
                            { name: 'Toplam Katkın', value: `**${totalContribution.toLocaleString()}** coin değerinde bilet` },
                            { name: 'Yeni Toplam Bilet', value: `**${newTicketCount.toLocaleString()}**` }
                        );
                    message.reply({ embeds: [resultEmbed] });
                }
                break;
            }

            case 'durum':
            case 'status': {
                if (!lotteryData) {
                    return message.reply({ embeds: [embeds.info('Şu anda aktif bir piyango bulunmuyor.')] });
                }

                const statusEmbed = new EmbedBuilder()
                    .setTitle('🎫 Piyango Durumu')
                    .setColor(embeds.info().data.color)
                    .addFields(
                        { name: '💰 Toplam Ödül Havuzu', value: `**${lotteryData.totalPot.toLocaleString('tr-TR')} coin**`, inline: true },
                        { name: '🎟️ Açılan Paket', value: `**${lotteryData.totalPackagesOpened}** adet`, inline: true }
                    );
                
                const sortedParticipants = lotteryData.participants.sort((a, b) => b.tickets - a.tickets);
                let participantsText = sortedParticipants.slice(0, 5).map(p => {
                    const winChance = ((p.tickets / lotteryData.totalPot) * 100).toFixed(2);
                    return `> <@${p.userId}> - **${p.tickets.toLocaleString()}** coin değerinde bilet (%${winChance} şans)`;
                }).join('\n');
                
                if (sortedParticipants.length > 5) {
                    participantsText += `\n> ve ${sortedParticipants.length - 5} kişi daha...`;
                }
                
                statusEmbed.addFields({ name: 'En Çok Bileti Olanlar', value: participantsText || 'Henüz katılan yok.' });
                
                const endTime = new Date(lotteryData.startTime.getTime() + DRAW_INTERVAL);
                statusEmbed.setFooter({ text: `Çekiliş: ${endTime.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })} tarihinde yapılacak.` });

                await message.channel.send({ embeds: [statusEmbed] });
                break;
            }

            default: {
                return message.reply({ embeds: [embeds.error(`Geçersiz alt komut. Kullanım: \`${this.usage}\``)] });
            }
        }
    },
    drawWinner
};