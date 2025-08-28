// Dosya Yolu: models/Economy.js
const { Schema, model } = require('mongoose');

// Kullanıcıların sunucu bazlı ekonomi verilerinin şemasını tanımlıyoruz.
const economySchema = new Schema({
    // Bu belgenin hangi sunucuya ait olduğu.
    guildId: { 
        type: String, 
        required: true 
    },
    
    // Bu belgenin hangi kullanıcıya ait olduğu.
    userId: { 
        type: String, 
        required: true 
    },

    // Kullanıcının mevcut coin bakiyesi.
    balance: { 
        type: Number, 
        default: 1000 // Yeni kullanıcılar 1000 coin ile başlar.
    },

    // 'günlük' komutunun en son ne zaman kullanıldığını tutan tarih.
    lastDaily: { 
        type: Date, 
        default: new Date(0) // Varsayılan olarak çok eski bir tarih (hiç kullanılmamış demek).
    },

    // 'soygun' komutunun en son ne zaman kullanıldığını tutan tarih.
    lastRob: { 
        type: Date, 
        default: new Date(0)
    },
    
    // 'çalış' gibi bir komut eklenirse onun zamanını tutmak için.
    lastWork: { 
        type: Date, 
        default: new Date(0) 
    },
    
    // 'report' komutunun en son ne zaman kullanıldığını tutan tarih.
    lastReport: { 
        type: Date, 
        default: new Date(0) 
    }
});

// Performansı artırmak ve mükerrer kayıtları %100 engellemek için,
// bir sunucudaki bir kullanıcının sadece tek bir ekonomi belgesi olabileceğinden emin oluyoruz.
// Bu, SQL'deki PRIMARY KEY (userId, guildId) ifadesinin MongoDB karşılığıdır.
economySchema.index({ guildId: 1, userId: 1 }, { unique: true });

// Şemayı "Economy" adında bir model olarak derleyip dışa aktarıyoruz.
// MongoDB'de bu, 'economies' adında bir koleksiyon oluşturacaktır.
module.exports = model('Economy', economySchema);