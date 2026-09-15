```
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
    'kanada', 'vancouver', 'toronto', 'ottawa', 'ekonomi', 
    'dolar', 'akçaağaç', 'gurbet', 'yazılım', 'discord'
];

// ==========================================
// HAZIR OLUNCA
// ==========================================

client.once('ready', () => {
    console.log(`${client.user.tag} olarak giriş yapıldı!`);

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
// ==========================================

async function hedefBul(message) {
    if (!message.guild) return null;
    const mentionedUser = message.mentions.users.first();

    if (mentionedUser) {
        try {
            return await message.guild.members.fetch(mentionedUser.id);
        } catch (error) {
            return null;
        }
    }

    if (message.reference && message.reference.messageId) {
        try {
            const replyMessage = await message.channel.messages.fetch(message.reference.messageId);
            if (replyMessage.author.bot) return null;
            return await message.guild.members.fetch(replyMessage.author.id);
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
    if (message.author.id === message.guild.ownerId) return true;
    if (hedef.roles.highest.position >= message.member.roles.highest.position) return false;
    return true;
}

// ==========================================
// MESAJ SİSTEMİ
// ==========================================

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const userId = message.author.id;

    // AFK KONTROL
    if (afkKullanicilar.has(userId)) {
        afkKullanicilar.delete(userId);
        message.reply('👋 Hoş geldin! AFK durumunu temizledim.');
    }

    message.mentions.users.forEach((user) => {
        if (afkKullanicilar.has(user.id)) {
            const sebep = afkKullanicilar.get(user.id);
            message.channel.send(`💤 **${user.username}** şu an AFK!\nSebep: \`${sebep}\``);
        }
    });

    // SEVİYE SİSTEMİ
    if (!message.content.startsWith('!')) {
        let xp = levelXP.get(userId) || 0;
        xp += Math.floor(Math.random() * 5) + 3;
        levelXP.set(userId, xp);

        let lvl = levelNum.get(userId) || 1;
        if (xp >= lvl * 100) {
            lvl += 1;
            levelNum.set(userId, lvl);
            levelXP.set(userId, 0);
            message.channel.send(`🎉 **${message.author.username}** Seviye atladı!\n🚀 Yeni seviye: **${lvl}**`);
        }
    }

    // KOMUT KONTROLÜ
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    // HELP / YARDIM KOMUTU
    if (command === 'help' || command === 'yardım') {
        const anaEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setAuthor({
                name: 'Zen Shop Bot Yardım Menüsü',
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription(
                '🏡 **Ana Menü**\nKategori panosuna geri dön\n\n' +
                '👑 **Kullanıcı**\nKullanıcı bilgileri\n\n' +
                '🔨 **Yetkili**\nYetkili araçları'
            );

        const menu = new StringSelectMenuBuilder()
            .setCustomId('yardim_menu')
            .setPlaceholder('📋 Bir kategori seçin...')
            .addOptions([
                { label: 'Ana Menü', value: 'ana_menu', emoji: '🏡' },
                { label: 'Kullanıcı', value: 'kullanici', emoji: '👑' },
                { label: 'Yetkili', value: 'yetkili', emoji: '🔨' }
            ]);

        const row = new ActionRowBuilder().addComponents(menu);
        message.channel.send({ embeds: [anaEmbed], components: [row] });
    }

    // RANK KOMUTU
    if (command === 'rank' || command === 'seviye') {
        const targetMember = (await hedefBul(message)) || message.member;
        const targetUser = targetMember.user;
        
        const lvl = levelNum.get(targetUser.id) || 1;
        const xp = levelXP.get(targetUser.id) || 0;
        const gerekenXp = lvl * 100;

        const rankEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setAuthor({ name: `${targetUser.username} - Seviye Bilgisi`, iconURL: targetUser.displayAvatarURL() })
            .setDescription(`🚀 **Seviye:** ${lvl}\n✨ **XP:** ${xp} / ${gerekenXp}`)
            .setFooter({ text: 'Mesaj yazarak XP kazanabilirsin!' });

        message.reply({ embeds: [rankEmbed] });
    }

    // AVATAR KOMUTU
    if (command === 'avatar') {
        const targetMember = (await hedefBul(message)) || message.member;
        const targetUser = targetMember.user;

        const avatarEmbed = new EmbedBuilder()
            .setColor('#0000ff')
            .setTitle(`${targetUser.username} Kullanıcısının Avatarı`)
            .setImage(targetUser.displayAvatarURL({ dynamic: true, size: 1024 }));

        message.reply({ embeds: [avatarEmbed] });
    }

    // ==========================================
    // YETKİLİ KOMUTLARI
    // ==========================================

    // !BAN
    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ Bu komutu kullanmak için `Üyeleri Engelle` yetkin olmalı.');
        }
        const hedefKullanici = await hedefBul(message);
        if (!hedefKullanici) return message.reply('❌ Lütfen bir üyeyi etiketleyin veya mesajını yanıtlayın.');
        if (!rolKontrol(message, hedefKullanici)) return message.reply('❌ Bu üyenin rolü seninle aynı veya senden daha yüksek!');
        if (!hedefKullanici.bannable) return message.reply('❌ Bu üyeyi engellemek için yetkim yetmiyor.');

        const sebep = args.join(' ') || 'Sebep belirtilmedi.';
        await hedefKullanici.ban({ reason: sebep });
        message.channel.send(`🔨 **${hedefKullanici.user.username}** başarıyla sunucudan yasaklandı. Sebep: \`${sebep}\``);
    }

    // !UNBAN
    if (command === 'unban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ Bu komutu kullanmak için `Üyeleri Engelle` yetkin olmalı.');
        }
        const id = args[0];
        if (!id) return message.reply('❌ Lütfen yasağını kaldırmak istediğiniz kullanıcının ID\'sini yazın.');

        try {
            await message.guild.members.unban(id);
            message.channel.send(`✅ ID'si belirtilen kullanıcının yasaklaması başarıyla kaldırıldı.`);
        } catch (error) {
            message.reply('❌ Bu ID\'ye sahip bir yasaklama bulunamadı veya bir hata oluştu.');
        }
    }

    // !MUTE
    if (command === 'mute') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ Bu komutu kullanmak için `Üyeleri Sustur` yetkin olmalı.');
        }
        const hedefKullanici = await hedefBul(message);
        if (!hedefKullanici) return message.reply('❌ Lütfen bir üyeyi etiketleyin veya mesajını yanıtlayın.');
        if (!rolKontrol(message, hedefKullanici)) return message.reply('❌ Bu üyenin rolü seninle aynı veya senden daha yüksek!');
        
        try {
            await hedefKullanici.timeout(60 * 60 * 1000, 'Yetkili tarafından susturuldu.');
            message.channel.send(`🔇 **${hedefKullanici.user.username}** 1 saatliğine susturuldu.`);
        } catch (error) {
            message.reply('❌ Kullanıcı susturulurken bir hata oluştu.');
        }
    }

    // !UNMUTE
    if (command === 'unmute') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ Bu komutu kullanmak için `Üyeleri Sustur` yetkin olmalı.');
        }
        const hedefKullanici = await hedefBul(message);
        if (!hedefKullanici) return message.reply('❌ Lütfen bir üyeyi etiketleyin veya mesajını yanıtlayın.');

```

Kodu dikkatli kullanın.

svg

try {
await hedefKullanici.timeout(null);
message.channel.send(`🔊 **${hedefKullanici.user.username}** kullanıcısının susturulması kaldırıldı.`);
} catch (error) {
message.reply('❌ Kullanıcının susturulması kaldırılırken bir hata oluştu.');
}
}
});

// ==========================================
// MENÜ SEÇİMLERİNİ DİNLEME SİSTEMİ (DÜZELTİLEN YER)
// ==========================================
client.on('interactionCreate', async (interaction) => {
if (!interaction.isStringSelectMenu()) return;

if (interaction.customId === 'yardim\_menu') {
// Liste yapısı düzeltildi [0] eklendi
const secim = interaction.values[0];

const guncelEmbed = new EmbedBuilder().setColor('#ff0000');

if (secim === 'ana\_menu') {
guncelEmbed
.setTitle('🏡 Ana Menü')
.setDescription('**!yardım** - Yardım menüsünü açar.\n\*\*!rank\*\* - Seviyenizi gösterir.\n\*\*!avatar\*\* - Profil resminizi gösterir.');
} else if (secim === 'kullanici') {
guncelEmbed
.setTitle('👑 Kullanıcı Komutları')
.setDescription('**!rank** - Seviye durumunuzu listeler.\n\*\*!avatar\*\* - Resminizi büyütür.');
} else if (secim === 'yetkili') {
guncelEmbed
.setTitle('🔨 Yetkili Komutları')
.setDescription('**!ban** - Üyeyi yasaklar.\n\*\*!unban\*\* - Üyenin yasağını kaldırır (ID ile).\n\*\*!mute\*\* - Üyeyi 1 saat susturur.\n\*\*!unmute\*\* - Üyenin susturmasını kaldırır.');
}

await interaction.update({ embeds: [guncelEmbed] });
}
});

// ==========================================
// BOT GİRİŞİ
// ==========================================
client.login(process.env.TOKEN);

```
```
