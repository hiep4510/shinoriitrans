import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

export const ENV = process.env;

export const ADMIN_ROLE_ID = "1435243498482700390";
export const MOD_ROLE_ID = "1435243499829198952";
export const AUTH_USER_ID = "1385427304921960478";
export const READONLY_ROLE_ID = "1435243510474211429";

export const DEFAULT_CATEGORY_NAME = "Manga Projects";
export const SETUP_CENTER_NAME = "Setup Center";

/* ========== File lưu dữ liệu ========== */
// Dùng đường dẫn tuyệt đối dựa vào file này
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const DATA_DIR = path.join(__dirname, "data");

// tạo thư mục nếu chưa có
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const MANGA_FILE = path.join(DATA_DIR, "mangaList.json");
const MEMBER_FILE = path.join(DATA_DIR, "memberMap.json");

/* ========== load dữ liệu từ file ========== */
export let mangaList = [];
export let memberMap = {};

// Load mangaList
try {
  if (fs.existsSync(MANGA_FILE)) {
    mangaList = JSON.parse(fs.readFileSync(MANGA_FILE, "utf-8"));
  } else {
    fs.writeFileSync(MANGA_FILE, JSON.stringify([], null, 2), "utf-8");
    console.log(`[Info] Tạo mới file mangaList.json tại ${MANGA_FILE}`);
  }
} catch (err) {
  console.error("[Error] Không thể đọc/ghi mangaList.json:", err);
}

// Load memberMap
try {
  if (fs.existsSync(MEMBER_FILE)) {
    memberMap = JSON.parse(fs.readFileSync(MEMBER_FILE, "utf-8"));
  } else {
    fs.writeFileSync(MEMBER_FILE, JSON.stringify({}, null, 2), "utf-8");
    console.log(`[Info] Tạo mới file memberMap.json tại ${MEMBER_FILE}`);
  }
} catch (err) {
  console.error("[Error] Không thể đọc/ghi memberMap.json:", err);
}

/* ========== helper để update runtime + ghi vào file ========== */
export function setMangaList(newList) {
  mangaList = newList;
  try {
    fs.writeFileSync(MANGA_FILE, JSON.stringify(newList, null, 2), "utf-8");
  } catch (err) {
    console.error("[Error] Không thể ghi mangaList.json:", err);
  }
}

export function setMemberMap(newMap) {
  memberMap = newMap;
  try {
    fs.writeFileSync(MEMBER_FILE, JSON.stringify(newMap, null, 2), "utf-8");
  } catch (err) {
    console.error("[Error] Không thể ghi memberMap.json:", err);
  }
}
