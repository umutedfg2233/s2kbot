const mineflayer = require('mineflayer');

const bot = mineflayer.createBot({
  host: '6b6t.org', // Sunucu IP adresini buraya yaz
  username: 'SeninBotIsmin', // Botun ismi
  version: '1.20.1' // Sunucu sürümü
});

bot.on('spawn', () => {
  console.log("Bot oyuna girdi!");
});

bot.on('chat', (username, message) => {
  if (message === '#konum') {
    bot.chat(`Konumum: ${bot.entity.position}`);
  }
});

bot.on('error', (err) => console.log(err));

// Botun başarıyla başlatıldığını loglarda görmek için:
console.log("Bot baslatildi!");
