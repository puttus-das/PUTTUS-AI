const TelegramBot = require("node-telegram-bot-api");

const BOT_NAME = process.env.BOT_NAME || "PUTTUS-XD";
const PAIR_COOLDOWN_MS = 60 * 1000;

const pairCooldown = new Map();
const pairingUsers = new Set();

const WHATSAPP_CHANNEL_URL =
  "https://whatsapp.com/channel/0029Vb7pmbEEwEjzdGSM4G3B";

const OWNER_CONTACT_URL = "https://wa.me/917679218662";

const MAIN_BUTTONS = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "📢 WhatsApp Channel",
          url: WHATSAPP_CHANNEL_URL,
        },
      ],
      [
        {
          text: "👤 Owner Contact",
          url: OWNER_CONTACT_URL,
        },
      ],
    ],
  },
};

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCode(value) {
  const raw = String(value || "").replace(/\s+/g, "");

  if (!raw) {
    return "";
  }

  return raw.match(/.{1,4}/g)?.join("-") || raw;
}

function maskPhone(value) {
  const phone = String(value || "");

  if (phone.length <= 4) {
    return phone;
  }

  return `${phone.slice(0, 2)}********${phone.slice(-2)}`;
}

function startTelegramPairing({
  onPairRequest,
  onLogoutRequest,
  getStatus,
} = {}) {
  const token =
    process.env.TELEGRAM_BOT_TOKEN || process.env.TG_TOKEN || "";

  if (!token || /^YOUR_|^\s*$/.test(token)) {
    console.log(
      "Telegram pairing disabled: TELEGRAM_BOT_TOKEN is not set.",
    );
    return null;
  }

  if (typeof onPairRequest !== "function") {
    console.error(
      "Telegram pairing disabled: WhatsApp pairing callback is missing.",
    );
    return null;
  }

  const bot = new TelegramBot(token, {
    polling: true,
  });

  bot.onText(/^\/(start|help)$/i, async (message) => {
    try {
      await bot.sendMessage(
        message.chat.id,
        `🤖 ${BOT_NAME}\n\n` +
          "Use /pair followed by your WhatsApp number.\n\n" +
          "Example:\n" +
          "/pair 919876543210\n\n" +
          "WhatsApp steps:\n" +
          "1. Open Settings\n" +
          "2. Tap Linked devices\n" +
          "3. Tap Link a device\n" +
          "4. Choose Link with phone number instead\n" +
          "5. Enter the pairing code\n\n" +
          "Use /status to check the bot.\n" +
          "Use /logout to disconnect WhatsApp.",
        MAIN_BUTTONS,
      );
    } catch (error) {
      console.error("Telegram help error:", error.message);
    }
  });

  bot.onText(/^\/status$/i, async (message) => {
    try {
      const status =
        typeof getStatus === "function" ? getStatus() : {};

      const connected = Boolean(status.connected);

      if (connected) {
        await bot.sendMessage(
          message.chat.id,
          `🟢 ${BOT_NAME} WhatsApp connected` +
            (status.user?.id ? `\n${status.user.id}` : ""),
          MAIN_BUTTONS,
        );
      } else {
        await bot.sendMessage(
          message.chat.id,
          `⚪ ${BOT_NAME} WhatsApp is not connected.\n\n` +
            "Use:\n" +
            "/pair 919876543210",
          MAIN_BUTTONS,
        );
      }
    } catch (error) {
      await bot.sendMessage(
        message.chat.id,
        `❌ Status error: ${error.message}`,
      );
    }
  });

  bot.onText(/^\/logout$/i, async (message) => {
    try {
      if (typeof onLogoutRequest !== "function") {
        throw new Error("Logout is unavailable");
      }

      await onLogoutRequest();

      await bot.sendMessage(
        message.chat.id,
        `✅ ${BOT_NAME} WhatsApp session logged out.`,
        MAIN_BUTTONS,
      );
    } catch (error) {
      await bot.sendMessage(
        message.chat.id,
        `❌ Logout failed: ${error.message}`,
      );
    }
  });

  bot.onText(/^\/pair(?:\s+(.+))?$/i, async (message, match) => {
    const chatId = message.chat.id;
    const userId = String(message.from?.id || chatId);

    const lastRequest = pairCooldown.get(userId) || 0;
    const remaining =
      PAIR_COOLDOWN_MS - (Date.now() - lastRequest);

    if (remaining > 0) {
      await bot.sendMessage(
        chatId,
        `⏳ Please wait ${Math.ceil(remaining / 1000)} seconds.`,
      );
      return;
    }

    const phone = normalizePhone(match?.[1]);

    if (!/^\d{8,15}$/.test(phone)) {
      await bot.sendMessage(
        chatId,
        "❌ Invalid WhatsApp number.\n\n" +
          "Correct example:\n" +
          "/pair 919876543210",
      );
      return;
    }

    if (pairingUsers.has(userId)) {
      await bot.sendMessage(
        chatId,
        "⏳ Your pairing request is already running.",
      );
      return;
    }

    pairCooldown.set(userId, Date.now());
    pairingUsers.add(userId);

    try {
      await bot.sendMessage(
        chatId,
        `⏳ Generating ${BOT_NAME} pairing code for ` +
          `${maskPhone(phone)}...`,
      );

      const code = await onPairRequest(phone);

      if (!code) {
        throw new Error("WhatsApp did not return a pairing code.");
      }

      await bot.sendMessage(
        chatId,
        `🔐 *${BOT_NAME} WhatsApp Pairing Code*\n\n` +
          `Code: *${formatCode(code)}*\n\n` +
          "On WhatsApp:\n" +
          "1. Open Settings\n" +
          "2. Tap Linked devices\n" +
          "3. Tap Link a device\n" +
          "4. Choose Link with phone number instead\n" +
          "5. Enter the code above\n\n" +
          "⚠️ Do not share this code with anyone.",
        {
          parse_mode: "Markdown",
          ...MAIN_BUTTONS,
        },
      );
    } catch (error) {
      console.error("Telegram pairing error:", error);

      await bot.sendMessage(
        chatId,
        `❌ Pairing failed:\n${error.message}`,
      );
    } finally {
      pairingUsers.delete(userId);
    }
  });

  bot.on("polling_error", (error) => {
    console.error(
      "Telegram polling error:",
      error.message,
    );
  });

  bot.on("error", (error) => {
    console.error(
      "Telegram bot error:",
      error.message,
    );
  });

  console.log("✅ Telegram pairing control is running.");

  return bot;
}

module.exports = {
  startTelegramPairing,
};
        
