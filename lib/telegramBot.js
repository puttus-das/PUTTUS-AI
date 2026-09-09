const TelegramBot = require("node-telegram-bot-api");

const PAIR_COOLDOWN_MS = 60_000;
const pairCooldown = new Map();
const pairingUsers = new Set();

const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb7pmbEEwEjzdGSM4G3B";
const OWNER_CONTACT_URL = "https://wa.me/917679218662";
const MAIN_BUTTONS = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "📢 WhatsApp Channel", url: WHATSAPP_CHANNEL_URL }],
      [{ text: "👤 Owner Contact", url: OWNER_CONTACT_URL }]
    ]
  }
};

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCode(value) {
  const raw = String(value || "").replace(/\s+/g, "");
  return raw.match(/.{1,4}/g)?.join("-") || raw;
}

function maskPhone(value) {
  const phone = String(value || "");
  return phone.length > 4 ? `${phone.slice(0, 2)}********${phone.slice(-2)}` : phone;
}

function startTelegramPairing({ onPairRequest, onLogoutRequest, getStatus } = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.TG_TOKEN;
  if (!token || /^YOUR_|^\s*$/.test(token)) {
    console.log("ℹ️ Telegram pairing disabled: TELEGRAM_BOT_TOKEN is not set.");
    return null;
  }
  if (typeof onPairRequest !== "function") {
    console.error("❌ Telegram pairing disabled: WhatsApp pairing callback is missing.");
    return null;
  }

  const bot = new TelegramBot(token, { polling: true });

  bot.onText(/^\/(start|help)$/i, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      "🤖 PUTTUS-AI\n\n" +
        "Use /pair <country-code + number> to get a WhatsApp pairing code.\n" +
        "Example: /pair 919876543210\n\n" +
        "WhatsApp → Settings → Linked devices → Link a device → Link with phone number instead.\n\n" +
        "Use /status to check the bot status.\nUse /logout to disconnect the current session.",
      MAIN_BUTTONS
    );
  });

  bot.onText(/^\/status$/i, async (msg) => {
    try {
      const status = typeof getStatus === "function" ? getStatus() : {};
      const connected = Boolean(status.connected);
      await bot.sendMessage(
        msg.chat.id,
        connected
          ? `🟢 WhatsApp connected${status.user?.id ? `\n${status.user.id}` : ""}`
          : "⚪ WhatsApp is not connected. Use /pair <number>."
      );
    } catch (error) {
      await bot.sendMessage(msg.chat.id, `❌ Status error: ${error.message}`);
    }
  });

  bot.onText(/^\/logout$/i, async (msg) => {
    try {
      if (typeof onLogoutRequest !== "function") throw new Error("Logout is unavailable");
      await onLogoutRequest();
      await bot.sendMessage(msg.chat.id, "✅ WhatsApp session logged out.");
    } catch (error) {
      await bot.sendMessage(msg.chat.id, `❌ Logout failed: ${error.message}`);
    }
  });

  bot.onText(/^\/pair(?:\s+(.+))?$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id || chatId);
    const remaining = PAIR_COOLDOWN_MS - (Date.now() - (pairCooldown.get(userId) || 0));
    if (remaining > 0) {
      await bot.sendMessage(chatId, `⏳ Please wait ${Math.ceil(remaining / 1000)} seconds before trying again.`);
      return;
    }

    const phone = normalizePhone(match?.[1]);
    if (!/^\d{8,15}$/.test(phone)) {
      await bot.sendMessage(chatId, "❌ Invalid number. Example: /pair 919876543210");
      return;
    }
    if (pairingUsers.has(userId)) {
      await bot.sendMessage(chatId, "⏳ Your pairing request is already running. Please wait.");
      return;
    }

    pairCooldown.set(userId, Date.now());
    pairingUsers.add(userId);
    try {
      await bot.sendMessage(chatId, `⏳ Generating a pairing code for ${maskPhone(phone)}...`);
      const code = await onPairRequest(phone);
      await bot.sendMessage(
        chatId,
        "🔐 *WhatsApp Pairing Code*\n\n" +
          `Code: *${formatCode(code)}*\n\n` +
          "On WhatsApp:\n" +
          "1. Open Settings\n" +
          "2. Tap Linked devices\n" +
          "3. Tap Link a device\n" +
          "4. Choose Link with phone number instead\n" +
          "5. Enter the code above\n\n" +
          "⚠️ Do not share this code.",
        { parse_mode: "Markdown", ...MAIN_BUTTONS }
      );
    } catch (error) {
      console.error("Telegram pairing error:", error);
      await bot.sendMessage(chatId, `❌ Pairing failed: ${error.message}`);
    } finally {
      pairingUsers.delete(userId);
    }
  });

  bot.on("polling_error", (error) => console.error("Telegram polling error:", error.message));
  bot.on("error", (error) => console.error("Telegram bot error:", error.message));
  console.log("✅ Telegram pairing control is running.");
  return bot;
}

module.exports = { startTelegramPairing };
        
