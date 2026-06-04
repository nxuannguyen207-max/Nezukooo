const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { CROP_DATA, MA_SOI_ROLES, AQUA_COIN } = require('./config');

const DB_FILE = path.join(__dirname, 'database.json');
let memoryDB = { users: {}, giveaways: { totalGw: 0, totalDistributed: 0 }, taixiuHistory: {} }; // Đã thêm bộ nhớ cầu

function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    memoryDB = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!memoryDB.taixiuHistory) memoryDB.taixiuHistory = {};
  } else {
    saveDatabase();
  }
}

function saveDatabase() {
  fs.writeFileSync(DB_FILE, JSON.stringify(memoryDB, null, 2), 'utf8');
}

function getAccount(userId, username = 'User') {
  if (!memoryDB.users[userId]) {
    memoryDB.users[userId] = {
      userId, coins: 5000, tickets: 0, lastDaily: null, dailyStreak: 0, lastWork: null, history: [],
      farm: {
        username, level: 1, exp: 0, totalIncome: 0, maxPlots: 4,
        inventory: { 'Cà Rốt': 10, 'Dâu Tây': 0, 'Bắp': 0, 'Bí Ngô': 0, 'Dứa': 0, 'Hoa Hồng': 0, 'Hoa Pha Lê': 0 },
        tools: { 'Bình Tưới': 1, 'Phân Bón': 0, 'Thuốc Tăng Trưởng': 0 },
        pets: { 'Thỏ': false, 'Chó': false },
        weather: '☀️ Nắng', quests: { dailyDone: false, progress: 0 }, plantCount: 0, harvestCount: 0,
        plots: Array.from({ length: 4 }, (_, i) => ({ id: i + 1, cropName: null, plantedAt: null, duration: 0 }))
      }
    };
    saveDatabase();
  }
  const acc = memoryDB.users[userId];
  if (!acc.farm.tools) acc.farm.tools = { 'Bình Tưới': 1, 'Phân Bón': 0, 'Thuốc Tăng Trưởng': 0 };
  if (!acc.farm.quests) acc.farm.quests = { dailyDone: false, progress: 0 };
  return acc;
}

function modifyCoins(userId, amount, reason, isIncome = true) {
  if (isNaN(amount) || amount <= 0) return false;
  const account = getAccount(userId);
  if (!isIncome && account.coins < amount) return false;
  
  account.coins += isIncome ? amount : -amount;
  if (!account.history) account.history = [];
  account.history.push({
    type: isIncome ? 'INCOME' : 'EXPENSE', amount, reason, timestamp: new Date().toISOString()
  });
  if (account.history.length > 20) account.history.shift();
  saveDatabase();
  return true;
}

function generateFarmEmbed(farm, ownerId) {
  let now = new Date();
  let plotStr = '';
  farm.plots.forEach(p => {
    if (!p.cropName) {
      plotStr += `⚙️ Ô đất [${p.id}]: 🟫 **Đất Trống**\n`;
    } else {
      const ready = new Date(new Date(p.plantedAt).getTime() + p.duration);
      const diff = ready - now;
      plotStr += diff <= 0 
        ? `⚙️ Ô đất [${p.id}]: 🌾 **${p.cropName}** [🍓 QUẢ ĐÃ CHÍN, THU HOẠCH NGAY!]\n`
        : `⚙️ Ô đất [${p.id}]: 🌱 **${p.cropName}** (⏳ Còn ${Math.ceil(diff / 60000)} phút chín)\n`;
    }
  });
  let invStr = Object.entries(farm.inventory).filter(([_, q]) => q > 0).map(([c, q]) => `• **${c}**: \`${q}\` trái\n`).join('') || '*Kho rỗng, hãy chăm chỉ gieo trồng.*';
  return new EmbedBuilder()
    .setTitle(`🌱 TRANG TRẠI SINH THÁI CỦA: ${farm.username}`)
    .setDescription(`🏡 Cấp độ nhà nông: **Cấp ${farm.level}** | ⭐ Tổng tích lũy EXP: \`${farm.exp}\` \n🌈 Thời tiết: **${farm.weather}**\n💰 Tổng thu nhập từ nông nghiệp: \`${farm.totalIncome.toLocaleString()}\` ${AQUA_COIN}\n\n🌾 **TRẠNG THÁI CÁC Ô RUỘNG ĐẤT (${farm.maxPlots} ô):**\n${plotStr}\n📦 **VẬT PHẨM SẢN PHẨM TRONG KHO:**\n${invStr}`)
    .setFooter({ text: 'Sử dụng lệnh Asell all để bán sạch nông sản quy ra tiền xu!' })
    .setColor('#32cd32');
}

// Hàm cập nhật kết quả phiên cược và đẩy vào hệ thống lịch sử cầu
function executeTaiXiuResult(guildId, channel, sessionState) {
  const tx = sessionState.taixiu.get(guildId);
  if (!tx || tx.ended) return;
  tx.ended = true;
  const d1 = Math.floor(Math.random() * 6) + 1, d2 = Math.floor(Math.random() * 6) + 1, d3 = Math.floor(Math.random() * 6) + 1;
  const sum = d1 + d2 + d3;
  const resTX = sum >= 11 ? 'Tài' : 'Xỉu', resCL = sum % 2 === 0 ? 'Chẵn' : 'Lẻ';
  
  // Lưu cầu vào Lịch sử hệ thống (Tối đa lưu 15 phiên gần nhất)
  if (!memoryDB.taixiuHistory[guildId]) memoryDB.taixiuHistory[guildId] = [];
  memoryDB.taixiuHistory[guildId].push(resTX === 'Tài' ? '🔴 T' : '🔵 X');
  if (memoryDB.taixiuHistory[guildId].length > 15) memoryDB.taixiuHistory[guildId].shift();
  saveDatabase();

  let report = `🎲 **KẾT QUẢ PHIÊN TÀI XỈU** 🎲\nKết quả xúc xắc: **${d1} + ${d2} + ${d3} = ${sum}**\n👉 Hệ thống xác định: **[${resTX} - ${resCL}]**\n\n`;
  if (tx.bets.length === 0) report += '*Không có thành viên nào cược.*';
  tx.bets.forEach(b => {
    if (b.type === resTX || b.type === resCL) {
      modifyCoins(b.userId, b.amount * 2, `Trúng thưởng Tài Xỉu`, true);
      report += `• <@${b.userId}> cược **${b.amount.toLocaleString()}** -> 🎉 **Thắng** nhận **+${(b.amount * 2).toLocaleString()}** ${AQUA_COIN}\n`;
    } else {
      report += `• <@${b.userId}> cược **${b.amount.toLocaleString()}** -> ❌ Thua sạch.\n`;
    }
  });
  sessionState.taixiu.delete(guildId);
  channel.send({ embeds: [new EmbedBuilder().setTitle('🔔 ĐÓNG SẢNH TÀI XỈU').setDescription(report).setColor('#ff4500')] });
}

function endLuckyNumberGame(guildId, channel, sessionState) {
  const ln = sessionState.luckyNumber.get(guildId);
  if (!ln) return;
  const validPlayers = ln.participants.filter(p => p.chosenNumber !== null);
  if (validPlayers.length === 0) {
    sessionState.luckyNumber.delete(guildId);
    return channel.send('🍀 | Phiên Số May Mắn tự động hủy do không có ai chọn số.');
  }
  const pool = ln.participants.length * 10000;
  const systemLuckyNumbers = [];
  while (systemLuckyNumbers.length < ln.winnersCount) {
    const r = Math.floor(Math.random() * 99) + 1;
    if (!systemLuckyNumbers.includes(r)) systemLuckyNumbers.push(r);
  }
  const winners = validPlayers.filter(p => systemLuckyNumbers.includes(p.chosenNumber));
  let str = `🏁 **KẾT QUẢ PHÒNG QUAY SỐ MAY MẮN** 🏁\n• Mã số trúng thưởng: **${systemLuckyNumbers.join(', ')}**\n• Tổng hũ: **${pool.toLocaleString()}** ${AQUA_COIN}\n\n`;
  if (winners.length === 0) {
    str += '🍀 Không ai trúng giải kỳ này.';
  } else {
    const eachReward = Math.floor(pool / winners.length);
    winners.forEach(w => {
      modifyCoins(w.userId, eachReward, 'Trúng giải Số May Mắn', true);
      str += `🎉 <@${w.userId}> chốt trúng số [${w.chosenNumber}], ôm trọn: **+${eachReward.toLocaleString()}** ${AQUA_COIN}!\n`;
    });
  }
  sessionState.luckyNumber.delete(guildId);
  channel.send({ embeds: [new EmbedBuilder().setTitle('🍀 KẾT QUẢ QUAY SỐ').setDescription(str).setColor('#00ffaa')] });
}

function resolveGiveaway(mid, client) {
  const gw = memoryDB.giveaways[mid];
  if (!gw || gw.status !== 'RUNNING') return;
  gw.status = 'ENDED';
  const clientChannel = client.channels.cache.get(gw.channelId);
  if (!clientChannel) return;
  if (gw.participants.length === 0) {
    saveDatabase();
    return clientChannel.send(`🎉 **GIVEAWAY KẾT THÚC** 🎉\n🔴 Hủy bỏ: Không ai tham gia.`);
  }
  const winners = [];
  const pool = [...gw.participants];
  const count = Math.min(gw.winnersCount, pool.length);
  for (let i = 0; i < count; i++) {
    winners.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  gw.winners = winners;
  memoryDB.giveaways.totalGw = (memoryDB.giveaways.totalGw || 0) + 1;
  const prizeMoney = parseInt(gw.prize.replace(/,/g, ''));
  if (!isNaN(prizeMoney) && prizeMoney > 0) {
    winners.forEach(wId => { modifyCoins(wId, prizeMoney, `Trúng thưởng Giveaway`, true); });
  }
  saveDatabase();
  clientChannel.send(`🎉 **GIVEAWAY KẾT THÚC** 🎉\n• Quà: **${gw.prize}**\n• Người thắng: ${winners.map(w => `<@${w}>`).join(', ')}`);
}

function allocateWerewolfRoles(room) {
  const total = room.players.length;
  const deck = ['tien tri', 'bao ve', 'phu thuy', 'ma soi'];
  const remainKeys = Object.keys(MA_SOI_ROLES).filter(k => !deck.includes(k));
  while (deck.length < total) deck.push(remainKeys[Math.floor(Math.random() * remainKeys.length)]);
  deck.sort(() => Math.random() - 0.5);
  room.players.forEach((pId, idx) => { room.rolesMap[pId] = deck[idx]; });
}

async function notifyPlayersAndCreateNightChannels(room, guild, textChannel, client) {
  for (const pId of room.players) {
    const user = await client.users.fetch(pId).catch(() => null);
    if (user) {
      const rInfo = MA_SOI_ROLES[room.rolesMap[pId]];
      await user.send(`🎭 **VAI TRÒ BÍ MẬT:** Bạn là **${rInfo.name}**\nPhe: *${rInfo.side}*\nSkill: ${rInfo.skill}`).catch(() => {});
    }
  }
  room.phase = 'NIGHT'; room.nightCount += 1;
  await textChannel.permissionOverwrites.set([{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages] }]).catch(() => {});
  const wolfChannel = await guild.channels.create({
    name: `hang-soi-dem-${room.nightCount}`, type: ChannelType.GuildText,
    permissionOverwrites: [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }]
  }).catch(() => null);
  if (wolfChannel) {
    for (const pId of room.players) {
      if (MA_SOI_ROLES[room.rolesMap[pId]].side === 'Ma Sói') {
        await wolfChannel.permissionOverwrites.create(pId, { ViewChannel: true, SendMessages: true }).catch(() => {});
      }
    }
    await wolfChannel.send(`🐺 **ĐÊM SĂN SỐ ${room.nightCount} CỦA PHE MA SÓI** 🐺`);
  }
  textChannel.send(`🌙 **ĐÊM SỐ ${room.nightCount} BUÔNG XUỐNG** 🌙`);
}

module.exports = {
  memoryDB, loadDatabase, saveDatabase, getAccount, modifyCoins, generateFarmEmbed,
  executeTaiXiuResult, endLuckyNumberGame, resolveGiveaway, allocateWerewolfRoles, notifyPlayersAndCreateNightChannels
};


