// src/fbHandler.js
import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { ENV } from "./config.js";

/* NOTE: we'll get client instance from discordClient module at runtime to avoid circular import.
   So here we export a function to set the client, and handleNewPost uses that client.
*/

let _client = null;
export function setDiscordClient(client) {
  _client = client;
}

export async function handleNewPost(value) {
  try {
    if (!_client) return console.warn("fbHandler: discord client not set yet");
    const guild = _client.guilds.cache.get(ENV.DISCORD_GUILD_ID);
    if (!guild) return console.warn("⚠️ Không tìm thấy guild");

    const channel = guild.channels.cache.get(ENV.RELEASE_FEED_CHANNEL_ID);
    if (!(channel instanceof TextChannel))
      return console.warn("⚠️ Không tìm thấy kênh feed hợp lệ");

    const role = guild.roles.cache.find((r) => r.name.includes("Reader / Fan"));
    const mention = role ? `<@&${role.id}>` : "";

    const pageName = value.from?.name || "Fanpage";
    const pageIcon = value.from?.picture?.data?.url || null;
    const postMessage = value.message?.trim() || "(Không có nội dung)";
    const attachments = value.attachments?.data || [];
    const imageUrl = attachments[0]?.media?.image?.src || null;
    const postId = value.post_id || value.id || "";
    const postLink = postId ? `https://www.facebook.com/${postId.replace("_", "/posts/")}` : null;
    const createdTime = new Date(value.created_time || Date.now());

    const embed = new EmbedBuilder()
      .setColor("#0866FF")
      .setAuthor({
        name: pageName,
        iconURL: pageIcon,
        url: postLink || undefined,
      })
      .setDescription(postMessage)
      .setFooter({
        text: "Facebook",
        iconURL:
          "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
      })
      .setTimestamp(createdTime);

    if (imageUrl) embed.setImage(imageUrl);

    await channel.send({
      content: `${mention} **${pageName} vừa đăng bài mới!**`,
      embeds: [embed],
    });

    console.log(`✅ Đã gửi bài post mới từ ${pageName}`);
  } catch (err) {
    console.error("❌ Lỗi khi gửi post mới:", err);
  }
}
