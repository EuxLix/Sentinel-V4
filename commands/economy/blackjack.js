// Dosya Yolu: commands/economy/blackjack.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const economyHelper = require('../../utils/economyHelper');
const embeds = require('../../utils/embedhelper');

// --- Oyun Sabitleri ---
const SUITS = { 'H': '♥️', 'D': '♦️', 'C': '♣️', 'S': '♠️' };
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const MIN_BET = 10;

// --- Yardımcı Fonksiyonlar ---

/**
 * Karıştırılmış yeni bir deste oluşturur.
 */
function createDeck() {
    const deck = [];
    for (const suit of Object.keys(SUITS)) {
        for (const rank of RANKS) deck.push({ rank, suit });
    }
    // Fisher-Yates shuffle algoritması
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

/**
 * Bir elin sayısal değerini hesaplar (As'ları 1 veya 11 olarak ayarlar).
 */
function calculateHandValue(hand) {
    let value = 0, aceCount = 0;
    for (const card of hand) {
        if (['J', 'Q', 'K'].includes(card.rank)) value += 10;
        else if (card.rank === 'A') { aceCount++; value += 11; }
        else value += parseInt(card.rank);
    }
    while (value > 21 && aceCount > 0) { value -= 10; aceCount--; }
    return value;
}

/**
 * Kart dizisini okunabilir bir metne çevirir.
 */
function handToString(hand, hideSecondCard = false) {
    if (hideSecondCard && hand.length > 1) {
        return `\`${hand[0].rank}${SUITS[hand[0].suit]}\` \`??\``;
    }
    return hand.map(card => `\`${card.rank}${SUITS[card.suit]}\``).join(' ');
}

/**
 * Mevcut oyun durumuna göre embed mesajını oluşturur.
 */
function createGameEmbed(gameState) {
    const { playerHand, dealerHand, bet, result, status, playerName, playerAvatar, finalBalance } = gameState;
    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);

    const outcomes = {
        bj: { title: '🃏 BLACKJACK!', color: 'Gold', message: `Mükemmel! Bahsinin 1.5 katı olan **${Math.floor(bet * 1.5).toLocaleString('tr-TR')}** coin kazandın!` },
        win: { title: '🎉 Kazandın!', color: 'Green', message: `Tebrikler! **+${bet.toLocaleString('tr-TR')}** coin kazandın.` },
        lose: { title: '💥 Kaybettin!', color: 'Red', message: `Üzgünüm! **-${bet.toLocaleString('tr-TR')}** coin kaybettin.` },
        push: { title: '⚖️ Berabere!', color: 'Yellow', message: 'Bahsin iade edildi. Bakiye değişmedi.' },
        timeout: { title: '⏰ Zaman Aşımı!', color: 'Grey', message: `Süre dolduğu için bahsini kaybettin. **-${bet.toLocaleString('tr-TR')}** coin.` }
    };

    const outcome = outcomes[result] || { title: 'Blackjack Masası', color: 'Navy' };
    const isGameOver = !!result;

    const embed = new EmbedBuilder()
        .setColor(outcome.color)
        .setTitle(outcome.title)
        .setAuthor({ name: playerName, iconURL: playerAvatar })
        .addFields(
            { name: `Senin Elin (${playerValue})`, value: handToString(playerHand), inline: true },
            { name: `Kurpiyerin Eli ${isGameOver ? `(${dealerValue})` : ''}`, value: handToString(dealerHand, !isGameOver), inline: true }
        );

    if (outcome.message) {
        embed.setDescription(outcome.message);
    }
    
    // Oyun bittiğinde güncel bakiye gösterilir.
    if (finalBalance !== null) {
        embed.setFooter({ text: `Bahis: ${bet.toLocaleString('tr-TR')} | Yeni Bakiye: ${finalBalance.toLocaleString('tr-TR')}` });
    } else {
        embed.setFooter({ text: `Bahis: ${bet.toLocaleString('tr-TR')}` });
    }
    
    return embed;
}

// --- Ana Komut ---
module.exports = {
    name: 'blackjack',
    description: 'Blackjack oyna ve şansını dene!',
    category: 'economy',
    usage: 'blackjack <bahis>',
    aliases: ['bj', '21'],
    cooldown: 20,
    async execute(message, args, client) {
        const { author, guild } = message;
        const betAmount = parseInt(args[0]);

        if (isNaN(betAmount) || betAmount < MIN_BET) {
            return message.reply({ embeds: [embeds.error(`Lütfen en az **${MIN_BET}** coin olacak şekilde geçerli bir bahis girin.`)] });
        }

        try {
            const userAccount = await economyHelper.getUser(author.id, guild.id);
            if (userAccount.balance < betAmount) {
                return message.reply({ embeds: [embeds.error(`Yetersiz bakiye! Mevcut: **${userAccount.balance.toLocaleString()}**, gereken: **${betAmount.toLocaleString()}**`)] });
            }

            const gameState = {
                playerName: author.username,
                playerAvatar: author.displayAvatarURL(),
                deck: createDeck(),
                playerHand: [],
                dealerHand: [],
                bet: betAmount,
                result: null,
                finalBalance: null // Oyun sonunda güncellenecek
            };

            gameState.playerHand.push(gameState.deck.pop(), gameState.deck.pop());
            gameState.dealerHand.push(gameState.deck.pop(), gameState.deck.pop());

            // Anında Blackjack durumu
            if (calculateHandValue(gameState.playerHand) === 21) {
                const winnings = Math.floor(betAmount * 1.5) - betAmount; // Net kazanç
                const newBalance = await economyHelper.addBalance(author.id, guild.id, winnings);
                gameState.result = 'bj';
                gameState.finalBalance = newBalance;
                return message.channel.send({ embeds: [createGameEmbed(gameState)] });
            }

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('bj_hit').setLabel('Kart Çek').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('bj_stand').setLabel('Dur').setStyle(ButtonStyle.Danger)
            );

            const gameMessage = await message.channel.send({ embeds: [createGameEmbed(gameState)], components: [buttons] });
            const collector = gameMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id !== author.id) return i.reply({ content: 'Bu oyun senin değil!', ephemeral: true });
                await i.deferUpdate();

                if (i.customId === 'bj_hit') {
                    gameState.playerHand.push(gameState.deck.pop());
                    if (calculateHandValue(gameState.playerHand) > 21) {
                        gameState.result = 'lose';
                        gameState.finalBalance = await economyHelper.removeBalance(author.id, guild.id, betAmount);
                        collector.stop('gameover');
                    }
                } else if (i.customId === 'bj_stand') {
                    while (calculateHandValue(gameState.dealerHand) < 17) gameState.dealerHand.push(gameState.deck.pop());

                    const playerValue = calculateHandValue(gameState.playerHand);
                    const dealerValue = calculateHandValue(gameState.dealerHand);

                    if (dealerValue > 21 || playerValue > dealerValue) {
                        gameState.result = 'win';
                        gameState.finalBalance = await economyHelper.addBalance(author.id, guild.id, betAmount);
                    } else if (playerValue < dealerValue) {
                        gameState.result = 'lose';
                        gameState.finalBalance = await economyHelper.removeBalance(author.id, guild.id, betAmount);
                    } else {
                        gameState.result = 'push';
                        gameState.finalBalance = userAccount.balance; // Bakiye değişmez
                    }
                    collector.stop('gameover');
                }
                await gameMessage.edit({ embeds: [createGameEmbed(gameState)] });
            });

            collector.on('end', async (collected, reason) => {
                if (reason !== 'gameover') { // Eğer oyun zaten bitmediyse (süre dolduysa)
                    gameState.result = 'timeout';
                    gameState.finalBalance = await economyHelper.removeBalance(author.id, guild.id, betAmount);
                }

                const finalEmbed = createGameEmbed(gameState);
                const disabledButtons = ActionRowBuilder.from(gameMessage.components[0]).setComponents(
                    gameMessage.components[0].components.map(c => ButtonBuilder.from(c).setDisabled(true))
                );
                await gameMessage.edit({ embeds: [finalEmbed], components: [disabledButtons] }).catch(() => {});
            });
        } catch (error) {
            console.error('[HATA] Blackjack komutunda hata:', error);
            message.reply({ embeds: [embeds.error('Blackjack oynanırken beklenmedik bir hata oluştu.')] });
        }
    }
};