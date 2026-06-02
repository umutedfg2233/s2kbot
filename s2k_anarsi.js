const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;
const http = require('http');
const { SocksProxyAgent } = require('socks-proxy-agent');

console.log("=== PROXY DESTEKLI ULTRA GIZLI BOT SISTEMI BASLATILIYOR ===");

// Railway Canlı Tutma Sunucusu
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot Sistemleri Proxy Modunda Aktif!\n');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`Web portu ${PORT} aktif.`); });

const AYARLAR = {
  host: 'mc.quiltanarchy.xyz',
  version: '1.21.1',
  // Fotoğraftaki çalışan ve stabil duran SOCKS5 proxy adresi entegre edildi:
  proxy: "socks5://174.75.211.193:4145" 
};

const klanListesi = new Set(['umut', 'umutedfg2']); 
let bot;
let takipEdilenOyuncu = null;

function botuBaslat() {
  const rastgeleGecikme = Math.floor(Math.random() * 5000) + 2000;
  console.log(`>>> Proxy üzerinden baglanti maskeleniyor... ${rastgeleGecikme}ms sonra sızma denenecek.`);

  setTimeout(() => {
    const botSecenekleri = {
      host: AYARLAR.host,
      username: 'S2k_' + Math.floor(1000 + Math.random() * 9000),
      version: AYARLAR.version,
      checkTimeoutInterval: 120000,
      physicsEnabled: true 
    };

    // Proxy aktif ediliyor
    if (AYARLAR.proxy && AYARLAR.proxy !== "") {
      botSecenekleri.agent = new SocksProxyAgent(AYARLAR.proxy);
      console.log(`-> Baglanti guvenli maske adresi uzerinden yonlendiriliyor: ${AYARLAR.proxy}`);
    }

    bot = mineflayer.createBot(botSecenekleri);
    bot.loadPlugin(pathfinder);

    bot.on('login', () => {
      console.log(`>>> Sizma Basarili! Sunucuya girildi: ${bot.username}`);
      setInterval(() => {
        if (bot && bot._client) bot._client.write('keep_alive', { id: Math.floor(Math.random() * 1000) });
      }, 10000);
    });

    bot.on('spawn', () => {
      console.log(">>> Bot dünyada doğdu. Koruma duvarı proxy ile aşıldı!");
      
      setTimeout(() => {
        bot.chat('/register S2kBot123 S2kBot123'); 
        bot.chat('/login S2kBot123');
      }, 3000);
      
      const afkInterval = setInterval(() => {
        if (!bot) return clearInterval(afkInterval);
        const eylem = Math.random();

        if (eylem < 0.2) {
          const yaw = (Math.random() * 360 - 180) * (Math.PI / 180);
          const pitch = (Math.random() * 60 - 30) * (Math.PI / 180);
          bot.look(yaw, pitch);
        } else if (eylem < 0.4) {
          bot.setControlState('forward', true);
          setTimeout(() => bot.setControlState('forward', false), 400);
        } else if (eylem < 0.6) {
          bot.setControlState('jump', true);
          setTimeout(() => bot.setControlState('jump', false), 300);
        } else if (eylem < 0.8) {
          const slot = Math.floor(Math.random() * 9);
          bot.setQuickBarSlot(slot);
        } else {
          bot.swingArm('right');
        }
      }, 12000);
    });

    // GELISMIS SOHBET VE KOMUTLAR
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
      console.log(`!!! Sunucudan atılma gerçekleşti. Sebep: ${reason}`);
      yenidenBaglan();
    });

    bot.on('error', (err) => {
      console.log(`!!! Bağlantı hatası: ${err.message}`);
      yenidenBaglan();
    });

  }, rastgeleGecikme);
}

function yenidenBaglan() {
  const sonrakiDene = Math.floor(Math.random() * 10000) + 10000;
  console.log(`>>> Sabırlı Mod: ${sonrakiDene / 1000} saniye sonra tamamen yeni bir proxy kimliğiyle sızma denenecek...`);
  setTimeout(() => { botuBaslat(); }, sonrakiDene);
}

botuBaslat();
