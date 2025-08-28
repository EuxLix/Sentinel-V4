// Dosya Yolu: models/Giveaway.js
const { Schema, model } = require('mongoose');

const giveawaySchema = new Schema({
    messageId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    guildId: { type: String, required: true },
    prize: { type: String, required: true },
    winnerCount: { type: Number, required: true },
    endTime: { type: Date, required: true },
    ended: { type: Boolean, default: false },
    // Kazananların ID'lerini bir dizi olarak tutacağız.
    winners: { type: [String], default: [] } 
});

module.exports = model('Giveaway', giveawaySchema);