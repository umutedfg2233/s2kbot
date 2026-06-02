const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;
const http = require('http');

console.log("=== BOT SISTEMI BASLATILIYOR ===");

// Railway'in botu kapatmasını önlemek için mini web sunucusu (Starting Container hatasını çözer)
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot Aktif!\n');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Web sunucusu ${PORT} portunda aktif.`);
});

// === AYARLAR VE YETKILER ===
const AYARLAR = {
  host: 'mc.quiltanarchy.xyz',
  username: 'S2k_' + Math.floor(1000 + Math.random() * 9000), // Her seferinde farklı isim (Anti-Bot için)
  version: '1.21.1'
};

// Klan/İzinli Oyuncular Listesi (umut ve umutedfg2 doğrudan eklendi)
const klanListesi = new Set(['umut', 'umutedfg2']); 

const bot = mineflayer.createBot({
  host: AYARLAR.host,
  username: AYARLAR.username,
  version: AYARLAR.version,
  checkTimeoutInterval: 60000
});

// Eklentileri Yükle
bot.loadPlugin(pathfinder);

let takipEdilenOyuncu = null;

bot.on('login', () => {
  console.log(`>>> Bot sunucuya giris yapti! Isim: ${bot.username}`);
});

bot.on('spawn', () => {
  console.log(">>> Bot dunyada dogdu (Spawn oldu). Ozellikler aktif!");
  bot.chat('/register S2kBot123 S2kBot123'); // Eğer sunucuda kayıt gerekiyorsa
  bot.chat('/login S2kBot123');
  
  // Anti-AFK Döngüsü (Her 15 saniyede bir rastgele hareket eder/zıplar)
  setInterval(() => {
    const rastgele = Math.random();
    if (rastgele < 0.3) {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    } else if (rastgele < 0.6) {
      bot.setControlState('sneak', true);
      setTimeout(() => bot.setControlState('sneak', false), 800);
    } else {
      bot.swingArm('right');
    }
  }, 15000);
});

// === GELISMIS SOHBET VE KOMUT SISTEMI ===
bot.on('chat', (username, message) => {
  if (username === bot.username) return;

  const mesaj = message.trim().toLowerCase();

  // TPA ISTEKLERINI KONTROL ETME (Sadece klandakileri kabul eder)
  if (mesaj.includes('tpa') || mesaj.includes('teleport')) {
    if (klanListesi.has(username)) {
      bot.chat(`/tpaccept ${username}`);
      bot.chat(`/tpyes ${username}`);
      console.log(`> Klandan ${username} kişisinin TPA isteği kabul edildi.`);
    } else {
      bot.chat(`/tpdeny ${username}`);
      console.log(`> Klanda olmayan ${username} kişisinin TPA isteği reddedildi.`);
    }
  }

  // Sadece sahiplerinin (umut veya umutedfg2) kullanabileceği komutlar
  if (klanListesi.has(username)) {
    
    // Takip Etme Sistemi
    if (mesaj === 'takip et') {
      const target = bot.players[username]?.entity;
      if (!target) {
        bot.chat('Seni goremiyorum, yaklasman lazim.');
        return;
      }
      takipEdilenOyuncu = username;
      bot.chat('Seni takip etmeye basliyorum.');
      baslaTakip(target);
    }

    // Takibi Bırakma
    if (mesaj === 'dur') {
      takipEdilenOyuncu = null;
      bot.pathfinder.setGoal(null);
      bot.chat('Takip durduruldu.');
    }

    // Klana/İzinli Listesine Oyuncu Ekleme
    if (mesaj.startsWith('klan ekle ')) {
      const eklenecek = message.split(' ')[2];
      if (eklenecek) {
        klanListesi.add(eklenecek);
        bot.chat(`${eklenecek} klana ve izin verilenler listesine eklendi.`);
      }
    }

    // Klandan Oyuncu Silme
    if (mesaj.startsWith('klan sil ')) {
      const silinecek = message.split(' ')[2];
      // Ana sahiplerin silinmesini engellemek için kontrol
      if (silinecek && silinecek !== 'umut' && silinecek !== 'umutedfg2') {
        klanListesi.delete(silinecek);
        bot.chat(`${silinecek} klandan cikarildi.`);
      }
    }

    // Herkese TPA Atma Komutu
    if (mesaj.startsWith('tpa at ')) {
      const hedef = message.split(' ')[2];
      if (hedef) {
        bot.chat(`/tpa ${hedef}`);
      }
    }
  }
});

// Takip Fonksiyonu
function baslaTakip(target) {
  const defaultMovements = new Movements(bot);
  bot.pathfinder.setMovements(defaultMovements);
  bot.pathfinder.setGoal(new GoalFollow(target, 2), true);
}

// Oyuncu uzaklaşıp tekrar görünürse takibe devam etmesi için
bot.on('entityMoved', (entity) => {
  if (takipEdilenOyuncu && entity.username === takipEdilenOyuncu) {
    bot.pathfinder.setGoal(new GoalFollow(entity, 2), true);
  }
});

// Hataları ve Atılmaları Loglama
bot.on('kicked', (reason) => {
  console.log("!!! Bot sunucudan atildi: " + reason);
});

bot.on('error', (err) => {
  console.log("!!! Bir hata olustu: ", err);
});
