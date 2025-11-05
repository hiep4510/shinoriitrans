require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`✅ Đăng nhập thành công với ${client.user.tag}`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const everyoneRole = guild.roles.everyone;

  // Tìm category INFORMATION
  const infoCategory = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name.includes('INFORMATION')
  );

  if (!infoCategory) {
    console.log('❌ Không tìm thấy category INFORMATION.');
    process.exit(1);
  }

  // Lấy danh sách channel con trong category
  const infoChannels = guild.channels.cache.filter(
    c => c.parentId === infoCategory.id
  );

  // Set quyền: chỉ xem, không chat
  for (const [id, channel] of infoChannels) {
    if (channel.type === ChannelType.GuildText) {
      await channel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: false,
        AddReactions: false,
        SendMessagesInThreads: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false
      });
      console.log(`🔒 Đã khóa chat trong #${channel.name}`);
    }
  }

  console.log('✅ Hoàn tất chỉnh quyền các kênh INFORMATION.');
  process.exit(0);
});

client.login(process.env.TOKEN);
