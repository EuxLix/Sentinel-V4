// Dosya Yolu: models/GuildSettings.js
const { Schema, model } = require('mongoose');

// Sunucuya özel ayarların veritabanı şemasını (yapısını) tanımlıyoruz.
const guildSettingsSchema = new Schema({
    // guildId, her ayar belgesinin hangi sunucuya ait olduğunu belirtir.
    // required: true -> Bu alanın boş bırakılamayacağını zorunlu kılar.
    // unique: true -> Her sunucunun sadece bir ayar belgesi olmasını sağlar, mükerrer kaydı engeller.
    guildId: { 
        type: String, 
        required: true, 
        unique: true 
    },

    // Logların gönderileceği kanalın ID'si.
    logChannelId: { 
        type: String, 
        default: null // Varsayılan olarak ayarlanmamış (null).
    },

    // Karşılama mesajlarının gönderileceği kanalın ID'si.
    welcomeChannelId: { 
        type: String, 
        default: null 
    },
    
    // Karşılama sisteminin aktif olup olmadığını belirten boolean (true/false) değer.
    welcomeEnabled: { 
        type: Boolean, 
        default: false // Varsayılan olarak kapalı.
    },

    // Sunucuya yeni katılan üyelere otomatik verilecek rolün ID'si.
    autoRoleId: { 
        type: String, 
        default: null 
    },

    // Otorol sisteminin aktif olup olmadığı.
    autoRoleEnabled: { 
        type: Boolean, 
        default: false 
    },

    // Moderasyon komutlarını kullanabilecek özel görevli rolünün ID'si.
    modRoleId: { 
        type: String, 
        default: null 
    },
    
    // Özel oda sisteminin oluşturulacağı kategori ID'si.
    privateRoomsCategoryId: { 
        type: String, 
        default: null 
    },

    // Kullanıcıların yeni özel oda oluşturmak için katılacağı ses kanalının ID'si.
    joinToCreateChannelId: { 
        type: String, 
        default: null 
    }
});

// Şemayı bir "model" olarak derleyip dışa aktarıyoruz.
// 'GuildSettings' -> MongoDB'de 'guildsettings' adında bir koleksiyon (tablo) oluşturacak.
module.exports = model('GuildSettings', guildSettingsSchema);