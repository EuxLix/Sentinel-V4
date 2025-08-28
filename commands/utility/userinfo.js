const { EmbedBuilder, UserFlags } = require('discord.js');
const embeds = require('../../utils/embedhelper');

// Rozetleri emojiye çeviren harita
const flagMap = {
    Staff: '🛠️ Discord Personeli',
    Partner: '🤝 Partner',
    Hypesquad: '🌟 HypeSquad Etkinlikleri',
    BugHunterLevel1: '🐛 Bug Avcısı (Seviye 1)',
    BugHunterLevel2: '🦋 Bug Avcısı (Seviye 2)',
    HypeSquadOnlineHouse1: '🏠 HypeSquad Bravery',
    HypeSquadOnlineHouse2: '🏠 HypeSquad Brilliance',
    HypeSquadOnlineHouse3: '🏠 HypeSquad Balance',
    PremiumEarlySupporter: '💎 Erkenden Nitro Alan',
    VerifiedBot: '✅ Onaylı Bot',
    VerifiedDeveloper: '🔧 Onaylı Geliştirici',
    CertifiedModerator: '🛡️ Sertifikalı Moderatör',
    ActiveDeveloper: '👨‍💻 Aktif Geliştirici',
};

module.exports = {
    name: 'userinfo',
    description: 'Belirtilen kullanıcı veya komutu yazan kişi hakkında detaylı bilgi verir.',
    category: 'utility',
    usage: 'userinfo [@kullanıcı veya ID]',
    cooldown: 10,
    async execute(message, args) {
        let targetMember;

        if (message.mentions.members.first()) {
            targetMember = message.mentions.members.first();
        } else if (args[0]) {
            targetMember = await message.guild.members.fetch(args[0]).catch(() => null);
        } else {
            targetMember = message.member;
        }

        if (!targetMember) {
            return message.reply({ embeds: [embeds.error('Kullanıcı bulunamadı. Lütfen geçerli bir kullanıcıyı etiketle veya ID\'sini gir.')] });
        }

        const user = targetMember.user;
        await user.fetch(true);
        
        const accountCreated = parseInt(user.createdAt.getTime() / 1000);
        const serverJoined = parseInt(targetMember.joinedAt.getTime() / 1000);
        
        // Rozetleri topla
        const userFlags = user.flags.toArray();
        let userBadges = userFlags.length > 0 ? userFlags.map(flag => flagMap[flag]).filter(Boolean) : [];
        if (targetMember.premiumSinceTimestamp) {
            userBadges.unshift('🚀 Sunucu Takviyecisi');
        }
        if (user.avatar?.startsWith('a_') || user.banner) {
            if (!userBadges.includes('🚀 Sunucu Takviyecisi')) {
                 userBadges.unshift('✨ Nitro');
            }
        }
        
        const userRoles = targetMember.roles.cache
            .filter(role => role.id !== message.guild.id)
            .map(role => role.toString())
            .join(', ');

        const statusMap = {
            online: '🟢 Çevrimiçi',
            idle: '🌙 Boşta',
            dnd: '⛔ Rahatsız Etmeyin',
            offline: '⚫ Çevrimdışı',
        };
        const userStatus = statusMap[targetMember.presence?.status] || '⚫ Çevrimdışı';

        // Aktiviteyi formatla
        let activityText = 'Yok';
        const activity = targetMember.presence?.activities[0];
        if (activity) {
            switch (activity.type) {
                case 0: // Playing
                    activityText = `Oynuyor: **${activity.name}**`;
                    break;
                case 1: // Streaming
                    activityText = `Yayın yapıyor: **${activity.name}**`;
                    break;
                case 2: // Listening
                    activityText = `Dinliyor: **${activity.details}** - **${activity.state}**`;
                    break;
                case 3: // Watching
                    activityText = `İzliyor: **${activity.name}**`;
                    break;
                case 4: // Custom
                    activityText = `${activity.emoji || ''} ${activity.state || ''}`;
                    break;
                case 5: // Competing
                    activityText = `Yarışıyor: **${activity.name}**`;
                    break;
            }
        }

        const embed = new EmbedBuilder()
            .setColor(targetMember.displayHexColor === '#000000' ? '#95a5a6' : targetMember.displayHexColor)
            .setAuthor({ name: `${user.username} Kullanıcısının Profili`, iconURL: user.displayAvatarURL() })
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: '👤 İsim & Durum', value: `${user}\n${userStatus}`, inline: true },
                { name: '🎮 Aktivite', value: activityText, inline: true },
                { name: '🆔 ID', value: `\`${user.id}\``, inline: true },
                { name: '📅 Hesap Oluşturulma', value: `<t:${accountCreated}:D>`, inline: true },
                { name: '📥 Sunucuya Katılım', value: `<t:${serverJoined}:D>`, inline: true },
                { name: '🚀 En Yüksek Rol', value: `${targetMember.roles.highest}`, inline: true },
                { name: '🏅 Rozetler', value: userBadges.length > 0 ? userBadges.join('\n') : 'Yok', inline: false },
                { name: `📜 Roller (${targetMember.roles.cache.size - 1})`, value: userRoles.length > 0 ? userRoles.slice(0, 1000) : 'Yok', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Sorgulayan: ${message.author.tag}` });

        if (user.banner) {
            embed.setImage(user.bannerURL({ dynamic: true, size: 512 }));
        }

        await message.channel.send({ embeds: [embed] });
    },
};