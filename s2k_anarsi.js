const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;
const http = require('http');
const { SocksProxyAgent } = require('socks-proxy-agent');

console.log("=== S2K_BOT: BUNGEECORD/VELOCITY GECIS MODU BASLATILIYOR ===");

// Global Hata Yakalayıcı: Geçiş sırasındaki ani kopmalarda Railway'in çökmesini önler
process.on('uncaughtException', (err) => {
  console.log(`[Sunucu Geçiş Hatası Engellendi] ${err.message}`);
});

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('s2k_bot Sorunsuz Aktif!\n');
});
server.listen(process.env.PORT || 3000);

const AYARLAR = {
  host: 'mc.quiltanarchy.xyz',
  version: '1.21.1',
  username: 's2k_bot'
};

const PROXY_LISTESI = [
  "socks5://192.252.210.233:4145",
  "socks5://67.71.242.118:1080",
  "socks5://178.17.171.222:1080",
  "socks5://109.71.245.79:1080",
  "socks5://146.0.77.29:3000",
  "socks5://94.131.95.82:1080"
];

let aktifProxyIndex = 0;
let ayniIpDenemeSayisi = 0; 
const klanListesi = new Set(['umut', 'umutedfg2']); 
let bot = null;
let takipEdilenOyuncu = null;
let lobiGirisYapildi = false;

function botuBaslat() {
  if (bot) {
    try { bot.end(); } catch(e) {}
    bot = null;
  }
  
  lobiGirisYapildi = false; // Her yeni bağlantıda sıfırla
  const gecerliProxy = PROXY_LISTESI[aktifProxyIndex];
  console.log(`>>> [Bağlantı] ${AYARLAR.username} -> Proxy: ${aktifProxyIndex + 1}/${PROXY_LISTESI.length}`);

  bot = mineflayer.createBot({
    host: AYARLAR.host,
    username: AYARLAR.username,
    version: AYARLAR.version,
    checkTimeoutInterval: 240000, // Sunucu geçişindeki (Configuration) donmaları önlemek için süre 4 dakikaya çıkarıldı
    physicsEnabled: true,
    agent: new SocksProxyAgent(gecerliProxy)
  });

  bot.loadPlugin(pathfinder);

  bot.on('login', () => {
    console.log(`>>> LOBİ BAĞLANTISI: Bot giriş kapısına ulaştı.`);
    ayniIpDenemeSayisi = 0; 
  });

  // Bot lobide ilk doğduğunda tetiklenir
  bot.on('spawn', () => {
    // Eğer zaten şifre yazdıysak ve sunucu bizi aktarıyorsa, tekrar şifre yazıp paketi bozma!
    if (lobiGirisYapildi) {
      console.log(">>> [Aktarım/Configuration] Bot şu an anarşi dünyasına taşınıyor, komut engellendi.");
      return;
    }

    console.log(`>>> Lobi dünyası yüklendi. Güvenli geçiş için 3 saniye sonra TEK SEFERLİK şifre giriliyor...`);
    
    setTimeout(() => {
      if (bot && bot._client && bot._client.state === 'play' && !lobiGirisYapildi) {
        lobiGirisYapildi = true; // Şifrenin sadece 1 kere gitmesini garantiye alıyoruz
        console.log("-> Lobi doğrulama şifresi sunucuya gönderildi. Aktarım bekleniyor...");
        bot.chat('/register s2k_bot123 s2k_bot123'); 
        bot.chat('/login s2k_bot123');
      }
    }, 3000);
  });

  // Bot Lobi'den başarıyla sıyrılıp ana Anarşi dünyasına ayak bastığında bu event tetiklenir
  bot.on('game', () => {
    if (lobiGirisYapildi) {
      console.log("=================================================");
      console.log(">>> BAŞARI: ANA ANARŞİ DÜNYASINA SIZMA SAĞLANDI! <<<");
      console.log("=================================================");
    }
  });

  // KOMUTLAR (Klan, TPA, Takip)
  bot.on('chat', (username, message) => {
    if (!bot || username === bot.username) return;
    const mesaj = message.trim().toLowerCase();

    if (mesaj.includes('tpa')) {
      if (klanListesi.has(username)) bot.chat(`/tpaccept ${username}`);
      else bot.chat(`/tpdeny ${username}`);
    }

    if (klanListesi.has(username)) {
      if (mesaj === 'takip et') {
        const target = bot.players[username]?.entity;
        if (target) {
          takipEdilenOyuncu = username;
          bot.chat('Takip basladi.');
          bot.pathfinder.setGoal(new GoalFollow(target, 2), true);
        }
      }
      if (mesaj === 'dur') {
        takipEdilenOyuncu = null;
        bot.pathfinder.setGoal(null);
        bot.chat('Durdum.');
      }
      if (mesaj.startsWith('klan ekle ')) {
        const eklenecek = message.split(' ')[2];
        if (eklenecek) klanListesi.add(eklenecek);
      }
      if (mesaj.startsWith('klan sil ')) {
        const silinecek = message.split(' ')[2];
        if (silinecek && silinecek !== 'umut' && silinecek !== 'umutedfg2') klanListesi.delete(silinecek);
      }
      if (mesaj.startsWith('tpa at ')) {
        const hedef = message.split(' ')[2];
        if (hedef) bot.chat(`/tpa ${hedef}`);
      }
    }
  });

  bot.on('kicked', (reason) => {
    let temizSebep = reason;
    if (typeof reason === 'object') {
      try { temizSebep = JSON.stringify(reason); } catch (e) {}
    }
    console.log(`!!! Bağlantı Kesildi. Sunucu Yanıtı: ${temizSebep}`);
    yenidenBaglanYonetimi();
  });

  bot.on('error', (err) => {
    console.log(`!!! Ağ Hatası: ${err.message}`);
    yenidenBaglanYonetimi();
  });
}

function yenidenBaglanYonetimi() {
  ayniIpDenemeSayisi++;

  if (ayniIpDenemeSayisi >= 2) {
    ayniIpDenemeSayisi = 0;
    aktifProxyIndex = (aktifProxyIndex + 1) % PROXY_LISTESI.length;
    console.log(`>>> Hat temizleniyor, sonraki Ev IP'sine geçiliyor...`);
  }

  console.log(">>> Sunucu kapılarının temizlenmesi için 25 saniye bekleniyor...");
  setTimeout(() => { botuBaslat(); }, 25000);
}

botuBaslat();
