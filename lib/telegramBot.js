const TelegramBot = require("node-telegram-bot-api");
const settings = require("../settings");

const cooldown = new Map();
const running = new Set();
const buttons = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "📢 WhatsApp Channel", url: settings.channelLink }],
      [{ text: "👤 Owner Contact", url: settings.ownerContact }],
    ],
  },
};

function normalizePhone(value) { return String(value || "").replace(/\D/g, ""); }
function formatCode(value) {
  const raw = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return raw.match(/.{1,4}/g)?.join("-") || raw;
}

function startTelegramPairing({ pair, logout, status }) {
  const token = settings.telegramBotToken;
  if (!token) { console.error("Telegram token is missing"); return null; }
  const bot = new TelegramBot(token, { polling: true });

  bot.onText(/^\/(start|help)$/i, (msg) => bot.sendMessage(msg.chat.id,
    `🤖 ${settings.botName}\n\nUse /pair <country-code + number> to connect your WhatsApp.\nExample: /pair 919876543210\n\nUse /status to check your session or /logout to disconnect it.`, buttons));

  bot.onText(/^\/status$/i, async (msg) => {
    try {
      const s = await status(String(msg.from?.id || msg.chat.id));
      await bot.sendMessage(msg.chat.id, s?.connected ? `🟢 WhatsApp connected\n${s.number || ""}` : "⚪ Your WhatsApp is not connected. Use /pair <number>.");
    } catch (e) { await bot.sendMessage(msg.chat.id, `❌ Status error: ${e.message}`); }
  });

  bot.onText(/^\/logout$/i, async (msg) => {
    try { await logout(String(msg.from?.id || msg.chat.id)); await bot.sendMessage(msg.chat.id, "✅ Your WhatsApp session was logged out."); }
    catch (e) { await bot.sendMessage(msg.chat.id, `❌ Logout failed: ${e.message}`); }
  });

  bot.onText(/^\/pair(?:\s+(.+))?$/i, async (msg, match) => {
    const userId = String(msg.from?.id || msg.chat.id);
    const last = cooldown.get(userId) || 0;
    if (Date.now() - last < settings.pairCooldownMs) {
      return bot.sendMessage(msg.chat.id, "⏳ Please wait before requesting another code.");
    }
    const phone = normalizePhone(match?.[1]);
    if (!/^\d{8,15}$/.test(phone)) return bot.sendMessage(msg.chat.id, "❌ Invalid number. Example: /pair 919876543210");
    if (running.has(userId)) return bot.sendMessage(msg.chat.id, "⏳ Your pairing request is already running.");
    cooldown.set(userId, Date.now()); running.add(userId);
    try {
      await bot.sendMessage(msg.chat.id, "⏳ Generating your WhatsApp pairing code...");
      const code = await pair(userId, phone);
      await bot.sendMessage(msg.chat.id,
        `🤖 *${settings.botName}*\n\n🔐 *WhatsApp Pairing Code*\n\nCode: *${formatCode(code)}*\n\nOn WhatsApp:\n1. Open Settings\n2. Tap Linked devices\n3. Tap Link a device\n4. Choose Link with phone number instead\n5. Enter the code above\n\n⚠️ Do not share this code.`,
        { parse_mode: "Markdown", ...buttons });
    } catch (e) { await bot.sendMessage(msg.chat.id, `❌ Pairing failed: ${e.message}`); }
    finally { running.delete(userId); }
  });
  bot.on("polling_error", (e) => console.error("Telegram polling error:", e.message));
  console.log("✅ Telegram multi-device control is running.");
  return bot;
}
module.exports = { startTelegramPairing };
