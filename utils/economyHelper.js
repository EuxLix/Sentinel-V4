// Dosya Yolu: utils/economyHelper.js
// MongoDB ve Mongoose için güncellenmiş sürüm.
const Economy = require('../models/Economy'); // Projenin ana dizinindeki models/Economy.js dosyasını varsayıyoruz.

/**
 * Bir kullanıcının ekonomi verilerini veritabanından alır.
 * Eğer kullanıcı için bir kayıt yoksa, varsayılan değerlerle yeni bir kayıt oluşturur ve onu döndürür.
 * @param {string} userId - Kullanıcının Discord ID'si.
 * @param {string} guildId - Sunucunun Discord ID'si.
 * @returns {Promise<object>} Kullanıcının ekonomi verilerini içeren Mongoose belgesi.
 */
async function getUser(userId, guildId) {
    // findOneAndUpdate metodu, belirtilen kritere uyan bir belgeyi bulur ve günceller.
    // upsert: true -> Eğer belge bulunamazsa, yeni bir tane oluşturur.
    // new: true -> İşlem sonucunda belgenin güncellenmiş halini döndürür.
    // setDefaultsOnInsert: true -> Yeni belge oluşturulurken şemadaki varsayılan değerleri kullanır.
    const userAccount = await Economy.findOneAndUpdate(
        { userId, guildId },
        { $setOnInsert: { userId, guildId } }, // Sadece yeni oluşturulurken bu alanları ekler.
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return userAccount;
}

/**
 * Bir kullanıcının hesabına belirtilen miktarda para ekler.
 * @param {string} userId - Kullanıcının Discord ID'si.
 * @param {string} guildId - Sunucunun Discord ID'si.
 * @param {number} amount - Eklenecek pozitif miktar.
 * @returns {Promise<number>} Kullanıcının yeni bakiyesi.
 */
async function addBalance(userId, guildId, amount) {
    if (amount <= 0) {
        const user = await getUser(userId, guildId);
        return user.balance;
    }
    // $inc operatörü, mevcut değeri belirtilen miktar kadar artırır. Bu atomik bir işlemdir.
    const result = await Economy.findOneAndUpdate(
        { userId, guildId },
        { $inc: { balance: amount } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return result.balance;
}

/**
 * Bir kullanıcının hesabından belirtilen miktarda para siler.
 * @param {string} userId - Kullanıcının Discord ID'si.
 * @param {string} guildId - Sunucunun Discord ID'si.
 * @param {number} amount - Çıkarılacak pozitif miktar.
 * @returns {Promise<number>} Kullanıcının yeni bakiyesi.
 */
async function removeBalance(userId, guildId, amount) {
    if (amount <= 0) {
        const user = await getUser(userId, guildId);
        return user.balance;
    }
    // $inc operatörüne negatif bir değer vermek, mevcut değeri azaltır.
    const result = await Economy.findOneAndUpdate(
        { userId, guildId },
        { $inc: { balance: -amount } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return result.balance;
}


/**
 * Bir komut için bekleme süresini (cooldown) veritabanına kaydeder.
 * @param {string} userId - Kullanıcının Discord ID'si.
 * @param {string} guildId - Sunucunun Discord ID'si.
 * @param {'daily' | 'rob' | 'work' | 'report'} type - Cooldown'un ayarlanacağı komut türü.
 */
async function setCooldown(userId, guildId, type) {
    const now = new Date();
    // Alan adını dinamik olarak oluştur: lastDaily, lastRob vb.
    const field = `last${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    // $set operatörü ile belirtilen alanın değerini güncelle.
    await Economy.updateOne(
        { userId, guildId },
        { $set: { [field]: now } }
    );
}

/**
 * Sunucudaki en zengin kullanıcıları listeler.
 * @param {string} guildId - Sunucunun Discord ID'si.
 * @param {number} [limit=10] - Listelenecek kullanıcı sayısı.
 * @returns {Promise<Array<object>>} Zengin kullanıcıların listesi.
 */
async function getLeaderboard(guildId, limit = 10) {
    // .find() -> Belirtilen kritere uyan tüm belgeleri bulur.
    // .sort() -> Sonuçları sıralar. { balance: -1 } -> balance alanına göre büyükten küçüğe.
    // .limit() -> Sonuç sayısını sınırlar.
    // .lean() -> Sonucu tam bir Mongoose belgesi yerine saf bir JavaScript nesnesi olarak döndürür, bu da performansı artırır.
    return Economy.find({ guildId })
        .sort({ balance: -1 })
        .limit(limit)
        .lean();
}

module.exports = {
    getUser,
    addBalance,
    removeBalance,
    setCooldown,
    getLeaderboard
};