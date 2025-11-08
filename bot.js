// bot.js
import dotenv from "dotenv";
dotenv.config();

// 🌐 Chạy Express server
import "./core/expressServer.js"; // chỉ import để chạy server

// 🤖 Discord Client
import { client } from "./core/discordClient.js";

// ===== Features =====
import { attachMangaListener } from "./features/mangaManager.js"; // interaction manga
import { initFBWebhookHandler } from "./features/facebookHandler.js"; // FB webhook
import { initWelcomeMember } from "./features/welcomeHandler.js"; // welcome user + auto role
import { initSetupCenter } from "./features/setupCenter.js"; // setup center + 3 nút

// 🌐 Start Express server
const app = startExpressServer();

// 🤖 Discord Client Ready
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    // ⚙️ Setup Center
    await initSetupCenter(client);

    // 📘 Manga Manager
    attachMangaListener(client);

    // 👥 Member Manager
    await initMemberManager(client);

    // 🌐 FB Webhook
    await initFBWebhookHandler(client, app);

    // 🎉 Welcome Member
    await initWelcomeMember(client);

    console.log("✅ Bot đã khởi tạo xong tất cả features!");
  } catch (err) {
    console.error("❌ Lỗi khi khởi tạo bot:", err);
  }
});

// 🔑 Login Discord
client.login(process.env.TOKEN);
