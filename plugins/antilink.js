const store = require("../lib/lightweight_store");
const isOwnerOrSudo = require("../lib/isOwner");
const isAdmin = require("../lib/isAdmin");

/* =========================================================
HELPERS
========================================================= */

function getSock(bot) {
  if (bot && typeof bot.sendMessage === "function") {
    return bot;
  }

  if (bot?.sock && typeof bot.sock.sendMessage === "function") {
    return bot.sock;
  }

  return null;
}

function getChatId(message) {
  return (
    message?.key?.remoteJid ||
    message?.chatId ||
    message?.jid ||
    null
  );
}

function getSenderId(message) {
  return (
    message?.key?.participant ||
    message?.participant ||
    message?.sender ||
    message?.key?.remoteJid ||
    null
  );
}

function isGroupMessage(message) {
  const jid = getChatId(message);
  return Boolean(jid && jid.endsWith("@g.us"));
}

/* =========================================================
PUTTUS VCARD
========================================================= */

function getPuttusVCardQuote() {
  const botJid = "919641092392@s.whatsapp.net";

  const vcard =
    "BEGIN:VCARD\n" +
    "VERSION:3.0\n" +
    "N:PUTTUS;BOT;;;\n" +
    "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
    "ORG:PUTTUS BOT\n" +
    "TEL;TYPE=CELL;TYPE=VOICE;waid=919641092392:+919641092392\n" +
    "END:VCARD";

  return {
    key: {
      remoteJid: "status@broadcast",
      fromMe: false,
      id: "PUTTUS-" + Date.now(),
      participant: botJid,
    },

    message: {
      contactMessage: {
        displayName:
          "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
        vcard: vcard,
      },
    },
  };
}

/* =========================================================
SEND TEXT
========================================================= */

async function sendText(
  bot,
  chatId,
  text,
  quoted = null,
) {
  try {
    const sock = getSock(bot);

    if (!sock || !chatId) {
      return false;
    }

    const statusQuote = getPuttusVCardQuote();

    await sock.sendMessage(
      chatId,
      { text },
      {
        quoted: statusQuote,
      },
    );

    return true;

  } catch (error) {
    console.error(
      "[Pᴜᴛᴜs-Bᴏᴛ] Send text error:",
      error.message,
    );

    return false;
  }
}

/* =========================================================
SETTINGS
========================================================= */

async function getSetting(chatId) {
  try {
    const setting = await store.getSetting(
      chatId,
      "antilink",
    );

    return (
      setting || {
        enabled: false,
        action: "delete",
        type: "all",
      }
    );

  } catch (error) {
    console.error(
      "[Pᴜᴛᴜs-Bᴏᴛ] Get setting error:",
      error.message,
    );

    return {
      enabled: false,
      action: "delete",
      type: "all",
    };
  }
}

async function saveSetting(chatId, data) {
  try {
    await store.saveSetting(
      chatId,
      "antilink",
      data,
    );

    return true;

  } catch (error) {
    console.error(
      "[Pᴜᴛᴜs-Bᴏᴛ] Save setting error:",
      error.message,
    );

    return false;
  }
}

/* =========================================================
ADMIN / OWNER
========================================================= */

async function isProtectedUser(
  bot,
  message,
) {
  try {
    const chatId = getChatId(message);
    const senderId = getSenderId(message);

    if (!chatId || !senderId) {
      return false;
    }

    const owner = await isOwnerOrSudo(
      senderId,
      bot,
      chatId,
    );

    if (owner) {
      return true;
    }

    const admin = await isAdmin(
      bot,
      chatId,
      senderId,
    );

    return Boolean(admin);

  } catch (error) {
    return false;
  }
}

/* =========================================================
BOT ADMIN
========================================================= */

async function isBotAdmin(
  bot,
  chatId,
) {
  try {
    const sock = getSock(bot);

    if (!sock) {
      return false;
    }

    const metadata = await sock.groupMetadata(
      chatId,
    );

    const botNumber =
      sock.user?.id?.split(":")[0];

    if (!botNumber) {
      return false;
    }

    const botJid =
      `${botNumber}@s.whatsapp.net`;

    const participant =
      metadata.participants.find(
        (p) =>
          p.id === botJid ||
          p.id?.split(":")[0] === botNumber,
      );

    return Boolean(
      participant &&
      (
        participant.admin === "admin" ||
        participant.admin === "superadmin"
      ),
    );

  } catch (error) {
    return false;
  }
}

/* =========================================================
MESSAGE TEXT
========================================================= */

function getMessageText(message) {
  return (
    message?.message?.conversation ||
    message?.message?.extendedTextMessage?.text ||
    message?.message?.imageMessage?.caption ||
    message?.message?.videoMessage?.caption ||
    ""
  );
}

/* =========================================================
LINK DETECTION
========================================================= */

function containsLink(text) {
  if (!text) {
    return false;
  }

  const urlRegex =
    /(?:https?:\/\/|www\.|wa\.me\/|chat\.whatsapp\.com\/|t\.me\/|telegram\.me\/|instagram\.com\/|facebook\.com\/|fb\.com\/|youtube\.com\/|youtu\.be\/|twitter\.com\/|x\.com\/|discord\.gg\/|discord\.com\/invite\/)/i;

  return urlRegex.test(text);
}

function detectLinkType(text) {
  const value =
    String(text || "").toLowerCase();

  if (
    value.includes("chat.whatsapp.com") ||
    value.includes("wa.me")
  ) {
    return "whatsapp";
  }

  if (
    value.includes("t.me") ||
    value.includes("telegram.me")
  ) {
    return "telegram";
  }

  return "other";
}

/* =========================================================
DELETE MESSAGE
========================================================= */

async function deleteMessage(
  bot,
  message,
) {
  try {
    const sock = getSock(bot);
    const chatId = getChatId(message);

    if (!sock || !chatId) {
      return false;
    }

    const key = message?.key;

    if (!key) {
      return false;
    }

    await sock.sendMessage(
      chatId,
      {
        delete: key,
      },
    );

    return true;

  } catch (error) {
    console.error(
      "[Pᴜᴛᴜs-Bᴏᴛ] Delete error:",
      error.message,
    );

    return false;
  }
}

/* =========================================================
KICK USER
========================================================= */

async function kickUser(
  bot,
  message,
) {
  try {
    const sock = getSock(bot);
    const chatId = getChatId(message);
    const senderId = getSenderId(message);

    if (
      !sock ||
      !chatId ||
      !senderId
    ) {
      return false;
    }

    const botAdmin =
      await isBotAdmin(
        sock,
        chatId,
      );

    if (!botAdmin) {
      return false;
    }

    await sock.groupParticipantsUpdate(
      chatId,
      [senderId],
      "remove",
    );

    return true;

  } catch (error) {
    console.error(
      "[Pᴜᴛᴜs-Bᴏᴛ] Kick error:",
      error.message,
    );

    return false;
  }
}

/* =========================================================
WARN USER
========================================================= */

async function warnUser(
  bot,
  message,
) {
  const chatId = getChatId(message);
  const senderId = getSenderId(message);

  if (!chatId) {
    return false;
  }

  const number =
    senderId?.split("@")[0] ||
    "user";

  const text =
    "╭━━〔 𝐏ᴜᴛᴜs-𝐁ᴏᴛ 〕━━╮\n" +
    "│\n" +
    "│ 🚫 𝙇𝙄𝙉𝙆 𝘿𝙀𝙏𝙀𝘾𝙏𝙀𝘿\n" +
    "│\n" +
    `│ 👤 @${number}\n` +
    "│ 🔗 𝙇𝙄𝙉𝙆𝙎 𝘼𝙍𝙀 𝙉𝙊𝙏 𝘼𝙇𝙇𝙊𝙒𝙀𝘿\n" +
    "│\n" +
    "╰━━━━━━━━━━━━━━━━╯";

  return sendText(
    bot,
    chatId,
    text,
    message,
  );
}

/* =========================================================
ANTILINK COMMAND
========================================================= */

async function handleAntiLinkCommand(
  bot,
  message,
  args = [],
) {
  const chatId = getChatId(message);

  if (
    !chatId ||
    !isGroupMessage(message)
  ) {
    return false;
  }

  const senderId = getSenderId(message);

  const owner =
    await isOwnerOrSudo(
      senderId,
      bot,
      chatId,
    );

  const admin =
    await isAdmin(
      bot,
      chatId,
      senderId,
    );

  if (!owner && !admin) {
    await sendText(
      bot,
      chatId,
      "╭━━〔 𝐏ᴜᴛᴜs-𝐁ᴏᴛ 〕━━╮\n" +
      "│\n" +
      "│ ❌ 𝘼𝘿𝙈𝙄𝙉 𝙊𝙉𝙇𝙔\n" +
      "│\n" +
      "│ 𝙊𝙉𝙇𝙔 𝙂𝙍𝙊𝙐𝙋 𝘼𝘿𝙈𝙄𝙉𝙎 𝘾𝘼𝙉\n" +
      "│ 𝘾𝙊𝙉𝙁𝙄𝙂𝙐𝙍𝙀 𝘼𝙉𝙏𝙄𝙇𝙄𝙉𝙆.\n" +
      "│\n" +
      "╰━━━━━━━━━━━━━━━━╯",
      message,
    );

    return true;
  }

  const setting =
    await getSetting(chatId);

  const command =
    String(args[0] || "")
      .toLowerCase()
      .trim();

  /* ───────── STATUS ───────── */

  if (
    command === "status" ||
    command === "list"
  ) {
    const status =
      setting.enabled
        ? "𝙊𝙉"
        : "𝙊𝙁𝙁";

    const action =
      String(
        setting.action ||
        "delete",
      ).toUpperCase();

    return sendText(
      bot,
      chatId,
      `╭━━〔 𝐏ᴜᴛᴜs-𝐁ᴏᴛ 〕━━╮\n` +
      `│\n` +
      `│ ⿻ 𝙎𝙏𝘼𝙏𝙐𝙎 ➜ ${status}\n` +
      `│ ⿻ 𝘼𝘾𝙏𝙄𝙊𝙉 ➜ ${action}\n` +
      `│\n` +
      `╰━━━━━━━━━━━━━━━━╯`,
      message,
    );
  }

  /* ───────── ON ───────── */

  if (command === "on") {
    await saveSetting(
      chatId,
      {
        ...setting,
        enabled: true,
      },
    );

    return sendText(
      bot,
      chatId,
      `𝐏ᴜᴛᴜs-𝐁ᴏᴛ 𝙀𝙉𝘼𝘽𝙇𝙀𝘿 𝘼𝙉𝙏𝙄𝙇𝙄𝙉𝙆 ✅`,
      message,
    );
  }

  /* ───────── OFF ───────── */

  if (command === "off") {
    await saveSetting(
      chatId,
      {
        ...setting,
        enabled: false,
      },
    );

    return sendText(
      bot,
      chatId,
      `𝐏ᴜᴛᴜs-𝐁ᴏᴛ 𝘿𝙄𝙎𝘼𝘽𝙇𝙀𝘿 𝘼𝙉𝙏𝙄𝙇𝙄𝙉𝙆 ❌`,
      message,
    );
  }

  /* ───────── DELETE ───────── */

  if (command === "delete") {
    await saveSetting(
      chatId,
      {
        ...setting,
        enabled: true,
        action: "delete",
      },
    );

    return sendText(
      bot,
      chatId,
      `𝐏ᴜᴛᴜs-𝐁ᴏᴛ 𝘼𝙉𝙏𝙄𝙇𝙄𝙉𝙆 𝘼𝘾𝙏𝙄𝙊𝙉 ➜ 𝘿𝙀𝙇𝙀𝙏𝙀 🗑️`,
      message,
    );
  }

  /* ───────── KICK ───────── */

  if (command === "kick") {
    await saveSetting(
      chatId,
      {
        ...setting,
        enabled: true,
        action: "kick",
      },
    );

    return sendText(
      bot,
      chatId,
      `𝐏ᴜᴛᴜs-𝐁ᴏᴛ 𝘼𝙉𝙏𝙄𝙇𝙄𝙉𝙆 𝘼𝘾𝙏𝙄𝙊𝙉 ➜ 𝙆𝙄𝘾𝙆 👢`,
      message,
    );
  }

  /* ───────── WARN ───────── */

  if (command === "warn") {
    await saveSetting(
      chatId,
      {
        ...setting,
        enabled: true,
        action: "warn",
      },
    );

    return sendText(
      bot,
      chatId,
      `𝐏ᴜᴛᴜs-𝐁ᴏᴛ 𝘼𝙉𝙏𝙄𝙇𝙄𝙉𝙆 𝘼𝘾𝙏𝙄𝙊𝙉 ➜ 𝙒𝘼𝙍𝙉 ⚠️`,
      message,
    );
  }

  /* ───────── HELP ───────── */

  return sendText(
    bot,
    chatId,
    "━〔 *𝐏ᴜᴛᴜs-𝐁ᴏᴛ* 〕━\n" +
    "│\n" +
    "│ ❯ *.ᴀɴᴛɪʟɪɴᴋ ᴏɴ*\n" +
    "│ ❯ *.ᴀɴᴛɪʟɪɴᴋ ᴏғғ*\n" +
    "│ ❯ *.ᴀɴᴛɪʟɪɴᴋ ᴅᴇʟᴇᴛᴇ*\n" +
    "│ ❯ *.ᴀɴᴛɪʟɪɴᴋ ᴋɪᴄᴋ*\n" +
    "│ ❯ *.ᴀɴᴛɪʟɪɴᴋ ᴡᴀʀɴ*\n" +
    "│ ❯ *.ᴀɴᴛɪʟɪɴᴋ sᴛᴀᴛᴜs*\n" +
    "│\n" +
    "╰━",
    message,
  );
}

/* =========================================================
INCOMING LINK HANDLER
========================================================= */

async function handleIncomingMessage(
  bot,
  messageOrChatId,
  maybeMessage,
) {
  try {
    const message =
      maybeMessage ||
      messageOrChatId;

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

    /* ───────── PROTECTED USERS ───────── */

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

    /* ───────── DELETE ───────── */

    if (action === "delete") {
      return await deleteMessage(
        bot,
        message,
      );
    }

    /* ───────── KICK ───────── */

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
        await sendText(
          bot,
          chatId,
          `╭━━〔 𝐏ᴜᴛᴜs-𝐁ᴏᴛ 〕━━╮\n` +
          `│\n` +
          `│ ⚠️ 𝙇𝙄𝙉𝙆 𝘿𝙀𝙏𝙀𝘾𝙏𝙀𝘿\n` +
          `│\n` +
          `│ ❌ 𝙐𝙉𝘼𝘽𝙇𝙀 𝙏𝙊 𝙍𝙀𝙈𝙊𝙑𝙀 𝙐𝙎𝙀𝙍\n` +
          `│ 🛡️ 𝙈𝘼𝙆𝙀 𝙎𝙐𝙍𝙀 𝘽𝙊𝙏 𝙄𝙎 𝘼𝘿𝙈𝙄𝙉\n` +
          `│\n` +
          `╰━━━━━━━━━━━━━━━━╯`,
        );

        return true;
      }

      return true;
    }

    /* ───────── WARN ───────── */

    if (action === "warn") {
      await deleteMessage(
        bot,
        message,
      );

      return await warnUser(
        bot,
        message,
      );
    }

    return false;

  } catch (error) {
    console.error(
      "[Pᴜᴛᴜs-Bᴏᴛ] Handler error:",
      error.message,
    );

    return false;
  }
}

/* =========================================================
EXPORTS
========================================================= */

module.exports = {
  command: "antilink",

  aliases: [
    "antilinks",
  ],

  category: "group",

  description:
    "Enable or configure group antilink",

  usage:
    ".antilink on/off/delete/kick/warn/status",

  handler:
    handleAntiLinkCommand,

  handleIncomingMessage,

  handleLinkDetection:
    handleIncomingMessage,
};
