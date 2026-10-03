"use strict";

const fs = require("fs");
const path = require("path");
const {
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");

const DATA_DIR = path.join(process.cwd(), "data");
const ASSETS_DIR = path.join(process.cwd(), "assets");
const STATE_FILE = path.join(DATA_DIR, "mention.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

/* =========================================================
   DEFAULT STATE
========================================================= */

const DEFAULT_STATE = {
  enabled: false,
  type: null,
  assetPath: null,
  text: null,
};

/* =========================================================
   STATE
========================================================= */

function loadState() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      fs.writeFileSync(
        STATE_FILE,
        JSON.stringify(DEFAULT_STATE, null, 2)
      );
      return { ...DEFAULT_STATE };
    }

    const data = JSON.parse(
      fs.readFileSync(STATE_FILE, "utf8")
    );

    return {
      ...DEFAULT_STATE,
      ...data,
    };
  } catch (error) {
    console.error(
      "[MENTION] State load error:",
      error.message
    );

    return { ...DEFAULT_STATE };
  }
}

function saveState(state) {
  try {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify(state, null, 2)
    );

    return true;
  } catch (error) {
    console.error(
      "[MENTION] State save error:",
      error.message
    );

    return false;
  }
}

/* =========================================================
   HELPERS
========================================================= */

function getChatId(message) {
  return (
    message?.key?.remoteJid ||
    message?.chat ||
    message?.from ||
    null
  );
}

function getQuotedMessage(message) {
  return (
    message?.quoted ||
    message?.quote ||
    message?.message?.extendedTextMessage
      ?.contextInfo?.quotedMessage ||
    null
  );
}

function getMessageContent(message) {
  if (!message) return null;

  if (message.message) {
    return message.message;
  }

  return message;
}

/* =========================================================
   UNWRAP MESSAGE
========================================================= */

function unwrapMessage(message) {
  let msg = message;

  if (!msg) return null;

  if (msg.ephemeralMessage?.message) {
    msg = msg.ephemeralMessage.message;
  }

  if (msg.viewOnceMessage?.message) {
    msg = msg.viewOnceMessage.message;
  }

  if (msg.viewOnceMessageV2?.message) {
    msg = msg.viewOnceMessageV2.message;
  }

  if (msg.viewOnceMessageV2Extension?.message) {
    msg = msg.viewOnceMessageV2Extension.message;
  }

  return msg;
}

/* =========================================================
   MEDIA DETECTION
========================================================= */

function detectMedia(message) {
  let msg = getMessageContent(message);

  if (!msg) return null;

  msg = unwrapMessage(msg);

  if (!msg) return null;

  if (msg.imageMessage) {
    return {
      type: "image",
      content: msg.imageMessage,
    };
  }

  if (msg.videoMessage) {
    return {
      type: "video",
      content: msg.videoMessage,
    };
  }

  if (msg.stickerMessage) {
    return {
      type: "sticker",
      content: msg.stickerMessage,
    };
  }

  if (msg.audioMessage) {
    return {
      type: "audio",
      content: msg.audioMessage,
    };
  }

  if (msg.conversation) {
    return {
      type: "text",
      text: msg.conversation,
    };
  }

  if (msg.extendedTextMessage?.text) {
    return {
      type: "text",
      text: msg.extendedTextMessage.text,
    };
  }

  return null;
}

/* =========================================================
   DOWNLOAD MEDIA
========================================================= */

async function downloadMedia(media) {
  if (!media?.content) {
    throw new Error("Media content not found");
  }

  const stream = await downloadContentFromMessage(
    media.content,
    media.type
  );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/* =========================================================
   EXTENSION
========================================================= */

function getExtension(type) {
  switch (type) {
    case "image":
      return "jpg";

    case "video":
      return "mp4";

    case "sticker":
      return "webp";

    case "audio":
      return "mp3";

    default:
      return "bin";
  }
}

/* =========================================================
   SAVE MEDIA
========================================================= */

async function saveMedia(media) {
  const buffer = await downloadMedia(media);

  if (!buffer || !buffer.length) {
    throw new Error("Downloaded media is empty");
  }

  const extension = getExtension(media.type);

  const filePath = path.join(
    ASSETS_DIR,
    `mention_custom.${extension}`
  );

  fs.writeFileSync(filePath, buffer);

  return filePath;
}

/* =========================================================
   BOT NUMBER
========================================================= */

function normalizeJid(jid) {
  return String(jid || "")
    .split(":")[0]
    .split("@")[0]
    .replace(/\D/g, "");
}

function getBotNumber(sock) {
  try {
    const jid =
      sock?.user?.id ||
      sock?.user?.jid ||
      "";

    return normalizeJid(jid);
  } catch {
    return "";
  }
}

/* =========================================================
   CONTEXT INFO
========================================================= */

function getMessageContextInfo(message) {
  let msg = getMessageContent(message);

  if (!msg) return null;

  msg = unwrapMessage(msg);

  if (!msg) return null;

  return (
    msg.extendedTextMessage?.contextInfo ||
    msg.imageMessage?.contextInfo ||
    msg.videoMessage?.contextInfo ||
    msg.stickerMessage?.contextInfo ||
    msg.audioMessage?.contextInfo ||
    msg.documentMessage?.contextInfo ||
    null
  );
}

/* =========================================================
   CHECK BOT MENTION
========================================================= */

function isBotMentioned(sock, message) {
  const botNumber = getBotNumber(sock);

  if (!botNumber) {
    return false;
  }

  const contextInfo =
    getMessageContextInfo(message);

  /* REAL WHATSAPP MENTION */
  const mentionedJid =
    contextInfo?.mentionedJid || [];

  if (Array.isArray(mentionedJid)) {
    const found = mentionedJid.some((jid) => {
      return normalizeJid(jid) === botNumber;
    });

    if (found) {
      return true;
    }
  }

  /* TEXT FALLBACK */

  let msg = getMessageContent(message);

  if (!msg) return false;

  msg = unwrapMessage(msg);

  const text =
    msg?.conversation ||
    msg?.extendedTextMessage?.text ||
    msg?.imageMessage?.caption ||
    msg?.videoMessage?.caption ||
    "";

  if (!text) {
    return false;
  }

  const safeNumber = botNumber.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const regex = new RegExp(
    `@${safeNumber}\\b`
  );

  return regex.test(text);
}

/* =========================================================
   SEND SAVED REPLY
========================================================= */

async function sendMentionReply(
  sock,
  chatId,
  message
) {
  const state = loadState();

  if (!state.enabled) {
    return false;
  }

  if (!state.type) {
    return false;
  }

  try {
    /* TEXT */

    if (state.type === "text") {
      if (!state.text) {
        return false;
      }

      await sock.sendMessage(
        chatId,
        {
          text: state.text,
        },
        {
          quoted: message,
        }
      );

      return true;
    }

    /* FILE */

    if (!state.assetPath) {
      return false;
    }

    if (!fs.existsSync(state.assetPath)) {
      console.log(
        "[MENTION] Saved media file not found"
      );

      return false;
    }

    const buffer = fs.readFileSync(
      state.assetPath
    );

    /* IMAGE */

    if (state.type === "image") {
      await sock.sendMessage(
        chatId,
        {
          image: buffer,
          mimetype: "image/jpeg",
        },
        {
          quoted: message,
        }
      );

      return true;
    }

    /* VIDEO */

    if (state.type === "video") {
      await sock.sendMessage(
        chatId,
        {
          video: buffer,
          mimetype: "video/mp4",
        },
        {
          quoted: message,
        }
      );

      return true;
    }

    /* STICKER */

    if (state.type === "sticker") {
      await sock.sendMessage(
        chatId,
        {
          sticker: buffer,
        },
        {
          quoted: message,
        }
      );

      return true;
    }

    /* AUDIO */

    if (state.type === "audio") {
      await sock.sendMessage(
        chatId,
        {
          audio: buffer,
          mimetype: "audio/mpeg",
          ptt: false,
        },
        {
          quoted: message,
        }
      );

      return true;
    }

    return false;
  } catch (error) {
    console.error(
      "[MENTION] Reply error:",
      error.message
    );

    return false;
  }
}

/* =========================================================
   SET MENTION
========================================================= */

async function setMentionCommand(
  sock,
  message
) {
  const chatId = getChatId(message);

  if (!chatId) return;

  const quoted =
    getQuotedMessage(message);

  if (!quoted) {
    return sock.sendMessage(
      chatId,
      {
        text:
          "❌ *Reply to a photo, video, sticker, audio or text message.*\n\n" +
          "Then send *.mention*",
      },
      {
        quoted: message,
      }
    );
  }

  const media = detectMedia(quoted);

  if (!media) {
    return sock.sendMessage(
      chatId,
      {
        text:
          "❌ *Unsupported message.*\n\n" +
          "Supported:\n" +
          "🖼️ Photo\n" +
          "🎥 Video\n" +
          "🌐 Sticker\n" +
          "🎵 Audio\n" +
          "📝 Text",
      },
      {
        quoted: message,
      }
    );
  }

  try {
    /* TEXT */

    if (media.type === "text") {
      const state = {
        enabled: true,
        type: "text",
        assetPath: null,
        text: media.text,
      };

      saveState(state);

      return sock.sendMessage(
        chatId,
        {
          text:
            "✅ *Mention Reply Set!*\n\n" +
            "📝 Type: *TEXT*\n" +
            "⚡ Status: *ON*\n\n" +
            "Now mention the bot.",
        },
        {
          quoted: message,
        }
      );
    }

    /* MEDIA */

    const filePath =
      await saveMedia(media);

    const state = {
      enabled: true,
      type: media.type,
      assetPath: filePath,
      text: null,
    };

    saveState(state);

    const icons = {
      image: "🖼️",
      video: "🎥",
      sticker: "🌐",
      audio: "🎵",
    };

    return sock.sendMessage(
      chatId,
      {
        text:
          "✅ *Mention Reply Set!*\n\n" +
          `${icons[media.type] || "📦"} Type: *${media.type.toUpperCase()}*\n` +
          "⚡ Status: *ON*\n\n" +
          "Now mention the bot.",
      },
      {
        quoted: message,
      }
    );
  } catch (error) {
    console.error(
      "[MENTION] Set error:",
      error
    );

    return sock.sendMessage(
      chatId,
      {
        text:
          "❌ *Failed to save the media.*\n\n" +
          `${error.message}`,
      },
      {
        quoted: message,
      }
    );
  }
}

/* =========================================================
   MENTION DETECTION
========================================================= */

async function handleMentionDetection(
  sock,
  chatId,
  message
) {
  try {
    if (!message) {
      return false;
    }

    if (!chatId) {
      chatId = getChatId(message);
    }

    if (!chatId) {
      return false;
    }

    /* ONLY GROUP */

    if (!chatId.endsWith("@g.us")) {
      return false;
    }

    const mentioned =
      isBotMentioned(
        sock,
        message
      );

    if (!mentioned) {
      return false;
    }

    return await sendMentionReply(
      sock,
      chatId,
      message
    );
  } catch (error) {
    console.error(
      "[MENTION] Detection error:",
      error.message
    );

    return false;
  }
}

/* =========================================================
   COMMAND HANDLER
========================================================= */

async function handleMentionCommand(
  sock,
  message,
  args
) {
  const chatId = getChatId(message);

  if (!chatId) return;

  const action = String(
    args?.[0] || ""
  )
    .trim()
    .toLowerCase();

  /* ON */

  if (action === "on") {
    const state = loadState();

    if (!state.type) {
      return sock.sendMessage(
        chatId,
        {
          text:
            "❌ *No mention reply is set yet.*\n\n" +
            "Reply to a photo/video/sticker/audio/text and send *.mention* first.",
        },
        {
          quoted: message,
        }
      );
    }

    state.enabled = true;

    saveState(state);

    return sock.sendMessage(
      chatId,
      {
        text:
          "✅ *Mention Reply Enabled*",
      },
      {
        quoted: message,
      }
    );
  }

  /* OFF */

  if (action === "off") {
    const state = loadState();

    state.enabled = false;

    saveState(state);

    return sock.sendMessage(
      chatId,
      {
        text:
          "❌ *Mention Reply Disabled*",
      },
      {
        quoted: message,
      }
    );
  }

  /* STATUS */

  if (
    action === "status" ||
    action === "info"
  ) {
    const state = loadState();

    return sock.sendMessage(
      chatId,
      {
        text:
          "╭─〔 *MENTION REPLY* 〕\n" +
          "│\n" +
          `│ Status: ${state.enabled ? "ON" : "OFF"}\n` +
          `│ Type: ${state.type || "NONE"}\n` +
          `│ File: ${state.assetPath ? "SET" : "NOT SET"}\n` +
          "╰────────────────",
      },
      {
        quoted: message,
      }
    );
  }

  /* SET */

  return setMentionCommand(
    sock,
    message
  );
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  command: "mention",

  aliases: [
    "mreply",
    "mentionreply",
  ],

  category: "general",

  description:
    "Set automatic reply when bot is mentioned",

  usage:
    ".mention [on/off/status] or reply to media with .mention",

  async handler(
    sock,
    message,
    args
  ) {
    return handleMentionCommand(
      sock,
      message,
      args
    );
  },

  handleMentionDetection,
};
