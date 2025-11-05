require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`✅ Đăng nhập thành công với ${client.user.tag}`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const data = JSON.parse(fs.readFileSync('server.json', 'utf8'));

  // === XÓA TẤT CẢ CHANNEL CŨ ===
  console.log('🧹 Đang xóa toàn bộ channel cũ...');
  for (const channel of guild.channels.cache.values()) {
    try {
      await channel.delete();
      console.log(`❌ Xóa channel: ${channel.name}`);
    } catch (err) {
      console.warn(`⚠️ Không xóa được ${channel.name}: ${err.message}`);
    }
  }

  // === XÓA TOÀN BỘ ROLE CŨ (trừ @everyone) ===
  console.log('🧹 Đang xóa toàn bộ role cũ...');
  for (const role of guild.roles.cache.values()) {
    if (role.name !== '@everyone') {
      try {
        await role.delete();
        console.log(`❌ Xóa role: ${role.name}`);
      } catch (err) {
        console.warn(`⚠️ Không xóa được role ${role.name}: ${err.message}`);
      }
    }
  }

  // === TẠO ROLE MỚI ===
  console.log('🎭 Tạo role mới...');
  const rolesMap = {};
  for (const roleData of data.roles) {
    const role = await guild.roles.create({
      name: roleData.name,
      color: roleData.color,
      permissions: roleData.permissions || [],
    });
    rolesMap[roleData.name] = role;
    console.log(`✅ Đã tạo role: ${role.name}`);
  }

  // === TẠO CATEGORY & CHANNEL MỚI ===
  console.log('📁 Đang tạo cấu trúc server...');
  for (const categoryData of data.channels) {
    const category = await guild.channels.create({
      name: categoryData.name,
      type: 4, // category
    });
    console.log(`📂 Category: ${category.name}`);

    // Quyền cho từng khu
    if (categoryData.name.includes("STAFF")) {
      await category.permissionOverwrites.set([
        { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: rolesMap["👑 Admin"], allow: [PermissionsBitField.Flags.ViewChannel] },
        { id: rolesMap["🛠️ Mod"], allow: [PermissionsBitField.Flags.ViewChannel] },
        { id: rolesMap["🈶 Translator"], allow: [PermissionsBitField.Flags.ViewChannel] },
        { id: rolesMap["🖋️ Editor"], allow: [PermissionsBitField.Flags.ViewChannel] },
      ]);
    }

    // Tạo channel con trong category
    for (const ch of categoryData.channels) {
      const channel = await guild.channels.create({
        name: ch.name,
        type: ch.type === 'voice' ? 2 : 0, // 2=voice, 0=text
        parent: category.id
      });

      // Quyền riêng cho STAFF
      if (categoryData.name.includes("STAFF")) {
        await channel.permissionOverwrites.set([
          { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: rolesMap["👑 Admin"], allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id: rolesMap["🛠️ Mod"], allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        ]);
      }

      console.log(`  ↳ ${channel.name}`);
    }
  }

  console.log('🎉 Hoàn tất setup server mới!');
  process.exit(0);
});

client.login(process.env.TOKEN);
