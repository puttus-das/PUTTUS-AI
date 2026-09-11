const store = require("../lib/lightweight_store");
const isOwnerOrSudo = require("../lib/isOwner");
const isAdmin = require("../lib/isAdmin");

/* =========================================================
   ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲ VCARD
========================================================= */

const PUTTUS_VCARD =
  "BEGIN:VCARD\n" +
  "VERSION:3.0\n" +
  "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
  "ORG:PUTTUS BOT;\n" +
  "TEL;type=CELL;type=VOICE;waid=918967360566:+91 8967360566\n" +
  "END:VCARD";

const VCARD_DISPLAY_NAME =
  "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜";

/* =========================================================
   HELPERS
========================================================= */

function getSock(bot) {
  if (
    bot &&
    typeof bot.sendMessage === "function"
  ) {
    return bot;
  }

  if (
    bot?.sock &&
    typeof bot.sock.sendMessage === "function"
  ) {
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

  return Boolean(
    jid && jid.endsWith("@g.us"),
  );
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

    await sock.sendMessage(
      chatId,
      {
        text,
      },
      quoted
        ? {
            quoted,
          }
        : {},
    );

    return true;
  } catch (error) {
    console.error(
      "[ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲] Send text error:",
      error.message,
    );

    return false;
  }
}

/* =========================================================
   SEND PUTTUS VCARD
========================================================= */

async function sendPuttusVCard(
  bot,
  chatId,
  quoted = null,
) {
  try {
    const sock = getSock(bot);

    if (!sock || !chatId) {
      return false;
    }

    await sock.sendMessage(
      chatId,
      {
        contacts: {
          displayName:
            "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",

          contacts: [
            {
              vcard: `BEGIN:VCARD
VERSION:3.0
FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲
ORG:PUTTUS BOT;
TEL;type=CELL;type=VOICE;waid=918967360566:+91 8967360566
END:VCARD`,
            },
          ],
        },
      },
      quoted
        ? {
            quoted,
          }
        : {},
    );

    return true;
  } catch (error) {
    console.error(
      "[ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲] VCard error:",
      error.message,
    );

    return false;
  }
}

/* =========================================================
   SEND TEXT + VCARD
========================================================= */

async function sendAntiLinkReply(
  bot,
  message,
  text,
) {
  const chatId = getChatId(message);

  if (!chatId) {
    return false;
  }

  await sendText(
    bot,
    chatId,
    text,
    message,
  );

  await sendPuttusVCard(
    bot,
    chatId,
  );

  return true;
}

/* =========================================================
   SETTINGS
========================================================= */

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
        action: "delete",
        type: "all",
      }
    );
  } catch (error) {
    console.error(
      "[ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲] Get setting error:",
      error.message,
    );

    return {
      enabled: false,
      action: "delete",
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
      "[ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲] Save setting error:",
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
    const chatId =
      getChatId(message);

    const senderId =
      getSenderId(message);

    if (!chatId || !senderId) {
      return false;
    }

    const owner =
      await isOwnerOrSudo(
        senderId,
        bot,
        chatId,
      );

    if (owner) {
      return true;
    }

    const admin =
      await isAdmin(
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

    const metadata =
      await sock.groupMetadata(
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
          p.id?.split(":")[0] ===
            botNumber,
      );

    return Boolean(
      participant &&
        (
          participant.admin ===
            "admin" ||
          participant.admin ===
            "superadmin"
        ),
    );
  } catch (error) {
    return false;
  }
}

/* =========================================================
   MESSAGE TEXT
========================================================= */

function getMessageText(
  message,
) {
  return (
    message?.message
      ?.conversation ||
    message?.message
      ?.extendedTextMessage
      ?.text ||
    message?.message
      ?.imageMessage
      ?.caption ||
    message?.message
      ?.videoMessage
      ?.caption ||
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
    String(text || "")
      .toLowerCase();

  if (
    value.includes(
      "chat.whatsapp.com",
    ) ||
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
    const sock =
      getSock(bot);

    const chatId =
      getChatId(message);

    if (!sock || !chatId) {
      return false;
    }

    const key =
      message?.key;

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
      "[ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲] Delete error:",
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
    const sock =
      getSock(bot);

    const chatId =
      getChatId(message);

    const senderId =
      getSenderId(message);

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
      "[ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲] Kick error:",
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
  const chatId =
    getChatId(message);

  const senderId =
    getSenderId(message);

  if (!chatId) {
    return false;
  }

  const number =
    senderId
      ?.split("@")[0] ||
    "user";

  const text =
    `╭━━〔 ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲ 〕━━╮\n` +
    `│\n` +
    `│ 🚫 𝙇𝙄𝙉𝙆 𝘿𝙀𝙏𝙀𝘾𝙏𝙀𝘿\n` +
    `│\n` +
    `│ 👤 @${number}\n` +
    `│ 🔗 𝙇𝙄𝙉𝙆𝙎 𝘼𝙍𝙀 𝙉𝙊𝙏 𝘼𝙇𝙇𝙊𝙒𝙀𝘿\n` +
    `│\n` +
    `╰━━━━━━━━━━━━━━━━╯`;

  try {
    const sock =
      getSock(bot);

    if (!sock) {
      return false;
    }

    await sock.sendMessage(
      chatId,
      {
        text,
        mentions: senderId
          ? [senderId]
          : [],
      },
      {
        quoted: message,
      },
    );

    return true;
  } catch (error) {
    console.error(
      "[ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲] Warn error:",
      error.message,
    );

    return false;
  }
}

/* =========================================================
   ANTILINK COMMAND
========================================================= */

async function handleAntiLinkCommand(
  bot,
  message,
  args = [],
) {
  const chatId =
    getChatId(message);

  if (
    !chatId ||
    !isGroupMessage(message)
  ) {
    return false;
  }

  const senderId =
    getSenderId(message);

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
      `╭━━〔 ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲ 〕━━╮\n` +
        `│\n` +
        `│ ❌ 𝘼𝘿𝙈𝙄𝙉 𝙊𝙉𝙇𝙔\n` +
        `│\n` +
        `│ 𝙊𝙉𝙇𝙔 𝙂𝙍𝙊𝙐𝙋 𝘼𝘿𝙈𝙄𝙉𝙎 𝘾𝘼𝙉\n` +
        `│ 𝘾𝙊𝙉𝙁𝙄𝙂𝙐𝙍𝙀 𝘼𝙉𝙏𝙄𝙇𝙄𝙉𝙆.\n` +
        `│\n` +
        `╰━━━━━━━━━━━━━━━━╯`,
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

    return sendAntiLinkReply(
      bot,
      message,
      `╭━━〔 ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲ 〕━━╮\n` +
        `│\n` +
        `│ ⿻ 𝙎𝙏𝘼𝙏𝙐𝙎 ➜ ${status}\n` +
        `│ ⿻ 𝘼𝘾𝙏𝙄𝙊𝙉 ➜ ${action}\n` +
        `│\n` +
        `╰━━━━━━━━━━━━━━━━╯`,
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

    return sendAntiLinkReply(
      bot,
      message,
      `ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲ 𝙀𝙉𝘼𝘽𝙇𝙀𝘿 𝘼𝙉𝙏𝙄𝙇𝙄𝙉𝙆 ✅`,
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

    return sendAntiLinkReply(
      bot,
      message,
      `ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲ 𝘿𝙄𝙎𝘼𝘽𝙇𝙀𝘿 𝘼𝙉𝙏𝙄𝙇𝙄𝙉𝙆 ❌`,
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

    return sendAntiLinkReply(
      bot,
      message,
      `ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲ 𝘼𝙉𝙏𝙄𝙇𝙄𝙉𝙆 𝘼𝘾𝙏𝙄𝙊𝙉 ➜ 𝘿𝙀𝙇𝙀𝙏𝙀 🗑️`,
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

    return sendAntiLinkReply(
      bot,
      message,
      `ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲ 𝘼𝙉𝙏𝙄𝙇𝙄𝙉𝙆 𝘼𝘾𝙏𝙄𝙊𝙉 ➜ 𝙆𝙄𝘾𝙆 👢`,
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

    return sendAntiLinkReply(
      bot,
      message,
      `ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲ 𝘼𝙉𝙏𝙄𝙇𝙄𝙉𝙆 𝘼𝘾𝙏𝙄𝙊𝙉 ➜ 𝙒𝘼𝙍𝙉 ⚠️`,
    );
  }

  /* ───────── HELP ───────── */

  return sendAntiLinkReply(
    bot,
    message,
    `╭━━〔 ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲ 〕━━╮
│
│ ⿻ .𝙖𝙣𝙩𝙞𝙡𝙞𝙣𝙠 𝙤𝙣
│ ⿻ .𝙖𝙣𝙩𝙞𝙡𝙞𝙣𝙠 𝙤𝙛𝙛
│ ⿻ .𝙖𝙣𝙩𝙞𝙡𝙞𝙣𝙠 𝙙𝙚𝙡𝙚𝙩𝙚
│ ⿻ .𝙖𝙣𝙩𝙞𝙡𝙞𝙣𝙠 𝙠𝙞𝙘𝙠
│ ⿻ .𝙖𝙣𝙩𝙞𝙡𝙞𝙣𝙠 𝙬𝙖𝙧𝙣
│ ⿻ .𝙖𝙣𝙩𝙞𝙡𝙞𝙣𝙠 𝙨𝙩𝙖𝙩𝙪𝙨
│
╰━━━━━━━━━━━━━━━━╯`,
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
    /*
     * Supports:
     *
     * handleIncomingMessage(bot, message)
     *
     * AND:
     *
     * handleLinkDetection(
     *   bot,
     *   chatId,
     *   message,
     *   userMessage,
     *   senderId
     * )
     */

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
      const deleted =
        await deleteMessage(
          bot,
          message,
        );

      if (!deleted) {
        return false;
      }

      await sendPuttusVCard(
        bot,
        chatId,
      );

      return true;
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
          `╭━━〔 ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲ 〕━━╮\n` +
            `│\n` +
            `│ ⚠️ 𝙇𝙄𝙉𝙆 𝘿𝙀𝙏𝙀𝘾𝙏𝙀𝘿\n` +
            `│\n` +
            `│ ❌ 𝙐𝙉𝘼𝘽𝙇𝙀 𝙏𝙊 𝙍𝙀𝙈𝙊𝙑𝙀 𝙐𝙎𝙀𝙍\n` +
            `│ 🛡️ 𝙈𝘼𝙆𝙀 𝙎𝙐𝙍𝙀 𝘽𝙊𝙏 𝙄𝙎 𝘼𝘿𝙈𝙄𝙉\n` +
            `│\n` +
            `╰━━━━━━━━━━━━━━━━╯`,
        );
      }

      await sendPuttusVCard(
        bot,
        chatId,
      );

      return true;
    }

    /* ───────── WARN ───────── */

    if (action === "warn") {
      await deleteMessage(
        bot,
        message,
      );

      await warnUser(
        bot,
        message,
      );

      await sendPuttusVCard(
        bot,
        chatId,
      );

      return true;
    }

    return false;
  } catch (error) {
    console.error(
      "[ᐟ𝙋𝙐𝙏𝙏𝙐𝙎^᪲᪲᪲] Handler error:",
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

  sendPuttusVCard,
};
