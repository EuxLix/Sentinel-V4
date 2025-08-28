// Dosya Yolu: utils/stringHelper.js

/**
 * Kullanıcının girdiği "10k", "5m" gibi metinleri sayısal değere çevirir.
 * @param {string} input - Kullanıcının girdiği miktar metni.
 * @returns {number|null} - Geçerliyse sayı, değilse null döndürür.
 */
function parseAmount(input) {
    if (!input) return null;

    const cleanedInput = input.toLowerCase();
    let multiplier = 1;

    if (cleanedInput.endsWith('k')) {
        multiplier = 1000;
    } else if (cleanedInput.endsWith('m')) {
        multiplier = 1000000;
    } else if (cleanedInput.endsWith('b')) {
        multiplier = 1000000000;
    }

    const numberPart = parseFloat(cleanedInput.replace(/k|m|b/, ''));
    if (isNaN(numberPart)) return null;

    return Math.floor(numberPart * multiplier);
}


module.exports = { parseAmount };