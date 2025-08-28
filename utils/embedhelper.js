const { EmbedBuilder } = require('discord.js');

// Marka rengi ve logosu - bu değerleri değiştirebilirsiniz.
const BRAND_COLOR = '#E84A00'; 
const BRAND_LOGO_URL = 'https://cdn.discordapp.com/attachments/1241342859848974406/1387411576906186772/pp31.png?ex=685d3f38&is=685bedb8&hm=a77fa5d2181fbed7521a8a002354354221f529fe383c0aee91f602002aab6e4b&';

// Renk paleti
const colors = {
    success: '#2ECC71',
    error: '#E74C3C',
    info: BRAND_COLOR,
    warning: '#F39C12'
};

/**
 * Belirtilen parametrelerle temel bir embed oluşturur.
 * @param {string} color - Embed'in Hex renk kodu.
 * @param {string} defaultTitle - Varsayılan başlık.
 * @param {string | null} description - Embed'in açıklaması.
 * @param {string | null} [customTitle=null] - Embed'i oluşturan özel başlık.
 * @returns {EmbedBuilder} - Oluşturulan EmbedBuilder nesnesi.
 */
const createEmbed = (color, defaultTitle, description = null, customTitle = null) => {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(customTitle || defaultTitle) // Özel başlık varsa onu, yoksa varsayılanı kullanır.
        .setDescription(description)
        .setTimestamp()
        .setFooter({ text: 'EuxLix Development', iconURL: BRAND_LOGO_URL }); 
};

module.exports = {
    /**
     * Başarı mesajı embed'i oluşturur.
     * @param {string} description - Embed açıklaması.
     * @param {string | null} [title=null] - Varsayılan başlığı ezmek için özel başlık.
     */
    success: (description, title = null) => createEmbed(colors.success, '✅ Başarılı', description, title),

    /**
     * Hata mesajı embed'i oluşturur.
     * @param {string} description - Embed açıklaması.
     * @param {string | null} [title=null] - Varsayılan başlığı ezmek için özel başlık.
     */
    error: (description, title = null) => createEmbed(colors.error, '❌ Hata', description, title),

    /**
     * Bilgi mesajı embed'i oluşturur.
     * @param {string} description - Embed açıklaması.
     * @param {string | null} [title=null] - Varsayılan başlığı ezmek için özel başlık.
     */
    info: (description, title = null) => createEmbed(colors.info, 'ℹ️ Bilgi', description, title),
    
    /**
     * Uyarı mesajı embed'i oluşturur.
     * @param {string} description - Embed açıklaması.
     * @param {string | null} [title=null] - Varsayılan başlığı ezmek için özel başlık.
     */
    warning: (description, title = null) => createEmbed(colors.warning, '⚠️ Uyarı', description, title),
};