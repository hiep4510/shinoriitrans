// src/mangaManager.js
import {
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  DEFAULT_CATEGORY_NAME,
  SETUP_CENTER_NAME,
  READONLY_ROLE_ID,
} from "./config.js";
import { currentChapterMap } from "./state.js";
import { mangaList } from "./config.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🧩 Helper: lấy đường dẫn cover nếu có
export function getCoverPath(mangaName) {
  const sanitized = mangaName
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  const coverDir = path.join(__dirname, "cover");
  const possibleExts = [".jpg", ".jpeg", ".png", ".webp"];
  for (const ext of possibleExts) {
    const filePath = path.join(coverDir, sanitized + ext);
    if (fs.existsSync(filePath)) return "attachment://" + sanitized + ext;
  }
  return null;
}

// 🧩 Helper: tạo embed manga
export function createMangaEmbed(manga, currentChapter = "Chưa đặt") {
  const embed = new EmbedBuilder()
    .setTitle(`📘 ${manga}`)
    .setDescription(
      "Ấn nút bên dưới để tạo chương mới hoặc nhập số chương hiện tại."
    )
    .addFields({ name: "📖 Chương hiện tại", value: currentChapter })
    .setColor("#00BFFF");

  const coverPath = getCoverPath(manga);
  if (coverPath) embed.setThumbnail(coverPath);

  return { embed, coverPath };
}

/**
 * ➕ Tạo nhiều channel từ danh sách manga (Add Channel flow)
 */
export async function createChannelsFromList(guild, mangaNames) {
  const categoryName = DEFAULT_CATEGORY_NAME;
  let category = guild.channels.cache.find(
    (c) => c.name === categoryName && c.type === ChannelType.GuildCategory
  );
  if (!category) {
    category = await guild.channels.create({
      name: categoryName,
      type: ChannelType.GuildCategory,
    });
  }

  const created = [];
  for (const manga of mangaNames) {
    const channelName = manga
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "");

    let channel = guild.channels.cache.find(
      (c) => c.name === channelName && c.parentId === category.id
    );

    if (!channel) {
      const overwrites = [];
      const readerFanRole = guild.roles.cache.get(READONLY_ROLE_ID);
      if (readerFanRole) {
        overwrites.push({
          id: readerFanRole.id,
          deny: [
            "SendMessages",
            "AddReactions",
            "UseApplicationCommands",
            "SendMessagesInThreads",
            "CreatePublicThreads",
            "CreatePrivateThreads",
          ],
        });
      }

      channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: overwrites,
      });

      const { embed, coverPath } = createMangaEmbed(manga);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`set-chapter-${manga}`)
          .setLabel("📝 Nhập số chương hiện tại")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`create-chapter-${manga}`)
          .setLabel("➕ Tạo chương mới")
          .setStyle(ButtonStyle.Success)
      );

      const files = coverPath
        ? [
            path.join(
              __dirname,
              "cover",
              path.basename(coverPath.replace("attachment://", ""))
            ),
          ]
        : [];

      const setupMessage = await channel.send({
        embeds: [embed],
        components: [row],
        files,
      });

      try {
        await setupMessage.pin();
      } catch (err) {}

      created.push(channel.name);

      if (currentChapterMap[manga] == null) currentChapterMap[manga] = 0;
    }
  }

  return created;
}

/**
 * 🔄 Cập nhật lại embed gốc nếu cover thay đổi
 */
export async function refreshMangaEmbeds(guild, mangaList) {
  const categoryName = DEFAULT_CATEGORY_NAME;
  const category = guild.channels.cache.find(
    (c) => c.name === categoryName && c.type === ChannelType.GuildCategory
  );
  if (!category) return;

  for (const manga of mangaList) {
    const channelName = manga
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "");

    const channel = guild.channels.cache.find(
      (c) => c.name === channelName && c.parentId === category.id
    );
    if (!channel) continue;

    const messages = await channel.messages.fetch({ limit: 50 });
    const setupMsg = messages.find(
      (m) => m.embeds.length && m.embeds[0].title?.includes(manga)
    );
    if (!setupMsg) continue;

    const { embed, coverPath } = createMangaEmbed(
      manga,
      `Chương ${currentChapterMap[manga] || 0}`
    );
    const files = coverPath
      ? [
          path.join(
            __dirname,
            "cover",
            path.basename(coverPath.replace("attachment://", ""))
          ),
        ]
      : [];

    try {
      await setupMsg.edit({ embeds: [embed], files: files.length ? files : undefined });
      console.log(`🔄 Đã refresh cover cho #${channel.name}`);
    } catch (err) {
      console.warn(`⚠️ Không thể refresh cover cho #${channel.name}:`, err.message);
    }
  }
}

/**
 * ⚙️ Tạo hoặc cập nhật Setup Center channel
 */
export async function ensureSetupCenter(guild) {
  let setupChannel = guild.channels.cache.find(
    (c) => c.name === SETUP_CENTER_NAME.toLowerCase().replace(/\s+/g, "-")
  );

  if (!setupChannel) {
    setupChannel = await guild.channels.create({
      name: SETUP_CENTER_NAME,
      type: ChannelType.GuildText,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("⚙️ Setup Center")
    .setDescription(
      "Quản lý danh sách manga / thành viên và add channel theo danh sách hiện tại."
    )
    .addFields({
      name: "Các nút",
      value:
        "Cập nhật danh sách Manga, Cập nhật danh sách thành viên, Add Channel",
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("update-manga-list")
      .setLabel("Cập nhật danh sách Manga")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("update-member-list")
      .setLabel("Cập nhật danh sách thành viên")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("add-channel")
      .setLabel("Add Channel")
      .setStyle(ButtonStyle.Success)
  );

  const messages = await setupChannel.messages.fetch({ limit: 50 });
  const pinned = messages.find(
    (m) => m.embeds.length && m.embeds[0].title === "⚙️ Setup Center"
  );

  if (pinned) {
    try {
      await pinned.edit({ embeds: [embed], components: [row] });
    } catch (err) {}
  } else {
    const msg = await setupChannel.send({ embeds: [embed], components: [row] });
    try {
      await msg.pin();
    } catch (err) {}
  }
}

/**
 * 🏗️ Tạo category và các kênh manga (nếu chưa có)
 */
export async function setupMangaChannels(guild, mangaList) {
  const categoryName = DEFAULT_CATEGORY_NAME;
  let category = guild.channels.cache.find(
    (c) => c.name === categoryName && c.type === ChannelType.GuildCategory
  );
  if (!category) {
    category = await guild.channels.create({
      name: categoryName,
      type: ChannelType.GuildCategory,
    });
  }

  const readerFanRole = guild.roles.cache.get(READONLY_ROLE_ID);

  for (const manga of mangaList) {
    const channelName = manga
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "");

    let channel = guild.channels.cache.find(
      (c) => c.name === channelName && c.parentId === category.id
    );

    if (!channel) {
      const overwrites = [];
      if (readerFanRole)
        overwrites.push({
          id: readerFanRole.id,
          deny: [
            "SendMessages",
            "AddReactions",
            "UseApplicationCommands",
            "SendMessagesInThreads",
            "CreatePublicThreads",
            "CreatePrivateThreads",
          ],
        });

      channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: overwrites,
      });

      const { embed, coverPath } = createMangaEmbed(manga);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`set-chapter-${manga}`)
          .setLabel("📝 Nhập số chương hiện tại")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`create-chapter-${manga}`)
          .setLabel("➕ Tạo chương mới")
          .setStyle(ButtonStyle.Success)
      );

      const files = coverPath
        ? [
            path.join(
              __dirname,
              "cover",
              path.basename(coverPath.replace("attachment://", ""))
            ),
          ]
        : [];

      const setupMessage = await channel.send({
        embeds: [embed],
        components: [row],
        files,
      });

      try {
        await setupMessage.pin();
      } catch (err) {}

      if (currentChapterMap[manga] == null) currentChapterMap[manga] = 0;
    }
  }
}
