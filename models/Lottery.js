const { Schema, model } = require('mongoose');

const lotterySchema = new Schema({
    guildId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    totalPot: { type: Number, default: 0 },
    participants: [{
        userId: { type: String, required: true },
        tickets: { type: Number, required: true },
    }],
    startTime: { type: Date, default: Date.now },
    ended: { type: Boolean, default: false },
    // Yeni eklenen alan
    totalPackagesOpened: { type: Number, default: 0 },
});

module.exports = model('Lottery', lotterySchema);