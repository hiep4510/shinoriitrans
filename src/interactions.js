// src/interactions.js
import {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  InteractionType, // ✅ thêm dòng này
  MessageFlags,     // ✅ thêm luôn nếu bạn muốn fix cảnh báo ephemeral
} from "discord.js";

import { ADMIN_ROLE_ID, MOD_ROLE_ID, AUTH_USER_ID, setMangaList, setMemberMap, mangaList as configMangaList, memberMap as configMemberMap } from "./config.js";
import { currentChapterMap, roleDataMap } from "./state.js";
import { createChannelsFromList } from "./mangaManager.js";
import { setMangaList as setMangaListFn, setMemberMap as setMemberMapFn, mangaList as importedMangaList, memberMap as importedMemberMap } from "./config.js";

/* ========= Check quyền hợp lệ ========= */
function isAuthorized(member, userId) {
  if (!member) return false;
  const roles = member.roles?.cache || new Map();
  return (
    roles.has(ADMIN_ROLE_ID) ||
    roles.has(MOD_ROLE_ID) ||
    userId === AUTH_USER_ID
  );
}

/* ========= Setup Center UI ========= */
async function showSetupCenter(interaction) {
  // kiểm tra channel
  if (!interaction.channel || interaction.channel.name !== "setup-center") return;

  const embed = new EmbedBuilder()
    .setTitle("⚙️ Setup Center")
    .setDescription("Quản lý danh sách manga / thành viên và add channel theo danh sách hiện tại.");

  const mangaRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("update-manga-list").setLabel("📚 Danh sách Manga").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("add-channel").setLabel("➕ Tạo Channel").setStyle(ButtonStyle.Success)
  );

  const memberRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("update-member-list").setLabel("👥 Danh sách Thành viên").setStyle(ButtonStyle.Primary)
  );

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ embeds: [embed], components: [mangaRow, memberRow], ephemeral: true });
  } else {
    await interaction.reply({ embeds: [embed], components: [mangaRow, memberRow], ephemeral: true });
  }
}

export function registerInteractionHandlers(client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      const member = interaction.member;
      const userId = interaction.user?.id;
 // ✅ Kiểm tra quyền chung (Admin hoặc Mod hoặc AUTH_USER)
      if (!isAuthorized(member, userId)) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "🚫 Bạn không có quyền thực hiện hành động này.",
            flags: MessageFlags.Ephemeral,
          });
        }
        return;
      }
      // ======= Handle Setup Center buttons =======
      if (interaction.isButton() && interaction.customId === "update-manga-list") {
        const embed = new EmbedBuilder()
          .setTitle("📚 Danh sách Manga")
          .setDescription("Danh sách hiện tại:")
          .addFields(
            { name: "Manga", value: importedMangaList.map((m, i) => `${i + 1}. ${m}`).join("\n") || "(Trống)" }
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("add-manga").setLabel("Thêm manga").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("edit-manga").setLabel("Sửa manga").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("delete-manga").setLabel("Xóa manga").setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        return;
      }

      if (interaction.isButton() && interaction.customId === "update-member-list") {
        const embed = new EmbedBuilder()
          .setTitle("👥 Danh sách Thành viên")
          .setDescription("Danh sách hiện tại:")
          .addFields({ name: "Members", value: Object.values(importedMemberMap).join("\n") || "(Trống)" });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("add-member").setLabel("Thêm thành viên").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("edit-member").setLabel("Sửa thành viên").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("delete-member").setLabel("Xóa thành viên").setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        return;
      }

      if (interaction.isButton() && interaction.customId === "add-channel") {
        const options = importedMangaList.map((m) =>
          new StringSelectMenuOptionBuilder().setLabel(m).setValue(m)
        );
        const select = new StringSelectMenuBuilder()
          .setCustomId("select-manga-to-add")
          .setPlaceholder("Chọn manga để tạo channel (multi chọn)")
          .setMinValues(1)
          .setMaxValues(Math.min(25, options.length))
          .addOptions(options);

        const row = new ActionRowBuilder().addComponents(select);
        await interaction.reply({ content: "Chọn manga để tạo channel:", components: [row], ephemeral: true });
        return;
      }

      // ===== Modal flows for adding/editing/deleting manga/members =====
      if (interaction.isButton() && interaction.customId === "add-manga") {
        const modal = new ModalBuilder().setCustomId("modal-add-manga").setTitle("Thêm manga mới");
        const input = new TextInputBuilder()
          .setCustomId("manga-name")
          .setLabel("Tên manga (viết chính xác)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
        return;
      }

      if (interaction.isButton() && interaction.customId === "edit-manga") {
        const modal = new ModalBuilder().setCustomId("modal-edit-manga").setTitle("Sửa manga");
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("old-name").setLabel("Tên cũ").setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("new-name").setLabel("Tên mới").setStyle(TextInputStyle.Short).setRequired(true)
          )
        );
        await interaction.showModal(modal);
        return;
      }

      if (interaction.isButton() && interaction.customId === "delete-manga") {
        const modal = new ModalBuilder().setCustomId("modal-delete-manga").setTitle("Xóa manga");
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("delete-name").setLabel("Tên cần xóa").setStyle(TextInputStyle.Short).setRequired(true)
          )
        );
        await interaction.showModal(modal);
        return;
      }

      if (interaction.isButton() && interaction.customId === "add-member") {
        const modal = new ModalBuilder().setCustomId("modal-add-member").setTitle("Thêm thành viên");
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("member-name").setLabel("Tên thành viên").setStyle(TextInputStyle.Short).setRequired(true)
          )
        );
        await interaction.showModal(modal);
        return;
      }

      if (interaction.isButton() && interaction.customId === "edit-member") {
        const modal = new ModalBuilder().setCustomId("modal-edit-member").setTitle("Sửa thành viên");
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("old-member").setLabel("Tên cũ").setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("new-member").setLabel("Tên mới").setStyle(TextInputStyle.Short).setRequired(true)
          )
        );
        await interaction.showModal(modal);
        return;
      }

      if (interaction.isButton() && interaction.customId === "delete-member") {
        const modal = new ModalBuilder().setCustomId("modal-delete-member").setTitle("Xóa thành viên");
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("delete-member-name").setLabel("Tên cần xóa").setStyle(TextInputStyle.Short).setRequired(true)
          )
        );
        await interaction.showModal(modal);
        return;
      }

      // ===== Handle modal submissions =====
      if (interaction.isModalSubmit()) {
        const id = interaction.customId;

        // Manga modals
        if (id === "modal-add-manga") {
          const name = interaction.fields.getTextInputValue("manga-name").trim();
          if (!name) return interaction.reply({ content: "Tên không hợp lệ.", ephemeral: true });
          const cfg = await import("./config.js");
          const arr = cfg.mangaList;
          if (arr.includes(name)) return interaction.reply({ content: `⚠️ Manga **${name}** đã tồn tại.`, ephemeral: true });
          arr.push(name);
          cfg.setMangaList(arr);
          await interaction.reply({ content: `✅ Đã thêm manga **${name}**.`, ephemeral: true });

          await showSetupCenter(interaction);
          return;
        }

        if (id === "modal-edit-manga") {
          const oldName = interaction.fields.getTextInputValue("old-name").trim();
          const newName = interaction.fields.getTextInputValue("new-name").trim();
          const cfg = await import("./config.js");
          const arr = cfg.mangaList;
          const idx = arr.findIndex((m) => m === oldName);
          if (idx === -1) return interaction.reply({ content: "Không tìm thấy tên cũ.", ephemeral: true });
          arr[idx] = newName;
          cfg.setMangaList(arr);
          await interaction.reply({ content: `✅ Đã đổi **${oldName}** → **${newName}**`, ephemeral: true });

          await showSetupCenter(interaction);
          return;
        }

        if (id === "modal-delete-manga") {
          const name = interaction.fields.getTextInputValue("delete-name").trim();
          const cfg = await import("./config.js");
          const arr = cfg.mangaList;
          const idx = arr.findIndex((m) => m === name);
          if (idx === -1) return interaction.reply({ content: "Không tìm thấy manga cần xóa.", ephemeral: true });
          arr.splice(idx, 1);
          cfg.setMangaList(arr);
          await interaction.reply({ content: `✅ Đã xóa **${name}** khỏi danh sách.`, ephemeral: true });

          await showSetupCenter(interaction);
          return;
        }

        // Member modals
        if (id === "modal-add-member") {
          const name = interaction.fields.getTextInputValue("member-name").trim();
          if (!name) return interaction.reply({ content: "Tên không hợp lệ.", ephemeral: true });
          const cfg = await import("./config.js");
          const map = cfg.memberMap;
          map[name] = name;
          cfg.setMemberMap(map);
          await interaction.reply({ content: `✅ Đã thêm thành viên **${name}**.`, ephemeral: true });

          await showSetupCenter(interaction);
          return;
        }

        if (id === "modal-edit-member") {
          const oldName = interaction.fields.getTextInputValue("old-member").trim();
          const newName = interaction.fields.getTextInputValue("new-member").trim();
          const cfg = await import("./config.js");
          const map = cfg.memberMap;
          if (!map[oldName]) return interaction.reply({ content: "Không tìm thấy thành viên cũ.", ephemeral: true });
          delete map[oldName];
          map[newName] = newName;
          cfg.setMemberMap(map);
          await interaction.reply({ content: `✅ Đã đổi tên **${oldName}** → **${newName}**`, ephemeral: true });

          await showSetupCenter(interaction);
          return;
        }

        if (id === "modal-delete-member") {
          const name = interaction.fields.getTextInputValue("delete-member-name").trim();
          const cfg = await import("./config.js");
          const map = cfg.memberMap;
          if (!map[name]) return interaction.reply({ content: "Không tìm thấy thành viên.", ephemeral: true });
          delete map[name];
          cfg.setMemberMap(map);
          await interaction.reply({ content: `✅ Đã xóa thành viên **${name}**.`, ephemeral: true });

          await showSetupCenter(interaction);
          return;
        }
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
      // ===== create-chapter button =====
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

        const setupMsg = fetched.find(
          (m) => m.embeds.length && m.embeds[0].title?.includes(mangaName)
        );
        if (setupMsg) {
          const oldEmbed = EmbedBuilder.from(setupMsg.embeds[0]);
          const fields = oldEmbed.data.fields?.map((f) =>
            f.name === "📖 Chương hiện tại" ? { ...f, value: `Chương ${nextChap}` } : f
          ) || [];
          if (!fields.find(f => f.name === "📖 Chương hiện tại")) {
            fields.push({ name: "📖 Chương hiện tại", value: `Chương ${nextChap}` });
          }
          const updated = EmbedBuilder.from(oldEmbed).setFields(fields);
          try {
            await setupMsg.edit({ embeds: [updated] });
          } catch (err) {
            console.warn("Không thể cập nhật embed gốc:", err.message);
          }
        }

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

        const cfg = await import("./config.js");
        const members = Object.values(cfg.memberMap);
        const dropdownRoles = ["Translator", "Editor", "PR + QC"];
        for (const roleName of dropdownRoles) {
          const options = members.map(
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

        // giữ lại embed gốc ở channel manga project nếu có
        if (setupMsg) {
          try {
            await channel.send({ embeds: setupMsg.embeds, components: setupMsg.components });
          } catch (err) {
            console.warn("Không thể gửi lại embed gốc:", err.message);
          }
        }

        return;
      }

      // ===== Handle dropdown for Add Channel =====
if (interaction.isStringSelectMenu() && interaction.customId === "select-manga-to-add") {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const selectedManga = interaction.values;
  const created = await createChannelsFromList(interaction.guild, selectedManga);

  await interaction.editReply({
    content: `✅ Đã tạo channel cho: ${created.join(", ")}`,
  });
  return;
}

// ===== Handle dropdowns for chapter roles =====
if (
  interaction.isStringSelectMenu() &&
  interaction.customId.startsWith("select-") &&
  interaction.customId !== "select-manga-to-add" // 👈 tránh xử lý trùng
) {
  const parts = interaction.customId.split("-");
  const roleName = parts[1];
  const messageId = parts.slice(2).join("-");

  // bảo vệ chống lỗi “to-add” không phải số
  if (!/^\d+$/.test(messageId)) {
    console.warn(`⚠️ Bỏ qua select không hợp lệ: ${interaction.customId}`);
    await interaction.reply({
      content: "❌ Tương tác không hợp lệ (messageId không hợp lệ).",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const members = interaction.values;
  const data = roleDataMap.get(messageId) || {};
  data[roleName] = members;
  roleDataMap.set(messageId, data);

  const channel = interaction.channel;
  const mainMsg = await channel.messages.fetch(messageId);
  if (mainMsg) {
    const oldEmbed = EmbedBuilder.from(mainMsg.embeds[0]);
    const fields = oldEmbed.data.fields.map((f) =>
      f.name.includes(roleName)
        ? { ...f, value: members.join(", ") || "Chưa chọn" }
        : f
    );
    const updated = EmbedBuilder.from(oldEmbed).setFields(fields);
    await mainMsg.edit({ embeds: [updated] });
  }

  await interaction.reply({
    content: `✅ Đã cập nhật ${roleName}.`,
    flags: MessageFlags.Ephemeral,
  });
  return;
}

    } catch (err) {
      console.error("Interaction error:", err);
      if (interaction && !interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            content: "❌ Có lỗi khi xử lý tương tác.",
            ephemeral: true,
          });
        } catch (e) {}
      }
    }
  });
}
