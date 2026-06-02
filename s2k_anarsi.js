const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;
const http = require('http');
const { SocksProxyAgent } = require('socks-proxy-agent');

console.log("=== GUNCEL ISIM: S2K_BOT SISTEMI BASLATILIYOR ===");

// Railway Canlı Tutma Sunucusu
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('s2k_bot Aktif!\n');
});
server.listen(process.env.PORT || 3000);

const AYARLAR = {
  host: 'mc.quiltanarchy.xyz',
  version: '1.21.1',
  username: 's2k_bot' // Senin önceden kayıt olduğun isim buraya sabitlendi!
};

// BotSentry'yi geçen temiz ev IP'leri
const PROXY_LISTESI = [
  "socks5://192.252.210.233:4145",
  "socks5://67.71.242.118:1080",
  "socks5://178.17.171.222:1080",
  "socks5://109.71.245.79:1080",
  "socks5://146.0.77.29:3000",
  "socks5://94.131.95.82:1080"
];

let aktifProxyIndex = 0;
let baglantiDenemeSayisi = 0; 
const klanListesi = new Set(['umut', 'umutedfg2']); 
let bot;
let takipEdilenOyuncu = null;

function botuBaslat() {
  const gecerliProxy = PROXY_LISTESI[aktifProxyIndex];
  console.log(`>>> [Bağlantı] ${AYARLAR.username} ismi ve ${aktifProxyIndex + 1}. Ev IP'si ile bağlanılıyor... (Deneme: ${baglantiDenemeSayisi + 1})`);

  const botSecenekleri = {
    host: AYARLAR.host,
    username: AYARLAR.username,
    version: AYARLAR.version,
    checkTimeoutInterval: 120000,
    physicsEnabled: true,
    agent: new SocksProxyAgent(gecerliProxy)
  };

  bot = mineflayer.createBot(botSecenekleri);
  bot.loadPlugin(pathfinder);

  bot.on('login', () => {
    console.log(`>>> SIZMA BAŞARILI! ${bot.username} sunucuya giriş yaptı.`);
    baglantiDenemeSayisi = 0; 
    
    setInterval(() => {
      if (bot && bot._client) bot._client.write('keep_alive', { id: Math.floor(Math.random() * 1000) });
    }, 10000);
  });

  bot.on('spawn', () => {
    console.log(`>>> ${bot.username} dünyada doğdu. Komutlar ve eski özelliklerin hepsi aktif!`);
    
    // s2k_bot hesabının giriş komutları
    setTimeout(() => {
      bot.chat('/register s2k_bot123 s2k_bot123'); 
      bot.chat('/login s2k_bot123'); // Eğer şifren s2k_bot123'ten farklıysa burayı değiştirebilirsin
    }, 3000);
    
    // İnsansı Anti-AFK
    setInterval(() => {
      if (!bot) return;
      const eylem = Math.random();
      if (eylem < 0.25) {
        const yaw = (Math.random() * 360 - 180) * (Math.PI / 180);
        const pitch = (Math.random() * 60 - 30) * (Math.PI / 180);
        bot.look(yaw, pitch);
      } else if (eylem < 0.5) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 300);
      } else if (eylem < 0.75) {
        bot.swingArm('right');
      } else {
        bot.setControlState('forward', true);
        setTimeout(() => bot.setControlState('forward', false), 200);
      }
    }, 13000);
  });

  // TÜM KOMUTLAR (TPA filtreleri, takip et, dur, klan ekle/sil, tpa at)
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    const mesaj = message.trim().toLowerCase();

    if (mesaj.includes('tpa') || mesaj.includes('teleport')) {
      if (klanListesi.has(username)) {
        bot.chat(`/tpaccept ${username}`);
        bot.chat(`/tpyes ${username}`);
        console.log(`> Klandan ${username} TPA isteği kabul edildi.`);
      } else {
        bot.chat(`/tpdeny ${username}`);
        console.log(`> Yabancı ${username} TPA isteği reddedildi.`);
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
          bot.chat(`${silinecek} klandan cikarildi.`);
        }
      }

      if (mesaj.startsWith('tpa at ')) {
        const hedef = message.split(' ')[2];
        if (hedef) bot.chat(`/tpa ${hedef}`);
      }
    }
  });

  bot.on('entityMoved', (entity) => {
    if (takipEdilenOyuncu && entity.username === takipEdilenOyuncu) {
      bot.pathfinder.setGoal(new GoalFollow(entity, 2), true);
    }
  });

  bot.on('kicked', (reason) => {
    console.log(`!!! Sunucudan atıldı. Sebep: ${reason}`);
    yenidenBaglanYonetimi();
  });

  bot.on('error', (err) => {
    console.log(`!!! Bağlantı hatası: ${err.message}`);
    yenidenBaglanYonetimi();
  });
}

// Analiz mekanizmasını peş peşe girişle bozan sistem
function yenidenBaglanYonetimi() {
  baglantiDenemeSayisi++;

  if (baglantiDenemeSayisi >= 2) {
    baglantiDenemeSayisi = 0;
    aktifProxyIndex = (aktifProxyIndex + 1) % PROXY_LISTESI.length;
    console.log(`>>> Bu proxy engelli olabilir. Sıradaki Ev IP'sine geçiliyor...`);
  }

  console.log(">>> Sunucunun analiz süresi bekleniyor... 7 saniye sonra aynı IP ile tekrar girilecek.");
  setTimeout(() => { botuBaslat(); }, 7000);
}

botuBaslat();
