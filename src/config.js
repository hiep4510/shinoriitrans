// src/config.js
import dotenv from "dotenv";
dotenv.config();

export const ENV = process.env;

export const ADMIN_ROLE_ID = "1435243498482700390";
export const MOD_ROLE_ID = "1435243499829198952";
export const AUTH_USER_ID = "1385427304921960478";
export const READONLY_ROLE_ID = "1435243510474211429";

export const DEFAULT_CATEGORY_NAME = "Manga Projects";
export const SETUP_CENTER_NAME = "Setup Center";

/* ========== initial data (same như bot.js gốc) ========== */
export let mangaList = [
  "Make Heroine wo Katasetai!!",
  "Chanto Suki tte Ieru Ko Musou",
  "Someone Hertz",
  "Oshite Dame nara Oshite miro!",
  "Saigo no Negai ni Tsuki ga Naku",
  "Idol Chuunibyou",
  "Toaru Kagaku no Mental Out",
];

export let memberMap = {
  "Nam thần bí ẩn": "Nam thần bí ẩn",
  Juli: "Juli",
  SnowTy: "SnowTy",
  Shork: "Shork",
  Bean: "Bean",
  Golk: "Golk",
};

/* helper export so other modules can update these runtime lists */
export function setMangaList(newList) {
  mangaList = newList;
}
export function setMemberMap(newMap) {
  memberMap = newMap;
}
