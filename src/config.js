// src/config.js
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

export const ENV = process.env;

export const ADMIN_ROLE_ID = "1435243498482700390";
export const MOD_ROLE_ID = "1435243499829198952";
export const AUTH_USER_ID = "1385427304921960478";
export const READONLY_ROLE_ID = "1435243510474211429";

export const DEFAULT_CATEGORY_NAME = "Manga Projects";
export const SETUP_CENTER_NAME = "Setup Center";

/* ======== file lưu dữ liệu ======== */
const MANGA_FILE = path.resolve("./data/mangaList.json");
const MEMBER_FILE = path.resolve("./data/memberMap.json");

/* ======== helper function ======== */
function readJSON(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("❌ Lỗi đọc file JSON:", err);
    return defaultValue;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("❌ Lỗi ghi file JSON:", err);
  }
}

/* ======== load dữ liệu ban đầu ======== */
export let mangaList = readJSON(MANGA_FILE, [
  "Make Heroine wo Katasetai!!",
  "Chanto Suki tte Ieru Ko Musou",
  "Someone Hertz",
  "Oshite Dame nara Oshite miro!",
  "Saigo no Negai ni Tsuki ga Naku",
  "Idol Chuunibyou",
  "Toaru Kagaku no Mental Out",
]);

export let memberMap = readJSON(MEMBER_FILE, {
  "Nam thần bí ẩn": "Nam thần bí ẩn",
  Juli: "Juli",
  SnowTy: "SnowTy",
  Shork: "Shork",
  Bean: "Bean",
  Golk: "Golk",
});

/* ======== helper export để update ======== */
export function setMangaList(newList) {
  mangaList = newList;
  writeJSON(MANGA_FILE, mangaList);
}

export function setMemberMap(newMap) {
  memberMap = newMap;
  writeJSON(MEMBER_FILE, memberMap);
}
