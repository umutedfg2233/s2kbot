const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;
const http = require('http');
const { SocksProxyAgent } = require('socks-proxy-agent');

console.log("=== S2K_BOT: BOTSENTRY DUVAR DELICI MOD AKTIF ===");

// Global Hata Koruması
process.on('uncaughtException', (err) => {
  console.log(`[Sistem Koruması] Çökme engellendi: ${err.message}`);
});

// Railway Canlı Tutma Servisi
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
let analizGecildi = false;
let hareketInterval = null;

function botuBaslat() {
  if (hareketInterval) clearInterval(hareketInterval);
  if (bot) {
    try { bot.end(); } catch(e) {}
    bot = null;
  }
  
  analizGecildi = false;
  const gecerliProxy = PROXY_LISTESI[aktifProxyIndex];
  console.log(`>>> [Ağ Girişi] ${AYARLAR.username} | Proxy: ${aktifProxyIndex + 1}/${PROXY_LISTESI.length}`);

  bot = mineflayer.createBot({
    host: AYARLAR.host,
    username: AYARLAR.username,
    version: AYARLAR.version,
    checkTimeoutInterval: 60000, 
    physicsEnabled: true,
    agent: new SocksProxyAgent(gecerliProxy)
  });

  bot.loadPlugin(pathfinder);

  bot.on('login', () => {
    console.log(`>>> SUNUCU KAPISI ACILDI: Bot analiz odasına alındı.`);
    ayniIpDenemeSayisi = 0; 
  });

  bot.on('spawn', () => {
    console.log(`>>> Bot haritada var oldu. BotSentry analizi için insan simülasyonu başlatılıyor...`);

    // İNSAN HAREKET SİMÜLASYONU (BotSentry'nin "Bu bot" demesini engeller)
    if (!hareketInterval) {
      let yon = true;
      hareketInterval = setInterval(() => {
        if (bot && bot.entity) {
          // Botun kafasını hafifçe sağa sola oynatarak gerçek oyuncu taklidi yaptırıyoruz
          bot.look(yon ? 0.1 : -0.1, 0, true);
          yon = !yon;
        }
      }, 500);
    }
    
    // Sunucu analiz yazısını geçip bizi şifre ekranına atana kadar bekleyen esnek tetikleyici
    setTimeout(() => {
      if (bot && bot._client && bot._client.state === 'play' && !analizGecildi) {
        analizGecildi = true;
        console.log("-> Analiz süresi bitti, şifre ve lobi doğrulama komutları basılıyor...");
        bot.chat('/register s2k_bot123 s2k_bot123'); 
        bot.chat('/login s2k_bot123');
      }
    }, 5000); // Analiz kuyruğundan sıyrılmak için tam kıvamında 5 saniye bekleme
  });

  // Sunucu eline harita (captcha) verirse otomatik olarak haritayı yere at veya elinden bırak
  bot.on('heldItemChanged', (item) => {
    if (item && item.name.includes('map')) {
      console.log(">>> [UYARI] Sunucu botun eline doğrulama haritası verdi! Temizleniyor...");
      bot.tossStack(item); // Haritayı yere fırlatıp korumayı bypass etmeyi dener
    }
  });

  bot.on('game', () => {
    if (analizGecildi) {
      if (hareketInterval) { clearInterval(hareketInterval); hareketInterval = null; }
      console.log("=================================================");
      console.log(">>> %100 BAŞARI: BOT ANARŞİ SUNUCUSUNUN İÇİNDE! <<<");
      console.log("=================================================");
    }
  });

  // OYUN İÇİ KOMUTLAR
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
    if (hareketInterval) { clearInterval(hareketInterval); hareketInterval = null; }
    let temizSebep = reason;
    if (typeof reason === 'object') {
      try { temizSebep = JSON.stringify(reason); } catch (e) {}
    }
    console.log(`!!! Sunucudan Tekmelendi. Sebep: ${temizSebep}`);
    yenidenBaglanYonetimi();
  });

  bot.on('error', (err) => {
    if (hareketInterval) { clearInterval(hareketInterval); hareketInterval = null; }
    console.log(`!!! Ağ Sinyal Hatası: ${err.message}`);
    yenidenBaglanYonetimi();
  });
}

function yenidenBaglanYonetimi() {
  ayniIpDenemeSayisi++;

  if (ayniIpDenemeSayisi >= 2) {
    ayniIpDenemeSayisi = 0;
    aktifProxyIndex = (aktifProxyIndex + 1) % PROXY_LISTESI.length;
    console.log(`>>> Tünel değiştirildi. Yeni Ev IP'sine geçiliyor...`);
  }

  console.log(">>> BotSentry hafızasının silinmesi için 25 saniye bekleniyor...");
  setTimeout(() => { botuBaslat(); }, 25000);
}

botuBaslat();
