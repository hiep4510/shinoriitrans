// bot.js
import dotenv from "dotenv";
import express from "express";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";

dotenv.config();

/* =========================
   🚀 EXPRESS SERVER (FACEBOOK + KEEP ALIVE)
========================= */
const app = express();
app.use(express.json());

// ✅ Kiểm tra root (để Render/Replit biết server sống)
app.get("/", (req, res) => res.send("✅ Bot is running!"));

// ✅ Xác minh Webhook của Facebook
const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("📩 Webhook verification request:", { mode, token, challenge });

  // Phải có mode=subscribe và verify_token trùng thì mới xác nhận được
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Facebook Webhook verified successfully!");
    res.status(200).type("text/plain").send(challenge); // Facebook yêu cầu text/plain
  } else {
    console.log("❌ Webhook verification failed!");
    res.sendStatus(403);
  }
});

// 📬 Khi Facebook gửi thông báo bài viết mới
app.post("/webhook", (req, res) => {
  console.log("📨 Webhook POST received:", JSON.stringify(req.body, null, 2));

  const body = req.body;
  if (body.object === "page") {
    body.entry?.forEach((entry) => {
      const changes = entry.changes || [];
      changes.forEach((change) => {
        if (change.field === "feed") {
          const value = change.value;
		   // ✅ Chỉ xử lý khi là bài đăng mới (status hoặc photo)
          if (
            value.verb === "add" &&
            (value.item === "status" || value.item === "photo" || value.item === "share")
          ) {
            handleNewPost(value);
          }
        }
      });
    });

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🌐 Express server online on port ${PORT}`)
);

/* =========================
   🤖 DISCORD BOT
========================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`🤖 Bot đã đăng nhập với tên: ${client.user.tag}`);
});

/* =========================
   👋 SỰ KIỆN: THÀNH VIÊN MỚI
========================= */
client.on("guildMemberAdd", async (member) => {
  console.log(`👤 Thành viên mới: ${member.user.tag}`);

  const welcomeChannel = member.guild.channels.cache.find((ch) =>
    ch.name.toLowerCase().includes("welcome")
  );

  if (welcomeChannel) {
    await welcomeChannel.send(
      `🎉 Chào mừng **${member.user.username}** đã đến với **${member.guild.name}**!`
    );
  }

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

/* =========================
   📰 KHI FANPAGE ĐĂNG BÀI MỚI
========================= */
async function handleNewPost(value) {
  try {
    const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
    if (!guild) return console.warn("⚠️ Không tìm thấy guild");

    const channel = guild.channels.cache.get(process.env.RELEASE_FEED_CHANNEL_ID);
    if (!(channel instanceof TextChannel)) {
      return console.warn("⚠️ Channel không phải TextChannel hoặc không tìm thấy");
    }

    const role = guild.roles.cache.find((r) => r.name.includes("Reader / Fan"));
    const mention = role ? `<@&${role.id}>` : "";

    const postId = value.post_id || value.id;
    const link = `https://www.facebook.com/${postId}`;
    const message = value.message || "Fanpage vừa đăng một bài viết mới!";

    await channel.send(
      `${mention} 📰 **Fanpage vừa đăng bài mới!**\n> ${message}\n🔗 ${link}`
    );
    console.log("✅ Đã gửi thông báo bài viết mới tới kênh release-feed");
  } catch (err) {
    console.error("❌ Lỗi khi gửi thông báo bài viết mới:", err);
  }
}

/* =========================
   🔑 ĐĂNG NHẬP BOT
========================= */
client.login(process.env.TOKEN);
