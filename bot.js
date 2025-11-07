// bot.js (Discord + FB Webhook + Manga Manager + Dropdown)
import dotenv from "dotenv";
import express from "express";
import {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  Events,
  TextChannel,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";

dotenv.config();

/* =========================
   🌐 EXPRESS SERVER (keep-alive + FB webhook)
========================= */
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

app.get("/", (req, res) => res.send("✅ Bot is running!"));
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

app.post("/webhook", async (req, res) => {
  const body = req.body;
  if (body.object === "page") {
    body.entry?.forEach((entry) => {
      entry.changes?.forEach((change) => {
        if (change.field === "feed") {
          const value = change.value;
          if (
            value.verb === "add" &&
            ["status", "photo", "share"].includes(value.item)
          )
            handleNewPost(value);
        }
      });
    });
    res.status(200).send("EVENT_RECEIVED");
  } else res.sendStatus(404);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🌐 Express server online on port ${PORT}`)
);

/* =========================
   🤖 DISCORD CLIENT
========================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

/* =========================
   CONFIG
========================= */
const mangaList = [
  "Make Heroine wo Katasetai!!",
  "Chanto Suki tte Ieru Ko Musou",
  "Someone Hertz",
  "Oshite Dame nara Oshite miro!",
  "Saigo no Negai ni Tsuki ga Naku",
  "Idol Chuunibyou",
  "Toaru Kagaku no Mental Out",
];

const memberMap = {
  "Nam thần bí ẩn": "Nam thần bí ẩn",
  Juli: "Juli",
  SnowTy: "SnowTy",
  Shork: "Shork",
  Bean: "Bean",
  Golk: "Golk",
};

const currentChapterMap = {};
const roleDataMap = new Map();

const ADMIN_ROLE_ID = "1435243498482700390";
const MOD_ROLE_ID = "1435243499829198952";
const READONLY_ROLE_ID = "1435243510474211429";

/* =========================
   READY
========================= */
client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
  if (guild) await setupMangaChannels(guild);
});

/* =========================
   MANGA CHANNEL SETUP
========================= */
async function setupMangaChannels(guild) {
  const categoryName = "Manga Projects";
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

/* =========================
   INTERACTIONS
========================= */
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    const member = interaction.member;

    // Chặn người không có quyền dùng 2 nút gốc
    const isAuthorized =
      member.roles.cache.has(ADMIN_ROLE_ID) || member.roles.cache.has(MOD_ROLE_ID);

    if (
      !isAuthorized &&
      interaction.isButton() &&
      (interaction.customId.startsWith("set-chapter-") ||
        interaction.customId.startsWith("create-chapter-"))
    ) {
      return await interaction.reply({
        content: "🚫 Bạn không có quyền sử dụng nút này.",
        ephemeral: true,
      });
    }

    // ===== Modal nhập chương =====
    if (interaction.isButton() && interaction.customId.startsWith("set-chapter-")) {
      const mangaName = interaction.customId.replace("set-chapter-", "");
      const modal = new ModalBuilder()
        .setCustomId(`modal-chapter-${mangaName}`)
        .setTitle("Nhập số chương hiện tại");

      const input = new TextInputBuilder()
        .setCustomId("chapter-number")
        .setLabel("Số chương hiện tại (VD: 12)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
      return;
    }

    if (
      interaction.type === InteractionType.ModalSubmit &&
      interaction.customId.startsWith("modal-chapter-")
    ) {
      const mangaName = interaction.customId.replace("modal-chapter-", "");
      const raw = interaction.fields.getTextInputValue("chapter-number").trim();
      const num = parseInt(raw, 10);
      if (Number.isNaN(num) || num < 0)
        return await interaction.reply({
          content: "❌ Số chương không hợp lệ.",
          ephemeral: true,
        });

      currentChapterMap[mangaName] = num;
      await interaction.reply({
        content: `✅ Đã đặt **${mangaName}** tới **Chương ${num}**.`,
        ephemeral: true,
      });

      const channel = interaction.channel;
      const messages = await channel.messages.fetch({ limit: 10 });
      const setupMsg = messages.find(
        (m) => m.embeds.length && m.embeds[0].title?.includes(mangaName)
      );
      if (setupMsg) {
        const updated = EmbedBuilder.from(setupMsg.embeds[0]).setFields({
          name: "📖 Chương hiện tại",
          value: `Chương ${num}`,
        });
        await setupMsg.edit({ embeds: [updated] });
      }
      return;
    }

    // ===== Nút tạo chương mới =====
    if (interaction.isButton() && interaction.customId.startsWith("create-chapter-")) {
      await interaction.deferReply({ ephemeral: true });
      const mangaName = interaction.customId.replace("create-chapter-", "");
      const channel = interaction.channel;

      const fetched = await channel.messages.fetch({ limit: 100 });
      const chapterEmbeds = fetched.filter(
        (m) => m.embeds.length > 0 && m.embeds[0].title?.startsWith("📖 Chương")
      );

      let nextChap =
        currentChapterMap[mangaName] && currentChapterMap[mangaName] > 0
          ? currentChapterMap[mangaName] + 1
          : chapterEmbeds.size + 1;

      currentChapterMap[mangaName] = nextChap;

      // 🔹 Cập nhật embed gốc hiển thị chương hiện tại
      const setupMsg = fetched.find(
        (m) => m.embeds.length && m.embeds[0].title?.includes(mangaName)
      );
      if (setupMsg) {
        const updated = EmbedBuilder.from(setupMsg.embeds[0]).setFields({
          name: "📖 Chương hiện tại",
          value: `Chương ${nextChap}`,
        });
        await setupMsg.edit({ embeds: [updated] });
      }

      // Embed chương
      const mainEmbed = new EmbedBuilder()
        .setTitle(`📖 Chương ${nextChap}`)
        .setDescription("Chọn thành viên cho từng mục từ dropdown bên dưới")
        .addFields(
          { name: "💬 Translator", value: "Chưa chọn", inline: false },
          { name: "🖋 Editor", value: "Chưa chọn", inline: false },
          { name: "🔍 PR + QC", value: "Chưa chọn", inline: false }
        )
        .setColor("#FFD700")
        .setFooter({ text: `Manga: ${mangaName}` });

      const mainMsg = await channel.send({ embeds: [mainEmbed] });
      roleDataMap.set(mainMsg.id, { Editor: [], Translator: [], "PR + QC": [] });

      await interaction.editReply({
        content: `✅ Đã tạo **Chương ${nextChap}** cho **${mangaName}**.`,
      });

      const dropdownRoles = ["Translator", "Editor", "PR + QC"];
      for (const roleName of dropdownRoles) {
        const options = Object.values(memberMap).map(
          (m) => new StringSelectMenuOptionBuilder().setLabel(m).setValue(m)
        );

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`select-${roleName}-${mainMsg.id}`)
          .setPlaceholder(`Chọn ${roleName}`)
          .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await channel.send({
          content: `Chọn thành viên cho ${roleName}:`,
          components: [row],
        });
      }

      // 🔹 Gửi lại embed gốc
      if (setupMsg) await channel.send({ embeds: setupMsg.embeds, components: setupMsg.components });
    }

    // ===== Dropdown chọn người =====
    if (interaction.isStringSelectMenu()) {
      const [_, roleName, mainMsgId] = interaction.customId.split("-");
      if (!roleDataMap.has(mainMsgId)) return;

      const member = interaction.member;
      if (
        !member.roles.cache.has(ADMIN_ROLE_ID) &&
        !member.roles.cache.has(MOD_ROLE_ID)
      ) {
        return await interaction.reply({
          content: "🚫 Bạn không có quyền thao tác dropdown này.",
          ephemeral: true,
        });
      }

      const selected = interaction.values;
      const roleData = roleDataMap.get(mainMsgId);
      roleData[roleName] = selected;
      roleDataMap.set(mainMsgId, roleData);

      const channel = interaction.channel;
      const mainMsg = await channel.messages.fetch(mainMsgId);
      if (mainMsg) {
        const updated = EmbedBuilder.from(mainMsg.embeds[0]).setFields(
          {
            name: "💬 Translator",
            value: roleData.Translator.length ? roleData.Translator.join(", ") : "Chưa chọn",
          },
          {
            name: "🖋 Editor",
            value: roleData.Editor.length ? roleData.Editor.join(", ") : "Chưa chọn",
          },
          {
            name: "🔍 PR + QC",
            value: roleData["PR + QC"].length ? roleData["PR + QC"].join(", ") : "Chưa chọn",
          }
        );
        await mainMsg.edit({ embeds: [updated] });
      }

      await interaction.reply({ content: "✅ Đã cập nhật thành viên.", ephemeral: true });
    }
  } catch (err) {
    console.error("Interaction error:", err);
    if (interaction && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Có lỗi khi xử lý tương tác.",
        ephemeral: true,
      });
    }
  }
});

/* =========================
   FACEBOOK POST HANDLER
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
    const pageIcon =
      "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg";
    const postTime = new Date((value.created_time || Date.now()) * 1000);

    const embed = new EmbedBuilder()
      .setAuthor({ name: pageName, iconURL: pageIcon, url: postLink })
      .setTitle("📰 Bài viết mới trên fanpage!")
      .setDescription(postMessage)
      .setColor(0x1877f2)
      .setURL(postLink)
      .setFooter({ text: "Facebook", iconURL: pageIcon })
      .setTimestamp(postTime);

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
   LOGIN
========================= */
client.login(process.env.TOKEN);
