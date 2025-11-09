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
  ctx.session.currentSearchWord = searchWord;

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
      console.log(item.name, `select_category:${item.id.toString()}`);

      return Markup.button.callback(
        item.name,
        `select_category:${item.id.toString()}`
      );
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

// Обработчик для нажатия на inline-кнопки (выбор категории)
searchingScene.action(/^select_category:(\d+)$/, async (ctx) => {
  const callbackData = ctx.callbackQuery.data;
  const productId = ctx.match[1];

  console.log(callbackData, "callbackData");
  console.log(ctx.session.currentSearchWord, "context");

  await ctx.answerCbQuery(`Вы выбрали продукт с ID: ${productId}`);
  await ctx.reply(`Обрабатываем ваш выбор продукта с ID: ${productId}`);

  ctx.reply(`Ок, сейчас пороюсь на ВБшечке, а потом в твоей жопе)
ЖДИ, ХУЛЕ...`);

  const response = await getGoods(
    ctx.session.currentSearchWord,
    "catalog",
    productId
  );

  console.log(response.data, "Response data");

  if (!response) {
    ctx.reply("Ошибка при запросе к WBшечке. Попробуй позже.");
    ctx.scene.leave();
    return;
  }

  if (response.status == 429) {
    ctx.reply("Заебал, слишком много запросов, WBшечка сдохла, дай подышать");
    ctx.scene.leave();
    return;
  }

  if (!response.data) {
    ctx.reply("Не удалось получить данные с WBшечки.");
    ctx.scene.leave();
    return;
  }

  const formatResponse = await createDocument(response.data.products, filePath);

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

  //   if (callbackData === "all_variants") {
  //     // Пользователь выбрал "Все варианты", продолжаем без фильтра
  //     selectedFilterId = null;
  //     await ctx.reply("Ок, ищу без фильтров.");
  //   } else if (callbackData.startsWith("category_")) {
  //     // Пользователь выбрал категорию
  //     selectedFilterId = callbackData.replace("category_", ""); // Извлекаем ID
  //     const selectedCategoryName =
  //       ctx.session.filters.find(
  //         (filter) => filter.id.toString() === selectedFilterId
  //       )?.name || "выбранную категорию";
  //     await ctx.reply(
  //       `Отлично! Ты выбрал: "${selectedCategoryName}". Ищу по ней...`
  //     );
  //   } else {
  //     // Если что-то пошло не так
  //     await ctx.reply("Неизвестный выбор. Попробуй еще раз.");
  //     return;
  //   }
});
