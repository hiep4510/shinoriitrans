import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once("ready", async () => {
  console.log(`Đăng nhập thành công với ${client.user.tag}`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const channel = guild.channels.cache.find(c => c.name.includes("rules")); // tìm kênh rules

  if (!channel) {
    console.log("Không tìm thấy kênh rules!");
    process.exit(1);
  }

  await channel.send("✅ Ở đây tao là luật!");
  console.log("Đã gửi xong.");
  process.exit(0);
});

client.login(process.env.TOKEN);
