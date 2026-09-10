const TelegramBot = require("node-telegram-bot-api");

const PAIR_COOLDOWN_MS = 60_000;
const pairCooldown = new Map();
const pairingUsers = new Set();

const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb7pmbEEwEjzdGSM4G3B";
const OWNER_CONTACT_URL = "https://wa.me/917679218662";

const MAIN_BUTTONS = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "📢 WʜᴀᴛsAᴘᴘ Cʜᴀɴɴᴇʟ", url: WHATSAPP_CHANNEL_URL }],
      [{ text: "👤 Oᴡɴᴇʀ Cᴏɴᴛᴀᴄᴛ", url: OWNER_CONTACT_URL }]
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
  return phone.length > 4
    ? `${phone.slice(0, 2)}********${phone.slice(-2)}`
    : phone;
}

function startTelegramPairing({ onPairRequest, onLogoutRequest, getStatus } = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.TG_TOKEN;

  if (!token || /^YOUR_|^\s*$/.test(token)) {
    console.log("ℹ️ Tᴇʟᴇɢʀᴀᴍ Pᴀɪʀɪɴɢ ᴅɪsᴀʙʟᴇᴅ: Tᴇʟᴇɢʀᴀᴍ_ʙᴏᴛ_ᴛᴏᴋᴇɴ ɪs ɴᴏᴛ sᴇᴛ.");
    return null;
  }

  if (typeof onPairRequest !== "function") {
    console.error("❌ Tᴇʟᴇɢʀᴀᴍ Pᴀɪʀɪɴɢ ᴅɪsᴀʙʟᴇᴅ: WʜᴀᴛsAᴘᴘ Pᴀɪʀɪɴɢ ᴄᴀʟʟʙᴀᴄᴋ ɪs ᴍɪssɪɴɢ.");
    return null;
  }

  const bot = new TelegramBot(token, { polling: true });

  bot.onText(/^\/(start|help)$/i, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      "🤖 Pᴜᴛᴛᴜs-Bᴏᴛ\n\n" +
        "Uѕᴇ /pair <country-code + number> ᴛᴏ ɢᴇᴛ ᴀ WʜᴀᴛsAᴘᴘ ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ.\n\n" +
        "E̷x̷a̷m̷p̷l̷e̷: /pair 919876543210\n\n" +
        "WʜᴀᴛsAᴘᴘ → Sᴇᴛᴛɪɴɢs → Lɪɴᴋᴇᴅ ᴅᴇᴠɪᴄᴇs → Lɪɴᴋ ᴀ ᴅᴇᴠɪᴄᴇ → Lɪɴᴋ ᴡɪᴛʜ ᴘʜᴏɴᴇ ɴᴜᴍʙᴇʀ ɪɴsᴛᴇᴀᴅ.\n\n" +
        "Uѕᴇ /status ᴛᴏ ᴄʜᴇᴄᴋ ᴛʜᴇ Bᴏᴛ sᴛᴀᴛᴜs.\n" +
        "Uѕᴇ /logout ᴛᴏ ᴅɪsᴄᴏɴɴᴇᴄᴛ ᴛʜᴇ ᴄᴜʀʀᴇɴᴛ sᴇssɪᴏɴ.",
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
          ? `🟢 WʜᴀᴛsAᴘᴘ Cᴏɴɴᴇᴄᴛᴇᴅ${status.user?.id ? `\n${status.user.id}` : ""}`
          : "⚪ WʜᴀᴛsAᴘᴘ ɪs ɴᴏᴛ ᴄᴏɴɴᴇᴄᴛᴇᴅ. Uѕᴇ /pair <number>."
      );
    } catch (error) {
      await bot.sendMessage(
        msg.chat.id,
        `❌ Sᴛᴀᴛᴜs Eʀʀᴏʀ: ${error.message}`
      );
    }
  });

  bot.onText(/^\/logout$/i, async (msg) => {
    try {
      if (typeof onLogoutRequest !== "function") {
        throw new Error("Lᴏɢᴏᴜᴛ ɪs ᴜɴᴀᴠᴀɪʟᴀʙʟᴇ");
      }

      await onLogoutRequest();

      await bot.sendMessage(
        msg.chat.id,
        "✅ WʜᴀᴛsAᴘᴘ Sᴇssɪᴏɴ Lᴏɢɢᴇᴅ Oᴜᴛ."
      );
    } catch (error) {
      await bot.sendMessage(
        msg.chat.id,
        `❌ Lᴏɢᴏᴜᴛ Fᴀɪʟᴇᴅ: ${error.message}`
      );
    }
  });

  bot.onText(/^\/pair(?:\s+(.+))?$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id || chatId);

    const remaining =
      PAIR_COOLDOWN_MS -
      (Date.now() - (pairCooldown.get(userId) || 0));

    if (remaining > 0) {
      await bot.sendMessage(
        chatId,
        `⏳ Pʟᴇᴀsᴇ ᴡᴀɪᴛ ${Math.ceil(remaining / 1000)} sᴇᴄᴏɴᴅs ʙᴇғᴏʀᴇ ᴛʀʏɪɴɢ ᴀɢᴀɪɴ.`
      );
      return;
    }

    const phone = normalizePhone(match?.[1]);

    if (!/^\d{8,15}$/.test(phone)) {
      await bot.sendMessage(
        chatId,
        "❌ Iɴᴠᴀʟɪᴅ Nᴜᴍʙᴇʀ.\nE̷x̷a̷m̷p̷l̷e̷: /pair 919876543210"
      );
      return;
    }

    if (pairingUsers.has(userId)) {
      await bot.sendMessage(
        chatId,
        "⏳ Yᴏᴜʀ Pᴀɪʀɪɴɢ Rᴇǫᴜᴇsᴛ ɪs ᴀʟʀᴇᴀᴅʏ Rᴜɴɴɪɴɢ. Pʟᴇᴀsᴇ ᴡᴀɪᴛ."
      );
      return;
    }

    pairCooldown.set(userId, Date.now());
    pairingUsers.add(userId);

    try {
      await bot.sendMessage(
        chatId,
        `⏳ Gᴇɴᴇʀᴀᴛɪɴɢ Pᴀɪʀɪɴɢ Cᴏᴅᴇ ғᴏʀ ${maskPhone(phone)}...`
      );

      const code = await onPairRequest(phone);

      await bot.sendMessage(
        chatId,
        "🔐 *WʜᴀᴛsAᴘᴘ Pᴀɪʀɪɴɢ Cᴏᴅᴇ*\n\n" +
          `Cᴏᴅᴇ: *${formatCode(code)}*\n\n` +
          "Oɴ WʜᴀᴛsAᴘᴘ:\n" +
          "1. Oᴘᴇɴ Sᴇᴛᴛɪɴɢs\n" +
          "2. Tᴀᴘ Lɪɴᴋᴇᴅ ᴅᴇᴠɪᴄᴇs\n" +
          "3. Tᴀᴘ Lɪɴᴋ ᴀ ᴅᴇᴠɪᴄᴇ\n" +
          "4. Cʜᴏᴏsᴇ Lɪɴᴋ ᴡɪᴛʜ ᴘʜᴏɴᴇ ɴᴜᴍʙᴇʀ ɪɴsᴛᴇᴀᴅ\n" +
          "5. Eɴᴛᴇʀ ᴛʜᴇ ᴄᴏᴅᴇ ᴀʙᴏᴠᴇ\n\n" +
          "⚠️ Dᴏ ɴᴏᴛ sʜᴀʀᴇ ᴛʜɪs ᴄᴏᴅᴇ.",
        {
          parse_mode: "Markdown",
          ...MAIN_BUTTONS
        }
      );
    } catch (error) {
      console.error("Tᴇʟᴇɢʀᴀᴍ Pᴀɪʀɪɴɢ Eʀʀᴏʀ:", error);

      await bot.sendMessage(
        chatId,
        `❌ Pᴀɪʀɪɴɢ Fᴀɪʟᴇᴅ: ${error.message}`
      );
    } finally {
      pairingUsers.delete(userId);
    }
  });

  bot.on("polling_error", (error) =>
    console.error("Tᴇʟᴇɢʀᴀᴍ Pᴏʟʟɪɴɢ Eʀʀᴏʀ:", error.message)
  );

  bot.on("error", (error) =>
    console.error("Tᴇʟᴇɢʀᴀᴍ Bᴏᴛ Eʀʀᴏʀ:", error.message)
  );

  console.log("✅ Tᴇʟᴇɢʀᴀᴍ Pᴀɪʀɪɴɢ Cᴏɴᴛʀᴏʟ ɪs Rᴜɴɴɪɴɢ.");

  return bot;
}

module.exports = { startTelegramPairing };
