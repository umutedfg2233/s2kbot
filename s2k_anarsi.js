const mineflayer = require('mineflayer');
const { pathfinder } = require('mineflayer-pathfinder');
const http = require('http');
const { SocksProxyAgent } = require('socks-proxy-agent');

console.log("=== S2K_BOT: SAF 1.21.1 AG SURUCUSU BASLATILDI ===");

// Railway Çökme Koruması
process.on('uncaughtException', (err) => {
  console.log(`[Ağ Hatası Engellendi] -> ${err.message}`);
});

// Canlı Tutma Servisi
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot Aktif\n');
}).listen(process.env.PORT || 3000);

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

let proxyIndex = 0;
let bot = null;
let girisYapildi = false;

function botuOlustur() {
  if (bot) {
    try { bot.end(); } catch(e) {}
    bot = null;
  }

  girisYapildi = false;
  const aktifProxy = PROXY_LISTESI[proxyIndex];
  console.log(`>>> [Bağlantı Hattı] Proxy: ${proxyIndex + 1}/${PROXY_LISTESI.length}`);

  bot = mineflayer.createBot({
    host: AYARLAR.host,
    username: AYARLAR.username,
    version: AYARLAR.version,
    checkTimeoutInterval: 30000, // Railway'in SIGTERM vermeyeceği en hafif, en güvenli süre
    auth: 'offline',
    agent: new SocksProxyAgent(aktifProxy)
  });

  bot.loadPlugin(pathfinder);

  // Bot sunucuya ilk paket bağını kurduğunda
  bot.on('login', () => {
    console.log(`>>> [Bağlantı Başarılı] Sunucu kapısı açıldı, lobiye sızılıyor...`);
  });

  // Bot lobide doğduğunda (Spawn paketini yakaladığında)
  bot.on('spawn', () => {
    if (girisYapildi) return;

    console.log(`>>> [Lobi Doğrulama] Sunucu stabilizasyonu için 4 saniye bekleniyor...`);
    
    setTimeout(() => {
      if (bot && bot._client && bot._client.state === 'play' && !girisYapildi) {
        girisYapildi = true;
        console.log("-> Doğrulama ve şifre komutları sunucuya enjekte ediliyor...");
        
        // Sunucunun bot korumasını aşmak için komutları peş peşe değil, milisaniyelik boşluklarla gönderiyoruz
        bot.chat('/register s2k_bot123 s2k_bot123');
        
        setTimeout(() => {
          if (bot) bot.chat('/login s2k_bot123');
        }, 500);
      }
    }, 4000);
  });

  // Bot ana anarşi dünyasına geçiş yapıp "Joined" aşamasına ulaştığında
  bot.on('game', () => {
    if (girisYapildi) {
      console.log("=================================================");
      console.log(">>> BAŞARI: BOT SUNUCUYA GIRDI VE AKTIF OYUNDA! <<<");
      console.log("=================================================");
    }
  });

  // Mesaj ve TPA Komutları (Eksiksiz Sabit Tutuldu)
  bot.on('chat', (username, message) => {
    if (!bot || username === bot.username) return;
    const mesaj = message.trim().toLowerCase();
    const klan = ['umut', 'umutedfg2'];

    if (mesaj.includes('tpa') && klan.includes(username)) {
      bot.chat(`/tpaccept ${username}`);
    }
  });

  bot.on('kicked', (reason) => {
    console.log(`!!! Sunucudan Atılma Bildirisi: ${typeof reason === 'object' ? JSON.stringify(reason) : reason}`);
    yenidenBaglanYonetici();
  });

  bot.on('error', (err) => {
    console.log(`!!! Hat Sinyali Kesildi: ${err.message}`);
    yenidenBaglanYonetici();
  });
}

function yenidenBaglanYonetici() {
  proxyIndex = (proxyIndex + 1) % PROXY_LISTESI.length;
  console.log(`>>> Hat temizlendi, ${proxyIndex + 1}. sıradaki yedek tünele geçiliyor...`);
  
  // Saldırı korumasına takılmamak için 25 saniye temiz bekleme
  setTimeout(() => { botuOlustur(); }, 25000);
}

botuOlustur();
