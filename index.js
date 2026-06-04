const { 
  Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, 
  ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');
const express = require('express');
const { AQUA_COIN, TICKET_EMOJI, ADMIN_ID, STAFF_IDS, CROP_DATA, MA_SOI_ROLES } = require('./config');
const { 
  memoryDB, loadDatabase, saveDatabase, getAccount, modifyCoins, generateFarmEmbed,
  executeTaiXiuResult, endLuckyNumberGame, resolveGiveaway, allocateWerewolfRoles, notifyPlayersAndCreateNightChannels
} = require('./helpers');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates],
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
});

const app = express();
app.get('/', (req, res) => res.send({ status: "🟢 Hoạt động ổn định!", uptime: process.uptime() }));
app.listen(process.env.PORT || 3000, () => console.log(`🌐 Web Server running`));

const activeInteractions = new Set();
const sessionState = { taixiu: new Map(), luckyNumber: new Map(), werewolf: new Map() };

loadDatabase();

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const guildId = message.guild.id;
  const args = message.content.trim().split(/ +/);
  const command = args[0].toLowerCase();

  if (mwRoom && mwRoom.status === 'PLAYING' && mwRoom.channelId === message.channel.id) {
    if (mwRoom.deadPlayers.includes(message.author.id) || mwRoom.phase === 'NIGHT') return message.delete().catch(() => {});
  }

  const lnSession = sessionState.luckyNumber.get(guildId);
  if (lnSession && !isNaN(parseInt(message.content))) {
    const num = parseInt(message.content);
    if (num >= 1 && num <= 99) {
      const p = lnSession.participants.find(p => p.userId === message.author.id);
      if (p && p.chosenNumber === null) {
        p.chosenNumber = num;
        return message.reply(`🍀 | Bạn đã chọn mã số **[${num}]**!`);
      }
    }
  }

  if (['acash', 'acoin', 'agold'].includes(command)) {
    const acc = getAccount(message.author.id, message.author.username);
    return message.reply(`✅️ | Bạn có **${acc.coins.toLocaleString()}** ${AQUA_COIN} và **${acc.tickets}** ${TICKET_EMOJI}`);
  }

  if (command === 'adaily') {
    if (activeInteractions.has(message.author.id)) return message.reply('🔴 | Thao tác quá nhanh!');
    activeInteractions.add(message.author.id);
    const acc = getAccount(message.author.id, message.author.username);
    const now = new Date();
    if (acc.lastDaily && (now - new Date(acc.lastDaily)) < 24 * 60 * 60 * 1000) {
      activeInteractions.delete(message.author.id);
      return message.reply(`🔴 | Hôm nay bạn điểm danh rồi!`);
    }
    const bonus = Math.floor(Math.random() * 999) + 1;
    acc.coins += bonus;
    acc.dailyStreak = (acc.lastDaily && (now - new Date(acc.lastDaily)) < 48 * 60 * 60 * 1000) ? acc.dailyStreak + 1 : 1;
    acc.lastDaily = now.toISOString();
    saveDatabase();
    activeInteractions.delete(message.author.id);
    return message.reply(`✅️ | Nhận được **${bonus}** ${AQUA_COIN}! Chuỗi: **${acc.dailyStreak}** ngày!`);
  }

  if (command === 'awork') {
    if (activeInteractions.has(message.author.id)) return message.reply('🔴 | Thao tác quá nhanh!');
    activeInteractions.add(message.author.id);
    const acc = getAccount(message.author.id, message.author.username);
    const now = new Date();
    if (acc.lastWork && (now - new Date(acc.lastWork)) < 5 * 60 * 1000) {
      activeInteractions.delete(message.author.id);
      return message.reply(`🔴 | Đang mệt, quay lại sau!`);
    }
    const salary = Math.floor(Math.random() * 4999) + 1;
    acc.coins += salary;
    acc.lastWork = now.toISOString();
    saveDatabase();
    activeInteractions.delete(message.author.id);
    return message.reply(`✅️ | Nhận lương: **${salary.toLocaleString()}** ${AQUA_COIN}!`);
  }

  if (command === 'alixi') {
    const amount = parseInt(args[1]), duration = args[2];
    if (isNaN(amount) || amount <= 0 || !duration) return message.reply('🔴 | Cú pháp: `Alixi {tiền} {thời gian}`');
    if (!modifyCoins(message.author.id, amount, 'Thả xì', false)) return message.reply('🔴 | Bạn không đủ tiền!');
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`lixi_claim_${message.author.id}_${amount}_${Date.now()}`).setLabel('🧨 Giật Lì Xì').setStyle(ButtonStyle.Success));
    return message.channel.send({ content: `🎉 **${message.author.username}** thả bao lì xì trị giá **${amount.toLocaleString()}** ${AQUA_COIN}!`, components: [row] });
  }

  if (command === 'agive') {
    const target = message.mentions.users.first(), amount = parseInt(args[2]);
    if (!target || isNaN(amount) || amount <= 0 || target.id === message.author.id) return message.reply('🔴 | Cú pháp: `Agive @user {số tiền}`');
    if (!modifyCoins(message.author.id, amount, `Chuyển cho ${target.username}`, false)) return message.reply('🔴 | Thiếu tiền!');
    modifyCoins(target.id, amount, `Nhận từ ${message.author.username}`, true);
    return message.reply(`✅️ | Đã chuyển **${amount.toLocaleString()}** ${AQUA_COIN} cho **${target}**!`);
  }

  if (command === 'aadd') {
    if (message.author.id !== ADMIN_ID) return message.reply('🔴 | Chỉ Admin cấp cao!');
    const target = message.mentions.users.first(), amount = parseInt(args[2]);
    if (!target || isNaN(amount)) return message.reply('🔴 | Cú pháp: `Aadd @user {tiền}`');
    modifyCoins(target.id, amount, 'Admin cấp', true);
    return message.reply(`✅️ | Đã cấp **${amount.toLocaleString()}** cho **${target.username}**.`);
  }

  if (command === 'asomayman') {
    const winnersCount = parseInt(args[1]), dStr = args[2];
    if (isNaN(winnersCount) || !dStr) return message.reply('🔴 | Mẫu: `Asomayman 2 30s`');
    let ms = dStr.endsWith('s') ? parseInt(dStr) * 1000 : parseInt(dStr) * 60 * 1000;
    if (sessionState.luckyNumber.has(guildId)) return message.reply('🔴 | Game đang diễn ra.');
    sessionState.luckyNumber.set(guildId, { winnersCount, participants: [] });
    const embed = new EmbedBuilder().setTitle('🍀 PHÒNG QUAY SỐ MAY MẮN 🍀').setDescription(`Phí: 10k Coin\nThời gian: **${dStr}**`).setColor('#00ff88');
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ln_btn_buy').setLabel('🎟️ Đăng ký mua vé số').setStyle(ButtonStyle.Primary));
    await message.channel.send({ embeds: [embed], components: [row] });
    setTimeout(() => { endLuckyNumberGame(guildId, message.channel, sessionState); }, ms);
    return;
  }

  if (command === 'axin') {
    const amount = parseInt(args[1]), target = message.mentions.users.first();
    if (isNaN(amount) || !target || target.id === message.author.id) return message.reply('🔴 | Cú pháp: `Axin {tiền} @user`');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`xin_ok_${message.author.id}_${target.id}_${amount}`).setLabel('✅ Cho').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`xin_no_${message.author.id}_${target.id}_${amount}`).setLabel('❌ Không').setStyle(ButtonStyle.Danger)
    );
    return message.channel.send({ content: `🥺 **${message.author}** đang xin **${amount.toLocaleString()}** từ đại gia **${target}**.`, components: [row] });
  }

  // TÀI XỈU (ĐÃ THÊM HỆ THỐNG HIỂN THỊ CẦU)
  if (command === 'ataixiu') {
    if (sessionState.taixiu.has(guildId)) return message.reply('🎲 Sảnh cược đang mở rồi.');
    sessionState.taixiu.set(guildId, { messageId: null, bets: [], ended: false });

    // Lấy chuỗi lịch sử cầu trong database
    const history = memoryDB.taixiuHistory[guildId] || [];
    const historyStr = history.length > 0 ? history.join(' ➔ ') : '*Chưa có dữ liệu phiên cũ.*';

    const embed = new EmbedBuilder()
      .setTitle('🎲 SẢNH CƯỢC TÀI XỈU V3 🎲')
      .setDescription(`⏳ **Thời gian đặt cược: 30 giây**\n\n📊 **LỊCH SỬ CẦU GẦN ĐÂY (Tối đa 15 phiên):**\n${historyStr}`)
      .setColor('#ffaa00');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('tx_b_Xỉu').setLabel('Xỉu [x2]').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('tx_b_Tài').setLabel('Tài [x2]').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('tx_b_Chẵn').setLabel('Chẵn [x2]').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('tx_b_Lẻ').setLabel('Lẻ [x2]').setStyle(ButtonStyle.Secondary)
    );
    const msg = await message.channel.send({ embeds: [embed], components: [row] });
    sessionState.taixiu.get(guildId).messageId = msg.id;
    setTimeout(() => { executeTaiXiuResult(guildId, message.channel, sessionState); }, 30000);
    return;
  }

  if (command === 'alichsu') {
    const target = message.mentions.users.first() || message.author;
    const acc = getAccount(target.id, target.username);
    let str = `📜 **LỊCH SỬ GIAO DỊCH CỦA ${target.username.toUpperCase()}**\n💰 Số dư: **${acc.coins.toLocaleString()}**\n\n`;
    if (!acc.history || acc.history.length === 0) str += '*Chưa ghi nhận biến động.*';
    else acc.history.slice().reverse().forEach(h => { str += `\`[${new Date(h.timestamp).toLocaleTimeString()}]\` ${h.type === 'INCOME' ? '➕' : '➖'}**${h.amount.toLocaleString()}** | *${h.reason}*\n`; });
    return message.channel.send(str);
  }

  if (command === 'atop') {
    const sorted = Object.values(memoryDB.users).sort((a, b) => b.coins - a.coins).slice(0, 10);
    let str = '🏆 **BẢNG XẾP HẠNG ĐẠI GIA** 🏆\n\n';
    sorted.forEach((u, i) => { str += `${i+1}. **${u.farm?.username || 'Ẩn Danh'}** — ${u.coins.toLocaleString()} ${AQUA_COIN}\n`; });
    return message.channel.send(str);
  }

  if (command === 'agiveaway') {
    if (message.author.id !== ADMIN_ID && !STAFF_IDS.includes(message.author.id)) return message.reply('🔴 | Không đủ quyền!');
    const action = args[1]?.toLowerCase();
    if (action === 'end') {
      const mid = args[2];
      if (!mid || !memoryDB.giveaways[mid] || memoryDB.giveaways[mid].status !== 'RUNNING') return message.reply('🔴 | Không tìm thấy ID!');
      memoryDB.giveaways[mid].endTime = Date.now();
      resolveGiveaway(mid, client);
      return message.reply('✅️ | Kết thúc ngay lập tức.');
    }
    const winnersCount = parseInt(args[1]), dStr = args[2], prize = args.slice(3).join(' ');
    if (isNaN(winnersCount) || !dStr || !prize) return message.reply('🔴 | Cú pháp: `Agiveaway {số người} {phút} {quà}`');
    let ms = parseInt(dStr) * 60 * 1000; const endTime = Date.now() + ms;
    const embed = new EmbedBuilder().setTitle(`🎉 GIVEAWAY: ${prize} 🎉`).setDescription(`Kết thúc lúc: <t:${Math.floor(endTime / 1000)}:R>`).setColor('#ff00ff');
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('gw_join_btn').setLabel('🎉 Tham Gia').setStyle(ButtonStyle.Success));
    const gwMsg = await message.channel.send({ embeds: [embed], components: [row] });
    memoryDB.giveaways[gwMsg.id] = { messageId: gwMsg.id, channelId: message.channel.id, prize, winnersCount, endTime, participants: [], status: 'RUNNING' };
    saveDatabase();
    setTimeout(() => { resolveGiveaway(gwMsg.id, client); }, ms);
    return;
  }

  if (command === 'astartmasoi') {
    if (sessionState.werewolf.has(guildId)) return message.reply('🔴 | Đã có phòng Ma Sói hoạt động.');
    sessionState.werewolf.set(guildId, { status: 'SETUP', creatorId: message.author.id, channelId: message.channel.id, players: [message.author.id], deadPlayers: [], rolesMap: {}, phase: 'DAY', dayCount: 1, nightCount: 0 });
    const embed = new EmbedBuilder().setTitle('🐺 SẢNH CHỜ GAME MA SÓI 🐺').setDescription(`Danh sách:\n▪️ 1. <@${message.author.id}>`).setColor('#2f3136');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ms_btn_join').setLabel('✅️ Tham Gia').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ms_btn_leave').setLabel('🚪 Rời Khỏi').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ms_btn_start').setLabel('▶️ Bắt Đầu').setStyle(ButtonStyle.Success)
    );
    return message.channel.send({ embeds: [embed], components: [row] });
  }

  if (command === 'astopmasoi') {
    const room = sessionState.werewolf.get(guildId);
    if (!room || (message.author.id !== room.creatorId && message.author.id !== ADMIN_ID)) return message.reply('🔴 | Không thể hủy.');
    sessionState.werewolf.delete(guildId);
    return message.reply('🛑 | Đã cưỡng chế hủy.');
  }

  if (command === 'amasoi' && args[1] === 'role') {
    const query = args.slice(2).join(' ').toLowerCase();
    const matchedKey = Object.keys(MA_SOI_ROLES).find(k => k === query || MA_SOI_ROLES[k].name.toLowerCase().includes(query));
    if (!matchedKey) return message.reply('🔴 | Không tìm thấy.');
    const info = MA_SOI_ROLES[matchedKey];
    const embed = new EmbedBuilder().setTitle(`🎭 Vai trò: ${info.name}`).addFields({ name: '🌐 Phe', value: info.side }, { name: '🎯 Thắng', value: info.win }, { name: '✨ Skill', value: info.skill }).setColor('#8a2be2');
    return message.reply({ embeds: [embed] });
  }

  if (command === 'afarm') {
    const sub = args[1]?.toLowerCase(); const acc = getAccount(message.author.id, message.author.username);
    if (!sub) {
      const embed = generateFarmEmbed(acc.farm, message.author.id);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('farm_btn_plant').setLabel('🌱 Gieo Hạt').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('farm_btn_harvest').setLabel('🌾 Thu Hoạch').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('farm_btn_weather').setLabel('🎲 Thời Tiết').setStyle(ButtonStyle.Secondary)
      );
      return message.channel.send({ embeds: [embed], components: [row] });
    }
    if (sub === 'shop') {
      let str = '🏪 **CỬA HÀNG NÔNG NGHIỆP V3** 🏪\n\n';
      for (const [name, data] of Object.entries(CROP_DATA)) str += `• **${name}**: Mua: \`${data.seedPrice}\` | Bán: \`${data.sellPrice}\` (Chín: ${data.time / 60000}ph)\n`;
      return message.channel.send(str);
    }
    if (sub === 'upgrade') {
      if (acc.farm.maxPlots >= 12) return message.reply('🔴 | Đạt giới hạn 12 ô.');
      const cost = acc.farm.maxPlots * 50000;
      if (!modifyCoins(message.author.id, cost, `Mua ô đất`, false)) return message.reply(`🔴 | Cần ${cost.toLocaleString()} xu.`);
      acc.farm.maxPlots += 1; acc.farm.plots.push({ id: acc.farm.maxPlots, cropName: null, plantedAt: null, duration: 0 });
      saveDatabase();
      return message.reply(`✅️ | Đã mở rộng lên **${acc.farm.maxPlots}** ô.`);
    }
  }

  if (command === 'asell' && args[1] === 'all') {
    const acc = getAccount(message.author.id, message.author.username);
    let totalEarnings = 0, itemsSold = 0;
    for (const [cropName, count] of Object.entries(acc.farm.inventory)) {
      if (count > 0 && CROP_DATA[cropName]) {
        totalEarnings += count * CROP_DATA[cropName].sellPrice; itemsSold += count; acc.farm.inventory[cropName] = 0;
      }
    }
    if (totalEarnings === 0) return message.reply('🔴 | Kho trống rỗng.');
    acc.farm.totalIncome += totalEarnings; modifyCoins(message.author.id, totalEarnings, `Bán nông sản`, true);
    return message.reply(`🏪 | Đã bán **${itemsSold}** nông sản, túi nhận: **+${totalEarnings.toLocaleString()}** xu!`);
  }
});

client.on('interactionCreate', async (interaction) => {
  const guildId = interaction.guild?.id;
  if (interaction.isButton()) {
    const cid = interaction.customId;
    if (cid.startsWith('xin_')) {
      const [, status, askerId, giverId, amtStr] = cid.split('_'); const amt = parseInt(amtStr);
      if (interaction.user.id !== giverId) return interaction.reply({ content: '🔴 | Không phải bạn!', ephemeral: true });
      if (status === 'ok') {
        if (!modifyCoins(giverId, amt, `Bố thí`, false)) return interaction.reply({ content: '🔴 | Ví không đủ tiền.', ephemeral: true });
        modifyCoins(askerId, amt, 'Ăn xin thành công', true);
        return interaction.update({ content: `✅️ | Đã tặng <@${askerId}> **${amt.toLocaleString()}** xu!`, components: [] });
      } else return interaction.update({ content: `🔴 | Đã từ chối!`, components: [] });
    }

    if (cid.startsWith('lixi_claim_')) {
      const [, , creatorId, totalAmt, uniqueTs] = cid.split('_');
      const cacheKey = `lixi_${creatorId}_${uniqueTs}`; if (!sessionState[cacheKey]) sessionState[cacheKey] = new Set();
      if (sessionState[cacheKey].has(interaction.user.id)) return interaction.reply({ content: '🔴 | Giật rồi!', ephemeral: true });
      sessionState[cacheKey].add(interaction.user.id);
      const claimed = Math.floor(Math.random() * (parseInt(totalAmt) / 4)) + 10;
      modifyCoins(interaction.user.id, claimed, `Giật xì`, true);
      return interaction.channel.send(`🧨 | **${interaction.user.username}** đã giật được **${claimed.toLocaleString()}** xu từ <@${creatorId}>!`);
    }

    if (cid.startsWith('ms_btn_')) {
      const action = cid.split('_')[2]; const room = sessionState.werewolf.get(guildId);
      if (!room) return interaction.reply({ content: '🔴 | Phòng sập!', ephemeral: true });
      if (action === 'join') {
        if (!room.players.includes(interaction.user.id)) room.players.push(interaction.user.id);
      } else if (action === 'start') {
        if (interaction.user.id !== room.creatorId && interaction.user.id !== ADMIN_ID) return interaction.reply({ content: '🔴 | Không phải chủ phòng!', ephemeral: true });
        room.status = 'PLAYING'; allocateWerewolfRoles(room);
        await interaction.reply({ content: '⚡ Đã phát vai trò bí mật!', ephemeral: true });
        return notifyPlayersAndCreateNightChannels(room, interaction.guild, interaction.channel, client);
      }
      const listStr = room.players.map((id, idx) => `▪️ ${idx + 1}. <@${id}>`).join('\n');
      const embed = EmbedBuilder.from(interaction.message.embeds[0]).setDescription(`Chủ phòng: <@${room.creatorId}>\nSĩ số: **${room.players.length}/44**\n\n${listStr}`);
      return interaction.update({ embeds: [embed] });
    }

    if (cid.startsWith('tx_b_')) {
      const type = cid.split('_')[2];
      const modal = new ModalBuilder().setCustomId(`tx_md_submit_${type}`).setTitle(`Đặt cược vào [${type}]`);
      modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('tx_input_amt').setLabel('Số tiền:').setStyle(TextInputStyle.Short).setRequired(true)));
      return interaction.showModal(modal);
    }

    if (cid === 'ln_btn_buy') {
      const ln = sessionState.luckyNumber.get(guildId);
      if (ln.participants.some(p => p.userId === interaction.user.id)) return interaction.reply({ content: '🔴 | Mua rồi!', ephemeral: true });
      if (!modifyCoins(interaction.user.id, 10000, 'Mua vé số', false)) return interaction.reply({ content: '🔴 | Không đủ 10k.', ephemeral: true });
      ln.participants.push({ userId: interaction.user.id, chosenNumber: null });
      return interaction.reply({ content: '🎟️ Gạch vé xong! Gõ 1 số từ `1` đến `99` lên kênh chat.', ephemeral: true });
    }

    if (cid === 'gw_join_btn') {
      const gw = memoryDB.giveaways[interaction.message.id];
      if (!gw || gw.status !== 'RUNNING' || gw.participants.includes(interaction.user.id)) return interaction.reply({ content: '🔴 | Không hợp lệ/Tham gia rồi.', ephemeral: true });
      gw.participants.push(interaction.user.id); saveDatabase();
      const embed = EmbedBuilder.from(interaction.message.embeds[0]).setDescription(`Tham gia: **${gw.participants.length}** người.`);
      return interaction.update({ embeds: [embed] });
    }

    if (cid === 'farm_btn_harvest') {
      const acc = getAccount(interaction.user.id, interaction.user.username); let gainedExp = 0;
      acc.farm.plots.forEach(p => {
        if (p.cropName && new Date() >= new Date(new Date(p.plantedAt).getTime() + p.duration)) {
          acc.farm.inventory[p.cropName] = (acc.farm.inventory[p.cropName] || 0) + 1; gainedExp += CROP_DATA[p.cropName].exp;
          p.cropName = null; p.plantedAt = null;
        }
      });
      if (gainedExp === 0) return interaction.reply({ content: '🔴 | Không có cây chín!', ephemeral: true });
      acc.farm.exp += gainedExp; acc.farm.level = Math.floor(acc.farm.exp / 100) + 1; saveDatabase();
      return interaction.reply({ content: `🌾 Thu hoạch xong! Nhận **+${gainedExp} EXP**!`, ephemeral: true });
    }

    if (cid === 'farm_btn_plant') {
      const acc = getAccount(interaction.user.id, interaction.user.username);
      const select = new StringSelectMenuBuilder().setCustomId('farm_sl_plots').setPlaceholder('Chọn ô ruộng...');
      let avai = false;
      acc.farm.plots.forEach(p => { if (!p.cropName) { select.addOptions({ label: `Ô đất số [${p.id}] - Trống`, value: p.id.toString() }); avai = true; } });
      if (!avai) return interaction.reply({ content: '🔴 | Hết đất trống!', ephemeral: true });
      return interaction.reply({ content: '🌱 Chọn mảnh đất:', components: [new ActionRowBuilder().addComponents(select)], ephemeral: true });
    }

    if (cid === 'farm_btn_weather') {
      const acc = getAccount(interaction.user.id, interaction.user.username);
      acc.farm.weather = ['☀️ Nắng', '🌧️ Mưa', '⛈️ Bão', '🌈 Cầu Vồng'][Math.floor(Math.random() * 4)]; saveDatabase();
      return interaction.reply({ content: `🎲 Thời tiết chuyển sang: **${acc.farm.weather}**`, ephemeral: true });
    }
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith('tx_md_submit_')) {
    const type = interaction.customId.split('_')[3]; const amt = parseInt(interaction.fields.getTextInputValue('tx_input_amt'));
    const tx = sessionState.taixiu.get(guildId);
    if (isNaN(amt) || amt <= 0 || !tx || tx.ended) return interaction.reply({ content: '🔴 | Không hợp lệ!', ephemeral: true });
    if (!modifyCoins(interaction.user.id, amt, `Cược Tài Xỉu`, false)) return interaction.reply({ content: '🔴 | Ví không đủ.', ephemeral: true });
    tx.bets.push({ userId: interaction.user.id, type, amount: amt });
    return interaction.reply({ content: `✅ Cược **${amt.toLocaleString()}** xu vào cửa **[${type}]**!` });
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'farm_sl_plots') {
      const pid = interaction.values[0]; const seedMenu = new StringSelectMenuBuilder().setCustomId(`farm_sl_seeds_${pid}`).setPlaceholder('Hạt giống...');
      Object.keys(CROP_DATA).forEach(c => seedMenu.addOptions({ label: `${c} (${CROP_DATA[c].seedPrice.toLocaleString()} Nezuko)`, value: c }));
      return interaction.update({ content: `👉 Giống cấy cho ô [${pid}]:`, components: [new ActionRowBuilder().addComponents(seedMenu)] });
    }
    if (interaction.customId.startsWith('farm_sl_seeds_')) {
      const pid = parseInt(interaction.customId.split('_')[3]), crop = interaction.values[0];
      const acc = getAccount(interaction.user.id, interaction.user.username);
      if (!modifyCoins(interaction.user.id, CROP_DATA[crop].seedPrice, `Mua giống ${crop}`, false)) return interaction.reply({ content: '🔴 | Thiếu tiền mua giống.', ephemeral: true });
      const p = acc.farm.plots.find(x => x.id === pid);
      if (p) { p.cropName = crop; p.plantedAt = new Date().toISOString(); p.duration = CROP_DATA[crop].time; acc.farm.quests.progress += 1; saveDatabase(); }
      return interaction.update({ content: `🌱 Đã gieo **${crop}** vào ô [${pid}]!`, components: [] });
    }
  }
});

client.login('process.env.TOKEN_BOT')