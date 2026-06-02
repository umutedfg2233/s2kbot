const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;
const http = require('http');
const { SocksProxyAgent } = require('socks-proxy-agent');

console.log("=== HATA DUZELTILDI: S2K_BOT YENIDEN BAGLANIYOR ===");

// Railway Canlı Tutma Sunucusu
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('s2k_bot Aktif!\n');
});
server.listen(process.env.PORT || 3000);

const AYARLAR = {
  host: 'mc.quiltanarchy.xyz',
  version: '1.21.1',
  username: 's2k_bot'
};

// Güncel temiz ev IP'leri
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
  console.log(`>>> [Bağlantı] Isim: ${AYARLAR.username} | Proxy: ${aktifProxyIndex + 1}/${PROXY_LISTESI.length} | Deneme: ${ayniIpDenemeSayisi + 1}`);

  const botSecenekleri = {
    host: AYARLAR.host,
    username: AYARLAR.username,
    version: AYARLAR.version,
    checkTimeoutInterval: 90000, // Yavaş proxy bağlantıları için süre artırıldı
    physicsEnabled: true,
    agent: new SocksProxyAgent(gecerliProxy)
  };

  try {
    bot = mineflayer.createBot(botSecenekleri);
    bot.loadPlugin(pathfinder);
  } catch (err) {
    console.log(`!!! Başlatma hatası: ${err.message}`);
    yenidenBaglanYonetimi();
    return;
  }

  bot.on('login', () => {
    console.log(`>>> SIZMA BAŞARILI! ${bot.username} sunucuya giriş yaptı.`);
    ayniIpDenemeSayisi = 0; 
  });

  bot.on('spawn', () => {
    console.log(`>>> ${bot.username} dünyada doğdu. Komutlar dinleniyor.`);
    
    setTimeout(() => {
      if (bot) {
        bot.chat('/register s2k_bot123 s2k_bot123'); 
        bot.chat('/login s2k_bot123');
      }
    }, 3000);
  });

  // Komut alanındaki yazım hatası tamamen düzeltildi
  bot.on('chat', (username, message) => {
    if (!bot || username === bot.username) return;
    const mesaj = message.trim().toLowerCase();

    if (mesaj.includes('tpa') || mesaj.includes('teleport')) {
      if (klanListesi.has(username)) {
        bot.chat(`/tpaccept ${username}`);
        bot.chat(`/tpyes ${username}`);
      } else {
        bot.chat(`/tpdeny ${username}`);
      }
    }

    if (klanListesi.has(username)) {
      if (mesaj === 'takip et') {
        const target = bot.players[username]?.entity;
        if (!target) {
          bot.chat('Seni goremiyorum, yaklasman lazim.');
          return;
        }
        takipEdilenOyuncu = username;
        bot.chat('Seni takip etmeye basliyorum.');
        const defaultMovements = new Movements(bot);
        bot.pathfinder.setMovements(defaultMovements);
        bot.pathfinder.setGoal(new GoalFollow(target, 2), true);
      }

      if (mesaj === 'dur') {
        takipEdilenOyuncu = null;
        bot.pathfinder.setGoal(null);
        bot.chat('Takip durduruldu.');
      }

      if (mesaj.startsWith('klan ekle ')) {
        const eklenecek = message.split(' ')[2];
        if (eklenecek) {
          klanListesi.add(eklenecek);
          bot.chat(`${eklenecek} listeye eklendi.`);
        }
      }

      if (mesaj.startsWith('klan sil ')) {
        const silinecek = message.split(' ')[2];
        if (silinecek && silinecek !== 'umut' && silinecek !== 'umutedfg2') {
          klanListesi.delete(silinecek);
          bot.chat(`${silinecek} cikarildi.`);
        }
      }

      if (mesaj.startsWith('tpa at ')) {
        const hedef = message.split(' ')[2];
        if (hedef) bot.chat(`/tpa ${hedef}`);
      }
    }
  });

  bot.on('entityMoved', (entity) => {
    if (bot && takipEdilenOyuncu && entity.username === takipEdilenOyuncu) {
      bot.pathfinder.setGoal(new GoalFollow(entity, 2), true);
    }
  });

  bot.on('kicked', (reason) => {
    console.log(`!!! Sunucudan atildi. Sebep: ${reason}`);
    yenidenBaglanYonetimi();
  });

  bot.on('error', (err) => {
    console.log(`!!! Baglanti hatasi: ${err.message}`);
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

  console.log(">>> 10 saniye sonra yeniden denenecek...");
  setTimeout(() => { botuBaslat(); }, 10000);
}

botuBaslat();
