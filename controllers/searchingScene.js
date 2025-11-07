import { Scenes, Markup } from "telegraf";
import { getUserInput, createDocument } from "../utils/helpFunction.js";
import { getGoods } from "../services/queries.js";
import path from "path";
import fs from "fs/promises";

export const searchingScene = new Scenes.BaseScene("searching");

const filePath = path.resolve(process.cwd(), "goods.json");
let selectedFilterId = null;

searchingScene.enter((ctx) => {
  ctx.reply("Че ищем, пидор?");
  selectedFilterId = null;
});

searchingScene.on("message", async (ctx) => {
  const searchWord = getUserInput(ctx);
  if (!searchWord) {
    ctx.reply("Ты ничего не ввел, пидор. Попробуй еще раз.");
    ctx.scene.reenter();
    return;
  }

  console.log(searchWord);

  try {
    const currentCategories = await getGoods(searchWord, "filters");

    console.log(currentCategories.data.data.filters[0], 32);

    const firstFilter = currentCategories.data.data.filters[0];
    if (!firstFilter.items || firstFilter.items.length === 0) {
      ctx.reply(
        "Для найденных фильтров нет доступных категорий. Попробуй другой запрос."
      );
      ctx.scene.leave();
      return;
    }

    const categoryList = firstFilter.items.map((item) => {
      return Markup.button.callback(item.name, item.id.toString());
    });

    const allVariantsButton = Markup.button.callback(
      "Все варианты",
      "all_variants"
    );

    const buttons = [allVariantsButton, ...categoryList];

    if (categoryList.length > 0) {
      ctx.session.filters = firstFilter.items;
      ctx.reply(
        `Для этого запроса я нашел следующие фильтры:`,
        Markup.inlineKeyboard(buttons, { columns: 2 })
      );
    } else {
      ctx.reply("Не удалось найти подходящие категории для фильтрации.");
    }

    ctx.reply(`Ок, сейчас пороюсь на ВБшечке, а потом в твоей жопе)
ЖДИ, ХУЛЕ...`);

    const response = await getGoods(searchWord, "catalog");

    if (!response || !currentCategories) {
      ctx.reply("Ошибка при запросе к WBшечке. Попробуй позже.");
      ctx.scene.leave();
      return;
    }

    if (response.status == 429 || currentCategories.status == 429) {
      ctx.reply("Заебал, слишком много запросов, WBшечка сдохла, дай подышать");
      ctx.scene.leave();
      return;
    }

    if (!response.data.data || !response.data.data.products) {
      ctx.reply("Не удалось получить данные с WBшечки.");
      ctx.scene.leave();
      return;
    }

    const formatResponse = await createDocument(
      response.data.products,
      filePath
    );

    if (formatResponse.length === 0) {
      ctx.reply(
        `По запросу "${searchWord}" ничего не нашел на ВБшечке. Попробуй еще раз, может, я просто слепой долбоеб.`
      );
      ctx.scene.leave();
      return;
    } else {
      console.log("закончил");
      try {
        const fileContent = await fs.readFile(filePath, "utf-8");

        await ctx.sendDocument(
          {
            source: Buffer.from(fileContent),
            filename: "goods.json",
          },
          {
            caption: "Вот список товаров в формате JSON!",
          }
        );

        console.log("отправил документ");
        ctx.scene.leave();
      } catch (error) {
        console.error("Ошибка при отправке документа:", error);
        ctx.reply("Не удалось отправить документ.");
        ctx.scene.leave();
      }
    }
  } catch (error) {
    ctx.reply(`Ну пиздец!
Доволен!?
Ты меня сломал...

ошибка: ${error.message || error}

Иди покури, может позже мне станет лучше...`);

    console.error("Произошла критическая ошибка в searchingScene:", error);
    ctx.scene.leave();
  }
});

// searchingScene.on("callback_query", async (ctx) => {

// })
