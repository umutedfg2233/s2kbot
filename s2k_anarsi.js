const mineflayer = require('mineflayer');
const { pathfinder } = require('mineflayer-pathfinder');
const http = require('http');
const { SocksProxyAgent } = require('socks-proxy-agent');

console.log("=== S2K_BOT: SAF PROTOKOL KARARLI SURUM AKTIF ===");

// Çökme Koruması
process.on('uncaughtException', (err) => {
  console.log(`[Sistem Koruması] Dalgalanma engellendi: ${err.message}`);
});

// Railway Canlı Tutma Portu
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('S2K Bot System Online\n');
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
let girisGirisimi = false;
let komutZamanlayici = null;

function botuBaslat() {
  if (komutZamanlayici) clearTimeout(komutZamanlayici);
  
  if (bot) {
    try { bot.end(); } catch(e) {}
    bot = null;
  }

  girisGirisimi = false;
  const aktifProxy = PROXY_LISTESI[proxyIndex];
  console.log(`>>> [Bağlantı] Hat: ${proxyIndex + 1}/${PROXY_LISTESI.length}`);

  bot = mineflayer.createBot({
    host: AYARLAR.host,
    username: AYARLAR.username,
    version: AYARLAR.version,
    checkTimeoutInterval: 45000, // Railway SIGTERM koruma sınırı
    auth: 'offline',
    agent: new SocksProxyAgent(aktifProxy)
  });

  bot.loadPlugin(pathfinder);

  bot.on('login', () => {
    console.log(`>>> [Lobi Bağlantısı] Bot ana kapıdan içeri sızdı.`);
  });

  bot.on('spawn', () => {
    if (girisGirisimi) return;
    girisGirisimi = true;

    console.log(`>>> [Doğrulama Odası] Bot dünyada var oldu. Güvenli geçiş bekleniyor...`);

    // Paket çakışmasını önlemek ve sunucunun komutları tam işlemesi için 5. saniyede tek ve net bir vuruş
    komutZamanlayici = setTimeout(() => {
      if (bot && bot._client && bot._client.state === 'play') {
        console.log("-> Giriş ve tescil paketleri sunucuya gönderiliyor...");
        bot.chat('/register s2k_bot123 s2k_bot123');
        bot.chat('/login s2k_bot123');
      }
    }, 5000);
  });

  bot.on('game', () => {
    if (girisGirisimi) {
      console.log("=================================================");
      console.log(">>> %100 BAŞARI: BOT SORUNSUZCA OYUNA GIRDI! <<<");
      console.log("=================================================");
    }
  });

  // Klan ve TPA Komutları
  bot.on('chat', (username, message) => {
    if (!bot || username === bot.username) return;
    const mesaj = message.trim().toLowerCase();
    const klan = ['umut', 'umutedfg2'];

    if (mesaj.includes('tpa') && klan.includes(username)) {
      bot.chat(`/tpaccept ${username}`);
    }
  });

  bot.on('kicked', (reason) => {
    console.log(`!!! Bağlantı Kesildi: ${typeof reason === 'object' ? JSON.stringify(reason) : reason}`);
    yenidenBaglan();
  });

  bot.on('error', (err) => {
    console.log(`!!! Sistem Ağ Hatası: ${err.message}`);
    yenidenBaglan();
  });
}

function yenidenBaglan() {
  if (komutZamanlayici) clearTimeout(komutZamanlayici);

  proxyIndex = (proxyIndex + 1) % PROXY_LISTESI.length;
  console.log(`>>> Hat temizleniyor, sonraki tünele geçiş yapılıyor...`);
  
  // Eski oturum paketlerinin sunucudan tamamen silinmesi için 30 saniye temiz bekleme süresi
  setTimeout(() => { botuBaslat(); }, 30000);
}

botuBaslat();
