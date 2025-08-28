// Dosya Yolu: handlers/privateRoomHandler.js
const {
    PermissionsBitField,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    UserSelectMenuBuilder,
} = require("discord.js");
const embeds = require("../utils/embedhelper");
const PrivateRoom = require('../models/PrivateRoom');

async function execute(interaction) {
    const { customId, guild, member } = interaction;

    if (interaction.isButton() && customId.startsWith("room_")) {
        const parts = customId.split("_");
        const action = parts[1];
        const channelId = parts[2];

        const voiceChannel = guild.channels.cache.get(channelId);
        if (!voiceChannel) {
            interaction.reply({
                content: "Bu oda artık mevcut değil.",
                ephemeral: true,
            }).catch(() => {});
            return interaction.message.delete().catch(() => {});
        }

        const roomData = await PrivateRoom.findOne({ channelId: channelId }).lean();
        if (!roomData)
            return interaction.reply({
                embeds: [embeds.error("Bu odaya ait bilgi bulunamadı veya oda artık aktif değil.")],
                ephemeral: true,
            });
        if (member.id !== roomData.ownerId)
            return interaction.reply({
                embeds: [embeds.error("Bu butonu sadece oda sahibi kullanabilir!")],
                ephemeral: true,
            });

        if (action === "delete") {
            await voiceChannel.delete("Oda sahibi tarafından silindi.");
            await PrivateRoom.deleteOne({ channelId: channelId });
            return;
        }
        
        switch (action) {
            case "lock":
            case "unlock": {
                const isCurrentlyLocked = !voiceChannel
                    .permissionsFor(guild.id)
                    .has(PermissionsBitField.Flags.Connect);

                await voiceChannel.permissionOverwrites.edit(guild.id, {
                    Connect: !isCurrentlyLocked,
                });

                const newButton = ButtonBuilder.from(interaction.component)
                    .setLabel(isCurrentlyLocked ? "Kilidi Aç" : "Odayı Kilitle")
                    .setCustomId(
                        isCurrentlyLocked
                            ? `room_unlock_${channelId}`
                            : `room_lock_${channelId}`,
                    );

                interaction.message.components[0].components[0] = newButton;
                await interaction.message.edit({ components: interaction.message.components });

                return interaction.reply({
                    embeds: [
                        embeds.success(
                            `Oda başarıyla ${isCurrentlyLocked ? "kilitlendi" : "kilidi açıldı"}.`,
                        ),
                    ],
                    ephemeral: true,
                });
            }
            case "hide":
            case "unhide": {
                const isCurrentlyHidden = !voiceChannel
                    .permissionsFor(guild.id)
                    .has(PermissionsBitField.Flags.ViewChannel);

                await voiceChannel.permissionOverwrites.edit(guild.id, {
                    ViewChannel: !isCurrentlyHidden,
                });

                const newButton = ButtonBuilder.from(interaction.component)
                    .setLabel(isCurrentlyHidden ? "Görünür Yap" : "Odayı Gizle")
                    .setCustomId(
                        isCurrentlyHidden
                            ? `room_unhide_${channelId}`
                            : `room_hide_${channelId}`,
                    );

                interaction.message.components[0].components[1] = newButton;
                await interaction.message.edit({ components: interaction.message.components });

                return interaction.reply({
                    embeds: [
                        embeds.success(
                            `Oda başarıyla ${isCurrentlyHidden ? "gizlendi" : "görünür yapıldı"}.`,
                        ),
                    ],
                    ephemeral: true,
                });
            }
            case "rename": {
                const modal = new ModalBuilder()
                    .setCustomId(`rename_modal_${channelId}`)
                    .setTitle("Odayı Yeniden Adlandır");
                const nameInput = new TextInputBuilder()
                    .setCustomId("roomNameInput")
                    .setLabel("Yeni oda ismini girin")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(100);
                modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
                return interaction.showModal(modal);
            }
            case "limit": {
                const modal = new ModalBuilder()
                    .setCustomId(`limit_modal_${channelId}`)
                    .setTitle("Kullanıcı Limiti Ayarla");
                const limitInput = new TextInputBuilder()
                    .setCustomId("roomLimitInput")
                    .setLabel("Yeni limiti girin (0 = limitsiz)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(2);
                modal.addComponents(new ActionRowBuilder().addComponents(limitInput));
                return interaction.showModal(modal);
            }
            case "kick": {
                const kickMenu = new ActionRowBuilder().addComponents(
                    new UserSelectMenuBuilder()
                        .setCustomId(`kick_menu_${channelId}`)
                        .setPlaceholder("Odadan atmak istediğin üyeyi seç")
                        .setMinValues(1)
                        .setMaxValues(1),
                );
                return interaction.reply({
                    content: "Üye seç:",
                    components: [kickMenu],
                    ephemeral: true,
                });
            }
        }
    }

    if (interaction.isModalSubmit() &&
        (customId.startsWith("rename_modal_") || customId.startsWith("limit_modal_"))) {
        const parts = customId.split("_");
        const type = parts[0];
        const channelId = parts[2];
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return;

        if (type === "rename") {
            const newName = interaction.fields.getTextInputValue("roomNameInput");
            await channel.setName(newName);
            return interaction.reply({
                embeds: [embeds.success(`Odanın ismi başarıyla **${newName}** olarak değiştirildi.`)],
                ephemeral: true,
            });
        }

        if (type === "limit") {
            const newLimit = parseInt(interaction.fields.getTextInputValue("roomLimitInput"), 10);
            if (isNaN(newLimit) || newLimit < 0 || newLimit > 99) {
                return interaction.reply({
                    embeds: [embeds.error("Lütfen 0-99 arasında geçerli bir sayı girin.")],
                    ephemeral: true,
                });
            }
            await channel.setUserLimit(newLimit);
            return interaction.reply({
                embeds: [embeds.success(`Odanın limiti başarıyla **${newLimit === 0 ? "Limitsiz" : newLimit}** olarak ayarlandı.`)],
                ephemeral: true,
            });
        }
    }

    if (interaction.isUserSelectMenu() && customId.startsWith("kick_menu_")) {
        const channelId = customId.split("_")[2];
        const targetMember = interaction.members.first();
        if (targetMember.id === member.id)
            return interaction.update({
                content: "Kendini odadan atamazsın!",
                components: [],
            });

        await targetMember.voice.disconnect("Oda sahibi tarafından atıldı.");
        return interaction.update({
            content: `**${targetMember.user.tag}** odadan atıldı.`,
            components: [],
        });
    }
}

module.exports = { execute };
