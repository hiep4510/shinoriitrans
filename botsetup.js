// botsetup.js
import dotenv from "dotenv";
import express from "express";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";

dotenv.config();

// 🚀 Tạo web server để giữ bot hoạt động + nhận webhook từ Facebook
const app = express();
app.use(express.json());

app.get("/", (req, res) => res.send("Bot setup is running!"));

// ✅ Xác minh Webhook của Facebook
const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("🔔 Facebook Webhook verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 📬 Khi Facebook gửi thông báo bài viết mới
app.post("/webhook", (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    body.entry.forEach(entry => {
      const changes = entry.changes || [];
      changes.forEach(change => {
        if (change.field === "feed" && change.value?.item === "post") {
          handleNewPost(change.value);
        }
      });
    });

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

app.listen(3000, () => console.log("🌐 Express server online!"));


// 🧠 Khởi tạo Discord bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // để bot thấy member mới
    GatewayIntentBits.GuildMessages,
  ],
});

client.once("ready", () => {
  console.log(`✅ Bot đăng nhập: ${client.user.tag}`);
});


// 👋 Khi có thành viên mới
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


// 📰 Hàm gửi thông báo khi fanpage đăng bài
async function handleNewPost(value) {
  try {
    const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
    if (!guild) return console.warn("⚠️ Không tìm thấy guild");

    const channel = guild.channels.cache.get(process.env.RELEASE_FEED_CHANNEL_ID);
    if (!(channel instanceof TextChannel)) {
      return console.warn("⚠️ Channel không phải TextChannel hoặc không tìm thấy");
    }

    const role = guild.roles.cache.find(r => r.name.includes("Reader / Fan"));
    const mention = role ? `<@&${role.id}>` : "";

    const postId = value.post_id || value.id;
    const link = `https://www.facebook.com/${postId}`;
    const message = value.message || "Fanpage vừa đăng một bài viết mới!";

    await channel.send(`${mention} 📰 **Fanpage vừa đăng bài mới!**\n> ${message}\n🔗 ${link}`);

    console.log("✅ Đã gửi thông báo bài viết mới tới kênh release-feed");
  } catch (err) {
    console.error("❌ Lỗi khi gửi thông báo bài viết mới:", err);
  }
}


// 🔑 Đăng nhập bot
client.login(process.env.TOKEN);
