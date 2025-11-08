// src/mangaManager.js
import {
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { DEFAULT_CATEGORY_NAME, SETUP_CENTER_NAME, READONLY_ROLE_ID, mangaList as initialMangaList, setMangaList } from "./config.js";
import { currentChapterMap } from "./state.js";

/**
 * create or ensure category + manga channels exist per mangaList
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

      const embed = new EmbedBuilder()
        .setTitle(`📘 ${manga}`)
        .setDescription(
          "Ấn nút bên dưới để tạo chương mới hoặc nhập số chương hiện tại."
        )
        .addFields({ name: "📖 Chương hiện tại", value: "Chưa đặt" })
        .setColor("#00BFFF");

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

      const setupMessage = await channel.send({ embeds: [embed], components: [row] });
      try {
        await setupMessage.pin();
        console.log(`📌 Đã ghim embed gốc vào #${channel.name}`);
      } catch (err) {
        console.warn(`⚠️ Không thể ghim tin trong #${channel.name}:`, err.message);
      }
    }

    if (currentChapterMap[manga] == null) currentChapterMap[manga] = 0;
  }
  console.log("✅ Manga channels setup complete.");
}

/**
 * Create multiple channels for a list of manga names (used by Add Channel flow)
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
      channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category.id,
      });

      const embed = new EmbedBuilder()
        .setTitle(`📘 ${manga}`)
        .setDescription(
          "Ấn nút bên dưới để tạo chương mới hoặc nhập số chương hiện tại."
        )
        .addFields({ name: "📖 Chương hiện tại", value: "Chưa đặt" })
        .setColor("#00BFFF");

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

      const setupMessage = await channel.send({ embeds: [embed], components: [row] });
      try {
        await setupMessage.pin();
      } catch (err) {}
      created.push(channel.name);
    }
  }
  return created;
}

/**
 * Create or update the Setup Center channel with buttons:
 * - Update manga list
 * - Update member list
 * - Add Channel
 */
export async function ensureSetupCenter(guild, mangaList) {
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
    .setDescription("Quản lý danh sách manga / thành viên và add channel theo danh sách hiện tại.")
    .addFields(
      { name: "Các nút", value: "Cập nhật danh sách Manga, Cập nhật danh sách thành viên, Add Channel" }
    );

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

  // Send or update a pinned message (try to find existing)
  const messages = await setupChannel.messages.fetch({ limit: 50 });
  const pinned = messages.find((m) => m.embeds.length && m.embeds[0].title === "⚙️ Setup Center");
  if (pinned) {
    try {
      await pinned.edit({ embeds: [embed], components: [row] });
    } catch (err) {}
  } else {
    const msg = await setupChannel.send({ embeds: [embed], components: [row] });
    try { await msg.pin(); } catch (err) {}
  }
}
