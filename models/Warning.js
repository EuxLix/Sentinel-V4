// Dosya Yolu: models/Warning.js
const { Schema, model } = require('mongoose');

const warningSchema = new Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    // Uyarıları silmeyi kolaylaştırmak için benzersiz bir ID ekleyelim
    warningId: { type: String, required: true, unique: true },
});

// guildId ve userId'ye göre arama yapmayı hızlandırmak için index ekleyelim
warningSchema.index({ guildId: 1, userId: 1 });

module.exports = model('Warning', warningSchema);
