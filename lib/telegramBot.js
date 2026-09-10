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
          text: "📢 ᴡʜᴀᴛsᴀᴘᴘ ᴄʜᴀɴɴᴇʟ",
          url: WHATSAPP_CHANNEL_URL,
        },
      ],
      [
        {
          text: "👤 ᴏᴡɴᴇʀ ᴄᴏɴᴛᴀᴄᴛ",
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

  bot.onText(
    /^\/(start|help)$/i,
    async (message) => {
      try {
        await bot.sendMessage(
          message.chat.id,
          `🤖 <b>${escapeHtml(BOT_NAME)}</b>\n\n` +
            "ᴜsᴇ /ᴘᴀɪʀ ғᴏʟʟᴏᴡᴇᴅ ʙʏ ʏᴏᴜʀ ᴡʜᴀᴛsᴀᴘᴘ ɴᴜᴍʙᴇʀ.\n\n" +
            "<b>ᴇxᴀᴍᴘʟᴇ:</b>\n" +
            "<code>/pair 917679218662</code>\n\n" +
            "ᴡʜᴀᴛsᴀᴘᴘ sᴛᴇᴘs:\n" +
            "1. ᴏᴘᴇɴ sᴇᴛᴛɪɴɢs\n" +
            "2. ᴛᴀᴘ ʟɪɴᴋᴇᴅ ᴅᴇᴠɪᴄᴇs\n" +
            "3. ᴛᴀᴘ ʟɪɴᴋ ᴀ ᴅᴇᴠɪᴄᴇ\n" +
            "4. ᴄʜᴏᴏsᴇ ʟɪɴᴋ ᴡɪᴛʜ ᴘʜᴏɴᴇ ɴᴜᴍʙᴇʀ ɪɴsᴛᴇᴀᴅ\n" +
            "5. ᴇɴᴛᴇʀ ᴛʜᴇ ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ\n\n" +
            "ᴜsᴇ /sᴛᴀᴛᴜs ᴛᴏ ᴄʜᴇᴄᴋ ᴛʜᴇ ʙᴏᴛ.\n" +
            "ᴜsᴇ /ʟᴏɢᴏᴜᴛ ᴛᴏ ᴅɪsᴄᴏɴɴᴇᴄᴛ ᴡʜᴀᴛsᴀᴘᴘ.",
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

        const connected = Boolean(
          status.connected,
        );

        if (connected) {
          await bot.sendMessage(
            message.chat.id,
            `🟢 <b>${escapeHtml(
              BOT_NAME,
            )}</b> ᴡʜᴀᴛsᴀᴘᴘ ᴄᴏɴɴᴇᴄᴛᴇᴅ\n\n` +
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
            )}</b> ᴡʜᴀᴛsᴀᴘᴘ ɪs ɴᴏᴛ ᴄᴏɴɴᴇᴄᴛᴇᴅ.\n\n` +
              "ᴜsᴇ:\n" +
              "<code>/pair 917679218662</code>",
            {
              parse_mode: "HTML",
              ...MAIN_BUTTONS,
            },
          );
        }
      } catch (error) {
        await bot.sendMessage(
          message.chat.id,
          `❌ sᴛᴀᴛᴜs ᴇʀʀᴏʀ: ${escapeHtml(
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
            "Logout is unavailable",
          );
        }

        await onLogoutRequest();

        await bot.sendMessage(
          message.chat.id,
          `✅ <b>${escapeHtml(
            BOT_NAME,
          )}</b> ᴡʜᴀᴛsᴀᴘᴘ sᴇssɪᴏɴ ʟᴏɢɢᴇᴅ ᴏᴜᴛ.`,
          {
            parse_mode: "HTML",
            ...MAIN_BUTTONS,
          },
        );
      } catch (error) {
        await bot.sendMessage(
          message.chat.id,
          `❌ ʟᴏɢᴏᴜᴛ ғᴀɪʟᴇᴅ: ${escapeHtml(
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
          `⏳ ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ ${Math.ceil(
            remaining / 1000,
          )} sᴇᴄᴏɴᴅs ʙᴇғᴏʀᴇ ᴛʀʏɪɴɢ ᴀɢᴀɪɴ.`,
        );
        return;
      }

      const phone = normalizePhone(
        match?.[1],
      );

      if (!/^\d{8,15}$/.test(phone)) {
        await bot.sendMessage(
          chatId,
          "❌ ɪɴᴠᴀʟɪᴅ ᴡʜᴀᴛsᴀᴘᴘ ɴᴜᴍʙᴇʀ.\n\n" +
            "ᴄᴏʀʀᴇᴄᴛ ᴇxᴀᴍᴘʟᴇ:\n" +
            "<code>/pair 917679218662</code>",
          {
            parse_mode: "HTML",
          },
        );
        return;
      }

      if (pairingUsers.has(userId)) {
        await bot.sendMessage(
          chatId,
          "⏳ ʏᴏᴜʀ ᴘᴀɪʀɪɴɢ ʀᴇǫᴜᴇsᴛ ɪs ᴀʟʀᴇᴀᴅʏ ʀᴜɴɴɪɴɢ.",
        );
        return;
      }

      pairCooldown.set(userId, Date.now());
      pairingUsers.add(userId);

      try {
        await bot.sendMessage(
          chatId,
          `⏳ ɢᴇɴᴇʀᴀᴛɪɴɢ ᴀ ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ ғᴏʀ <code>${escapeHtml(
            maskPhone(phone),
          )}</code>...`,
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
          )} ᴡʜᴀᴛsᴀᴘᴘ ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ</b>\n\n` +
            `ᴄᴏᴅᴇ: <code>${escapeHtml(
              formattedCode,
            )}</code>\n\n` +
            "ᴛᴀᴘ ᴛʜᴇ ᴄᴏᴅᴇ ᴛᴏ ᴄᴏᴘʏ ɪᴛ.\n\n" +
            "ᴏɴ ᴡʜᴀᴛsᴀᴘᴘ:\n" +
            "1. ᴏᴘᴇɴ sᴇᴛᴛɪɴɢs\n" +
            "2. ᴛᴀᴘ ʟɪɴᴋᴇᴅ ᴅᴇᴠɪᴄᴇs\n" +
            "3. ᴛᴀᴘ ʟɪɴᴋ ᴀ ᴅᴇᴠɪᴄᴇ\n" +
            "4. ᴄʜᴏᴏsᴇ ʟɪɴᴋ ᴡɪᴛʜ ᴘʜᴏɴᴇ ɴᴜᴍʙᴇʀ ɪɴsᴛᴇᴀᴅ\n" +
            "5. ᴇɴᴛᴇʀ ᴛʜᴇ ᴄᴏᴅᴇ ᴀʙᴏᴠᴇ\n\n" +
            "⚠️ ᴅᴏ ɴᴏᴛ sʜᴀʀᴇ ᴛʜɪs ᴄᴏᴅᴇ ᴡɪᴛʜ ᴀɴʏᴏɴᴇ.",
          {
            parse_mode: "HTML",
            ...MAIN_BUTTONS,
          },
        );
      } catch (error) {
        console.error(
          "Telegram pairing error:",
          error,
        );

        await bot.sendMessage(
          chatId,
          `❌ ᴘᴀɪʀɪɴɢ ғᴀɪʟᴇᴅ:\n${escapeHtml(
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

  console.log(
    "✅ Telegram pairing control is running.",
  );

  return bot;
}

module.exports = {
  startTelegramPairing,
};


- 👤 Owner: "917679218662"
- "/pair" Example: "917679218662"
- Unicode font
- WhatsApp Channel button
- Owner Contact button
- "/start", "/help", "/pair", "/status", "/logout"
- Pair cooldown + pairing lock
- Error handling intact
