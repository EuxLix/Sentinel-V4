// Dosya Yolu: commands/economy/market.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const economyHelper = require('../../utils/economyHelper');
const embeds = require('../../utils/embedhelper');
const shopItems = require('../../shop.json');

module.exports = {
    name: 'market',
    description: 'Marketi görüntüler veya bir ürün satın alırsınız.',
    category: 'economy',
    usage: 'market [ürün ID]',
    aliases: ['shop', 'dükkan'],
    cooldown: 10,
    async execute(message, args, client) {
        const { author, guild, member } = message;
        const selectedItemId = args[0]?.toLowerCase();

        // --- BÖLÜM 1: SADECE MARKETİ LİSTELEME ---
        // Bu bölüm zaten veritabanı işlemi yapmadığı için oldukça verimli.
        // Sadece küçük iyileştirmeler yapıldı.
        if (!selectedItemId) {
            if (shopItems.length === 0) {
                return message.channel.send({ embeds: [embeds.info("Markette şu anda satılık ürün bulunmuyor.")] });
            }
            
            const shopEmbed = new EmbedBuilder()
                .setTitle('🛒 Sentinel Market')
                .setColor(embeds.info().data.color)
                .setDescription('Aşağıdaki ürünleri satın alabilirsiniz.\nSatın almak için `s!market <Ürün ID>` komutunu kullanın.');
            
            const itemFields = shopItems.map(item => ({
                name: `🛍️ ${item.name}`,
                value: `**Fiyat:** ${item.price.toLocaleString('tr-TR')} coin\n**ID:** \`${item.id}\``,
                inline: true
            }));
            shopEmbed.addFields(itemFields);

            return message.channel.send({ embeds: [shopEmbed] });
        }

        // --- BÖLÜM 2: ÜRÜN SATIN ALMA ---
        const item = shopItems.find(i => i.id.toLowerCase() === selectedItemId);
        if (!item) {
            return message.reply({ embeds: [embeds.error('Bu ID ile eşleşen bir ürün bulunamadı.')] });
        }

        try {
            // KRİTİK DÜZELTME: Kullanıcı verisi 'await' ile beklenmeli.
            const userAccount = await economyHelper.getUser(author.id, guild.id);

            if (userAccount.balance < item.price) {
                return message.reply({ embeds: [embeds.error(`Yeterli bakiyen yok. Bu ürün için **${item.price.toLocaleString('tr-TR')}** coin gerekli.`)] });
            }

            const role = guild.roles.cache.get(item.roleId);
            if (!role) {
                console.error(`[MARKET HATA] ${item.roleId} ID'li rol sunucuda bulunamadı! Lütfen shop.json dosyasını kontrol et.`);
                return message.reply({ embeds: [embeds.error('Bu ürünle ilişkili rol sunucuda bulunamadı. Lütfen bir yetkiliye bildirin.')] });
            }

            if (member.roles.cache.has(role.id)) {
                return message.reply({ embeds: [embeds.info('Bu role zaten sahipsin.')] });
            }

            // Botun rol hiyerarşisini kontrol et.
            if (guild.members.me.roles.highest.position <= role.position) {
                 return message.reply({ embeds: [embeds.error(`"${role.name}" rolünü vermek için yetkim yetersiz. Lütfen botun rolünün bu rolün üzerinde olduğundan emin olun.`)] });
            }

            // KRİTİK DÜZELTME: Bakiye düşürme işlemi 'await' ile beklenmeli
            // ve bu işlem bize güncel bakiyeyi zaten döndürür.
            const newBalance = await economyHelper.removeBalance(author.id, guild.id, item.price);
            await member.roles.add(role, 'Marketten satın aldı.');
            
            await message.reply({
                embeds: [embeds.success(`**${item.name}** rolünü başarıyla satın aldın! **${item.price.toLocaleString('tr-TR')}** coin harcadın.`)
                    .addFields({ name: 'Kalan Bakiye', value: `**${newBalance.toLocaleString('tr-TR')}** coin` })
                ]
            });

        } catch (error) {
            console.error("[HATA] Market komutunda hata:", error);
            await message.reply({ embeds: [embeds.error('Satın alma sırasında beklenmedik bir hata oluştu.')] });
        }
    }
};