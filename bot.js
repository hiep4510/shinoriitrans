import dotenv from "dotenv";
import express from "express";
import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from "discord.js";

dotenv.config();

/* =========================
   🚀 EXPRESS SERVER (FACEBOOK + KEEP ALIVE)
========================= */
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

// ✅ Route test server
app.get("/", (req, res) => res.send("✅ Bot is running!"));

// ✅ Facebook Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Facebook Webhook verified successfully!");
    res.status(200).type("text/plain").send(challenge);
  } else {
    console.log("❌ Webhook verification failed!");
    res.sendStatus(403);
  }
});

// 📬 Khi Facebook gửi bài mới
app.post("/webhook", (req, res) => {
  console.log("📨 Webhook POST received:", JSON.stringify(req.body, null, 2));

  const body = req.body;
  if (body.object === "page") {
    body.entry?.forEach((entry) => {
      entry.changes?.forEach((change) => {
        if (change.field === "feed") {
          const value = change.value;
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
   📰 GỬI THÔNG BÁO BÀI VIẾT MỚI
========================= */
async function handleNewPost(value) {
  try {
    const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
    if (!guild) return console.warn("⚠️ Không tìm thấy guild");

    const channel = guild.channels.cache.get(process.env.RELEASE_FEED_CHANNEL_ID);
    if (!(channel instanceof TextChannel))
      return console.warn("⚠️ Channel không phải TextChannel hoặc không tìm thấy");

    const role = guild.roles.cache.find((r) => r.name.includes("Reader / Fan"));
    const mention = role ? `<@&${role.id}>` : "";

    const postId = value.post_id || value.id;
    const postLink = `https://www.facebook.com/${postId.replace("_", "/posts/")}`;
    const postMessage = value.message || "Fanpage vừa đăng một bài viết mới!";
    const pageName = value.from?.name || "Trang Facebook";
    const pageIcon = "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg";
    const postTime = new Date((value.created_time || Date.now()) * 1000);

    // Tạo embed giống Pingcord
    const embed = new EmbedBuilder()
      .setAuthor({ name: pageName, iconURL: pageIcon, url: postLink })
      .setTitle("📰 Bài viết mới trên fanpage!")
      .setDescription(postMessage)
      .setColor(0x1877f2)
      .setURL(postLink)
      .setFooter({ text: "Facebook", iconURL: pageIcon })
      .setTimestamp(postTime);

    // Nếu có ảnh đính kèm
    const attachments = value.attachments?.data;
    if (attachments && attachments[0]?.media?.image?.src) {
      embed.setImage(attachments[0].media.image.src);
    }

    await channel.send({
      content: `${mention} **Fanpage vừa đăng bài mới!**`,
      embeds: [embed],
    });

    console.log("✅ Đã gửi thông báo bài viết mới tới kênh release-feed");
  } catch (err) {
    console.error("❌ Lỗi khi gửi thông báo bài viết mới:", err);
  }
}

/* =========================
   🔑 ĐĂNG NHẬP BOT
========================= */
client.login(process.env.TOKEN);
