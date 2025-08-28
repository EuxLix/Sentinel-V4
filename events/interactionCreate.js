// Dosya Yolu: events/interactionCreate.js
const { Events } = require("discord.js");
const embeds = require("../utils/embedhelper");

// --- YENİ YAPI: Handler Map ---
const interactionHandlers = {
    // ticket_ satırı buradan kaldırıldı
    giveaway_: require("../handlers/giveawayHandler"),
    "giveaway-modal": require("../handlers/giveawayHandler"), // Modal için de aynı handler
    room_: require("../handlers/privateRoomHandler"),
    rename_modal_: require("../handlers/privateRoomHandler"),
    limit_modal_: require("../handlers/privateRoomHandler"),
    kick_menu_: require("../handlers/privateRoomHandler"),
};

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isMessageComponent() && !interaction.isModalSubmit())
            return;

        const { customId } = interaction;

        try {
            for (const prefix in interactionHandlers) {
                if (customId.startsWith(prefix)) {
                    await interactionHandlers[prefix].execute(interaction);
                    return;
                }
            }
        } catch (error) {
            console.error(
                `[INTERACTION_HANDLER_HATA] CustomID "${customId}" işlenirken hata oluştu:`,
                error,
            );
            const errorMessage = {
                embeds: [
                    embeds.error("Bu etkileşim işlenirken bir hata oluştu."),
                ],
                ephemeral: true,
            };

            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(errorMessage).catch(() => {});
            } else {
                await interaction.reply(errorMessage).catch(() => {});
            }
        }
    },
};
