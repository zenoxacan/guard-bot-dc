```js
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ActivityType,
    PermissionFlagsBits
} = require('discord.js');

const {
    joinVoiceChannel,
    getVoiceConnection
} = require('@discordjs/voice');

// =====================================================
// AYARLAR
// =====================================================

const PREFIX = '!';

const GUILD_ID = '1549047532108382319';
const VOICE_CHANNEL_ID = '1549047535039938633';

// =====================================================
// CLIENT
// =====================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

// =====================================================
// BELLEK
// =====================================================

const levelXP = new Map();
const levelNum = new Map();

const uyarilar = new Map();
const afkKullanicilar = new Map();

const aktifAdamAsmaca = new Map();
const aktifFastKelime = new Map();

// =====================================================
// FAST KELİME HAVUZU
// =====================================================

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

// =====================================================
// BOT HAZIR
// =====================================================

client.once('ready', async () => {
    console.log('');
    console.log('======================================');
    console.log('          ZEN SHOP BOT');
    console.log('======================================');
    console.log(`✅ Bot: ${client.user.tag}`);
    console.log(`🆔 ID: ${client.user.id}`);
    console.log(`🌐 Sunucu sayısı: ${client.guilds.cache.size}`);
    console.log('======================================');

    client.user.setPresence({
        activities: [
            {
                name: 'Developed By Swoxyn',
                type: ActivityType.Playing
            }
        ],
        status: 'online'
    });

    await sesKanalinaBaglan();
});

// =====================================================
// SES KANALI
// =====================================================

async function sesKanalinaBaglan() {
    try {
        const guild = client.guilds.cache.get(GUILD_ID);

        if (!guild) {
            console.log('⚠️ Ses bağlantısı: Sunucu bulunamadı.');
            return;
        }

        const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);

        if (!channel) {
            console.log('⚠️ Ses bağlantısı: Ses kanalı bulunamadı.');
            return;
        }

        const mevcutBaglanti = getVoiceConnection(GUILD_ID);

        if (mevcutBaglanti) {
            return;
        }

        joinVoiceChannel({
            channelId: VOICE_CHANNEL_ID,
            guildId: GUILD_ID,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
        });

        console.log(`🔊 Ses kanalına bağlandı: ${channel.name}`);
    } catch (error) {
        console.error(
            '❌ Ses kanalına bağlanırken hata:',
            error.message
        );
    }
}

// Bağlantı koparsa tekrar bağlanmayı dene.
setInterval(() => {
    if (client.isReady()) {
        sesKanalinaBaglan();
    }
}, 5 * 60 * 1000);

// =====================================================
// HEDEF KULLANICI BUL
// =====================================================

async function hedefBul(message) {
    if (!message.guild) {
        return null;
    }

    // Etiket
    const mentionedUser = message.mentions.users.first();

    if (mentionedUser) {
        try {
            return await message.guild.members.fetch(
                mentionedUser.id
            );
        } catch {
            return null;
        }
    }

    // Yanıtlanan mesaj
    if (message.reference?.messageId) {
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
        } catch {
            return null;
        }
    }

    return null;
}

// =====================================================
// ROL KONTROLÜ
// =====================================================

function rolKontrol(message, hedef) {
    if (!message.member || !hedef) {
        return false;
    }

    // Sunucu sahibi rol hiyerarşisini geçebilir.
    if (message.author.id === message.guild.ownerId) {
        return true;
    }

    // Hedef aynı veya daha yüksek roldeyse işlem yapılamaz.
    if (
        hedef.roles.highest.position >=
        message.member.roles.highest.position
    ) {
        return false;
    }

    return true;
}

// =====================================================
// KENDİNE İŞLEM KONTROLÜ
// =====================================================

function kendineIslemKontrol(message, hedef) {
    return message.author.id !== hedef.id;
}

// =====================================================
// XP SİSTEMİ
// =====================================================

function xpEkle(message) {
    const userId = message.author.id;

    let xp = levelXP.get(userId) || 0;
    let level = levelNum.get(userId) || 1;

    const kazanilanXP =
        Math.floor(Math.random() * 5) + 3;

    xp += kazanilanXP;

    const gerekenXP = level * 100;

    if (xp >= gerekenXP) {
        level++;

        levelNum.set(userId, level);
        levelXP.set(userId, 0);

        message.channel.send(
            `🎉 **${message.author.username}** seviye atladı!\n` +
            `🚀 Yeni seviye: **${level}**`
        ).catch(() => {});

        return;
    }

    levelXP.set(userId, xp);
    levelNum.set(userId, level);
}

// =====================================================
// AFK
// =====================================================

function afkKontrol(message) {
    const userId = message.author.id;

    // AFK olan kişi mesaj attı.
    if (afkKullanicilar.has(userId)) {
        afkKullanicilar.delete(userId);

        message.reply(
            '👋 Hoş geldin! AFK durumunu kaldırdım.'
        ).catch(() => {});
    }

    // Etiketlenen kişi AFK.
    message.mentions.users.forEach((user) => {
        if (!afkKullanicilar.has(user.id)) {
            return;
        }

        const sebep =
            afkKullanicilar.get(user.id);

        message.channel.send(
            `💤 **${user.username}** şu an AFK!\n` +
            `Sebep: \`${sebep}\``
        ).catch(() => {});
    });
}

// =====================================================
// YARDIM MENÜSÜ
// =====================================================

function yardimMenusu() {
    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setAuthor({
            name: 'Zen Shop Bot Yardım Menüsü',
            iconURL: client.user.displayAvatarURL()
        })
        .setDescription(
            '🏡 **Ana Menü**\n' +
            'Yardım kategorilerini gösterir.\n\n' +

            '👑 **Kullanıcı**\n' +
            'Kullanıcı komutlarını gösterir.\n\n' +

            '🔨 **Yetkili**\n' +
            'Yetkili komutlarını gösterir.'
        );

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId('yardim_menu')
            .setPlaceholder('📋 Bir kategori seçin...')
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
            .addComponents(menu);

    return {
        embeds: [embed],
        components: [row]
    };
}

// =====================================================
// MESAJLAR
// =====================================================

client.on('messageCreate', async (message) => {
    try {
        if (message.author.bot) return;
        if (!message.guild) return;

        // -------------------------------
        // AFK
        // -------------------------------

        afkKontrol(message);

        // -------------------------------
        // NORMAL MESAJ = XP
        // -------------------------------

        if (!message.content.startsWith(PREFIX)) {
            xpEkle(message);
            return;
        }

        // -------------------------------
        // KOMUT
        // -------------------------------

        const args = message.content
            .slice(PREFIX.length)
            .trim()
            .split(/\s+/);

        const command =
            args.shift()?.toLowerCase();

        if (!command) return;

        // =================================================
        // HELP
        // =================================================

        if (
            command === 'help' ||
            command === 'yardım' ||
            command === 'yardim'
        ) {
            return message.channel.send(
                yardimMenusu()
            );
        }

        // =================================================
        // RANK
        // =================================================

        if (
            command === 'rank' ||
            command === 'seviye'
        ) {
            const hedef =
                (await hedefBul(message)) ||
                message.member;

            const user = hedef.user;

            const level =
                levelNum.get(user.id) || 1;

            const xp =
                levelXP.get(user.id) || 0;

            const gerekenXP = level * 100;

            const embed =
                new EmbedBuilder()
                    .setColor('#00ff00')
                    .setAuthor({
                        name:
                            `${user.username} - Seviye Bilgisi`,
                        iconURL:
                            user.displayAvatarURL()
                    })
                    .setDescription(
                        `🚀 **Seviye:** ${level}\n` +
                        `✨ **XP:** ${xp} / ${gerekenXP}`
                    )
                    .setFooter({
                        text:
                            'Mesaj yazarak XP kazanabilirsin!'
                    });

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // AVATAR
        // =================================================

        if (command === 'avatar') {
            const hedef =
                (await hedefBul(message)) ||
                message.member;

            const user = hedef.user;

            const embed =
                new EmbedBuilder()
                    .setColor('#0000ff')
                    .setTitle(
                        `${user.username} Kullanıcısının Avatarı`
                    )
                    .setImage(
                        user.displayAvatarURL({
                            size: 1024
                        })
                    );

            return message.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // BAN
        // =================================================

        if (command === 'ban') {
            if (
                !message.member.permissions.has(
                    PermissionFlagsBits.BanMembers
                )
            ) {
                return message.reply(
                    '❌ `Üyeleri Engelle` yetkin yok.'
                );
            }

            const hedef =
                await hedefBul(message);

            if (!hedef) {
                return message.reply(
                    '❌ Bir kullanıcı etiketle veya mesajını yanıtla.'
                );
            }

            if (!kendineIslemKontrol(message, hedef)) {
                return message.reply(
                    '❌ Kendine işlem uygulayamazsın.'
                );
            }

            if (!rolKontrol(message, hedef)) {
                return message.reply(
                    '❌ Bu üyenin rolü seninle aynı veya senden daha yüksek.'
                );
            }
```
