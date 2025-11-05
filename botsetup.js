// bot.js
import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js"; // 👈 thêm dòng này

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // để bot thấy member mới
  ],
});

client.once("ready", () => {
  console.log(`✅ Bot đăng nhập: ${client.user.tag}`);
});

client.on("guildMemberAdd", async (member) => {
  console.log(`👤 Thành viên mới: ${member.user.tag}`);

  // Tìm kênh welcome
  const welcomeChannel = member.guild.channels.cache.find((ch) =>
    ch.name.toLowerCase().includes("welcome")
  );

  if (welcomeChannel) {
    await welcomeChannel.send(
      `🎉 Chào mừng **${member.user.username}** đã đến với **${member.guild.name}**!`
    );
  }

  // Tìm role "💬 Reader / Fan"
  const role = member.guild.roles.cache.find((r) =>
    r.name.includes("Reader / Fan")
  );

  if (role) {
    try {
      await member.roles.add(role);
      console.log(`✅ Gán role "${role.name}" cho ${member.user.tag}`);
    } catch (err) {
      console.error("❌ Không thể gán role:", err);
    }
  } else {
    console.log("⚠️ Không tìm thấy role 'Reader / Fan' trong server!");
  }
});

client.login(process.env.TOKEN);
