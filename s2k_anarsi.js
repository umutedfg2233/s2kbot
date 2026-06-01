const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const SIFRE = 'illegalcivcivv';
const izinliOyuncular = ['umut', 'umutedfg2'];

function botuBaslat() {
  const bot = mineflayer.createBot({
    host: 'mc.quiltanarchy.xyz',
    port: 25565,
    username: 's2kbot',
    version: '1.21.1',
    auth: 'offline'
  });

  bot.loadPlugin(pathfinder);
  let antiAfkModu = false;
  let korumaModu = false;

  // Lobi Giriş Sistemi
  bot.on('message', (msg) => {
    const text = msg.toString().toLowerCase();
    if (text.includes('login') || text.includes('şifre')) {
      bot.chat(`/login ${SIFRE}`);
    }
  });

  // Gelişmiş AFK ve Koruma (PhysicsTick)
  bot.on('physicsTick', () => {
    // Anti-AFK: Zıplayıp etrafına bakarak atılmayı engelle
    if (antiAfkModu && Math.random() < 0.02) {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
      bot.look(bot.entity.yaw + 1, 0);
    }
    // Koruma Modu: Yakındaki yabancılara saldır
    if (korumaModu) {
      const entity = bot.nearestEntity(e => e.type === 'player' && !izinliOyuncular.includes(e.username.toLowerCase()));
      if (entity && bot.entity.position.distanceTo(entity.position) < 4) {
        bot.attack(entity);
      }
    }
  });

  // Komut Sistemi
  bot.on('chat', (username, message) => {
    if (!izinliOyuncular.includes(username.toLowerCase())) return;

    if (message.startsWith('#')) {
      const args = message.slice(1).trim().split(/ +/);
      const komut = args.shift().toLowerCase();

      // Takip ve Gelme (Gelişmiş Rota Hesaplama)
      if (komut === 'takip') {
        const target = bot.players[username]?.entity;
        if (target) {
          const move = new Movements(bot, bot.registry);
          bot.pathfinder.setMovements(move);
          bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true);
        }
      }
      if (komut === 'gel') {
        const target = bot.players[username]?.entity;
        if (target) {
          const move = new Movements(bot, bot.registry);
          bot.pathfinder.setMovements(move);
          bot.pathfinder.setGoal(new goals.GoalNear(target.position.x, target.position.y, target.position.z, 1));
        }
      }
      if (komut === 'dur') bot.pathfinder.setGoal(null);

      // Özellikler
      if (komut === 'antiofk') antiAfkModu = !antiAfkModu;
      if (komut === 'koru') korumaModu = !korumaModu;
      if (komut === 'tpa') bot.chat(`/tpa ${args[0]}`);
      if (komut === 'clan' && args[0] === 'add') izinliOyuncular.push(args[1].toLowerCase());
      
      if (komut === 'konum') {
        const pos = bot.entity.position;
        bot.chat(`X: ${Math.round(pos.x)} Y: ${Math.round(pos.y)} Z: ${Math.round(pos.z)}`);
      }
    }
    // Otomatik TPA Kabul
    if (message.includes('tpa') || message.includes('teleport')) {
      setTimeout(() => bot.chat(`/tpaccept ${username}`), 1500);
    }
  });

  bot.on('end', () => setTimeout(botuBaslat, 30000));
}

botuBaslat();
