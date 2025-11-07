import { mainMenu } from "../utils/buttons.js";

export const start = (ctx) => {
  ctx.reply(
    `Шо ты, лысый, Плаки-Плаки?)))
Просишь меня разнюхать для твоей бледнолицей задницы нового дешевого желаза?)
Тебе повезло, у меня завалялось пару вариантов, но если будешь плохо себя вести, я отправлю твоей бабуле парочку твоих дикпиков)`,
    mainMenu
  );
};

// Вход в сцену
export const startSearching = (ctx) => {
  return ctx.scene.enter("searching");
};
