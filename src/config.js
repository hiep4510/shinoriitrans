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
const DATA_DIR = path.resolve("./data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const MANGA_FILE = path.join(DATA_DIR, "mangaList.json");
const MEMBER_FILE = path.join(DATA_DIR, "memberMap.json");

/* ========== load dữ liệu từ file hoặc dùng mặc định ========== */
export let mangaList = fs.existsSync(MANGA_FILE)
  ? JSON.parse(fs.readFileSync(MANGA_FILE, "utf-8"))
  : [
      "Make Heroine wo Katasetai!!",
      "Chanto Suki tte Ieru Ko Musou",
      "Someone Hertz",
      "Oshite Dame nara Oshite miro!",
      "Saigo no Negai ni Tsuki ga Naku",
      "Idol Chuunibyou",
      "Toaru Kagaku no Mental Out",
    ];

export let memberMap = fs.existsSync(MEMBER_FILE)
  ? JSON.parse(fs.readFileSync(MEMBER_FILE, "utf-8"))
  : {
      "Nam thần bí ẩn": "Nam thần bí ẩn",
      Juli: "Juli",
      SnowTy: "SnowTy",
      Shork: "Shork",
      Bean: "Bean",
      Golk: "Golk",
    };

/* ========== helper để update runtime + ghi vào file ========== */
export function setMangaList(newList) {
  mangaList = newList;
  fs.writeFileSync(MANGA_FILE, JSON.stringify(newList, null, 2), "utf-8");
}

export function setMemberMap(newMap) {
  memberMap = newMap;
  fs.writeFileSync(MEMBER_FILE, JSON.stringify(newMap, null, 2), "utf-8");
}
