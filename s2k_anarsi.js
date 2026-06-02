const mineflayer = require('mineflayer');
const { pathfinder } = require('mineflayer-pathfinder');
const http = require('http');
const { SocksProxyAgent } = require('socks-proxy-agent');

console.log("=== S2K_BOT: ZINCIRLEME HATA COZUCU UZMAN SVR AKTIF ===");

// Global Hata Yakalayıcı: Paket uyumsuzluklarında Railway'in çökmesini kesin olarak önler
process.on('uncaughtException', (err) => {
  console.log(`[Sistem Koruması] Arka plan paket dalgalanması engellendi: ${err.message}`);
});

// Railway Canlı Tutma Port Servisi (SIGTERM Önleyici)
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
let sızmaGirisimi = false;
let komutZamanlayici1 = null;
let komutZamanlayici2 = null;

function botuAtesle() {
  // Eski zamanlayıcıları ve oturum kalıntılarını temizle (Süre doldu hatasını önler)
  if (komutZamanlayici1) clearTimeout(komutZamanlayici1);
  if (komutZamanlayici2) clearTimeout(komutZamanlayici2);
  
  if (bot) {
    try { bot.end(); } catch(e) {}
    bot = null;
  }

  sızmaGirisimi = false;
  const aktifProxy = PROXY_LISTESI[proxyIndex];
  console.log(`>>> [Ağ Tüneli] Bağlantı kanalı açılıyor... Proxy: ${proxyIndex + 1}/${PROXY_LISTESI.length}`);

  bot = mineflayer.createBot({
    host: AYARLAR.host,
    username: AYARLAR.username,
    version: AYARLAR.version,
    checkTimeoutInterval: 45000, // Railway'in donma algılamasını engelleyen esnek sınır
    auth: 'offline',
    agent: new SocksProxyAgent(aktifProxy)
  });

  bot.loadPlugin(pathfinder);

  bot.on('login', () => {
    console.log(`>>> [Ağ Girişi] Bot ham ağ katmanına başarıyla sızdı.`);
    
    // Ham veri kanallarında donmayı engelleyen iç kilit kırıcı (Anti-SIGTERM)
    if (bot._client) {
      bot._client.on('packet', (data, meta) => {
        if (meta.name === 'keep_alive') {
          // Sunucudan gelen canlılık paketlerini işlemciyi yormadan arka planda otomatik yanıtla
          try { bot._client.write('keep_alive', { keepAliveId: data.keepAliveId }); } catch(e) {}
        }
      });
    }
  });

  bot.on('spawn', () => {
    if (sızmaGirisimi) return;
    sızmaGirisimi = true;

    console.log(`>>> [Analiz Odası] Sunucu analiz sistemi inceleniyor. Stratejik beklemeye geçildi...`);

    // 1. AŞAMA: Analizin bitimine doğru ilk komut enjeksiyonu (3. Saniye)
    komutZamanlayici1 = setTimeout(() => {
      if (bot && bot._client && bot._client.state === 'play') {
        console.log("-> 1. Dalga şifre paketleri sunucuya basılıyor...");
        bot.chat('/register s2k_bot123 s2k_bot123');
        bot.chat('/login s2k_bot123');
      }
    }, 3000);

    // 2. AŞAMA: Eğer ilk komut sahte lobi duvarına takıldıysa, asıl lobiye geçiş anında ikinci vuruş (6. Saniye)
    komutZamanlayici2 = setTimeout(() => {
      if (bot && bot._client && bot._client.state === 'play') {
        console.log("-> 2. Dalga (Garanti) şifre paketleri sunucuya basılıyor...");
        bot.chat('/login s2k_bot123');
      }
    }, 6000);
  });

  bot.on('game', () => {
    if (sızmaGirisimi) {
      console.log("=================================================");
      console.log(">>> %100 BAŞARI: BOT TÜM DUVARLARI DELDI, OYUNDA! <<<");
      console.log("=================================================");
    }
  });

  // Oyun İçi Temel Klan ve TPA Komut Sistemi
  bot.on('chat', (username, message) => {
    if (!bot || username === bot.username) return;
    const mesaj = message.trim().toLowerCase();
    const klan = ['umut', 'umutedfg2'];

    if (mesaj.includes('tpa') && klan.includes(username)) {
      bot.chat(`/tpaccept ${username}`);
    }
  });

  bot.on('kicked', (reason) => {
    console.log(`!!! Sunucu Bağlantıyı Kesti. Gerekçe: ${typeof reason === 'object' ? JSON.stringify(reason) : reason}`);
    yenidenBaglanYonetimi();
  });

  bot.on('error', (err) => {
    console.log(`!!! Hat Protokol Hatası: ${err.message}`);
    yenidenBaglanYonetimi();
  });
}

function yenidenBaglanYonetimi() {
  if (komutZamanlayici1) clearTimeout(komutZamanlayici1);
  if (komutZamanlayici2) clearTimeout(komutZamanlayici2);

  proxyIndex = (proxyIndex + 1) % PROXY_LISTESI.length;
  console.log(`>>> Eski oturum kalıntıları temizleniyor. Yeni hatta geçildi.`);
  
  // Sunucunun hafızasındaki eski bot hayaletinin düşmesi için tam 30 saniye güvenli bekleme
  console.log(">>> Temiz bir başlangıç için 30 saniye geri sayım başlatıldı...");
  setTimeout(() => { botuAtesle(); }, 30000);
}

botuAtesle();
