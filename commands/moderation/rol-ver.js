// Dosya Yolu: commands/moderation/rol-ver.js
const { PermissionsBitField } = require("discord.js");
const embeds = require("../../utils/embedhelper");
const { getTargetMember, checkModerationAction } = require("../../utils/moderationHelper");

module.exports = {
    name: "rolver",
    description: "Bir kullanıcıya belirtilen rolü verir.",
    category: "moderation",
    usage: "rolver <@kullanıcı veya ID> <@rol veya rol ID>",
    aliases: ["rolver", "addrole"],
    cooldown: 3,
    permission: PermissionsBitField.Flags.ManageRoles,

    async execute(message, args, client) {
        if (args.length < 2) {
            return message.reply({ embeds: [embeds.error(`Lütfen rol verilecek kullanıcıyı ve rolü belirtin.\n**Kullanım:** \`${this.usage}\``)] });
        }

        const targetMember = await getTargetMember(message, args);
        if (!targetMember) {
            return message.reply({ embeds: [embeds.error("Bu ID'ye sahip kullanıcı sunucuda bulunamadı.")] });
        }

        const roleId = args[1].match(/\d{17,19}/)?.[0] || args[1];
        const roleToGive = message.guild.roles.cache.get(roleId);
        if (!roleToGive) {
            return message.reply({ embeds: [embeds.error("Bu ID'ye sahip bir rol bulunamadı.")] });
        }

        const { canAct, reason } = checkModerationAction(client, message.member, targetMember, this.permission);
        if (!canAct) {
            return message.reply({ embeds: [embeds.error(reason)] });
        }

        if (roleToGive.position >= message.member.roles.highest.position && message.guild.ownerId !== message.author.id) {
            return message.reply({ embeds: [embeds.error("Kendi rolünüzden daha yüksek veya aynı seviyedeki bir rolü veremezsiniz.")] });
        }
        if (roleToGive.position >= message.guild.members.me.roles.highest.position) {
            return message.reply({ embeds: [embeds.error("Bu rolü verecek yetkim yok. Lütfen rolümü bu rolün üzerine taşıyın.")] });
        }
        if (roleToGive.managed) {
            return message.reply({ embeds: [embeds.error("Bu rol bir entegrasyon tarafından yönetildiği için manuel olarak verilemez.")] });
        }

        if (targetMember.roles.cache.has(roleToGive.id)) {
            return message.reply({ embeds: [embeds.info(`**${targetMember.user.tag}** kullanıcısı zaten **${roleToGive.name}** rolüne sahip.`)] });
        }

        try {
            await targetMember.roles.add(roleToGive, `Yetkili: ${message.author.tag}`);

            const successEmbed = embeds.success(`**${targetMember.user.tag}** kullanıcısına **${roleToGive.name}** rolü başarıyla verildi.`, "✅ Rol Verildi")
                .addFields(
                    { name: "Yetkili", value: message.author.tag, inline: true },
                    { name: "Kullanıcı", value: targetMember.user.tag, inline: true },
                );

            await message.channel.send({ embeds: [successEmbed] });
        } catch (error) {
            console.error("[HATA] Rol verilirken hata oluştu:", error);
            message.reply({ embeds: [embeds.error("Rolü verirken beklenmedik bir hata oluştu. Yetkilerimi kontrol edin.")] });
        }
    },
};