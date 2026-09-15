const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ActivityType,
    PermissionFlagsBits
} = require('discord.js');

const { joinVoiceChannel } = require('@discordjs/voice');
const express = require('express');

// ==========================================
// DISCORD CLIENT
// ==========================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

// ==========================================
// BELLEKLER
// ==========================================

const levelXP = new Map();
const levelNum = new Map();

const uyarilar = new Map();
const afkKullanicilar = new Map();

const aktifAdamAsmaca = new Map();
const aktifFastKelime = new Map();

const fastKelimeHavuzu = [
    'kanada',
    'vancouver',
    'toronto',
    'ottawa',
    'ekonomi',
    'dolar',
    'akçaağaç',
    'gurbet',
    'yazılım',
    'discord'
];

// ==========================================
// WEB SUNUCUSU
// ==========================================

const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Zen Bot Aktif!');
});

app.listen(PORT, () => {
    console.log('Web sunucusu basariyla baslatildi.');
});

// ==========================================
// HAZIR OLUNCA
// ==========================================

client.once('ready', () => {
    console.log(
        `${client.user.tag} olarak giriş yapıldı!`
    );

    client.user.setPresence({
        activities: [
            {
                name: 'Developed By Swoxyn',
                type: ActivityType.Playing
            }
        ],
        status: 'online'
    });

    const channelId = '1549047535039938633';
    const guildId = '1549047532108382319';

    const connectToVoice = () => {
        try {
            const guild = client.guilds.cache.get(guildId);

            if (!guild) {
                console.log('Sunucu bulunamadı.');
                return;
            }

            joinVoiceChannel({
                channelId: channelId,
                guildId: guildId,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: true,
                selfMute: true
            });
        } catch (error) {
            console.log('Ses kanalına bağlanılamadı.');
        }
    };

    connectToVoice();

    setInterval(() => {
        connectToVoice();
    }, 15 * 60 * 1000);
});

// ==========================================
// HEDEF BULMA FONKSİYONU
// ETİKET VEYA REPLY
// ==========================================

async function hedefBul(message) {
    if (!message.guild) return null;

    const mentionedUser =
        message.mentions.users.first();

    if (mentionedUser) {
        try {
            return await message.guild.members.fetch(
                mentionedUser.id
            );
        } catch (error) {
            return null;
        }
    }

    if (
        message.reference &&
        message.reference.messageId
    ) {
        try {
            const replyMessage =
                await message.channel.messages.fetch(
                    message.reference.messageId
                );

            if (replyMessage.author.bot) {
                return null;
            }

            return await message.guild.members.fetch(
                replyMessage.author.id
            );
        } catch (error) {
            return null;
        }
    }

    return null;
}

// ==========================================
// ROL KONTROLÜ
// ==========================================

function rolKontrol(message, hedef) {
    if (!message.member) return false;

    if (message.author.id === message.guild.ownerId) {
        return true;
    }

    if (
        hedef.roles.highest.position >=
        message.member.roles.highest.position
    ) {
        return false;
    }

    return true;
}

// ==========================================
// MESAJ SİSTEMİ
// ==========================================

client.on(
    'messageCreate',
    async (message) => {

        if (message.author.bot) return;

        if (!message.guild) return;

        const userId =
            message.author.id;

        // ==========================================
        // AFK KONTROL
        // ==========================================

        if (
            afkKullanicilar.has(userId)
        ) {
            afkKullanicilar.delete(userId);

            message.reply(
                '👋 Hoş geldin! AFK durumunu temizledim.'
            );
        }

        message.mentions.users.forEach(
            (user) => {

                if (
                    afkKullanicilar.has(user.id)
                ) {
                    const sebep =
                        afkKullanicilar.get(user.id);

                    message.channel.send(
                        '💤 **' +
                        user.username +
                        '** şu an AFK!\nSebep: `' +
                        sebep +
                        '`'
                    );
                }

            }
        );

        // ==========================================
        // SEVİYE SİSTEMİ
        // ==========================================

        if (
            !message.content.startsWith('!')
        ) {
            let xp =
                levelXP.get(userId) || 0;

            xp +=
                Math.floor(
                    Math.random() * 5
                ) + 3;

            levelXP.set(
                userId,
                xp
            );

            let lvl =
                levelNum.get(userId) || 1;

            if (
                xp >= lvl * 100
            ) {
                lvl += 1;

                levelNum.set(
                    userId,
                    lvl
                );

                levelXP.set(
                    userId,
                    0
                );

                message.channel.send(
                    '🎉 **' +
                    message.author.username +
                    '** Seviye atladı!\n🚀 Yeni seviye: **' +
                    lvl +
                    '**'
                );
            }
        }

        // ==========================================
        // KOMUT KONTROL
        // ==========================================

        if (
            !message.content.startsWith('!')
        ) {
            return;
        }

        const args =
            message.content
                .slice(1)
                .trim()
                .split(/\s+/);

        const command =
            args
                .shift()
                .toLowerCase();

        // ==========================================
        // HELP
        // ==========================================

        if (
            command === 'help' ||
            command === 'yardım'
        ) {
            const anaEmbed =
                new EmbedBuilder()
                    .setColor('#ff0000')
                    .setAuthor({
                        name: 'Zen Shop Bot Yardım Menüsü',
                        iconURL:
                            client.user.displayAvatarURL()
                    })
                    .setDescription(
                        '🏡 **Ana Menü**\nKategori panosuna geri dön\n\n' +
                        '👑 **Kullanıcı**\nKullanıcı bilgileri\n\n' +
                        '🔨 **Yetkili**\nYetkili araçları'
                    );

            const menu =
                new StringSelectMenuBuilder()
                    .setCustomId(
                        'yardim_menu'
                    )
                    .setPlaceholder(
                        '📋 Bir kategori seçin...'
                    )
                    .addOptions([
                        {
                            label: 'Ana Menü',
                            value: 'ana_menu',
                            emoji: '🏡'
                        },
                        {
                            label: 'Kullanıcı',
                            value: 'kullanici',
                            emoji: '👑'
                        },
                        {
                            label: 'Yetkili',
                            value: 'yetkili',
                            emoji: '🔨'
                        }
                    ]);

            const row =
                new ActionRowBuilder()
                    .addComponents(
                        menu
                    );

            return message.reply({
                embeds: [
                    anaEmbed
                ],
                components: [
                    row
                ]
            });
        }


        // ==========================================
        // SHIP
        // ==========================================

        if (
            command === 'ship'
        ) {
            const oran =
                Math.floor(
                    Math.random() * 100
                ) + 1;

            return message.reply(
                '❤️ Aşk oranı: **%' +
                oran +
                '**'
            );
        }

        // ==========================================
        // RANK
        // ==========================================

        if (
            command === 'rank'
        ) {
            const level =
                levelNum.get(userId) || 1;

            const xp =
                levelXP.get(userId) || 0;

            return message.reply(
                '📊 Seviye: **' +
                level +
                '**\n✨ XP: **' +
                xp +
                '**'
            );
        }

        // ==========================================
        // AVATAR
        // ==========================================

        if (
            command === 'avatar'
        ) {
            const hedef =
                message.mentions.users.first() ||
                message.author;

            return message.reply(
                hedef.displayAvatarURL({
                    size: 1024
                })
            );
        }
        // ==========================================
        // TEMİZLE
        // ==========================================

        if (
            command === 'temizle'
        ) {
            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.ManageMessages
                )
            ) {
                return message.reply(
                    '❌ Yetkin yok!'
                );
            }

            const miktar =
                parseInt(args[0]);

            if (
                !miktar ||
                miktar < 1 ||
                miktar > 100
            ) {
                return message.reply(
                    '⚠️ 1 ile 100 arasında sayı gir.'
                );
            }

            try {
                await message.channel.bulkDelete(
                    miktar,
                    true
                );

                const bilgi =
                    await message.channel.send(
                        '🧹 **' +
                        miktar +
                        '** mesaj silindi.'
                    );

                setTimeout(() => {
                    bilgi
                        .delete()
                        .catch(() => {});
                }, 3000);

            } catch (error) {
                return message.reply(
                    '❌ Mesajlar silinemedi.'
                );
            }

            return;
        }

        // ==========================================
        // MUTE / SUSTUR
        // ETİKET VEYA REPLY
        // ==========================================

        if (
            command === 'sustur' ||
            command === 'mute'
        ) {
            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.ModerateMembers
                )
            ) {
                return message.reply(
                    '❌ Yetkin yok!'
                );
            }

            const hedef =
                await hedefBul(
                    message
                );

            let sure;

            if (
                message.mentions.users.first()
            ) {
                sure =
                    parseInt(args[1]);
            } else {
                sure =
                    parseInt(args[0]);
            }

            if (
                !hedef ||
                !sure ||
                sure < 1
            ) {
                return message.reply(
                    '⚠️ Kullanım:\n`!sustur @üye 10`\nveya\nBir mesaja reply atıp `!sustur 10`'
                );
            }

            if (
                hedef.id ===
                message.author.id
            ) {
                return message.reply(
                    '❌ Kendini susturamazsın.'
                );
            }

            if (
                !rolKontrol(
                    message,
                    hedef
                )
            ) {
                return message.reply(
                    '❌ Yetkin yok yarram.'
                );
            }

            if (
                !hedef.moderatable
            ) {
                return message.reply(
                    '❌ Botun rolü bu kullanıcıya yetmiyor.'
                );
            }

            try {
                await hedef.timeout(
                    sure * 60 * 1000
                );

                return message.reply(
                    '🔇 **' +
                    hedef.user.username +
                    '** adlı üye **' +
                    sure +
                    ' dakika** susturuldu.'
                );

            } catch (error) {
                return message.reply(
                    '❌ Üye susturulamadı.'
                );
            }
        }

        // ==========================================
        // UNMUTE
        // ETİKET VEYA REPLY
        // ==========================================

        if (
            command === 'unmute' ||
            command === 'susturmaac'
        ) {
            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.ModerateMembers
                )
            ) {
                return message.reply(
                    '❌ Yetkin yok!'
                );
            }

            const hedef =
                await hedefBul(
                    message
                );

            if (
                !hedef
            ) {
                return message.reply(
                    '⚠️ Bir üyeyi etiketle veya mesajına reply at.'
                );
            }

            if (
                hedef.id ===
                message.author.id
            ) {
                return message.reply(
                    '❌ Kendine bunu yapamazsın.'
                );
            }

            if (
                !rolKontrol(
                    message,
                    hedef
                )
            ) {
                return message.reply(
                    '❌ Yetkin yok yarram.'
                );
            }

            if (
                !hedef.moderatable
            ) {
                return message.reply(
                    '❌ Botun rolü bu kullanıcıya yetmiyor.'
                );
            }

            try {
                await hedef.timeout(
                    null
                );

                return message.reply(
                    '🔊 **' +
                    hedef.user.username +
                    '** adlı üyenin susturması kaldırıldı.'
                );

            } catch (error) {
                return message.reply(
                    '❌ Susturma kaldırılamadı.'
                );
            }
        }

        // ==========================================
        // BAN
        // ETİKET VEYA REPLY
        // ==========================================

        if (
            command === 'ban'
        ) {
            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.BanMembers
                )
            ) {
                return message.reply(
                    'Yetkin yok noob'
                );
            }

            const hedef =
                await hedefBul(
                    message
                );

            if (
                !hedef
            ) {
                return message.reply(
                    'Kişiyi etiketle veya mesajına reply at.'
                );
            }

            if (
                hedef.id ===
                message.author.id
            ) {
                return message.reply(
                    '❌ Kendini banlayamazsın.'
                );
            }

            if (
                !rolKontrol(
                    message,
                    hedef
                )
            ) {
                return message.reply(
                    '❌ Yetkin yok yarram.'
                );
            }

            if (
                !hedef.bannable
            ) {
                return message.reply(
                    '❌ Botun rolü bu kullanıcıyı banlamaya yetmiyor.'
                );
            }

            let sebep;

            if (
                message.mentions.users.first()
            ) {
                sebep =
                    args.slice(1).join(' ') ||
                    'Sebep belirtilmedi.';
            } else {
                sebep =
                    args.join(' ') ||
                    'Sebep belirtilmedi.';
            }

            try {
                const username =
                    hedef.user.username;

                await hedef.ban({
                    reason: sebep
                });

                return message.channel.send(
                    '🔨 **' +
                    username +
                    '** sunucudan yasaklandı.\n📝 Sebep: `' +
                    sebep +
                    '`'
                );

            } catch (error) {
                return message.reply(
                    '❌ Üye banlanamadı.'
                );
            }
        }

        // ==========================================
        // UNBAN
        // ==========================================

        if (
            command === 'unban'
        ) {
            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.BanMembers
                )
            ) {
                return message.reply(
                    '❌ Yetkin yok!'
                );
            }

            const userId =
                args[0];

            if (
                !userId
            ) {
                return message.reply(
                    '⚠️ Kullanım: `!unban KullanıcıID`'
                );
            }

            try {
                const ban =
                    await message.guild.bans.fetch(
                        userId
                    );

                await message.guild.members.unban(
                    userId,
                    'Yasağı kaldırıldı.'
                );

                return message.reply(
                    '🔓 **' +
                    ban.user.username +
                    '** adlı kullanıcının yasağı kaldırıldı.'
                );

            } catch (error) {
                return message.reply(
                    '❌ Kullanıcı bulunamadı veya banlı değil.'
                );
            }
        }

        // ==========================================
        // UYARI
        // ETİKET VEYA REPLY
        // ==========================================

        if (
            command === 'uyarı' ||
            command === 'uyar'
        ) {
            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.KickMembers
                )
            ) {
                return message.reply(
                    '❌ Yetkin yok!'
                );
            }

            const hedef =
                await hedefBul(
                    message
                );

            if (
                !hedef
            ) {
                return message.reply(
                    '⚠️ Bir üyeyi etiketle veya mesajına reply at.'
                );
            }

            if (
                !rolKontrol(
                    message,
                    hedef
                )
            ) {
                return message.reply(
                    '❌ Yetkin yok yarram.'
                );
            }

            let currentUyar =
                uyarilar.get(
                    hedef.id
                ) || 0;

            currentUyar += 1;

            uyarilar.set(
                hedef.id,
                currentUyar
            );

            if (
                currentUyar >= 3
            ) {
                uyarilar.set(
                    hedef.id,
                    0
                );

                if (
                    hedef.moderatable
                ) {
                    try {
                        await hedef.timeout(
                            15 * 60 * 1000
                        );

                        return message.channel.send(
                            '🚨 **' +
                            hedef.user.username +
                            '** 3 uyarıya ulaştığı için **15 dakika susturuldu!**'
                        );

                    } catch (error) {}
                }
            }

            return message.reply(
                '⚠️ **' +
                hedef.user.username +
                '** uyarıldı. (**' +
                currentUyar +
                '/3**)'
            );
        }

    }
);

// ==========================================
// YARDIM MENÜSÜ INTERACTION
// ==========================================

client.on(
    'interactionCreate',
    async (interaction) => {

        if (
            !interaction.isStringSelectMenu()
        ) {
            return;
        }

        if (
            interaction.customId !==
            'yardim_menu'
        ) {
            return;
        }

        const secilen =
            interaction.values[0];

        const embed =
            new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({
                    name: 'Zen Shop Bot Yardım Menüsü',
                    iconURL:
                        client.user.displayAvatarURL()
                });

        if (
            secilen === 'ana_menu'
        ) {
            embed.setDescription(
                '🏡 **Ana Menü**\nKategori panosuna geri dön\n\n' +
                '👑 **Kullanıcı**\nKullanıcı bilgileri\n\n' +
                '🔨 **Yetkili**\nYetkili araçları'
            );
        }

        if (
            secilen === 'kullanici'
        ) {
            embed
                .setTitle(
                    '👑 Kullanıcı Komutları'
                )
                .setDescription(
                    '`!rank` - Seviye ve XP.\n' +
                    '`!avatar [@üye]` - Avatar gösterir.\n' +
                    '`!sunucubilgi` - Sunucu bilgileri.'
                );
        }

        if (
            secilen === 'yetkili'
        ) {
            embed
                .setTitle(
                    '🔨 Yetkili Komutları'
                )
                .setDescription(
                    '`!temizle <miktar>` - Mesaj siler.\n\n' +
                    '`!sustur @üye <dakika>` - Üyeyi susturur.\n' +
                    'Reply ile: `!sustur <dakika>`\n\n' +
                    '`!unmute @üye` - Susturmayı kaldırır.\n' +
                    'Reply ile: `!unmute`\n\n' +
                    '`!ban @üye <sebep>` - Üyeyi banlar.\n' +
                    'Reply ile: `!ban <sebep>`\n\n' +
                    '`!unban <KullanıcıID>` - Ban kaldırır.\n\n' +
                    '`!uyarı @üye` - Uyarı verir.'
                );
        }

        await interaction.update({
            embeds: [
                embed
            ]
        });

    }
);

// ==========================================
// BOT LOGIN
// ==========================================

client.login(
    process.env.TOKEN
);
