const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;
const http = require('http');
const { SocksProxyAgent } = require('socks-proxy-agent');

console.log("=== EV TIPI COKLU PROXY GIZLI BOT SISTEMI ===");

// Railway için canlı tutma sunucusu
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot Aktif!\n');
});
server.listen(process.env.PORT || 3000);

const AYARLAR = {
  host: 'mc.quiltanarchy.xyz',
  version: '1.21.1'
};

// Şirket/Veri merkezi olmayan, tamamen ev interneti (Residential/ISP) olan 6 adet SOCKS5 proxy
const PROXY_LISTESI = [
  "socks5://67.71.242.118:1080",  // Ev İnterneti (Bireysel ISP)
  "socks5://192.252.210.233:4145", // Ev Tipi Paylaşımlı Konut IP'si
  "socks5://178.17.171.222:1080", // Ev Kullanıcısı Statik/Dinamik Hat
  "socks5://109.71.245.79:1080",  // Bireysel Genişbant İnternet
  "socks5://146.0.77.29:3000",    // Yerel Ev Servis Sağlayıcısı
  "socks5://94.131.95.82:1080"    // Şahsi Konut IP Bağlantısı
];

let aktifProxyIndex = 0;
const klanListesi = new Set(['umut', 'umutedfg2']); 
let bot;
let takipEdilenOyuncu = null;

function botuBaslat() {
  console.log(`>>> [Proxy Havuzu] ${aktifProxyIndex + 1}/${PROXY_LISTESI.length} numaralı Ev IP'si deneniyor...`);
  const gecerliProxy = PROXY_LISTESI[aktifProxyIndex];

  const botSecenekleri = {
    host: AYARLAR.host,
    username: 'S2k_' + Math.floor(1000 + Math.random() * 9000), // BotSentry yakalamasın diye rastgele isim
    version: AYARLAR.version,
    checkTimeoutInterval: 120000,
    physicsEnabled: true, // Gerçek insan fiziği simülasyonu
    agent: new SocksProxyAgent(gecerliProxy) // Seçilen ev proxy'sini bota bağlıyoruz
  };

  console.log(`-> Bağlantı gerçek insan interneti olarak maskelendi: ${gecerliProxy}`);

  bot = mineflayer.createBot(botSecenekleri);
  bot.loadPlugin(pathfinder);

  bot.on('login', () => {
    console.log(`>>> SIZMA BAŞARILI! BotSentry aşıldı ve oyuna girildi: ${bot.username}`);
    // Sunucuya insan gibi düzenli ping yolla
    setInterval(() => {
      if (bot && bot._client) bot._client.write('keep_alive', { id: Math.floor(Math.random() * 1000) });
    }, 10000);
  });

  bot.on('spawn', () => {
    console.log(">>> Bot başarıyla dünyada doğdu. Komutlar dinleniyor!");
    
    // Sunucuya girer girmez değil, 3 saniye sonra insansı bir gecikmeyle kayıt olur
    setTimeout(() => {
      bot.chat('/register S2kBot123 S2kBot123'); 
      bot.chat('/login S2kBot123');
    }, 3000);
    
    // Gelişmiş İnsansı Anti-AFK (Kafasını çevirir, rastgele hareket eder)
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

  // BÜTÜN ESKİ KOMUTLARIN KORUNDUĞU ALAN
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    const mesaj = message.trim().toLowerCase();

    // Akıllı TPA Filtresi (Klan içi onay, yabancı reddetme)
    if (mesaj.includes('tpa') || mesaj.includes('teleport')) {
      if (klanListesi.has(username)) {
        bot.chat(`/tpaccept ${username}`);
        bot.chat(`/tpyes ${username}`);
        console.log(`> Klandan ${username} TPA isteği onaylandı.`);
      } else {
        bot.chat(`/tpdeny ${username}`);
        console.log(`> Yabancı ${username} TPA isteği reddedildi.`);
      }
    }

    // umut ve umutedfg2 hesaplarının kullanabileceği komutlar
    if (klanListesi.has(username)) {
      // Takip Sistemi
      if (mesaj === 'takip et') {
        const target = bot.players[username]?.entity;
        if (!target) {
          bot.chat('Seni göremiyorum, biraz yaklaşmalısın.');
          return;
        }
        takipEdilenOyuncu = username;
        bot.chat('Seni takip etmeye başlıyorum.');
        const defaultMovements = new Movements(bot);
        bot.pathfinder.setMovements(defaultMovements);
        bot.pathfinder.setGoal(new GoalFollow(target, 2), true);
      }

      // Durdurma
      if (mesaj === 'dur') {
        takipEdilenOyuncu = null;
        bot.pathfinder.setGoal(null);
        bot.chat('Takip durduruldu.');
      }

      // Dinamik Klan Ekleme
      if (mesaj.startsWith('klan ekle ')) {
        const eklenecek = message.split(' ')[2];
        if (eklenecek) {
          klanListesi.add(eklenecek);
          bot.chat(`${eklenecek} başarıyla izinli listesine eklendi.`);
        }
      }

      // Klan Silme
      if (mesaj.startsWith('klan sil ')) {
        const silinecek = message.split(' ')[2];
        if (silinecek && silinecek !== 'umut' && silinecek !== 'umutedfg2') {
          klanListesi.delete(silinecek);
          bot.chat(`${silinecek} klandan çıkarıldı.`);
        }
      }

      // Herhangi Birine TPA Atma
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
    sonrakiProxyGec();
  });

  bot.on('error', (err) => {
    console.log(`!!! Bağlantı hatası oluştu: ${err.message}`);
    sonrakiProxyGec();
  });
}

// Eğer bir ev IP'si sunucu tarafından geçici olarak reddedilirse otomatik diğerine atlar
function sonrakiProxyGec() {
  aktifProxyIndex = (aktifProxyIndex + 1) % PROXY_LISTESI.length;
  console.log(`>>> Güvenlik için 15 saniye beklenecek ve ardından sıradaki ev IP'sine geçiş yapılacak...`);
  setTimeout(() => { botuBaslat(); }, 15000);
}

botuBaslat();
