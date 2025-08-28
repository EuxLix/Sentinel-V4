// Dosya Yolu: commands/moderation/rol-al.js
const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const embeds = require("../../utils/embedhelper");
const { getTargetMember, checkModerationAction } = require("../../utils/moderationHelper");

module.exports = {
    name: "rolal",
    description: "Bir kullanıcıdan belirtilen rolü alır.",
    category: "moderation",
    usage: "rolal <@kullanıcı veya ID> <@rol veya rol ID>",
    aliases: ["rolal", "role-remove"],
    cooldown: 3,
    permission: PermissionsBitField.Flags.ManageRoles,

    async execute(message, args, client) {
        if (args.length < 2) {
            return message.reply({ embeds: [embeds.error(`Lütfen rolü alınacak kullanıcıyı ve rolü belirtin.\n**Kullanım:** \`${this.usage}\``)] });
        }

        const targetMember = await getTargetMember(message, args);
        if (!targetMember) {
            return message.reply({ embeds: [embeds.error("Bu ID'ye sahip kullanıcı sunucuda bulunamadı.")] });
        }

        const roleId = args[1].match(/\d{17,19}/)?.[0] || args[1];
        const role = message.guild.roles.cache.get(roleId);
        if (!role) {
            return message.reply({ embeds: [embeds.error("Bu ID'ye sahip bir rol bulunamadı.")] });
        }

        const { canAct, reason } = checkModerationAction(client, message.member, targetMember, this.permission);
        if (!canAct) {
            return message.reply({ embeds: [embeds.error(reason)] });
        }

        if (role.position >= message.member.roles.highest.position && message.guild.ownerId !== message.author.id) {
            return message.reply({ embeds: [embeds.error("Kendi rolünüzden daha yüksek veya aynı seviyedeki bir rolü alamazsınız.")] });
        }
        if (role.position >= message.guild.members.me.roles.highest.position) {
            return message.reply({ embeds: [embeds.error("Bu rolü alacak yetkim yok. Lütfen rolümü bu rolün üzerine taşıyın.")] });
        }
        if (role.managed) {
            return message.reply({ embeds: [embeds.error("Bu rol bir entegrasyon tarafından yönetildiği için manuel olarak alınamaz.")] });
        }

        if (!targetMember.roles.cache.has(role.id)) {
            return message.reply({ embeds: [embeds.info(`**${targetMember.user.tag}** kullanıcısı zaten **${role.name}** rolüne sahip değil.`)] });
        }

        try {
            await targetMember.roles.remove(role, `Yetkili: ${message.author.tag}`);

            const successEmbed = embeds.success(`**${targetMember.user.tag}** kullanıcısından **${role.name}** rolü başarıyla alındı.`, "✅ Rol Alındı")
                .addFields(
                    { name: "Yetkili", value: message.author.tag, inline: true },
                    { name: "Kullanıcı", value: targetMember.user.tag, inline: true },
                );

            await message.channel.send({ embeds: [successEmbed] });
        } catch (error) {
            console.error("[HATA] Rol alınırken hata oluştu:", error);
            message.reply({ embeds: [embeds.error("Rolü alırken beklenmedik bir hata oluştu. Yetkilerimi kontrol edin.")] });
        }
    },
};