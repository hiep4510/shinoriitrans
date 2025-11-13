// src/discordClient.js
import {
  Client,
  GatewayIntentBits,
  Partials,
  Events
} from "discord.js";
import { startServer } from "./server.js";
import { ENV } from "./config.js";
import { setupMangaChannels, ensureSetupCenter, refreshMangaEmbeds  } from "./mangaManager.js";
import { registerInteractionHandlers } from "./interactions.js";
import { setDiscordClient } from "./fbHandler.js";
import { onGuildMemberAdd } from "./welcomeHandler.js";
import { mangaList } from "./config.js";
import fetch from "node-fetch";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

export function startBot() {
  // register interaction handlers
  registerInteractionHandlers(client);

  client.once(Events.ClientReady, async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    setDiscordClient(client);

    const guild = client.guilds.cache.get(ENV.DISCORD_GUILD_ID);
	if (guild) {
	// chỉ tạo setup center thôi, không tạo manga channel
	//await ensureSetupCenter(guild, mangaList);
	await refreshMangaEmbeds(guild, mangaList);
	}

    // start express server
    startServer();

	// 🟢 Giữ Render luôn thức (ngăn autosuspend)
	setInterval(() => {
	fetch("https://shinoriitrans.onrender.com")
		.then(res => console.log(`[Ping] ${new Date().toISOString()} - ${res.status}`))
		.catch(err => console.warn("[Ping lỗi]:", err.message));
	}, 5 * 60 * 1000); // ping mỗi 5 phút

  });

  // welcome handler
  client.on("guildMemberAdd", async (member) => {
    await onGuildMemberAdd(member);
  });

  client.login(ENV.TOKEN).catch((err) => {
    console.error("Login error:", err);
  });
}
