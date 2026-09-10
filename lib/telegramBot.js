const TelegramBot = require("node-telegram-bot-api");

const BOT_NAME =
  process.env.BOT_NAME || "PUTTUS-XD";

const PAIR_COOLDOWN_MS = 60 * 1000;

const pairCooldown = new Map();
const pairingUsers = new Set();

const WHATSAPP_CHANNEL_URL =
  "https://whatsapp.com/channel/0029Vb7pmbEEwEjzdGSM4G3B";

const OWNER_CONTACT_URL =
  "https://wa.me/917679218662";

const MAIN_BUTTONS = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "𓆩⚡𓆪 𝑾𝒉𝒂𝒕𝒔𝑨𝒑𝒑 𝑪𝒉𝒂𝒏𝒏𝒆𝒍",
          url: WHATSAPP_CHANNEL_URL,
        },
      ],
      [
        {
          text: "𓆩👑𓆪 𝑶𝒘𝒏𝒆𝒓 𝑪𝒐𝒏𝒕𝒂𝒄𝒕",
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
  const raw = String(value || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

  return raw.match(/.{1,4}/g)?.join("-") || raw;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.TG_TOKEN ||
    "";

  if (!token || /^YOUR_|^\s*$/.test(token)) {
    console.log(
      "Telegram pairing is disabled because TELEGRAM_BOT_TOKEN is missing.",
    );
    return null;
  }

  if (typeof onPairRequest !== "function") {
    console.error(
      "Telegram pairing is disabled because the WhatsApp pairing callback is missing.",
    );
    return null;
  }

  const bot = new TelegramBot(token, {
    polling: true,
  });

  bot.onText(
    /^\/(start|help)$/i,
    async (message) => {
      try {
        await bot.sendMessage(
          message.chat.id,
          `🤖 <b>${escapeHtml(
            BOT_NAME,
          )}</b>\n\n` +
            "✨ <b>𝑾𝒆𝒍𝒄𝒐𝒎𝒆 𝑻𝒐 𝑷𝑼𝑻𝑻𝑼𝑺 𝑷𝒂𝒊𝒓𝒊𝒏𝒈</b>\n\n" +
            "📱 𝑼𝒔𝒆 /pair 𝒇𝒐𝒍𝒍𝒐𝒘𝒆𝒅 𝒃𝒚 𝒚𝒐𝒖𝒓 𝑾𝒉𝒂𝒕𝒔𝑨𝒑𝒑 𝒏𝒖𝒎𝒃𝒆𝒓.\n\n" +
            "📝 <b>𝑬𝒙𝒂𝒎𝒑𝒍𝒆:</b>\n" +
            "<code>/pair 919876543210</code>\n\n" +
            "📲 <b>𝑾𝒉𝒂𝒕𝒔𝑨𝒑𝒑 𝑺𝒕𝒆𝒑𝒔:</b>\n" +
            "➊ 𝑶𝒑𝒆𝒏 𝑺𝒆𝒕𝒕𝒊𝒏𝒈𝒔\n" +
            "➋ 𝑻𝒂𝒑 𝑳𝒊𝒏𝒌𝒆𝒅 𝒅𝒆𝒗𝒊𝒄𝒆𝒔\n" +
            "➌ 𝑻𝒂𝒑 𝑳𝒊𝒏𝒌 𝒂 𝒅𝒆𝒗𝒊𝒄𝒆\n" +
            "➍ 𝑪𝒉𝒐𝒐𝒔𝒆 𝑳𝒊𝒏𝒌 𝒘𝒊𝒕𝒉 𝒑𝒉𝒐𝒏𝒆 𝒏𝒖𝒎𝒃𝒆𝒓 𝒊𝒏𝒔𝒕𝒆𝒂𝒅\n" +
            "➎ 𝑬𝒏𝒕𝒆𝒓 𝒕𝒉𝒆 𝒑𝒂𝒊𝒓𝒊𝒏𝒈 𝒄𝒐𝒅𝒆\n\n" +
            "📊 𝑼𝒔𝒆 /status 𝒕𝒐 𝒄𝒉𝒆𝒄𝒌 𝒕𝒉𝒆 𝒃𝒐𝒕.\n" +
            "🚪 𝑼𝒔𝒆 /logout 𝒕𝒐 𝒅𝒊𝒔𝒄𝒐𝒏𝒏𝒆𝒄𝒕 𝑾𝒉𝒂𝒕𝒔𝑨𝒑𝒑.",
          {
            parse_mode: "HTML",
            ...MAIN_BUTTONS,
          },
        );
      } catch (error) {
        console.error(
          "Telegram help error:",
          error.message,
        );
      }
    },
  );

  bot.onText(
    /^\/status$/i,
    async (message) => {
      try {
        const status =
          typeof getStatus === "function"
            ? getStatus()
            : {};

        if (Boolean(status.connected)) {
          await bot.sendMessage(
            message.chat.id,
            `🟢 <b>${escapeHtml(
              BOT_NAME,
            )}</b> 𝑾𝒉𝒂𝒕𝒔𝑨𝒑𝒑 𝒊𝒔 𝑪𝒐𝒏𝒏𝒆𝒄𝒕𝒆𝒅.\n\n` +
              "📱 <b>𝑨𝒄𝒄𝒐𝒖𝒏𝒕:</b>\n" +
              escapeHtml(
                status.user?.id || "",
              ),
            {
              parse_mode: "HTML",
              ...MAIN_BUTTONS,
            },
          );
        } else {
          await bot.sendMessage(
            message.chat.id,
            `⚪ <b>${escapeHtml(
              BOT_NAME,
            )}</b> 𝑾𝒉𝒂𝒕𝒔𝑨𝒑𝒑 𝒊𝒔 𝑵𝒐𝒕 𝑪𝒐𝒏𝒏𝒆𝒄𝒕𝒆𝒅.\n\n` +
              "🔗 <b>𝑼𝒔𝒆:</b>\n" +
              "<code>/pair 919876543210</code>",
            {
              parse_mode: "HTML",
              ...MAIN_BUTTONS,
            },
          );
        }
      } catch (error) {
        await bot.sendMessage(
          message.chat.id,
          `❌ <b>𝑺𝒕𝒂𝒕𝒖𝒔 𝑬𝒓𝒓𝒐𝒓:</b>\n${escapeHtml(
            error.message,
          )}`,
          {
            parse_mode: "HTML",
          },
        );
      }
    },
  );

  bot.onText(
    /^\/logout$/i,
    async (message) => {
      try {
        if (
          typeof onLogoutRequest !==
          "function"
        ) {
          throw new Error(
            "Logout is unavailable.",
          );
        }

        await onLogoutRequest();

        await bot.sendMessage(
          message.chat.id,
          `✅ <b>${escapeHtml(
            BOT_NAME,
          )}</b>\n\n` +
            "🔓 𝑾𝒉𝒂𝒕𝒔𝑨𝒑𝒑 𝑺𝒆𝒔𝒔𝒊𝒐𝒏 𝑳𝒐𝒈𝒈𝒆𝒅 𝑶𝒖𝒕 𝑺𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍𝒍𝒚.",
          {
            parse_mode: "HTML",
            ...MAIN_BUTTONS,
          },
        );
      } catch (error) {
        await bot.sendMessage(
          message.chat.id,
          `❌ <b>𝑳𝒐𝒈𝒐𝒖𝒕 𝑭𝒂𝒊𝒍𝒆𝒅:</b>\n${escapeHtml(
            error.message,
          )}`,
          {
            parse_mode: "HTML",
          },
        );
      }
    },
  );

  bot.onText(
    /^\/pair(?:\s+(.+))?$/i,
    async (message, match) => {
      const chatId = message.chat.id;
      const userId = String(
        message.from?.id || chatId,
      );

      const lastRequest =
        pairCooldown.get(userId) || 0;

      const remaining =
        PAIR_COOLDOWN_MS -
        (Date.now() - lastRequest);

      if (remaining > 0) {
        await bot.sendMessage(
          chatId,
          `⏳ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒘𝒂𝒊𝒕 <b>${Math.ceil(
            remaining / 1000,
          )}</b> 𝒔𝒆𝒄𝒐𝒏𝒅𝒔 𝒃𝒆𝒇𝒐𝒓𝒆 𝒕𝒓𝒚𝒊𝒏𝒈 𝒂𝒈𝒂𝒊𝒏.`,
          {
            parse_mode: "HTML",
          },
        );
        return;
      }

      const phone = normalizePhone(
        match?.[1],
      );

      if (!/^\d{8,15}$/.test(phone)) {
        await bot.sendMessage(
          chatId,
          "❌ <b>𝑰𝒏𝒗𝒂𝒍𝒊𝒅 𝑾𝒉𝒂𝒕𝒔𝑨𝒑𝒑 𝑵𝒖𝒎𝒃𝒆𝒓</b>\n\n" +
            "📝 <b>𝑬𝒙𝒂𝒎𝒑𝒍𝒆:</b>\n" +
            "<code>/pair 919876543210</code>",
          {
            parse_mode: "HTML",
          },
        );
        return;
      }

      if (pairingUsers.has(userId)) {
        await bot.sendMessage(
          chatId,
          "⏳ <b>𝒀𝒐𝒖𝒓 𝑷𝒂𝒊𝒓𝒊𝒏𝒈 𝑹𝒆𝒒𝒖𝒆𝒔𝒕 𝒊𝒔 𝒂𝒍𝒓𝒆𝒂𝒅𝒚 𝑹𝒖𝒏𝒏𝒊𝒏𝒈.</b>\n\n𝑷𝒍𝒆𝒂𝒔𝒆 𝒘𝒂𝒊𝒕...",
          {
            parse_mode: "HTML",
          },
        );
        return;
      }

      pairCooldown.set(userId, Date.now());
      pairingUsers.add(userId);

      try {
        await bot.sendMessage(
          chatId,
          `⚙️ <b>𝑮𝒆𝒏𝒆𝒓𝒂𝒕𝒊𝒏𝒈 𝑷𝒂𝒊𝒓𝒊𝒏𝒈 𝑪𝒐𝒅𝒆...</b>\n\n` +
            `📱 𝑵𝒖𝒎𝒃𝒆𝒓: <code>${escapeHtml(
              maskPhone(phone),
            )}</code>`,
          {
            parse_mode: "HTML",
          },
        );

        const code = await onPairRequest(
          phone,
        );

        if (!code) {
          throw new Error(
            "WhatsApp did not return a pairing code.",
          );
        }

        const formattedCode =
          formatCode(code);

        await bot.sendMessage(
          chatId,
          `🔐 <b>${escapeHtml(
            BOT_NAME,
          )} 𝑾𝒉𝒂𝒕𝒔𝑨𝒑𝒑 𝑷𝒂𝒊𝒓𝒊𝒏𝒈 𝑪𝒐𝒅𝒆</b>\n\n` +
            `🔑 <b>𝑪𝒐𝒅𝒆:</b> <code>${escapeHtml(
              formattedCode,
            )}</code>\n\n` +
            "📋 𝑻𝒂𝒑 𝒕𝒉𝒆 𝒄𝒐𝒅𝒆 𝒕𝒐 𝒄𝒐𝒑𝒚 𝒊𝒕.\n\n" +
            "📲 <b>𝑶𝒏 𝑾𝒉𝒂𝒕𝒔𝑨𝒑𝒑:</b>\n" +
            "➊ 𝑶𝒑𝒆𝒏 𝑺𝒆𝒕𝒕𝒊𝒏𝒈𝒔\n" +
            "➋ 𝑻𝒂𝒑 𝑳𝒊𝒏𝒌𝒆𝒅 𝒅𝒆𝒗𝒊𝒄𝒆𝒔\n" +
            "➌ 𝑻𝒂𝒑 𝑳𝒊𝒏𝒌 𝒂 𝒅𝒆𝒗𝒊𝒄𝒆\n" +
            "➍ 𝑪𝒉𝒐𝒐𝒔𝒆 𝑳𝒊𝒏𝒌 𝒘𝒊𝒕𝒉 𝒑𝒉𝒐𝒏𝒆 𝒏𝒖𝒎𝒃𝒆𝒓 𝒊𝒏𝒔𝒕𝒆𝒂𝒅\n" +
            "➎ 𝑬𝒏𝒕𝒆𝒓 𝒕𝒉𝒆 𝒄𝒐𝒅𝒆 𝒂𝒃𝒐𝒗𝒆\n\n" +
            "⚠️ <b>𝑫𝒐 𝒏𝒐𝒕 𝒔𝒉𝒂𝒓𝒆 𝒕𝒉𝒊𝒔 𝒄𝒐𝒅𝒆 𝒘𝒊𝒕𝒉 𝒂𝒏𝒚𝒐𝒏𝒆.</b>",
          {
            parse_mode: "HTML",
            ...MAIN_BUTTONS,
          },
        );
      } catch (error) {
        console.error(
          "Telegram pairing error:",
          error.message,
        );

        await bot.sendMessage(
          chatId,
          `❌ <b>𝑷𝒂𝒊𝒓𝒊𝒏𝒈 𝑭𝒂𝒊𝒍𝒆𝒅</b>\n\n${escapeHtml(
            error.message,
          )}`,
          {
            parse_mode: "HTML",
          },
        );
      } finally {
        pairingUsers.delete(userId);
      }
    },
  );

  bot.on(
    "polling_error",
    (error) => {
      console.error(
        "Telegram polling error:",
        error.message,
      );
    },
  );

  bot.on("error", (error) => {
    console.error(
      "Telegram bot error:",
      error.message,
    );
  });

  console.log(
    "Telegram pairing control is running.",
  );

  return bot;
}

module.exports = {
  startTelegramPairing,
};
