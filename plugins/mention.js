const fs = require("fs");
const path = require("path");
const {
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");

const store = require("../lib/lightweight_store");

/* =========================================================
   DATABASE
========================================================= */

const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;

const HAS_DB = !!(
  MONGO_URL ||
  POSTGRES_URL ||
  MYSQL_URL ||
  SQLITE_URL
);

/* =========================================================
   FILES
========================================================= */

const mentionFilePath = path.join(
  __dirname,
  "..",
  "data",
  "mention.json",
);

/* =========================================================
   DEFAULT STATE
========================================================= */

function defaultState() {
  return {
    enabled: false,
    assetPath: "",
    type: "text",
    mimetype: "",
    ptt: false,
    gifPlayback: false,
  };
}

/* =========================================================
   LOAD STATE
========================================================= */

async function loadState() {
  try {
    if (HAS_DB) {
      const state = await store.getSetting(
        "global",
        "mention",
      );

      if (!state || typeof state !== "object") {
        return defaultState();
      }

      return {
        ...defaultState(),
        ...state,
      };
    }

    if (!fs.existsSync(mentionFilePath)) {
      return defaultState();
    }

    const raw = fs.readFileSync(
      mentionFilePath,
      "utf8",
    );

    const state = JSON.parse(raw);

    if (!state || typeof state !== "object") {
      return defaultState();
    }

    return {
      ...defaultState(),
      ...state,
    };
  } catch (e) {
    console.error("loadState error:", e?.message || e);
    return defaultState();
  }
}

/* =========================================================
   SAVE STATE
========================================================= */

async function saveState(state) {
  if (HAS_DB) {
    await store.saveSetting(
      "global",
      "mention",
      state,
    );
    return;
  }

  const dataDir = path.join(
    __dirname,
    "..",
    "data",
  );

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, {
      recursive: true,
    });
  }

  fs.writeFileSync(
    mentionFilePath,
    JSON.stringify(state, null, 2),
  );
}

/* =========================================================
   GET QUOTED MESSAGE
========================================================= */

function getQuotedMessage(message) {
  const ctx =
    message?.message?.extendedTextMessage?.contextInfo ||
    message?.message?.imageMessage?.contextInfo ||
    message?.message?.videoMessage?.contextInfo ||
    message?.message?.documentMessage?.contextInfo ||
    message?.message?.stickerMessage?.contextInfo;

  if (!ctx?.quotedMessage) {
    return null;
  }

  return ctx.quotedMessage;
}

/* =========================================================
   DETECT MEDIA TYPE
========================================================= */

function detectMedia(qMsg) {
  if (!qMsg) return null;

  if (qMsg.imageMessage) {
    return {
      type: "image",
      dataType: "imageMessage",
      media: qMsg.imageMessage,
    };
  }

  if (qMsg.videoMessage) {
    return {
      type: "video",
      dataType: "videoMessage",
      media: qMsg.videoMessage,
    };
  }

  if (qMsg.stickerMessage) {
    return {
      type: "sticker",
      dataType: "stickerMessage",
      media: qMsg.stickerMessage,
    };
  }

  if (qMsg.audioMessage) {
    return {
      type: "audio",
      dataType: "audioMessage",
      media: qMsg.audioMessage,
    };
  }

  if (qMsg.conversation) {
    return {
      type: "text",
      dataType: null,
      media: null,
    };
  }

  if (qMsg.extendedTextMessage?.text) {
    return {
      type: "text",
      dataType: null,
      media: null,
    };
  }

  return null;
}

/* =========================================================
   DOWNLOAD QUOTED MEDIA
========================================================= */

async function downloadQuotedMedia(info) {
  if (!info) {
    throw new Error("No quoted media");
  }

  if (info.type === "text") {
    const text =
      info.media?.conversation ||
      "";

    return Buffer.from(text, "utf8");
  }

  const stream = await downloadContentFromMessage(
    info.media,
    info.type,
  );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/* =========================================================
   SAVE MENTION MEDIA
========================================================= */

async function setMentionCommand(
  sock,
  chatId,
  message,
) {
  const qMsg = getQuotedMessage(message);

  if (!qMsg) {
    return sock.sendMessage(
      chatId,
      {
        text:
          "❌ *Reply to a photo, video or sticker*\n\n" +
          "Example:\n" +
          "1. Reply to a photo\n" +
          "2. Send `.mention`",
      },
      { quoted: message },
    );
  }

  const info = detectMedia(qMsg);

  if (!info) {
    return sock.sendMessage(
      chatId,
      {
        text:
          "❌ *Unsupported media*\n\n" +
          "Supported:\n" +
          "🖼️ Photo\n" +
          "🎥 Video\n" +
          "🎨 Sticker\n" +
          "🎵 Audio\n" +
          "📝 Text",
      },
      { quoted: message },
    );
  }

  let buffer;

  try {
    buffer = await downloadQuotedMedia(info);
  } catch (e) {
    console.error(
      "Mention media download error:",
      e,
    );

    return sock.sendMessage(
      chatId,
      {
        text:
          "❌ *Failed to download the replied media.*",
      },
      { quoted: message },
    );
  }

  if (!buffer || !buffer.length) {
    return sock.sendMessage(
      chatId,
      {
        text: "❌ *Media is empty.*",
      },
      { quoted: message },
    );
  }

  /*
   * Keep a reasonable limit for Termux/RAM.
   * You can increase this later if needed.
   */
  const MAX_SIZE = 25 * 1024 * 1024;

  if (buffer.length > MAX_SIZE) {
    return sock.sendMessage(
      chatId,
      {
        text:
          "❌ *File too large.*\n\n" +
          "Maximum size: 25 MB",
      },
      { quoted: message },
    );
  }

  /* =======================================================
     FILE EXTENSION
  ======================================================= */

  let mimetype =
    info.media?.mimetype || "";

  let ext = "bin";

  if (info.type === "image") {
    if (mimetype.includes("png")) {
      ext = "png";
    } else if (mimetype.includes("webp")) {
      ext = "webp";
    } else {
      ext = "jpg";
    }
  }

  if (info.type === "video") {
    ext = "mp4";

    if (!mimetype) {
      mimetype = "video/mp4";
    }
  }

  if (info.type === "sticker") {
    ext = "webp";

    if (!mimetype) {
      mimetype = "image/webp";
    }
  }

  if (info.type === "audio") {
    if (
      mimetype.includes("ogg") ||
      mimetype.includes("opus")
    ) {
      ext = "ogg";
      mimetype = "audio/ogg; codecs=opus";
    } else if (
      mimetype.includes("mpeg") ||
      mimetype.includes("mp3")
    ) {
      ext = "mp3";
      mimetype = "audio/mpeg";
    } else {
      ext = "mp3";
      mimetype = "audio/mpeg";
    }
  }

  if (info.type === "text") {
    ext = "txt";
    mimetype = "text/plain";
  }

  /* =======================================================
     CLEAN OLD MENTION FILE
  ======================================================= */

  const assetsDir = path.join(
    __dirname,
    "..",
    "assets",
  );

  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, {
      recursive: true,
    });
  }

  try {
    const files = fs.readdirSync(assetsDir);

    for (const file of files) {
      if (file.startsWith("mention_custom.")) {
        try {
          fs.unlinkSync(
            path.join(assetsDir, file),
          );
        } catch {}
      }
    }
  } catch (e) {
    console.warn(
      "Mention cleanup error:",
      e?.message || e,
    );
  }

  /* =======================================================
     SAVE NEW FILE
  ======================================================= */

  const fileName =
    `mention_custom.${ext}`;

  const filePath = path.join(
    assetsDir,
    fileName,
  );

  try {
    fs.writeFileSync(
      filePath,
      buffer,
    );
  } catch (e) {
    console.error(
      "Mention save error:",
      e,
    );

    return sock.sendMessage(
      chatId,
      {
        text:
          "❌ *Failed to save mention media.*",
      },
      { quoted: message },
    );
  }

  /* =======================================================
     SAVE STATE
  ======================================================= */

  const state = await loadState();

  state.assetPath = path.join(
    "assets",
    fileName,
  );

  state.type = info.type;
  state.mimetype = mimetype;

  if (info.type === "video") {
    state.gifPlayback =
      !!info.media?.gifPlayback;
  } else {
    state.gifPlayback = false;
  }

  if (info.type === "audio") {
    state.ptt =
      !!info.media?.ptt;
  } else {
    state.ptt = false;
  }

  await saveState(state);

  /* =======================================================
     SUCCESS
  ======================================================= */

  const typeName = {
    image: "🖼️ Photo",
    video: "🎥 Video",
    sticker: "🎨 Sticker",
    audio: "🎵 Audio",
    text: "📝 Text",
  }[info.type] || info.type;

  return sock.sendMessage(
    chatId,
    {
      text:
        `✅ *Mention reply updated!*\n\n` +
        `Type: ${typeName}\n` +
        `File: ${fileName}\n` +
        `Storage: ${
          HAS_DB
            ? "Database"
            : "File System"
        }\n\n` +
        `Use *.mention on* to enable it.`,
    },
    { quoted: message },
  );
}

/* =========================================================
   GET BOT JIDS
========================================================= */

function getBotJids(sock) {
  const rawId =
    sock?.user?.id ||
    sock?.user?.jid ||
    "";

  if (!rawId) {
    return [];
  }

  const botNum = rawId
    .split("@")[0]
    .split(":")[0];

  if (!botNum) {
    return [];
  }

  return [
    `${botNum}@s.whatsapp.net`,
    `${botNum}@whatsapp.net`,
    rawId,
  ];
}

/* =========================================================
   MENTION DETECTION
========================================================= */

async function handleMentionDetection(
  sock,
  chatId,
  message,
) {
  try {
    if (message?.key?.fromMe) {
      return;
    }

    const state = await loadState();

    if (!state.enabled) {
      return;
    }

    if (!state.assetPath) {
      return;
    }

    const botJids = getBotJids(sock);

    if (!botJids.length) {
      return;
    }

    const msg =
      message?.message || {};

    const contexts = [
      msg.extendedTextMessage?.contextInfo,
      msg.imageMessage?.contextInfo,
      msg.videoMessage?.contextInfo,
      msg.documentMessage?.contextInfo,
      msg.stickerMessage?.contextInfo,
      msg.audioMessage?.contextInfo,
    ].filter(Boolean);

    let mentioned = [];

    for (const ctx of contexts) {
      if (
        Array.isArray(
          ctx.mentionedJid,
        )
      ) {
        mentioned.push(
          ...ctx.mentionedJid,
        );
      }
    }

    /* Direct mentionedJid */
    if (
      Array.isArray(
        msg.extendedTextMessage
          ?.mentionedJid,
      )
    ) {
      mentioned.push(
        ...msg.extendedTextMessage
          .mentionedJid,
      );
    }

    if (
      Array.isArray(
        msg.mentionedJid,
      )
    ) {
      mentioned.push(
        ...msg.mentionedJid,
      );
    }

    /* =====================================================
       TEXT FALLBACK
    ===================================================== */

    if (!mentioned.length) {
      const rawText = (
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        ""
      ).toString();

      if (!rawText) {
        return;
      }

      const botNum =
        botJids[0]
          ?.split("@")[0]
          ?.split(":")[0];

      if (!botNum) {
        return;
      }

      /*
       * IMPORTANT:
       * Double slash is required here.
       */
      const re = new RegExp(
        `@?${botNum}\\b`,
      );

      if (
        !re.test(
          rawText.replace(
            /\s+/g,
            "",
          ),
        )
      ) {
        return;
      }
    }

    /* =====================================================
       CHECK BOT MENTION
    ===================================================== */

    const isBotMentioned =
      mentioned.some((jid) =>
        botJids.includes(jid),
      );

    if (
      mentioned.length &&
      !isBotMentioned
    ) {
      return;
    }

    /* =====================================================
       FILE
    ===================================================== */

    const assetPath = path.join(
      __dirname,
      "..",
      state.assetPath,
    );

    if (!fs.existsSync(assetPath)) {
      return;
    }

    const buffer =
      fs.readFileSync(assetPath);

    if (!buffer.length) {
      return;
    }

    /* =====================================================
       SEND SAVED MEDIA
    ===================================================== */

    if (state.type === "image") {
      return await sock.sendMessage(
        chatId,
        {
          image: buffer,
          mimetype:
            state.mimetype ||
            "image/jpeg",
        },
        {
          quoted: message,
        },
      );
    }

    if (state.type === "video") {
      return await sock.sendMessage(
        chatId,
        {
          video: buffer,
          mimetype:
            state.mimetype ||
            "video/mp4",
          gifPlayback:
            !!state.gifPlayback,
        },
        {
          quoted: message,
        },
      );
    }

    if (state.type === "sticker") {
      return await sock.sendMessage(
        chatId,
        {
          sticker: buffer,
        },
        {
          quoted: message,
        },
      );
    }

    if (state.type === "audio") {
      return await sock.sendMessage(
        chatId,
        {
          audio: buffer,
          mimetype:
            state.mimetype ||
            "audio/mpeg",
          ptt: !!state.ptt,
        },
        {
          quoted: message,
        },
      );
    }

    if (state.type === "text") {
      return await sock.sendMessage(
        chatId,
        {
          text: buffer.toString(
            "utf8",
          ),
        },
        {
          quoted: message,
        },
      );
    }
  } catch (err) {
    console.error(
      "handleMentionDetection error:",
      err,
    );
  }
}

/* =========================================================
   PLUGIN
========================================================= */

module.exports = {
  command: "mention",

  aliases: [
    "setmention",
    "mentionreply",
  ],

  category: "owner",

  description:
    "Set photo, video or sticker as automatic mention reply",

  usage:
    ".mention (reply to media)\n" +
    ".mention on\n" +
    ".mention off",

  ownerOnly: true,

  async handler(
    sock,
    message,
    args,
    context = {},
  ) {
    const chatId =
      context.chatId ||
      message?.key?.remoteJid;

    const action =
      args[0]?.toLowerCase();

    /* =====================================================
       SET MEDIA
       .mention
       .mention set
    ===================================================== */

    if (
      !action ||
      action === "set"
    ) {
      return await setMentionCommand(
        sock,
        chatId,
        message,
      );
    }

    /* =====================================================
       ON
    ===================================================== */

    if (action === "on") {
      const state =
        await loadState();

      if (!state.assetPath) {
        return sock.sendMessage(
          chatId,
          {
            text:
              "❌ *No mention reply is set yet.*\n\n" +
              "Reply to a photo/video/sticker and send *.mention* first.",
          },
          {
            quoted: message,
          },
        );
      }

      state.enabled = true;

      await saveState(state);

      return sock.sendMessage(
        chatId,
        {
          text:
            "✅ *Mention Reply Enabled*",
        },
        {
          quoted: message,
        },
      );
    }

    /* =====================================================
       OFF
    ===================================================== */

    if (action === "off") {
      const state =
        await loadState();

      state.enabled = false;

      await saveState(state);

      return sock.sendMessage(
        chatId,
        {
          text:
            "❌ *Mention Reply Disabled*",
        },
        {
          quoted: message,
        },
      );
    }

    /* =====================================================
       STATUS
    ===================================================== */

    if (
      action === "status" ||
      action === "info"
    ) {
      const state =
        await loadState();

      return sock.sendMessage(
        chatId,
        {
          text:
            `╭─〔 *MENTION REPLY* 〕\n` +
            `│\n` +
            `│ Status: ${
              state.enabled
                ? "ON"
                : "OFF"
            }\n` +
            `│ Type: ${
              state.type ||
