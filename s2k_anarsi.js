const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;
const http = require('http');
const { SocksProxyAgent } = require('socks-proxy-agent');

console.log("=== S2K_BOT: 1.21.1 GELISTIRILMIS UZMAN MOD AKTIF ===");

// Global Hata Yakalayıcı: Geçiş ekranındaki anlık paket düşmelerinde Railway'in çökmesini önler
process.on('uncaughtException', (err) => {
  console.log(`[Protokol Güvenliği] Hafif ağ dalgalanması yakalandı: ${err.message}`);
});

// Railway Canlı Tutma Web Servisi
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('s2k_bot Sorunsuz Calisiyor!\n');
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
let lobiGirisDurumu = false;

function botuBaslat() {
  if (bot) {
    try { bot.end(); } catch(e) {}
    bot = null;
  }
  
  lobiGirisDurumu = false; 
  const gecerliProxy = PROXY_LISTESI[aktifProxyIndex];
  console.log(`>>> [Hatta Giriş] ${AYARLAR.username} | Proxy: ${aktifProxyIndex + 1}/${PROXY_LISTESI.length}`);

  bot = mineflayer.createBot({
    host: AYARLAR.host,
    username: AYARLAR.username,
    version: AYARLAR.version,
    checkTimeoutInterval: 60000, // Railway ve Mineflayer arasındaki en dengeli süre (60 Saniye)
    physicsEnabled: true,
    agent: new SocksProxyAgent(gecerliProxy)
  });

  bot.loadPlugin(pathfinder);

  // Sunucu değiştirirken (Lobi -> Anarşi) tetiklenen 1.21.1 durum takipçisi
  bot.on('stateChanged', (state) => {
    console.log(`>>> [Ağ Katmanı] Bot şu an kararlı duruma geçti: ${state}`);
    if (state === 'configuration') {
      console.log(">>> [Configuration] Sunucular arası köprü kuruluyor, veri paketleri senkronize ediliyor.");
    }
  });

  bot.on('login', () => {
    console.log(`>>> BAĞLANTI BAŞARILI: Bot 1.21.1 kapısından giriş yaptı.`);
    ayniIpDenemeSayisi = 0; 
  });

  bot.on('spawn', () => {
    // Aktarım ekranındayken komut göndermeyi engeller, paketi korur
    if (lobiGirisDurumu) {
      console.log(">>> [Dünya Değişimi] Bot şu an ana dünyaya aktarılıyor. Komut askıya alındı.");
      return;
    }

    console.log(`>>> Giriş lobisi algılandı. Doğrulama şifresi iletiliyor...`);
    
    setTimeout(() => {
      if (bot && bot._client && bot._client.state === 'play' && !lobiGirisDurumu) {
        lobiGirisDurumu = true; // Şifrenin sadece tek sefer gitmesini garanti eder
        console.log("-> Giriş paketi başarıyla gönderildi. Aktarım aşaması bekleniyor...");
        bot.chat('/register s2k_bot123 s2k_bot123'); 
        bot.chat('/login s2k_bot123');
      }
    }, 3000); 
  });

  // Bot lobi aktarımını (Configuration) başarıyla tamamlayıp ana dünyaya indiğinde tetiklenir
  bot.on('game', () => {
    if (lobiGirisDurumu) {
      console.log("=================================================");
      console.log(">>> BAŞARI: S2K_BOT ANA ANARŞİ DÜNYASINDA AKTİF! <<<");
      console.log("=================================================");
    }
  });

  // OYUN İÇİ KOMUTLAR (Klan, Takip, TPA mekanizmaları eksiksiz korunmuştur)
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
          bot.pathfinder.setMovements(new Movements(bot));
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
    console.log(`!!! Sunucu bağlantıyı kesti. Detay: ${temizSebep}`);
    yenidenBaglanYonetimi();
  });

  bot.on('error', (err) => {
    console.log(`!!! Protokol / Ağ hatası: ${err.message}`);
    yenidenBaglanYonetimi();
  });
}

function yenidenBaglanYonetimi() {
  ayniIpDenemeSayisi++;

  if (ayniIpDenemeSayisi >= 2) {
    ayniIpDenemeSayisi = 0;
    aktifProxyIndex = (aktifProxyIndex + 1) % PROXY_LISTESI.length;
    console.log(`>>> Tünel değiştiriliyor, sonraki temiz Ev IP'sine geçildi.`);
  }

  console.log(">>> Sunucu güvenliği için 25 saniye bekleniyor...");
  setTimeout(() => { botuBaslat(); }, 25000);
}

botuBaslat();
