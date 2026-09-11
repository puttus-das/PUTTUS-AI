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

  return String(text || "")
    .split("")
    .map((char) => {
      return (
        map[char.toLowerCase()] ||
        char
      );
    })
    .join("");
}

/* ═══════════════════════════════════════
   BOT MESSAGE
═══════════════════════════════════════ */

function botMessage(text) {
  return `*${BOT_NAME}*\n\n${text}`;
}

/* ═══════════════════════════════════════
   MESSAGE HELPERS
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
    message?.message?.extendedTextMessage
      ?.text ||
    message?.message?.imageMessage
      ?.caption ||
    message?.message?.videoMessage
      ?.caption ||
    message?.message
      ?.buttonsResponseMessage
      ?.selectedButtonId ||
    message?.text ||
    message?.body ||
    ""
  );
}

/* ═══════════════════════════════════════
   GET SOCKET
═══════════════════════════════════════ */

function getSocket(bot) {
  if (
    bot &&
    typeof bot.sendMessage ===
      "function"
  ) {
    return bot;
  }

  if (
    bot?.sock &&
    typeof bot.sock.sendMessage ===
      "function"
  ) {
    return bot.sock;
  }

  return null;
}

/* ═══════════════════════════════════════
   SEND MESSAGE
═══════════════════════════════════════ */

async function sendText(
  bot,
  chatId,
  text,
  quoted = null,
  mentions = [],
) {
  try {
    if (!bot || !chatId) {
      return false;
    }

    const sock = getSocket(bot);

    if (!sock) {
      console.error(
        "AntiLink: sendMessage not available",
      );

      return false;
    }

    const data = {
      text: String(text || ""),
    };

    if (
      Array.isArray(mentions) &&
      mentions.length
    ) {
      data.mentions = mentions;
    }

    const options = {};

    if (quoted) {
      options.quoted = quoted;
    }

    await sock.sendMessage(
      chatId,
      data,
      options,
    );

    return true;
  } catch (error) {
    console.error(
      "AntiLink sendText error:",
      error.message,
    );

    return false;
  }
}

async function sendReply(
  bot,
  message,
  text,
  mentions = [],
) {
  const chatId =
    getChatId(message);

  return sendText(
    bot,
    chatId,
    text,
    message,
    mentions,
  );
}

/* ═══════════════════════════════════════
   PUTTUS VCARD
═══════════════════════════════════════ */

const PUTTUS_VCARD =
  "BEGIN:VCARD\n" +
  "VERSION:3.0\n" +
  "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
  "ORG:PUTTUS BOT;\n" +
  "TEL;type=CELL;type=VOICE;waid=918967360566:+91 8967360566\n" +
  "END:VCARD";

/* ═══════════════════════════════════════
   SEND PUTTUS VCARD
═══════════════════════════════════════ */

async function sendPuttusVCard(
  bot,
  message,
  quoted = null,
) {
  try {
    const jid =
      getChatId(message);

    if (!jid) {
      console.error(
        "AntiLink VCard: chatId missing",
      );

      return false;
    }

    const sock =
      getSocket(bot);

    if (!sock) {
      console.error(
        "AntiLink VCard: socket unavailable",
      );

      return false;
    }

    /*
      IMPORTANT:
      WhatsApp contact must be sent
      using contacts payload.
    */

    const contactMessage = {
      contacts: {
        displayName:
          "⎯꯭̽ꪹ𝐏ᴜᴛᴜᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜".replace(
            "𝐏ᴜᴛᴜᴛᴜs",
            "𝐏ᴜᴛᴛᴜs",
          ),

        contacts: [
          {
            vcard:
              PUTTUS_VCARD,
          },
        ],
      },
    };

    const options = {};

    /*
      Don't quote a message that has
      already been deleted.
    */

    if (quoted) {
      options.quoted = quoted;
    }

    await sock.sendMessage(
      jid,
      contactMessage,
      options,
    );

    console.log(
      `[ANTILINK] PUTTUS VCard sent to ${jid}`,
    );

    return true;
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

    if (!setting) {
      return {
        enabled: false,
        action: "delete",
        type: "all",
      };
    }

    return {
      enabled:
        Boolean(setting.enabled),

      action:
        setting.action || "delete",

      type:
        setting.type || "all",
    };
  } catch (error) {
    console.error(
      "AntiLink getSetting error:",
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
      "AntiLink saveSetting error:",
      error.message,
    );

    return false;
  }
}

/* ═══════════════════════════════════════
   ADMIN CHECK
═══════════════════════════════════════ */

async function checkAdmin(
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

    if (
      typeof isAdmin ===
      "function"
    ) {
      const result =
        await isAdmin(
          bot,
          chatId,
          senderId,
        );

      if (
        typeof result ===
        "boolean"
      ) {
        return result;
      }

      if (
        result &&
        typeof result ===
          "object"
      ) {
        return Boolean(
          result.isSenderAdmin ||
            result.isAdmin,
        );
      }
    }

    return false;
  } catch (error) {
    console.error(
      "AntiLink admin check error:",
      error.message,
    );

    return false;
  }
}

/* ═══════════════════════════════════════
   OWNER / SUDO CHECK
═══════════════════════════════════════ */

async function checkOwnerOrSudo(
  bot,
  message,
) {
  try {
    const chatId =
      getChatId(message);

    const senderId =
      getSenderId(message);

    if (!senderId) {
      return false;
    }

    if (
      typeof isOwnerOrSudo ===
      "function"
    ) {
      return Boolean(
        await isOwnerOrSudo(
          senderId,
          bot,
          chatId,
        ),
      );
    }

    return false;
  } catch (error) {
    console.error(
      "AntiLink owner check error:",
      error.message,
    );

    return false;
  }
}

/* ═══════════════════════════════════════
   PROTECTED USER
═══════════════════════════════════════ */

async function isProtectedUser(
  bot,
  message,
) {
  const owner =
    await checkOwnerOrSudo(
      bot,
      message,
    );

  if (owner) {
    return true;
  }

  const admin =
    await checkAdmin(
      bot,
      message,
    );

  return admin;
}

/* ═══════════════════════════════════════
   LINK DETECTION
═══════════════════════════════════════ */

function containsLink(text) {
  if (!text) {
    return false;
  }

  const value =
    String(text);

  const regex =
    /(?:https?:\/\/|www\.|wa\.me\/|chat\.whatsapp\.com\/|whatsapp\.com\/channel\/|t\.me\/|telegram\.me\/|instagram\.com\/|facebook\.com\/|youtube\.com\/|youtu\.be\/|twitter\.com\/|x\.com\/|discord\.gg\/)[^\s]+/i;

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
    const chatId =
      getChatId(message);

    const key =
      message?.key ||
      message?.messageKey;

    if (!chatId || !key) {
      return false;
    }

    const sock =
      getSocket(bot);

    if (!sock) {
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
    const sock =
      bot?.groupMetadata
        ? bot
        : bot?.sock;

    if (
      sock &&
      typeof sock.groupMetadata ===
        "function"
    ) {
      return await sock.groupMetadata(
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
      !metadata ||
      !Array.isArray(
        metadata.participants,
      )
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

    const number =
      sender.split("@")[0];

    const mention =
      sender.includes("@")
        ? [sender]
        : [];

    await sendReply(
      bot,
      message,
      botMessage(
        `⚠️ *ᴡᴀʀɴɪɴɢ*\n\n` +
          `👤 *ᴜsᴇʀ :* @${number}\n` +
          `🔗 *ʀᴇᴀsᴏɴ :* ʟɪɴᴋ ᴅᴇᴛᴇᴄᴛᴇᴅ\n\n` +
          `📌 *ᴘʟᴇᴀsᴇ ᴅᴏɴ'ᴛ sᴇɴᴅ ʟɪɴᴋs ɪɴ ᴛʜɪs ɢʀᴏᴜᴘ.*`,
      ),
      mention,
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

  return smallFont(
    String(action),
  );
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

  const status =
    setting.enabled
      ? "🟢 ᴇɴᴀʙʟᴇᴅ"
      : "🔴 ᴅɪsᴀʙʟᴇᴅ";

  const action =
    setting.action
      ? actionName(
          setting.action,
        )
      : "ɴᴏᴛ sᴇᴛ";

  await sendReply(
    bot,
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

  if (
    !isGroupMessage(message)
  ) {
    await sendReply(
      bot,
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
      bot,
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
      bot,
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

  if (
    subCommand === "status"
  ) {
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
          type:
            current.type ||
            "all",
        },
      );

    if (!saved) {
      throw new Error(
        "Failed to save AntiLink setting.",
      );
    }

    await sendReply(
      bot,
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
      bot,
      message,
      botMessage(
        `† .ᴀɴᴛɪʟɪɴᴋ ᴏғғ\n\n` +
          `*❌ ᴀɴᴛɪʟɪɴᴋ ᴅɪsᴀʙʟᴇᴅ*\n\n` +
          `*🔗 ᴀɴᴛɪʟɪɴᴋ ɪs ɴᴏᴡ ᴅɪsᴀʙʟᴇᴅ.*`,
      ),
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
        bot,
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
      bot,
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

    return true;
  }

  /* UNKNOWN */

  await sendReply(
    bot,
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

    /* ═══════════════════════════════
       DELETE
    ═══════════════════════════════ */

    if (action === "delete") {
      const deleted =
        await deleteMessage(
          bot,
          message,
        );

      if (deleted) {
        /*
          Message is already deleted,
          so VCard is sent WITHOUT
          quoting the deleted message.
        */

        await sendPuttusVCard(
          bot,
          message,
          null,
        );

        return true;
      }

      return false;
    }

    /* ═══════════════════════════════
       KICK
    ═══════════════════════════════ */

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
          bot,
          message,
          botMessage(
            `⚠️ *ʟɪɴᴋ ᴅᴇᴛᴇᴄᴛᴇᴅ*\n\n` +
              `❌ *ᴜɴᴀʙʟᴇ ᴛᴏ ʀᴇᴍᴏᴠᴇ ᴛʜᴇ ᴜsᴇʀ.*\n` +
              `🛡️ *ᴍᴀᴋᴇ sᴜʀᴇ ᴛʜᴇ ʙᴏᴛ ɪs ᴀᴅᴍɪɴ.*`,
          ),
        );
      }

      /*
        Send VCard after AntiLink action.
      */

      await sendPuttusVCard(
        bot,
        message,
        null,
      );

      return true;
    }

    /* ═══════════════════════════════
       WARN
    ═══════════════════════════════ */

    if (action === "warn") {
      await deleteMessage(
        bot,
        message,
      );

      /*
        Warning is sent first.
      */

      await warnUser(
        bot,
        message,
      );

      /*
        Then VCard is sent.
      */

      await sendPuttusVCard(
        bot,
        message,
        null,
      );

      return true;
    }

    return false;
  } catch (error) {
    console.error(
      "AntiLink handler error:",
      error.message,
    );

    console.error(
      error.stack,
    );

    return false;
  }
}

/* ═══════════════════════════════════════
   IMPORTANT ALIAS
═══════════════════════════════════════ */

const handleLinkDetection =
  handleIncomingMessage;

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

  handleLinkDetection,

  getSetting,

  containsLink,

  sendPuttusVCard,

  vcard: PUTTUS_VCARD,
};
