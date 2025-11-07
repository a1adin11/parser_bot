import { setupBot } from "./bot.js";

try {
  const bot = setupBot();
  await bot.launch();
  console.log("🎉 Бот успешно запущен! 🎉");
} catch (e) {
  console.error("❌ Ошибка при запуске бота:", e);
}

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

