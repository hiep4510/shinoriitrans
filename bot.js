import dotenv from "dotenv";
import express from "express"; // 👈 import phải đặt ở đầu file
import { Client, GatewayIntentBits } from "discord.js";

dotenv.config();

// 🚀 Khởi động web server để Replit không sleep
const app = express();
app.get("/", (req, res) => res.send("Bot is running!"));
app.listen(3000, () => console.log("✅ Express server online!"));

// 🤖 Khởi tạo Discord client
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

client.login(process.env.TOKEN);
