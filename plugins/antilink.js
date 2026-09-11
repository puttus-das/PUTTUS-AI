const store = require("../lib/lightweight_store");
const isOwnerOrSudo = require("../lib/isOwner");
const isAdmin = require("../lib/isAdmin");

const BOT_NAME =
  "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜";

/* ═══════════════════════════════════════
   SMALL FONT
═══════════════════════════════════════ */

function smallFont(text) {
  const map = {
    a: "ᴀ",
    b: "ʙ",
    c: "ᴄ",
    d: "ᴅ",
    e: "ᴇ",
    f: "ғ",
    g: "ɢ",
    h: "ʜ",
    i: "ɪ",
    j: "ᴊ",
    k: "ᴋ",
    l: "ʟ",
    m: "ᴍ",
    n: "ɴ",
    o: "ᴏ",
    p: "ᴘ",
    q: "ǫ",
    r: "ʀ",
    s: "s",
    t: "ᴛ",
    u: "ᴜ",
    v: "ᴠ",
    w: "ᴡ",
    x: "x",
    y: "ʏ",
    z: "ᴢ",
  };

  return String(text)
    .split("")
    .map(
      (char) =>
        map[char.toLowerCase()] || char,
    )
    .join("");
}

/* ═══════════════════════════════════════
   BOT MESSAGE HEADER
═══════════════════════════════════════ */

function botMessage(text) {
  return `*${BOT_NAME}*\n\n${text}`;
}

/* ═══════════════════════════════════════
   CHAT / MESSAGE HELPERS
═══════════════════════════════════════ */

function getChatId(message) {
  return (
    message?.key?.remoteJid ||
    message?.remoteJid ||
    message?.chat ||
    message?.from ||
    ""
  );
}

function getSenderId(message) {
  return (
    message?.key?.participant ||
    message?.participant ||
    message?.sender ||
    message?.key?.remoteJid ||
    ""
  );
}

function isGroupMessage(message) {
  const jid = getChatId(message);

  return String(jid).endsWith("@g.us");
}

function cleanJid(jid) {
  return String(jid || "")
    .split(":")[0]
    .replace(
      /@c\.us$/,
      "@s.whatsapp.net",
    );
}

function getMessageText(message) {
  return (
    message?.message?.conversation ||
    message?.message?.extendedTextMessage?.text ||
    message?.message?.imageMessage?.caption ||
    message?.message?.videoMessage?.caption ||
    message?.text ||
    message?.body ||
    ""
  );
}

async function sendReply(message, text) {
  if (
    typeof message?.reply ===
    "function"
  ) {
    return message.reply(text);
  }

  if (
    typeof message?.sendMessage ===
    "function"
  ) {
    return message.sendMessage(text);
  }

  throw new Error(
    "No supported reply method found.",
  );
}

/* ═══════════════════════════════════════
   PUTTUS VCARD
═══════════════════════════════════════ */

async function sendPuttusVCard(
  bot,
  message,
) {
  try {
    const jid = getChatId(message);

    if (!jid) return false;

    const vcard =
      "BEGIN:VCARD\n" +
      "VERSION:3.0\n" +
      "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
      "ORG:PUTTUS BOT;\n" +
      "TEL;type=CELL;type=VOICE;waid=918967360566:+918967360566\n" +
      "END:VCARD";

    const contactMessage = {
      contacts: {
        displayName:
          "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
        contacts: [
          {
            vcard,
          },
        ],
      },
    };

    if (
      bot &&
      typeof bot.sendMessage ===
        "function"
    ) {
      await bot.sendMessage(
        jid,
        contactMessage,
      );

      return true;
    }

    if (
      bot?.sock &&
      typeof bot.sock.sendMessage ===
        "function"
    ) {
      await bot.sock.sendMessage(
        jid,
        contactMessage,
      );

      return true;
    }

    return false;
  } catch (error) {
    console.error(
      "AntiLink VCard error:",
      error.message,
    );

    return false;
  }
}

/* ═══════════════════════════════════════
   STORE
═══════════════════════════════════════ */

async function getSetting(chatId) {
  try {
    const setting =
      await store.getSetting(
        chatId,
        "antilink",
      );

    return (
      setting || {
        enabled: false,
        action: null,
        type: "all",
      }
    );
  } catch (error) {
    console.error(
      "AntiLink getSetting error:",
      error.message,
    );

    return {
      enabled: false,
      action: null,
      type: "all",
    };
  }
}

async function saveSetting(
  chatId,
  data,
) {
  try {
    await store.saveSetting(
      chatId,
      "antilink",
      data,
    );

    return true;
  } catch (error) {
    console.error(
      "AntiLink saveSetting error:",
      error.message,
    );

    return false;
  }
}

/* ═══════════════════════════════════════
   ADMIN / OWNER CHECK
═══════════════════════════════════════ */

async function checkAdmin(
  bot,
  message,
) {
  try {
    if (
      typeof isAdmin ===
      "function"
    ) {
      return Boolean(
        await isAdmin(
          bot,
          message,
        ),
      );
    }
  } catch (_) {}

  return false;
}

async function checkOwnerOrSudo(
  bot,
  message,
) {
  try {
    if (
      typeof isOwnerOrSudo ===
      "function"
    ) {
      return Boolean(
        await isOwnerOrSudo(
          bot,
          message,
        ),
      );
    }
  } catch (_) {}

  return false;
}

async function isProtectedUser(
  bot,
  message,
) {
  const admin =
    await checkAdmin(
      bot,
      message,
    );

  const owner =
    await checkOwnerOrSudo(
      bot,
      message,
    );

  return admin || owner;
}

/* ═══════════════════════════════════════
   LINK DETECTION
═══════════════════════════════════════ */

function containsLink(text) {
  if (!text) return false;

  const value = String(text);

  const regex =
    /(?:https?:\/\/|www\.|wa\.me\/|chat\.whatsapp\.com\/|whatsapp\.com\/channel\/|t\.me\/|telegram\.me\/|instagram\.com\/|facebook\.com\/|youtube\.com\/|youtu\.be\/)[^\s]+/i;

  return regex.test(value);
}

function detectLinkType(text) {
  const value =
    String(text || "")
      .toLowerCase();

  if (
    value.includes(
      "chat.whatsapp.com",
    ) ||
    value.includes(
      "whatsapp.com/channel",
    ) ||
    value.includes("wa.me/")
  ) {
    return "whatsapp";
  }

  if (
    value.includes("t.me/") ||
    value.includes(
      "telegram.me/",
    )
  ) {
    return "telegram";
  }

  return "other";
}

/* ═══════════════════════════════════════
   DELETE MESSAGE
═══════════════════════════════════════ */

async function deleteMessage(
  bot,
  message,
) {
  try {
    const jid = getChatId(message);

    const key =
      message?.key ||
      message?.messageKey;

    if (!jid || !key) {
      return false;
    }

    if (
      bot &&
      typeof bot.sendMessage ===
        "function"
    ) {
      await bot.sendMessage(jid, {
        delete: key,
      });

      return true;
    }

    if (
      bot?.sock &&
      typeof bot.sock.sendMessage ===
        "function"
    ) {
      await bot.sock.sendMessage(
        jid,
        {
          delete: key,
        },
      );

      return true;
    }

    return false;
  } catch (error) {
    console.error(
      "AntiLink delete error:",
      error.message,
    );

    return false;
  }
}

/* ═══════════════════════════════════════
   GROUP METADATA
═══════════════════════════════════════ */

async function getGroupMetadata(
  bot,
  chatId,
) {
  try {
    if (
      typeof bot?.groupMetadata ===
      "function"
    ) {
      return await bot.groupMetadata(
        chatId,
      );
    }

    if (
      typeof bot?.sock
        ?.groupMetadata ===
      "function"
    ) {
      return await bot.sock.groupMetadata(
        chatId,
      );
    }

    return null;
  } catch (error) {
    console.error(
      "AntiLink metadata error:",
      error.message,
    );

    return null;
  }
}

/* ═══════════════════════════════════════
   KICK USER
═══════════════════════════════════════ */

async function kickUser(
  bot,
  message,
) {
  try {
    const chatId =
      getChatId(message);

    const sender =
      cleanJid(
        getSenderId(message),
      );

    if (!chatId || !sender) {
      return false;
    }

    const metadata =
      await getGroupMetadata(
        bot,
        chatId,
      );

    if (
      !metadata?.participants
    ) {
      return false;
    }

    const participant =
      metadata.participants.find(
        (p) =>
          cleanJid(p?.id) ===
          sender,
      );

    if (!participant) {
      return false;
    }

    const sock =
      bot?.groupParticipantsUpdate
        ? bot
        : bot?.sock;

    if (
      !sock ||
      typeof sock.groupParticipantsUpdate !==
        "function"
    ) {
      return false;
    }

    await sock.groupParticipantsUpdate(
      chatId,
      [sender],
      "remove",
    );

    return true;
  } catch (error) {
    console.error(
      "AntiLink kick error:",
      error.message,
    );

    return false;
  }
}

/* ═══════════════════════════════════════
   WARNING
═══════════════════════════════════════ */

async function warnUser(
  bot,
  message,
) {
  try {
    const sender =
      cleanJid(
        getSenderId(message),
      );

    await sendReply(
      message,
      botMessage(
        `⚠️ *ᴡᴀʀɴɪɴɢ*\n\n` +
          `👤 *ᴜsᴇʀ :* @${sender.split("@")[0]}\n` +
          `🔗 *ʀᴇᴀsᴏɴ : ʟɪɴᴋ ᴅᴇᴛᴇᴄᴛᴇᴅ*\n\n` +
          `📌 *ᴘʟᴇᴀsᴇ ᴅᴏɴ'ᴛ sᴇɴᴅ ʟɪɴᴋs ɪɴ ᴛʜɪs ɢʀᴏᴜᴘ.*`,
      ),
    );

    return true;
  } catch (error) {
    console.error(
      "AntiLink warning error:",
      error.message,
    );

    return false;
  }
}

/* ═══════════════════════════════════════
   ACTION NAME
═══════════════════════════════════════ */

function actionName(action) {
  if (!action) {
    return "ɴᴏᴛ sᴇᴛ";
  }

  return smallFont(action);
}

/* ═══════════════════════════════════════
   STATUS
═══════════════════════════════════════ */

async function showStatus(
  bot,
  message,
) {
  const chatId =
    getChatId(message);

  const setting =
    await getSetting(chatId);

  const status = setting.enabled
    ? "🟢 ᴇɴᴀʙʟᴇᴅ"
    : "🔴 ᴅɪsᴀʙʟᴇᴅ";

  const action =
    setting.action
      ? actionName(
          setting.action,
        )
      : "ɴᴏᴛ sᴇᴛ";

  await sendReply(
    message,
    botMessage(
      `† .ᴀɴᴛɪʟɪɴᴋ sᴛᴀᴛᴜs\n\n` +
        `*${status}*\n` +
        `*⚙️ ᴀᴄᴛɪᴏɴ : ${action}*\n\n` +
        `🔗 *ᴘʀᴏᴛᴇᴄᴛᴇᴅ :*\n` +
        `• ᴡʜᴀᴛsᴀᴘᴘ\n` +
        `• ᴛᴇʟᴇɢʀᴀᴍ\n` +
        `• ᴏᴛʜᴇʀ ʟɪɴᴋs\n\n` +
        `🛡️ *ᴇxᴇᴍᴘᴛ : ᴀᴅᴍɪɴs*\n` +
        `👑 *ᴏᴡɴᴇʀ / sᴜᴅᴏ*`,
    ),
  );
}

/* ═══════════════════════════════════════
   COMMAND HANDLER
═══════════════════════════════════════ */

async function handleCommand(
  bot,
  message,
  args = [],
) {
  const chatId =
    getChatId(message);

  if (!chatId) {
    throw new Error(
      "Chat ID not found.",
    );
  }

  if (!isGroupMessage(message)) {
    await sendReply(
      message,
      botMessage(
        `❌ *ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴄᴀɴ ᴏɴʟʏ ʙᴇ ᴜsᴇᴅ ɪɴ ɢʀᴏᴜᴘs.*`,
      ),
    );

    return true;
  }

  const protectedUser =
    await isProtectedUser(
      bot,
      message,
    );

  if (!protectedUser) {
    await sendReply(
      message,
      botMessage(
        `❌ *ᴏɴʟʏ ᴀᴅᴍɪɴs, ᴏᴡɴᴇʀ ᴏʀ sᴜᴅᴏ ᴄᴀɴ ᴄʜᴀɴɢᴇ ᴀɴᴛɪʟɪɴᴋ sᴇᴛᴛɪɴɢs.*`,
      ),
    );

    return true;
  }

  const subCommand =
    String(args[0] || "")
      .toLowerCase()
      .trim();

  /* HELP */

  if (
    !subCommand ||
    subCommand === "help"
  ) {
    await sendReply(
      message,
      botMessage(
        `† .ᴀɴᴛɪʟɪɴᴋ\n\n` +
          `*† .ᴀɴᴛɪʟɪɴᴋ ᴏɴ*\n` +
          `*† .ᴀɴᴛɪʟɪɴᴋ ᴏғғ*\n` +
          `*† .ᴀɴᴛɪʟɪɴᴋ sᴇᴛ ᴅᴇʟᴇᴛᴇ*\n` +
          `*† .ᴀɴᴛɪʟɪɴᴋ sᴇᴛ ᴋɪᴄᴋ*\n` +
          `*† .ᴀɴᴛɪʟɪɴᴋ sᴇᴛ ᴡᴀʀɴ*\n` +
          `*† .ᴀɴᴛɪʟɪɴᴋ sᴛᴀᴛᴜs*`,
      ),
    );

    return true;
  }

  /* STATUS */

  if (subCommand === "status") {
    await showStatus(
      bot,
      message,
    );

    return true;
  }

  /* ON */

  if (subCommand === "on") {
    const current =
      await getSetting(chatId);

    const action =
      current.action ||
      "delete";

    const saved =
      await saveSetting(
        chatId,
        {
          ...current,
          enabled: true,
          action,
        },
      );

    if (!saved) {
      throw new Error(
        "Failed to save AntiLink setting.",
      );
    }

    await sendReply(
      message,
      botMessage(
        `† .ᴀɴᴛɪʟɪɴᴋ ᴏɴ\n\n` +
          `*✅ ᴀɴᴛɪʟɪɴᴋ ᴇɴᴀʙʟᴇᴅ*\n` +
          `*🗑️ ᴅᴇғᴀᴜʟᴛ : ${actionName(
            action,
          )}*\n` +
          `*🛡️ ᴇxᴇᴍᴘᴛ : ᴀᴅᴍɪɴs*\n` +
          `*👑 ᴏᴡɴᴇʀ / sᴜᴅᴏ*`,
      ),
    );

    await sendPuttusVCard(
      bot,
      message,
    );

    return true;
  }

  /* OFF */

  if (subCommand === "off") {
    const current =
      await getSetting(chatId);

    const saved =
      await saveSetting(
        chatId,
        {
          ...current,
          enabled: false,
        },
      );

    if (!saved) {
      throw new Error(
        "Failed to save AntiLink setting.",
      );
    }

    await sendReply(
      message,
      botMessage(
        `† .ᴀɴᴛɪʟɪɴᴋ ᴏғғ\n\n` +
          `*❌ ᴀɴᴛɪʟɪɴᴋ ᴅɪsᴀʙʟᴇᴅ*\n\n` +
          `*🔗 ᴀɴᴛɪʟɪɴᴋ ɪs ɴᴏᴡ ᴅɪsᴀʙʟᴇᴅ.*`,
      ),
    );

    await sendPuttusVCard(
      bot,
      message,
    );

    return true;
  }

  /* SET ACTION */

  if (subCommand === "set") {
    const action =
      String(args[1] || "")
        .toLowerCase()
        .trim();

    if (
      ![
        "delete",
        "kick",
        "warn",
      ].includes(action)
    ) {
      await sendReply(
        message,
        botMessage(
          `❌ *ɪɴᴠᴀʟɪᴅ ᴀᴄᴛɪᴏɴ*\n\n` +
            `† .ᴀɴᴛɪʟɪɴᴋ sᴇᴛ ᴅᴇʟᴇᴛᴇ\n` +
            `† .ᴀɴᴛɪʟɪɴᴋ sᴇᴛ ᴋɪᴄᴋ\n` +
            `† .ᴀɴᴛɪʟɪɴᴋ sᴇᴛ ᴡᴀʀɴ`,
        ),
      );

      return true;
    }

    const current =
      await getSetting(chatId);

    const saved =
      await saveSetting(
        chatId,
        {
          ...current,
          enabled: true,
          action,
        },
      );

    if (!saved) {
      throw new Error(
        "Failed to save AntiLink setting.",
      );
    }

    const icons = {
      delete: "🗑️",
      kick: "👢",
      warn: "⚠️",
    };

    await sendReply(
      message,
      botMessage(
        `† .ᴀɴᴛɪʟɪɴᴋ sᴇᴛ ${smallFont(
          action,
        )}\n\n` +
          `*${icons[action]} ᴀᴄᴛɪᴏɴ : ${actionName(
            action,
          )}*\n` +
          `*🔗 ᴀɴᴛɪʟɪɴᴋ : ᴇɴᴀʙʟᴇᴅ*\n` +
          `*🛡️ ᴇxᴇᴍᴘᴛ : ᴀᴅᴍɪɴs*\n` +
          `*👑 ᴏᴡɴᴇʀ / sᴜᴅᴏ*`,
      ),
    );

    await sendPuttusVCard(
      bot,
      message,
    );

    return true;
  }

  /* UNKNOWN COMMAND */

  await sendReply(
    message,
    botMessage(
      `❌ *ᴜɴᴋɴᴏᴡɴ ᴀɴᴛɪʟɪɴᴋ ᴄᴏᴍᴍᴀɴᴅ*\n\n` +
        `† .ᴀɴᴛɪʟɪɴᴋ ᴏɴ\n` +
        `† .ᴀɴᴛɪʟɪɴᴋ ᴏғғ\n` +
        `† .ᴀɴᴛɪʟɪɴᴋ sᴇᴛ ᴅᴇʟᴇᴛᴇ\n` +
        `† .ᴀɴᴛɪʟɪɴᴋ sᴇᴛ ᴋɪᴄᴋ\n` +
        `† .ᴀɴᴛɪʟɪɴᴋ sᴇᴛ ᴡᴀʀɴ\n` +
        `† .ᴀɴᴛɪʟɪɴᴋ sᴛᴀᴛᴜs`,
    ),
  );

  return true;
}

/* ═══════════════════════════════════════
   INCOMING LINK HANDLER
═══════════════════════════════════════ */

async function handleIncomingMessage(
  bot,
  message,
) {
  try {
    const chatId =
      getChatId(message);

    if (
      !chatId ||
      !isGroupMessage(message)
    ) {
      return false;
    }

    const setting =
      await getSetting(chatId);

    if (!setting.enabled) {
      return false;
    }

    const text =
      getMessageText(message);

    if (!containsLink(text)) {
      return false;
    }

    /* ADMIN / OWNER / SUDO EXEMPT */

    if (
      await isProtectedUser(
        bot,
        message,
      )
    ) {
      return false;
    }

    const linkType =
      detectLinkType(text);

    if (
      setting.type &&
      setting.type !== "all" &&
      setting.type !== linkType
    ) {
      return false;
    }

    const action =
      setting.action ||
      "delete";

    /* DELETE */

    if (action === "delete") {
      await deleteMessage(
        bot,
        message,
      );

      return true;
    }

    /* KICK */

    if (action === "kick") {
      await deleteMessage(
        bot,
        message,
      );

      const kicked =
        await kickUser(
          bot,
          message,
        );

      if (!kicked) {
        await sendReply(
          message,
          botMessage(
            `⚠️ *ʟɪɴᴋ ᴅᴇᴛᴇᴄᴛᴇᴅ*\n\n` +
              `❌ *ᴜɴᴀʙʟᴇ ᴛᴏ ʀᴇᴍᴏᴠᴇ ᴛʜᴇ ᴜsᴇʀ.*\n` +
              `🛡️ *ᴍᴀᴋᴇ sᴜʀᴇ ᴛʜᴇ ʙᴏᴛ ɪs ᴀᴅᴍɪɴ.*`,
          ),
        );
      }

      return true;
    }

    /* WARN */

    if (action === "warn") {
      await deleteMessage(
        bot,
        message,
      );

      await warnUser(
        bot,
        message,
      );

      return true;
    }

    return false;
  } catch (error) {
    console.error(
      "AntiLink handler error:",
      error.message,
    );

    return false;
  }
}

/* ═══════════════════════════════════════
   EXPORT
═══════════════════════════════════════ */

module.exports = {
  command: "antilink",

  aliases: [
    "antilinks",
  ],

  category: "group",

  description:
    "Enable, disable and configure AntiLink protection.",

  usage:
    ".antilink on | off | set delete | set kick | set warn | status",

  async handler(
    bot,
    message,
    args = [],
  ) {
    return handleCommand(
      bot,
      message,
      args,
    );
  },

  handleIncomingMessage,

  getSetting,

  containsLink,

  sendPuttusVCard,
};
