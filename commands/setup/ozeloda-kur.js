// Dosya Yolu: commands/setup/ozeloda-kur.js
const { PermissionsBitField, ChannelType } = require("discord.js");
const { getGuildSettings, updateGuildSetting } = require("../../utils/settingsHelper");
const embeds = require("../../utils/embedhelper");

module.exports = {
    name: "ozelodakur",
    description: "Özel oda sistemini sunucuya kurar.",
    category: "setup",
    usage: "ozelodakur",
    permission: PermissionsBitField.Flags.Administrator,
    cooldown: 60,

    async execute(message, args, client) { // Client parametresi eklendi
        if (!message.member.permissions.has(this.permission)) {
            return message.reply({ embeds: [embeds.error("Bu komutu kullanmak için `Yönetici` yetkisine sahip olmalısın.")] });
        }

        // Ayarlar artık client üzerinden, önbellekten okunuyor
        const guildSettings = getGuildSettings(client, message.guild.id);
        if (guildSettings.joinToCreateChannelId && message.guild.channels.cache.has(guildSettings.joinToCreateChannelId)) {
            return message.reply({ embeds: [embeds.info(`Özel oda sistemi zaten kurulu. Oda oluşturma kanalı: <#${guildSettings.joinToCreateChannelId}>`)] });
        }

        try {
            message.reply({ embeds: [embeds.info("Özel oda sistemi kuruluyor, lütfen bekleyin...")]});

            const category = await message.guild.channels.create({
                name: "ÖZEL ODALAR",
                type: ChannelType.GuildCategory,
            });
            const joinToCreateChannel = await message.guild.channels.create({
                name: "➕ Oda Oluştur",
                type: ChannelType.GuildVoice,
                parent: category.id,
            });

            // Ayarlar artık client üzerinden güncelleniyor
            await updateGuildSetting(client, message.guild.id, "privateRoomsCategoryId", category.id);
            await updateGuildSetting(client, message.guild.id, "joinToCreateChannelId", joinToCreateChannel.id);

            const successEmbed = embeds.success(
                `Özel oda sistemi başarıyla kuruldu!\n\nKullanıcılar artık ${joinToCreateChannel} kanalına katılarak kendi odalarını oluşturabilirler.`,
                "Kurulum Tamamlandı",
            );
            await message.channel.send({ embeds: [successEmbed] });
        } catch (error) {
            console.error("[HATA] Özel oda sistemi kurulurken hata oluştu:", error);
            message.channel.send({ embeds: [embeds.error("Sistemi kurarken bir hata oluştu. Lütfen botun `Kanalları Yönet` yetkisine sahip olduğundan emin olun.")] });
        }
    },
};