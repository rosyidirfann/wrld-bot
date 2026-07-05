require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ============================================================
// ✅ KONFIGURASI - Ambil dari file .env
// ============================================================
const BOT_TOKEN        = process.env.BOT_TOKEN;
const CHANNEL_ID_SAMBUT = process.env.CHANNEL_ID_SAMBUT;
const CHANNEL_ID_LOG   = process.env.CHANNEL_ID_LOG;
const CHANNEL_ID_ROLE  = process.env.CHANNEL_ID_ROLE;
const dataRole = {
    role_lk:        { id: '1478393187222683721', grup: 'gender',   nama: 'Laki-laki' },
    role_pr:        { id: '1478392661449904129', grup: 'gender',   nama: 'Perempuan' },
    role_lebih18:   { id: '1508626934505017466', grup: 'umur',     nama: '+18' },
    role_kurang18:  { id: '1508627114281140224', grup: 'umur',     nama: '-18' },
    dom_jakarta:    { id: '1506063872002621460', grup: 'domisili', nama: 'Jakarta' },
    dom_jawa:       { id: '1506063728515354714', grup: 'domisili', nama: 'Jawa' },
    dom_kalimantan: { id: '1506063949353980145', grup: 'domisili', nama: 'Kalimantan' },
    dom_sulawesi:   { id: '1506064001602424913', grup: 'domisili', nama: 'Sulawesi' },
    dom_sumatera:   { id: '1506063827370901656', grup: 'domisili', nama: 'Sumatera' },
    dom_bali:       { id: '1506063916554387517', grup: 'domisili', nama: 'Bali' },
    dom_papua:      { id: '1506064079926853662', grup: 'domisili', nama: 'Papua' }
};

// ============================================================
// ✅ SISTEM AFK DENGAN PENYIMPANAN BERKAS
// ============================================================
const BERKAS_AFK = path.join(__dirname, 'afk_data.json');
let daftarAfk = new Map();

// Muat data saat bot nyala
try {
    if (fs.existsSync(BERKAS_AFK)) {
        const bacaData = fs.readFileSync(BERKAS_AFK, 'utf8');
        daftarAfk = new Map(Object.entries(JSON.parse(bacaData)));
    }
} catch (err) {
    console.log('ℹ️ Data AFK baru dibuat / berkas rusak');
}

// Fungsi simpan otomatis
function simpanAfk() {
    fs.writeFileSync(BERKAS_AFK, JSON.stringify(Object.fromEntries(daftarAfk), null, 2), 'utf8');
}

const daftarUndangan = new Map();

// ============================================================
// ✅ TAMPILAN ROLE
// ============================================================
const embedRole = new EmbedBuilder()
    .setTitle('📋 DAFTAR ROLE WRLD SCIENTIST')
    .setDescription(
        'Pilih kategori di bawah untuk mendapatkan role sesuai data diri kamu.\n\n' +
        '⚠️ **Aturan Penting:**\n' +
        '• Hanya boleh 1 role per kategori.\n' +
        '• Pilih ulang → role lama otomatis terganti.\n' +
        '• Pilih sesuai kenyataan ya!'
    )
    .setColor('#551779')
    .setFooter({ text: 'WRLD SCIENTIST • Sistem Pengaturan Role' });

function buatMenuUtama() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('menu_utama_pilihan')
            .setPlaceholder('📂 Pilih kategori untuk mengatur role')
            .addOptions([
                { label: '👤 Gender',    value: 'kat_gender',   description: 'Atur jenis kelamin kamu' },
                { label: '🎂 Umur',      value: 'kat_umur',     description: 'Atur rentang umur kamu' },
                { label: '📍 Domisili',  value: 'kat_domisili', description: 'Atur tempat tinggal kamu' }
            ])
    );
}

// ============================================================
// ✅ KATA‑KATA MOTIVASI
// ============================================================
const quotes = [
    "Hidup itu seperti bersepeda. Kalau mau menjaga keseimbangan, kamu harus terus bergerak.",
    "Jangan menunggu waktu yang tepat, ciptakanlah waktu yang tepat.",
    "Kesuksesan bukanlah akhir, kegagalan bukanlah bencana: keberanian untuk melanjutkanlah yang terpenting.",
    "Setiap hari adalah kesempatan baru untuk menjadi lebih baik dari kemarin.",
    "Jangan bandingkan perjalananmu dengan orang lain. Bunga tidak mekar secara bersamaan.",
    "Kerja keras akan menggantikan bakat ketika bakat tidak bekerja keras.",
    "Bahagia bukan karena memiliki segalanya, tapi karena mensyukuri apa yang dimiliki.",
    "Mimpi tidak akan menjadi kenyataan lewat sihir, ia butuh keringat, tekad, dan kerja keras.",
    "Hari ini adalah hari terbaik untuk memulai hal baru.",
    "Kegagalan adalah guru terbaik, pelajari pelajarannya dan terus maju.",
    "Jembut kecelup santen menowo luput kulo njaluk ngapunten",
    "Tidak masalah seberapa lambatnya kamu berjalan selama kamu tidak berhenti.",
    "Hiduplah seolah‑olah kamu akan mati besok. Belajarlah seolah‑olah kamu akan hidup selamanya.",
    "Bermimpilah setinggi langit. Jika engkau jatuh, engkau akan jatuh di antara bintang‑bintang.",
    "Kesuksesan adalah hasil dari ketekunan dan tekad yang tak pernah padam."
];

// ============================================================
// ✅ PERINTAH GARIS MIRING / SLASH COMMANDS
// ============================================================
const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Cek apakah bot aktif dan lihat latensinya'),
    new SlashCommandBuilder().setName('info').setDescription('Lihat informasi tentang bot WRLD Scientist'),
    new SlashCommandBuilder().setName('katakataharini').setDescription('Dapat kata‑kata motivasi hari ini'),
    new SlashCommandBuilder().setName('serverinfo').setDescription('Lihat informasi server'),
    new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Lihat informasi pengguna')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Pengguna yang dilihat (kosongkan untuk diri sendiri)')
                .setRequired(false)
        )
].map(cmd => cmd.toJSON());

// ============================================================
// ✅ SAAT BOT SIAP
// ============================================================
let botSudahSiap = false;
client.once('ready', async () => {
    if (botSudahSiap) return;
    botSudahSiap = true;
    console.log(`✅ Bot nyala sebagai: ${client.user.tag}`);
    client.user.setActivity('Tracker • Welcome • AFK', { type: 'LISTENING' });

    // Simpan daftar undangan awal
    client.guilds.cache.forEach(async guild => {
        const undangan = await guild.invites.fetch().catch(() => {});
        if (undangan) daftarUndangan.set(guild.id, new Map(undangan.map(u => [u.code, u.uses])));
    });

    // Kirim pesan pemilihan peran
    const channelRole = client.channels.cache.get(CHANNEL_ID_ROLE);
    if (channelRole) {
        try {
            const pesanLama = await channelRole.messages.fetch({ limit: 20 });
            if (pesanLama.size > 0) await channelRole.bulkDelete(pesanLama, true);
        } catch {}
        await channelRole.send({ embeds: [embedRole], components: [buatMenuUtama()] });
    }

    // Daftarkan perintah ke Discord
    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Semua perintah berhasil didaftarkan');
    } catch (e) {
        console.error('❌ Gagal mendaftarkan perintah:', e);
    }
});

// ============================================================
// ✅ PELACAK UNDANGAN
// ============================================================
client.on('inviteCreate', undangan => {
    const serverId = undangan.guild.id;
    const peta = daftarUndangan.get(serverId) || new Map();
    peta.set(undangan.code, undangan.uses);
    daftarUndangan.set(serverId, peta);
});

// ============================================================
// ✅ SELAMAT DATANG + LOG UNDANGAN
// ============================================================
client.on('guildMemberAdd', async anggota => {
    const server = anggota.guild;
    const channelSambut = server.channels.cache.get(CHANNEL_ID_SAMBUT);
    if (channelSambut) {
        await channelSambut.send(`Heyooo ${anggota}, Selamat Bergabung bersama kami yaa, jangan lupa ambil role disini <#${CHANNEL_ID_ROLE}>.`);
    }

    let pengundang = 'Tidak diketahui / Bot', jumlahUndang = 0;
    try {
        const undanganBaru = await server.invites.fetch();
        const undanganLama = daftarUndangan.get(server.id) || new Map();
        const ketemu = undanganBaru.find(u => undanganLama.get(u.code) !== u.uses);
        if (ketemu) {
            pengundang = ketemu.inviter.tag;
            jumlahUndang = ketemu.uses;
            undanganLama.set(ketemu.code, ketemu.uses);
            daftarUndangan.set(server.id, undanganLama);
        }
    } catch {}

    const pesanEmbed = new EmbedBuilder()
        .setColor('#8323af')
        .setTitle('━━━━━━━━━━ • WRLD || Tracker • ━━━━━━━━━━')
        .setDescription(
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `➤ ➜ Welcome    : ${anggota}\n` +
            `➤ ➜ Invite By  : **${pengundang}**\n` +
            `➤ ➜ Total Invite : **${jumlahUndang}**\n` +
            `➤ ➜ Total Member : **${server.memberCount}**\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
        )
        .setFooter({ text: '━━━━━━━━━━ • WRLD SYSTEM • ━━━━━━━━━━' })
        .setTimestamp();

    const saluranLog = server.channels.cache.get(CHANNEL_ID_LOG) || channelSambut;
    saluranLog?.send({ embeds: [pesanEmbed] });
});

// ============================================================
// ✅ PENGENDALIAN SEMUA INTERAKSI
// ============================================================
client.on('interactionCreate', async interaksi => {
    // Perintah Garis Miring
    if (interaksi.isChatInputCommand()) {
        if (interaksi.commandName === 'ping') {
            const mulai = Date.now();
            await interaksi.reply('🏓 Pinging...');
            await interaksi.editReply(`🏓 **Pong!**\n📶 Bot: **${Date.now() - mulai} ms**\n💓 WebSocket: **${client.ws.ping} ms**`);
        } else if (interaksi.commandName === 'info') {
            await interaksi.reply({ embeds: [new EmbedBuilder()
                .setColor('#551779')
                .setTitle('🤖 Info Bot WRLD Scientist')
                .setThumbnail(client.user.displayAvatarURL())
                .addFields(
                    { name: '📛 Nama', value: client.user.tag, inline: true },
                    { name: '🆔 ID', value: client.user.id, inline: true },
                    { name: '📅 Dibuat', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: '🌐 Server', value: `${client.guilds.cache.size} buah`, inline: true },
                    { name: '👥 Pengguna', value: `${client.users.cache.size} orang`, inline: true },
                    { name: '⚙️ Fitur', value: 'Selamat Datang • Pelacak Undangan • AFK • Menu Peran • Perintah Garis Miring', inline: false }
                )
                .setFooter({ text: 'WRLD SCIENTIST • Sistem' })
                .setTimestamp()
            ]});
        } else if (interaksi.commandName === 'katakataharini') {
            const acak = quotes[Math.floor(Math.random() * quotes.length)];
            await interaksi.reply({ embeds: [new EmbedBuilder().setColor('#8323af').setDescription(`💬 *"${acak}"*`)] });
        } else if (interaksi.commandName === 'serverinfo') {
            const g = interaksi.guild;
            await interaksi.reply({ embeds: [new EmbedBuilder()
                .setColor('#551779')
                .setTitle(`📊 Info Server: ${g.name}`)
                .setThumbnail(g.iconURL({ dynamic: true }))
                .addFields(
                    { name: '🆔 ID', value: g.id, inline: true },
                    { name: '👑 Pemilik', value: `<@${g.ownerId}>`, inline: true },
                    { name: '👥 Anggota', value: `${g.memberCount}`, inline: true },
                    { name: '📅 Dibuat', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: '💬 Saluran', value: `${g.channels.cache.size}`, inline: true },
                    { name: '🎭 Peran', value: `${g.roles.cache.size}`, inline: true }
                )
                .setTimestamp()
            ]});
        } else if (interaksi.commandName === 'userinfo') {
            const sasaran = interaksi.options.getUser('user') || interaksi.user;
            const anggota = interaksi.guild.members.cache.get(sasaran.id);
            await interaksi.reply({ embeds: [new EmbedBuilder()
                .setColor('#8323af')
                .setTitle(`👤 Info: ${sasaran.tag}`)
                .setThumbnail(sasaran.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '🆔 ID', value: sasaran.id, inline: true },
                    { name: '📅 Akun Dibuat', value: `<t:${Math.floor(sasaran.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: '📥 Masuk Server', value: anggota ? `<t:${Math.floor(anggota.joinedTimestamp / 1000)}:R>` : 'Tidak diketahui', inline: true },
                    { name: '🎭 Peran', value: anggota ? anggota.roles.cache.filter(r => r.id !== interaksi.guild.id).map(r => `<@&${r.id}>`).join(', ') || 'Tidak ada' : '‑', inline: false }
                )
                .setTimestamp()
            ]});
        }
        return;
    }

    // Menu Pilihan Peran
    if (interaksi.isStringSelectMenu() && interaksi.channel.id === CHANNEL_ID_ROLE) {
        if (interaksi.customId === 'menu_utama_pilihan') {
            const kat = interaksi.values[0];
            let daftarOpsi = [];
            if (kat === 'kat_gender') daftarOpsi = [
                { label: '👦 Laki‑laki', value: 'role_lk' },
                { label: '👧 Perempuan', value: 'role_pr' }
            ];
            if (kat === 'kat_umur') daftarOpsi = [
                { label: '🔞 +18 Tahun', value: 'role_lebih18' },
                { label: '👶 ‑18 Tahun', value: 'role_kurang18' }
            ];
            if (kat === 'kat_domisili') daftarOpsi = [
                { label: '🏙️ Jakarta',    value: 'dom_jakarta' },
                { label: '🌿 Jawa',        value: 'dom_jawa' },
                { label: '🌲 Kalimantan', value: 'dom_kalimantan' },
                { label: '🌊 Sulawesi',   value: 'dom_sulawesi' },
                { label: '🌋 Sumatera',   value: 'dom_sumatera' },
                { label: '🌺 Bali',        value: 'dom_bali' },
                { label: '🦜 Papua',       value: 'dom_papua' }
            ];

            await interaksi.update({
                content: '👇 Sekarang pilih peran yang sesuai:',
                components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder()
                    .setCustomId('menu_proses_role')
                    .setPlaceholder('✅ Pilih di sini...')
                    .addOptions(daftarOpsi)
                )]
            }).catch(err => console.error(err));
        } else if (interaksi.customId === 'menu_proses_role') {
            const kunci = interaksi.values[0];
            const info = dataRole[kunci];
            if (!info) return interaksi.reply({ content: '❌ Data tidak ditemukan', ephemeral: true });

            try {
                // Hapus peran lama dalam satu kelompok
                for (const k in dataRole) {
                    const r = dataRole[k];
                    if (r.grup === info.grup && interaksi.member.roles.cache.has(r.id)) {
                        await interaksi.member.roles.remove(r.id);
                    }
                }
                await interaksi.member.roles.add(info.id);
                await interaksi.reply({ content: `✅ Berhasil: **${info.nama}**`, ephemeral: true });
                setTimeout(() => interaksi.message.edit({ embeds: [embedRole], components: [buatMenuUtama()] }).catch(() => {}), 3000);
            } catch {
                await interaksi.reply({ content: '❌ Gagal: pastikan posisi peran bot di atas peran tujuan dan izin **Kelola Peran** aktif', ephemeral: true });
            }
        }
    }
});

// ============================================================
// ✅ SISTEM PESAN & AFK YANG SUDAH DIPERBAIKI
// ============================================================
client.on('messageCreate', async pesan => {
    if (pesan.author.bot || !pesan.guild) return;
    const anggota = pesan.guild.members.cache.get(pesan.author.id);
    if (!anggota) return;

    // Perintah AFK
    if (pesan.content.toLowerCase() === 'afk') {
        if (!daftarAfk.has(pesan.author.id)) {
            daftarAfk.set(pesan.author.id, anggota.displayName);
            simpanAfk();
        }
        try {
            await anggota.setNickname(`[AFK] ${daftarAfk.get(pesan.author.id)}`);
            pesan.reply('✅ Status AFK diaktifkan');
        } catch {
            pesan.reply('❌ Gagal ubah nama — cek posisi & izin peran bot');
        }
        return;
    }

    // Keluar dari AFK — berfungsi meski bot nyala ulang
    if (daftarAfk.has(pesan.author.id)) {
        try { await anggota.setNickname(daftarAfk.get(pesan.author.id)); } catch {}
        daftarAfk.delete(pesan.author.id);
        simpanAfk();
        pesan.reply('✅ Selamat kembali! Status AFK selesai');
    }

    // Kata‑kata harian lewat pesan biasa
    if (pesan.content.toLowerCase() === 'kata kata hari ini') {
        pesan.channel.send(quotes[Math.floor(Math.random() * quotes.length)]);
    }
});

client.login(BOT_TOKEN);