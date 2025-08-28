// Dosya Yolu: commands/utility/help.js
const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    PermissionsBitField,
} = require("discord.js");
const { hasPermission } = require("../../utils/permissionHelper");
const embeds = require("../../utils/embedhelper");

// Komutların gerektirdiği özel yetkiler
const commandPermissions = {
    ban: PermissionsBitField.Flags.BanMembers,
    softban: PermissionsBitField.Flags.BanMembers,
    unban: PermissionsBitField.Flags.BanMembers,
    kick: PermissionsBitField.Flags.KickMembers,
    timeout: PermissionsBitField.Flags.ModerateMembers,
    untimeout: PermissionsBitField.Flags.ModerateMembers,
    uyar: PermissionsBitField.Flags.ModerateMembers,
    uyarısil: PermissionsBitField.Flags.ModerateMembers,
    uyarılar: PermissionsBitField.Flags.ModerateMembers,
    sil: PermissionsBitField.Flags.ManageMessages,
    lock: PermissionsBitField.Flags.ManageChannels,
    unlock: PermissionsBitField.Flags.ManageChannels,
    name: PermissionsBitField.Flags.ManageNicknames,
    rolver: PermissionsBitField.Flags.ManageRoles,
    rolal: PermissionsBitField.Flags.ManageRoles,
    otorol: PermissionsBitField.Flags.Administrator,
    karşılama: PermissionsBitField.Flags.Administrator,
    loglar: PermissionsBitField.Flags.Administrator,
    görevli: PermissionsBitField.Flags.Administrator,
    giveaway: PermissionsBitField.Flags.ManageGuild,
    ozelodakur: PermissionsBitField.Flags.Administrator,
    para: PermissionsBitField.Flags.Administrator,
    tümuyarılarısil: PermissionsBitField.Flags.Administrator,
};

module.exports = {
    name: "help",
    description: "Kullanabileceğin tüm komutları listeler veya bir komut hakkında bilgi verir.",
    category: "utility",
    usage: "help [komut adı]",
    cooldown: 5,
    async execute(message, args, client) { // Client parametresi zaten alınıyor
        const { commands } = client;
        const prefix = process.env.PREFIX || "s!";

        // KULLANICININ KULLANABİLECEĞİ KOMUTLARI FİLTRELEME
        // 'hasPermission' fonksiyonuna 'client' objesini iletiyoruz
        const accessibleCommands = commands.filter((cmd) => {
            const requiredPermission = commandPermissions[cmd.name];
            if (!requiredPermission) {
                return true; // İzin gerektirmeyen komutlar herkes tarafından kullanılabilir.
            }
            // Artık client objesi ile birlikte çağrılıyor
            return hasPermission(client, message.member, requiredPermission);
        });

        // Tek komut bilgisi
        if (args.length > 0) {
            const commandName = args[0].toLowerCase();
            const command = accessibleCommands.get(commandName) || accessibleCommands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

            if (!command) {
                return message.reply({ embeds: [embeds.error("Böyle bir komut bulunamadı veya bu komutu kullanma yetkin yok.")] });
            }

            const commandEmbed = new EmbedBuilder()
                .setColor(embeds.info().data.color)
                .setTitle(`Komut Detayı: \`${command.name}\``)
                .addFields(
                    { name: "Açıklama", value: command.description || "Açıklama bulunmuyor." },
                    { name: "Kullanım", value: `\`${prefix}${command.usage || command.name}\`` },
                    { name: "Kategori", value: command.category.charAt(0).toUpperCase() + command.category.slice(1) }
                );
            if(command.aliases?.length > 0) {
                commandEmbed.addFields({ name: 'Alternatifler', value: `\`${command.aliases.join(', ')}\`` });
            }
            return message.channel.send({ embeds: [commandEmbed] });
        }

        // Kategori listesi
        const categories = [...new Set(accessibleCommands.map((cmd) => cmd.category))];

        const initialEmbed = new EmbedBuilder(embeds.info(null).data)
            .setTitle(`${client.user.username} Yardım Menüsü`)
            .setDescription("Kullanabileceğin komutları görmek için aşağıdaki menüden bir kategori seç.")
            .setThumbnail(client.user.displayAvatarURL());

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("help_category_select")
                .setPlaceholder("Bir kategori seçin...")
                .addOptions(
                    categories.map((category) => ({
                        label: `${category.charAt(0).toUpperCase() + category.slice(1)} Komutları`,
                        value: category,
                    })),
                ),
        );

        const helpMessage = await message.channel.send({ embeds: [initialEmbed], components: [row] });
        const collector = helpMessage.createMessageComponentCollector({ filter: (i) => i.user.id === message.author.id, time: 120000 });

        collector.on("collect", async (i) => {
            await i.deferUpdate();
            const selectedCategory = i.values[0];
            const categoryCommands = accessibleCommands.filter((cmd) => cmd.category === selectedCategory);

            const categoryEmbed = new EmbedBuilder(embeds.info(null).data)
                .setTitle(`${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Komutları`)
                .setDescription(categoryCommands.map((cmd) => `**\`${prefix}${cmd.name}\`** - ${cmd.description}`).join("\n"));

            await helpMessage.edit({ embeds: [categoryEmbed] });
        });

        collector.on("end", (collected, reason) => {
            const disabledRow = new ActionRowBuilder().addComponents(
                StringSelectMenuBuilder.from(row.components[0]).setDisabled(true)
            );
            if (reason === "time") {
                disabledRow.components[0].setPlaceholder("Süre doldu.");
            }
            helpMessage.edit({ components: [disabledRow] }).catch(() => {});
        });
    },
};
