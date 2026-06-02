const mineflayer = require('mineflayer');

const bot = mineflayer.createBot({
  host: 'mc.quiltanarchy.xyz',
  username: 'S2k_Bot',
  version: '1.21.1' 
});

let clanMembers = []; // Clan listesi
let following = null; // Takip edilecek oyuncu

// Anti-AFK (Arada zıpla veya dön)
setInterval(() => {
  bot.setControlState('jump', true);
  setTimeout(() => bot.setControlState('jump', false), 500);
}, 60000);

bot.on('spawn', () => {
  console.log("Bot QuiltAnarchy sunucusuna giriş yaptı!");
});

bot.on('chat', (username, message) => {
  if (username === bot.username) return;

  // #clan add [isim]
  if (message.startsWith('#clan add ')) {
    const target = message.split(' ')[2];
    clanMembers.push(target);
    bot.chat(`${target} clan listesine eklendi.`);
  }

  // #tpa [isim] (Sadece clan üyeleri kullanabilir)
  if (message.startsWith('#tpa ')) {
    if (clanMembers.includes(username)) {
      const target = message.split(' ')[1];
      bot.chat(`/tpa ${target}`);
      bot.chat(`${target} kişisine TPA isteği gönderildi.`);
    } else {
      bot.chat("Bu komutu kullanmak için clan üyesi olmalısın.");
    }
  }

  // #takip [isim]
  if (message.startsWith('#takip ')) {
    following = message.split(' ')[1];
    bot.chat(`${following} kişisi takip ediliyor.`);
  }

  if (message === '#dur') {
    following = null;
    bot.chat("Takip durduruldu.");
  }
});

// Takip etme mantığı
bot.on('physicsTick', () => {
  if (following) {
    const player = bot.players[following];
    if (player && player.entity) {
      bot.lookAt(player.entity.position.offset(0, player.entity.height, 0));
    }
  }
});

bot.on('error', (err) => console.log('Hata: ', err));

console.log("Bot başlatıldı ve özellikler yüklendi!");
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot aktif!');
}).listen(process.env.PORT || 10000);
