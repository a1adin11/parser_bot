// utils/buttons.js (для Inline-клавиатуры)
import { Markup } from "telegraf";
import CMD_TEXT from "../config/consts.js";

const inlineButtons = Object.entries(CMD_TEXT).map(([key, value]) => {
  return Markup.button.callback(value, key);
});

const categoryButtons = Object.entries(CMD_TEXT).map(([key, value]) => {
  return Markup.button.callback(value, key);
});

export const mainMenu = Markup.keyboard([inlineButtons]).resize();
