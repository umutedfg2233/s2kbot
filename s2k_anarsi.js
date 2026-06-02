const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;
const http = require('http');
const { SocksProxyAgent } = require('socks-proxy-agent');

console.log("=== S2K_BOT: SEBEP OKUYUCU GENC MOD BASLATILIYOR ===");

// Global Hata Yakalayıcı: ECONNRESET gibi ani kopmalarda Railway'in çökmesini %100 önler
process.on('uncaughtException', (err) => {
  console.log(`[Global Hata] Kodun çökmesi engellendi: ${err.message}`);
});

// Canlı tutma sunucusu
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

function botuBaslat() {
  if (bot) {
    try { bot.end(); } catch(e) {}
    bot = null;
  }

  const gecerliProxy = PROXY_LISTESI[aktifProxyIndex];
  console.log(`>>> [Bağlantı] ${AYARLAR.username} | Proxy: ${aktifProxyIndex + 1}/${PROXY_LISTESI.length} | Deneme: ${ayniIpDenemeSayisi + 1}`);

  bot = mineflayer.createBot({
    host: AYARLAR.host,
    username: AYARLAR.username,
    version: AYARLAR.version,
    checkTimeoutInterval: 120000,
    physicsEnabled: true,
    agent: new SocksProxyAgent(gecerliProxy)
  });

  bot.loadPlugin(pathfinder);

  bot.on('login', () => {
    console.log(`>>> SIZMA BAŞARILI! ${bot.username} sunucu içerisine sızdı.`);
    ayniIpDenemeSayisi = 0; 
  });

  bot.on('spawn', () => {
    console.log(`>>> ${bot.username} oyunda doğdu. Komutlar dinleniyor.`);
    setTimeout(() => {
      if (bot) {
        bot.chat('/register s2k_bot123 s2k_bot123'); 
        bot.chat('/login s2k_bot123');
      }
    }, 4000);
  });

  // KOMUTLAR (Eksiksiz Korundu)
  bot.on('chat', (username, message) => {
    if (!bot || username === bot.username) return;
    const mesaj = message.trim().toLowerCase();

    if (mesaj.includes('tpa')) {
      if (klanListesi.has(username)) {
        bot.chat(`/tpaccept ${username}`);
      } else {
        bot.chat(`/tpdeny ${username}`);
      }
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

  // [object Object] Hatasını çözen akıllı atılma dinleyicisi
  bot.on('kicked', (reason) => {
    let temizSebep = reason;
    if (typeof reason === 'object') {
      try {
        temizSebep = JSON.stringify(reason);
      } catch (e) {
        temizSebep = "Okunamayan Objeli Engel";
      }
    }
    console.log(`!!! Sunucudan atildi. Net Sebep: ${temizSebep}`);
    yenidenBaglanYonetimi();
  });

  bot.on('error', (err) => {
    console.log(`!!! Baglanti hatasi yakalandi: ${err.message}`);
    yenidenBaglanYonetimi();
  });
}

function yenidenBaglanYonetimi() {
  ayniIpDenemeSayisi++;

  if (ayniIpDenemeSayisi >= 2) {
    ayniIpDenemeSayisi = 0;
    aktifProxyIndex = (aktifProxyIndex + 1) % PROXY_LISTESI.length;
    console.log(`>>> Sıradaki Ev IP'sine geçiliyor...`);
  }

  // Sunucu giriş sınırını (Too Fast) aşmak için 25 saniye güvenli bekleme
  console.log(">>> [Güvenlik Gecikmesi] Sunucu korumasını sıfırlamak için 25 saniye bekleniyor...");
  setTimeout(() => { botuBaslat(); }, 25000);
}

botuBaslat();
