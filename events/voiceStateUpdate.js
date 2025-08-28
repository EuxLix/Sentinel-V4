// Dosya Yolu: events/voiceStateUpdate.js
const {
    EmbedBuilder,
    PermissionsBitField,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const { getGuildSettings } = require("../utils/settingsHelper");
const PrivateRoom = require("../models/PrivateRoom");

async function handlePrivateRoomCreation(newState, guildSettings, client) {
    const { guild, member } = newState;
    if (newState.channelId !== guildSettings.joinToCreateChannelId || !guildSettings.privateRoomsCategoryId) return;

    try {
        // Kullanıcının zaten özel odası var mı?
        const existingRoom = await PrivateRoom.findOne({ ownerId: member.id });
        if (existingRoom) {
            const channel = guild.channels.cache.get(existingRoom.channelId);
            if (channel) {
                await newState.setChannel(channel, "Kullanıcı zaten özel odasına yönlendirildi.");
                return;
            } else {
                // DB kaydı var ama kanal silinmiş → temizle
                await PrivateRoom.deleteOne({ ownerId: member.id });
            }
        }

        const voiceChannel = await guild.channels.create({
            name: `${member.user.username}'s Room`,
            type: ChannelType.GuildVoice,
            parent: guildSettings.privateRoomsCategoryId,
            permissionOverwrites: [
                {
                    id: member.id,
                    allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers]
                },
                {
                    id: client.user.id,
                    allow: [
                        PermissionsBitField.Flags.ManageChannels,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.EmbedLinks
                    ]
                }
            ]
        });

        await newState.setChannel(voiceChannel, "Kullanıcı özel oda oluşturdu.");
        await PrivateRoom.create({ channelId: voiceChannel.id, ownerId: member.id });

        // --- Kontrol Paneli Butonları ---
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`room_lock_${voiceChannel.id}`)
                .setLabel("Kilitle")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("🔒"),
            new ButtonBuilder()
                .setCustomId(`room_hide_${voiceChannel.id}`)
                .setLabel("Gizle")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("👻"),
            new ButtonBuilder()
                .setCustomId(`room_rename_${voiceChannel.id}`)
                .setLabel("İsim Değiştir")
                .setStyle(ButtonStyle.Primary)
                .setEmoji("✏️"),
            new ButtonBuilder()
                .setCustomId(`room_limit_${voiceChannel.id}`)
                .setLabel("Limit")
                .setStyle(ButtonStyle.Primary)
                .setEmoji("👥")
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`room_kick_${voiceChannel.id}`)
                .setLabel("Üye At")
                .setStyle(ButtonStyle.Danger)
                .setEmoji("👢"),
            new ButtonBuilder()
                .setCustomId(`room_delete_${voiceChannel.id}`)
                .setLabel("Odayı Sil")
                .setStyle(ButtonStyle.Danger)
                .setEmoji("🗑️")
        );

        const controlPanelEmbed = new EmbedBuilder()
            .setColor("#E84A00")
            .setTitle(`${member.user.username} Kontrol Paneli`)
            .setDescription("Odanı yönetmek için aşağıdaki butonları kullanabilirsin.");

        await voiceChannel.send({
            content: `${member}`,
            embeds: [controlPanelEmbed],
            components: [row1, row2]
        });
    } catch (error) {
        console.error("[HATA] Özel oda oluşturulurken hata:", error);
    }
}

async function handlePrivateRoomDeletion(oldState) {
    const { channel } = oldState;
    if (!channel) return;

    const isPrivateRoom = await PrivateRoom.exists({ channelId: channel.id });

    if (isPrivateRoom && channel.members.size === 0) {
        setTimeout(async () => {
            try {
                const stillEmptyChannel = await channel.guild.channels.fetch(channel.id).catch(() => null);
                if (stillEmptyChannel && stillEmptyChannel.members.size === 0) {
                    await stillEmptyChannel.delete("Özel oda boşaldığı için otomatik silindi.");
                    await PrivateRoom.deleteOne({ channelId: channel.id });
                }
            } catch (e) {
                // Kanal zaten silinmiş olabilir
            }
        }, 5000);
    }
}

async function handleVoiceLog(oldState, newState, logChannel) {
    const { member } = newState;
    if (oldState.channelId === newState.channelId) return;

    const embed = new EmbedBuilder()
        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
        .setTimestamp();

    if (!oldState.channelId) {
        embed
            .setColor("#2ECC71")
            .setTitle("Log: Ses Kanalına Katıldı")
            .setDescription(`**Üye:** ${member}\n**Kanal:** ${newState.channel}`);
    } else if (!newState.channelId) {
        embed
            .setColor("#E74C3C")
            .setTitle("Log: Ses Kanalından Ayrıldı")
            .setDescription(`**Üye:** ${member}\n**Kanal:** ${oldState.channel}`);
    } else {
        embed
            .setColor("#3498DB")
            .setTitle("Log: Ses Kanalı Değiştirdi")
            .setDescription(`**Üye:** ${member}`)
            .addFields(
                { name: "Eski Kanal", value: `${oldState.channel}`, inline: true },
                { name: "Yeni Kanal", value: `${newState.channel}`, inline: true }
            );
    }

    return logChannel.send({ embeds: [embed] }).catch(console.error);
}

module.exports = {
    name: "voiceStateUpdate",
    async execute(oldState, newState, client) {
        const { member, guild } = newState;
        if (!member || member.user.bot) return;

        const guildSettings = getGuildSettings(client, guild.id);

        await handlePrivateRoomCreation(newState, guildSettings, client);
        await handlePrivateRoomDeletion(oldState);

        if (guildSettings.logChannelId) {
            const logChannel = guild.channels.cache.get(guildSettings.logChannelId);
            if (logChannel) {
                await handleVoiceLog(oldState, newState, logChannel);
            }
        }
    }
};
