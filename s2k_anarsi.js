const mineflayer = require('mineflayer');
const http = require('http');

// Render portunu canlı tutmak için
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot aktif!');
}).listen(process.env.PORT || 10000);

// Rastgele isim oluşturucu (Anti-Bot'u şaşırtmak için)
const randomName = 'S2k_' + Math.floor(Math.random() * 9000 + 1000);

const bot = mineflayer.createBot({
  host: 'mc.quiltanarchy.xyz',
  username: randomName,
  version: '1.21.1',
  checkTimeoutInterval: 60000 // Bağlantı zaman aşımını uzatıyoruz
});

let clanMembers = [];
let following = null;

// Anti-AFK (Daha doğal olması için zamanlamayı değiştirdik)
setInterval(() => {
  bot.setControlState('jump', true);
  setTimeout(() => bot.setControlState('jump', false), 400);
}, 45000);

bot.on('login', () => {
  console.log(`Giriş yapıldı: ${randomName}`);
});

bot.on('spawn', () => {
  console.log("Bot oyunda doğdu!");
  bot.chat("Selam, S2k_Bot aktif!");
});

bot.on('chat', (username, message) => {
  if (username === bot.username) return;

  if (message.startsWith('#clan add ')) {
    const target = message.split(' ')[2];
    if (!clanMembers.includes(target)) {
      clanMembers.push(target);
      bot.chat(`${target} clan listesine eklendi.`);
    }
  }

  if (message.startsWith('#tpa ')) {
    if (clanMembers.includes(username)) {
      const target = message.split(' ')[1];
      bot.chat(`/tpa ${target}`);
    } else {
      bot.chat("Bu komutu kullanmak için clan üyesi olmalısın.");
    }
  }

  if (message.startsWith('#takip ')) {
    following = message.split(' ')[1];
    bot.chat(`${following} takip ediliyor.`);
  }

  if (message === '#dur') {
    following = null;
    bot.chat("Takip durduruldu.");
  }
});

bot.on('physicsTick', () => {
  if (following && bot.players[following] && bot.players[following].entity) {
    bot.lookAt(bot.players[following].entity.position.offset(0, 1.6, 0));
  }
});

bot.on('kicked', (reason) => {
  console.log("Sunucudan atıldı: " + reason);
});

bot.on('error', (err) => {
  console.log('Hata: ', err);
});
