import { Scenes, session, Telegraf } from "telegraf";
import dotenv from "dotenv";

import { start } from "./controllers/command.js";
import { startSearching } from "./controllers/command.js";

import CMD_TEXT from "./config/consts.js";
import { searchingScene } from "./controllers/searchingScene.js";

dotenv.config({ path: "./config/.env" });

const bot = new Telegraf(process.env.BOT_TOKEN);

const stage = new Scenes.Stage([searchingScene]);

export const setupBot = () => {
  bot.use(session({ collectionName: "sessions" }));
  bot.use(stage.middleware());

  bot.use((ctx, next) => {
    console.log(ctx);
    return next();
  });

  bot.start(start);

  bot.hears(CMD_TEXT.search, startSearching);

  return bot;
};
