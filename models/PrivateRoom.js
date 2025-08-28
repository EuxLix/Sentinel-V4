// Dosya Yolu: models/PrivateRoom.js
const { Schema, model } = require('mongoose');

const privateRoomSchema = new Schema({
    channelId: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true },
});

module.exports = model('PrivateRoom', privateRoomSchema);
