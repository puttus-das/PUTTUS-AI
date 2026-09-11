const store = require("../lib/lightweight_store");
const isOwnerOrSudo = require("../lib/isOwner");
const isAdmin = require("../lib/isAdmin");

/* =========================================================
   PUTTUS VCARD
========================================================= */

const PUTTUS_VCARD =
  "BEGIN:VCARD\n" +
  "VERSION:3.0\n" +
  "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
  "ORG:PUTTUS BOT;\n" +
  "TEL;type=CELL;type=VOICE;waid=918967360566:+91 8967360566\n" +
  "END:VCARD";

const VCARD_DISPLAY_NAME =
  "⎯꯭̽ꪹ𝐏ᴜᴛᴜᴜs-𝐁ᴏᴛ⎯꯭̽💜";

/* =========================================================
   VCARD QUOTED MESSAGE
========================================================= */

const vcardReply = {
  key: {
    fromMe: false,
    participant: "918967360566@s.whatsapp.net",
    remoteJid: "status@broadcast",
  },

  message: {
    contactMessage: {
      displayName: VCARD_DISPLAY_NAME,
      vcard: PUTTUS_VCARD,
    },
  },
};

/* =========================================================
   HELPERS
========================================================= */

function getSock(bot) {
  if (bot && typeof bot.sendMessage === "function") {
    return bot;
  }

  if (
    bot &&
    bot.sock &&
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
  return Boolean(jid && jid.endsWith("@g.us"));
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
      "[ANTILINK] Send text error:",
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

    const contactMessage = {
      contacts: {
        displayName: VCARD_DISPLAY_NAME,

        contacts: [
          {
            vcard: PUTTUS_VCARD,
          },
        ],
      },
    };

    await sock.sendMessage(
      chatId,
      contactMessage,
      quoted
        ? {
            quoted,
          }
        : {},
    );

    return true;
  } catch (error) {
    console.error(
      "[ANTILINK] VCard error:",
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

  /*
   * First send the AntiLink message.
   * The VCard is then sent as a real WhatsApp
   * contact card.
   */

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
      "[ANTILINK] Get setting error:",
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
      "[ANTILINK] Save setting error:",
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
  } catch {
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
    const sock =
      getSock(bot);

    if (!sock) {
      return false;
    }

    const metadata =
      await sock.groupMetadata(
        chatId,
      );

    const botJid =
      sock.user?.id?.split(":")[0] +
      "@s.whatsapp.net";

    const participant =
      metadata.participants.find(
        (p) =>
          p.id === botJid ||
          p.id?.split(":")[0] ===
            sock.user?.id?.split(":")[0],
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
  } catch {
    return false;
  }
}

/* =========================================================
   LINK DETECTION
========================================================= */

function getMessageText(
  message,
) {
  return (
    message?.message?.conversation ||
    message?.message?.extendedTextMessage
      ?.text ||
    message?.message?.imageMessage
      ?.caption ||
    message?.message?.videoMessage
      ?.caption ||
    ""
  );
}

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
      "[ANTILINK] Delete error:",
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
      "[ANTILINK] Kick error:",
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

  const text =
    `╭━━〔 ⚠️ ᴀɴᴛɪʟɪɴᴋ 〕━━╮\n` +
    `│\n` +
    `│ 🚫 ʟɪɴᴋ ᴅᴇᴛᴇᴄᴛᴇᴅ\n` +
    `│\n` +
    `│ 👤 @${senderId?.split("@")[0] || "user"}\n` +
    `│ 🔗 ʟɪɴᴋs ᴀʀᴇ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ\n` +
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
      "[ANTILINK] Warn error:",
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

  const setting =
    await getSetting(chatId);

  const command =
    String(args[0] || "")
      .toLowerCase();

  const value =
    args.slice(1).join(" ").trim();

  /* ───────── STATUS ───────── */

  if (
    command === "status" ||
    command === "list"
  ) {
    const status =
      setting.enabled
        ? "ᴏɴ"
        : "ᴏғғ";

    const action =
      setting.action ||
      "delete";

    return sendAntiLinkReply(
      bot,
      message,
      `╭━━〔 🔗 ᴀɴᴛɪʟɪɴᴋ 〕━━╮\n` +
        `│\n` +
        `│ ⿻ sᴛᴀᴛᴜs ➜ ${status}\n` +
        `│ ⿻ ᴀᴄᴛɪᴏɴ ➜ ${action}\n` +
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
      `*⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜 enabled antilink*.`,
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
      `*⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜 disabled antilink*.`,
    );
  }

  /* ───────── ACTION ───────── */

  if (
    ["delete", "kick", "warn"].includes(
      command,
    )
  ) {
    await saveSetting(
      chatId,
      {
        ...setting,
        action: command,
      },
    );

    return sendAntiLinkReply(
      bot,
      message,
      `*⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜 antilink action set to ${command}*.`,
    );
  }

  /* ───────── HELP ───────── */

  return sendAntiLinkReply(
    bot,
    message,
    `╭━━〔 🔗 ᴀɴᴛɪʟɪɴᴋ 〕━━╮
│
│ ⿻ .antilink on
│ ⿻ .antilink off
│ ⿻ .antilink delete
│ ⿻ .antilink kick
│ ⿻ .antilink warn
│ ⿻ .antilink status
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
     * Supports both:
     *
     * handleIncomingMessage(bot, message)
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
          `⚠️ *ʟɪɴᴋ ᴅᴇᴛᴇᴄᴛᴇᴅ*\n\n` +
            `❌ *ᴜɴᴀʙʟᴇ ᴛᴏ ʀᴇᴍᴏᴠᴇ ᴜsᴇʀ.*\n` +
            `🛡️ *ᴍᴀᴋᴇ sᴜʀᴇ ᴛʜᴇ ʙᴏᴛ ɪs ᴀᴅᴍɪɴ.*`,
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
      "[ANTILINK] Handler error:",
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

  handler: handleAntiLinkCommand,

  handleIncomingMessage,

  handleLinkDetection:
    handleIncomingMessage,

  sendPuttusVCard,

  vcardReply,
};
