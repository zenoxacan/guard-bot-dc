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
// DISCORD CLIENT
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
// AYARLAR
// =====================================================

const PREFIX = '!';

const VOICE_CHANNEL_ID = '1549047535039938633';
const GUILD_ID = '1549047532108382319';

// =====================================================
// BELLEKLER
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
// READY
// =====================================================

client.once('ready', () => {
    console.log('======================================');
    console.log(`${client.user.tag} olarak giriş yapıldı!`);
    console.log(`Bot ID: ${client.user.id}`);
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

    sesKanalinaBaglan();

    // Her 15 dakikada bağlantıyı kontrol et.
    setInterval(() => {
        sesKanalinaBaglan();
    }, 15 * 60 * 1000);
});

// =====================================================
// SES KANALINA BAĞLAN
// =====================================================

function sesKanalinaBaglan() {
    try {
        const guild = client.guilds.cache.get(GUILD_ID);

        if (!guild) {
            console.log('Ses bağlantısı: Sunucu bulunamadı.');
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

        console.log('Ses kanalına bağlanıldı.');
    } catch (error) {
        console.error('Ses kanalına bağlanırken hata oluştu:', error.message);
    }
}

// =====================================================
// HEDEF ÜYE BULMA
// =====================================================

async function hedefBul(message) {
    if (!message.guild) {
        return null;
    }

    // Etiket kontrolü
    const mentionedUser = message.mentions.users.first();

    if (mentionedUser) {
        try {
            return await message.guild.members.fetch(mentionedUser.id);
        } catch {
            return null;
        }
    }

    // Yanıtlanan mesaj kontrolü
    if (message.reference?.messageId) {
        try {
            const replyMessage = await message.channel.messages.fetch(
                message.reference.messageId
            );

            if (replyMessage.author.bot) {
                return null;
            }

            return await message.guild.members.fetch(replyMessage.author.id);
        } catch {
            return null;
        }
    }

    return null;
}

// =====================================================
// ROL HİYERARŞİ KONTROLÜ
// =====================================================

function rolKontrol(message, hedef) {
    if (!message.member || !hedef) {
        return false;
    }

    // Sunucu sahibi herkese işlem yapabilir.
    if (message.author.id === message.guild.ownerId) {
        return true;
    }

    // Bot kendi seviyesindeki / üstündeki üyeye işlem yapamaz.
    if (
        hedef.roles.highest.position >=
        message.member.roles.highest.position
    ) {
        return false;
    }

    return true;
}

// =====================================================
// KENDİNE İŞLEM YAPMA KONTROLÜ
// =====================================================

function kendineIslemKontrol(message, hedef) {
    if (message.author.id === hedef.id) {
        return false;
    }

    return true;
}

// =====================================================
// XP SİSTEMİ
// =====================================================

function xpEkle(message) {
    const userId = message.author.id;

    let xp = levelXP.get(userId) || 0;
    let lvl = levelNum.get(userId) || 1;

    const kazanilanXP = Math.floor(Math.random() * 5) + 3;

    xp += kazanilanXP;

    const gerekenXP = lvl * 100;

    if (xp >= gerekenXP) {
        lvl++;

        levelNum.set(userId, lvl);
        levelXP.set(userId, 0);

        message.channel.send(
            `🎉 **${message.author.username}** seviye atladı!\n` +
            `🚀 Yeni seviye: **${lvl}**`
        );

        return;
    }

    levelXP.set(userId, xp);
    levelNum.set(userId, lvl);
}

// =====================================================
// AFK SİSTEMİ
// =====================================================

function afkKontrol(message) {
    const userId = message.author.id;

    // Kullanıcı mesaj yazdıysa AFK kaldır.
    if (afkKullanicilar.has(userId)) {
        afkKullanicilar.delete(userId);

        message.reply(
            '👋 Hoş geldin! AFK durumunu temizledim.'
        ).catch(() => {});
    }

    // Etiketlenen kullanıcı AFK mı?
    message.mentions.users.forEach((user) => {
        if (!afkKullanicilar.has(user.id)) {
            return;
        }

        const sebep = afkKullanicilar.get(user.id);

        message.channel.send(
            `💤 **${user.username}** şu an AFK!\n` +
            `Sebep: \`${sebep}\``
        );
    });
}

// =====================================================
// HELP EMBED
// =====================================================

function yardimMenusuOlustur() {
    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setAuthor({
            name: 'Zen Shop Bot Yardım Menüsü',
            iconURL: client.user.displayAvatarURL()
        })
        .setDescription(
            '🏡 **Ana Menü**\n' +
            'Kategori panosuna geri dön.\n\n' +

            '👑 **Kullanıcı**\n' +
            'Kullanıcı komutları.\n\n' +

            '🔨 **Yetkili**\n' +
            'Yetkili araçları.'
        );

    const menu = new StringSelectMenuBuilder()
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

    const row = new ActionRowBuilder()
        .addComponents(menu);

    return {
        embeds: [embed],
        components: [row]
    };
}

// =====================================================
// MESAJ SİSTEMİ
// =====================================================

client.on('messageCreate', async (message) => {
    try {
        // Bot mesajlarını yok say.
        if (message.author.bot) {
            return;
        }

        // DM mesajlarını yok say.
        if (!message.guild) {
            return;
        }

        // =============================================
        // AFK
        // =============================================

        afkKontrol(message);

        // =============================================
        // XP
        // =============================================

        if (!message.content.startsWith(PREFIX)) {
            xpEkle(message);
            return;
        }

        // =============================================
        // KOMUT PARÇALAMA
        // =============================================
```
