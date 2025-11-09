// searchingScene.js
import { Scenes, Markup } from "telegraf";
import { getUserInput, createDocument } from "../utils/helpFunction.js";
import { getGoods } from "../services/queries.js";
import path from "path";
import fs from "fs/promises";

export const searchingScene = new Scenes.BaseScene("searching");

const filePath = path.resolve(process.cwd(), "goods.json");

// Переменная для хранения выбранного filterId
let selectedFilterId = null;

searchingScene.enter((ctx) => {
  ctx.reply("Че ищем, пидор?");
  // Сбрасываем selectedFilterId при входе в сцену, чтобы избежать старых значений
  selectedFilterId = null;
});

// Обработчик для обычных текстовых сообщений (начальный поиск)
searchingScene.on("message", async (ctx) => {
  const searchWord = getUserInput(ctx);
  if (!searchWord) {
    ctx.reply("Ты ничего не ввел, пидор. Попробуй еще раз.");
    ctx.scene.reenter();
    return;
  }

  console.log(searchWord);

  try {
    // Сначала получаем фильтры
    const currentCategories = await getGoods(searchWord, "filters");

    console.log("Filters response:", currentCategories.data.data.filters); // Логирование для отладки

    const firstFilter = currentCategories.data.data.filters && currentCategories.data.data.filters[0];
    if (!firstFilter || !firstFilter.items || firstFilter.items.length === 0) {
      ctx.reply(
        "Для найденных фильтров нет доступных категорий. Попробуй другой запрос."
      );
      ctx.scene.leave();
      return;
    }

    const categoryList = firstFilter.items.map((item) => {
      // Кнопка с id категории
      return Markup.button.callback(item.name, `category_${item.id}`); // Префикс для идентификации
    });

    const allVariantsButton = Markup.button.callback(
      "Все варианты",
      "all_variants" // Специальный идентификатор для случая, когда фильтры не нужны
    );

    const buttons = [allVariantsButton, ...categoryList];

    if (categoryList.length > 0) {
      // Сохраняем в сессии бота, чтобы использовать потом
      ctx.session.filters = firstFilter.items;
      ctx.reply(
        `Для этого запроса я нашел следующие фильтры:`,
        Markup.inlineKeyboard(buttons, { columns: 2 })
      );
    } else {
      ctx.reply("Не удалось найти подходящие категории для фильтрации.");
      ctx.scene.leave();
      return;
    }

    // Сообщение о начале поиска
    ctx.reply(`Ок, сейчас пороюсь на ВБшечке, а потом в твоей жопе)
ЖДИ, ХУЛЕ...`);

    // Здесь мы НЕ делаем запрос к каталогу, пока пользователь не выберет фильтр.
    // Это будет сделано в обработчике callback_query.

  } catch (error) {
    ctx.reply(`Ну пиздец!
Доволен!?
Ты меня сломал...

ошибка: ${error.message || error}

Иди покури, может позже мне станет лучше...`);

    console.error("Произошла критическая ошибка в searchingScene (message handler):", error);
    ctx.scene.leave();
  }
});

// Обработчик для нажатия на inline-кнопки (выбор категории)
searchingScene.on("callback_query", async (ctx) => {
  const callbackData = ctx.callbackQuery.data;

  // Отвечаем на callback_query, чтобы убрать "часики" у кнопки
  await ctx.answerCbQuery();

  if (callbackData === "all_variants") {
    // Пользователь выбрал "Все варианты", продолжаем без фильтра
    selectedFilterId = null;
    await ctx.reply("Ок, ищу без фильтров.");
  } else if (callbackData.startsWith("category_")) {
    // Пользователь выбрал категорию
    selectedFilterId = callbackData.replace("category_", ""); // Извлекаем ID
    const selectedCategoryName = ctx.session.filters.find(filter => filter.id.toString() === selectedFilterId)?.name || "выбранную категорию";
    await ctx.reply(`Отлично! Ты выбрал: "${selectedCategoryName}". Ищу по ней...`);
  } else {
    // Если что-то пошло не так
    await ctx.reply("Неизвестный выбор. Попробуй еще раз.");
    return;
  }

  // Теперь, когда у нас есть selectedFilterId (или null), делаем запрос к каталогу
  const searchWord = ctx.session.currentSearchWord; // Получаем исходный поисковый запрос из сессии

  if (!searchWord) {
      ctx.reply("Ошибка: не могу вспомнить, что ты искал. Попробуй начать заново.");
      ctx.scene.leave();
      return;
  }

  try {
    ctx.reply(`ЖДИ, ХУЛЕ... Ищу товары...`);

    const response = await getGoods(searchWord, "catalog", 1, selectedFilterId); // Передаем selectedFilterId

    if (!response) {
      ctx.reply("Ошибка при запросе к WBшечке. Попробуй позже.");
      ctx.scene.leave();
      return;
    }

    if (response.status === 429) { // Исправил проверку на ===
      ctx.reply("Заебал, слишком много запросов, WBшечка сдохла, дай подышать");
      ctx.scene.leave();
      return;
    }

    if (!response.data || !response.data.products) { // Проверка на response.data
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
            caption: `Вот список товаров по запросу "${searchWord}"${selectedFilterId ? ` с фильтром ${selectedCategoryName}` : ''} в формате JSON!`,
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

    console.error("Произошла критическая ошибка в searchingScene (callback_query handler):", error);
    ctx.scene.leave();
  }
});

// Добавляем обработку сохранения поискового слова в сессии
// Это нужно, чтобы callback_query мог получить поисковое слово
searchingScene.on("message", async (ctx) => {
  const searchWord = getUserInput(ctx);
  if (!searchWord) {
    ctx.reply("Ты ничего не ввел, пидор. Попробуй еще раз.");
    ctx.scene.reenter();
    return;
  }

  console.log(searchWord);
  ctx.session.currentSearchWord = searchWord; // Сохраняем поисковое слово в сессии

  try {
    const currentCategories = await getGoods(searchWord, "filters");

    console.log("Filters response:", currentCategories.data.data.filters);

    const firstFilter = currentCategories.data.data.filters && currentCategories.data.data.filters[0];
    if (!firstFilter || !firstFilter.items || firstFilter.items.length === 0) {
      ctx.reply(
        "Для найденных фильтров нет доступных категорий. Попробуй другой запрос."
      );
      ctx.scene.leave();
      return;
    }

    const categoryList = firstFilter.items.map((item) => {
      return Markup.button.callback(item.name, `category_${item.id}`);
    });

    const allVariantsButton = Markup.button.callback(
      "Все варианты",
      "all_variants"
    );

    const buttons = [allVariantsButton, ...categoryList];

    if (categoryList.length > 0) {
      ctx.session.filters = firstFilter.items; // Сохраняем фильтры в сессии
      ctx.reply(
        `Для этого запроса я нашел следующие фильтры:`,
        Markup.inlineKeyboard(buttons, { columns: 2 })
      );
    } else {
      ctx.reply("Не удалось найти подходящие категории для фильтрации.");
      ctx.scene.leave();
      return;
    }

  } catch (error) {
    ctx.reply(`Ну пиздец!
Доволен!?
Ты меня сломал...

ошибка: ${error.message || error}

Иди покури, может позже мне станет лучше...`);

    console.error("Произошла критическая ошибка в searchingScene (message handler):", error);
    ctx.scene.leave();
  }
});
