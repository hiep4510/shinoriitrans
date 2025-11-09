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
// Dùng path relative với file này
const DATA_DIR = path.join(path.resolve(), "src", "data");

// tạo thư mục nếu chưa có
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const MANGA_FILE = path.join(DATA_DIR, "mangaList.json");
const MEMBER_FILE = path.join(DATA_DIR, "memberMap.json");

/* ========== load dữ liệu từ file ========== */
export let mangaList = [];
export let memberMap = {};

// Load mangaList
if (fs.existsSync(MANGA_FILE)) {
  mangaList = JSON.parse(fs.readFileSync(MANGA_FILE, "utf-8"));
} else {
  console.warn(`[Warning] File mangaList.json không tồn tại ở ${MANGA_FILE}`);
}

// Load memberMap
if (fs.existsSync(MEMBER_FILE)) {
  memberMap = JSON.parse(fs.readFileSync(MEMBER_FILE, "utf-8"));
} else {
  console.warn(`[Warning] File memberMap.json không tồn tại ở ${MEMBER_FILE}`);
}

/* ========== helper để update runtime + ghi vào file ========== */
export function setMangaList(newList) {
  mangaList = newList;
  fs.writeFileSync(MANGA_FILE, JSON.stringify(newList, null, 2), "utf-8");
}

export function setMemberMap(newMap) {
  memberMap = newMap;
  fs.writeFileSync(MEMBER_FILE, JSON.stringify(newMap, null, 2), "utf-8");
}
