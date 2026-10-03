"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "mention.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/* =========================================================
   DEFAULT STATE
========================================================= */

const DEFAULT_STATE = {
  enabled: false,
  url: null,
  type: null,
  thumbnail: null,
  caption: null,
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
   CHAT ID
========================================================= */

function getChatId(message) {
  return (
    message?.key?.remoteJid ||
    message?.chat ||
    message?.from ||
    null
  );
}

/* =========================================================
   BOT JID
========================================================= */

function normalizeNumber(value) {
  return String(value || "")
    .split(":")[0]
    .split("@")[0]
    .replace(/\D/g, "");
}

function getBotNumber(sock) {
  try {
    return normalizeNumber(
      sock?.user?.id ||
      sock?.user?.jid ||
      ""
    );
  } catch {
    return "";
  }
}

/* =========================================================
   GET CONTEXT INFO
========================================================= */

function getContextInfo(message) {
  const msg = message?.message || message;

  if (!msg) return null;

  return (
    msg.extendedTextMessage?.contextInfo ||
    msg.imageMessage?.contextInfo ||
    msg.videoMessage?.contextInfo ||
    msg.audioMessage?.contextInfo ||
    msg.documentMessage?.contextInfo ||
    msg.stickerMessage?.contextInfo ||
    msg.buttonsResponseMessage?.contextInfo ||
    msg.listResponseMessage?.contextInfo ||
    null
  );
}

/* =========================================================
   CHECK REAL WHATSAPP MENTION
========================================================= */

function isBotMentioned(sock, message) {
  const botNumber = getBotNumber(sock);

  if (!botNumber) {
    return false;
  }

  const contextInfo =
    getContextInfo(message);

  const mentionedJid =
    contextInfo?.mentionedJid || [];

  if (Array.isArray(mentionedJid)) {
    for (const jid of mentionedJid) {
      if (
        normalizeNumber(jid) ===
        botNumber
      ) {
        return true;
      }
    }
  }

  /* FALLBACK: TEXT */

  const msg = message?.message || message;

  const text =
    msg?.conversation ||
    msg?.extendedTextMessage?.text ||
    msg?.imageMessage?.caption ||
    msg?.videoMessage?.caption ||
    "";

  if (!text) {
    return false;
  }

  return text.includes(`@${botNumber}`);
}

/* =========================================================
   URL TYPE
========================================================= */

function detectUrlType(url) {
  const cleanUrl = String(url || "")
    .split("?")[0]
    .split("#")[0]
    .toLowerCase();

  if (
    cleanUrl.endsWith(".mp3") ||
    cleanUrl.includes(".mp3/")
  ) {
    return "audio";
  }

  if (
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.includes(".mp4/")
  ) {
    return "video";
  }

  return null;
}

/* =========================================================
   DOWNLOAD URL
========================================================= */

function downloadUrl(url) {
  return new Promise(
    (resolve, reject) => {
      const client = url.startsWith("https://")
        ? https
        : http;

      const request = client.get(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0",
          },
        },
        (response) => {
          /* REDIRECT */

          if (
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            response.resume();

            return downloadUrl(
              response.headers.location
            )
              .then(resolve)
              .catch(reject);
          }

          if (
            response.statusCode !== 200
          ) {
            response.resume();

            return reject(
              new Error(
                `HTTP ${response.statusCode}`
              )
            );
          }

          const chunks = [];

          response.on(
            "data",
            (chunk) => {
              chunks.push(chunk);
            }
          );

          response.on(
            "end",
            () => {
              resolve(
                Buffer.concat(chunks)
              );
            }
          );

          response.on(
            "error",
            reject
          );
        }
      );

      request.on(
        "error",
        reject
      );

      request.setTimeout(
        120000,
        () => {
          request.destroy();

          reject(
            new Error(
              "Download timeout"
            )
          );
        }
      );
    }
  );
}

/* =========================================================
   SEND URL MEDIA
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

  if (!state.url) {
    return false;
  }

  try {
    let type = state.type;

    if (!type) {
      type =
        detectUrlType(
          state.url
        );
    }

    if (!type) {
      console.log(
        "[MENTION] Unknown URL type"
      );

      return false;
    }

    console.log(
      `[MENTION] Sending ${type}: ${state.url}`
    );

    const buffer =
      await downloadUrl(
        state.url
      );

    if (
      !buffer ||
      !buffer.length
    ) {
      throw new Error(
        "Downloaded file is empty"
      );
    }

    /* MP4 */

    if (type === "video") {
      const videoMessage = {
        video: buffer,
        mimetype: "video/mp4",
        fileName: "PUTTUS-MENTION.mp4",
      };

      if (state.caption) {
        videoMessage.caption =
          state.caption;
      }

      /*
       * If a thumbnail URL is provided,
       * download it and use it.
       */

      if (state.thumbnail) {
        try {
          const thumbnail =
            await downloadUrl(
              state.thumbnail
            );

          if (thumbnail?.length) {
            videoMessage.jpegThumbnail =
              thumbnail;
          }
        } catch (error) {
          console.log(
            "[MENTION] Thumbnail error:",
            error.message
          );
        }
      }

      await sock.sendMessage(
        chatId,
        videoMessage,
        {
          quoted: message,
        }
      );

      return true;
    }

    /* MP3 */

    if (type === "audio") {
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
      "[MENTION] Send error:",
      error.message
    );

    return false;
  }
}

/* =========================================================
   SET URL
========================================================= */

async function setMentionCommand(
  sock,
  message,
  args
) {
  const chatId =
    getChatId(message);

  if (!chatId) return;

  const url =
    String(
      args?.[0] || ""
    ).trim();

  if (
    !url ||
    !/^https?:\/\//i.test(url)
  ) {
    return sock.sendMessage(
      chatId,
      {
        text:
          "❌ *Give an MP3 or MP4 URL.*\n\n" +
          "Example:\n" +
          "`.mention https://example.com/song.mp3`\n\n" +
          "or\n\n" +
          "`.mention https://example.com/video.mp4`",
      },
      {
        quoted: message,
      }
    );
  }

  const type =
    detectUrlType(url);

  if (!type) {
    return sock.sendMessage(
      chatId,
      {
        text:
          "❌ *Only MP3 and MP4 URLs are supported.*\n\n" +
          "Supported:\n" +
          "🎵 MP3\n" +
          "🎥 MP4",
      },
      {
        quoted: message,
      }
    );
  }

  const state = {
    enabled: true,
    url,
    type,
    thumbnail: null,
    caption: null,
  };

  saveState(state);

  return sock.sendMessage(
    chatId,
    {
      text:
        "✅ *Mention Reply Set!*\n\n" +
        `📦 Type: *${type.toUpperCase()}*\n` +
        "⚡ Status: *ON*\n\n" +
        "Now @tag the bot.",
    },
    {
      quoted: message,
    }
  );
}

/* =========================================================
   DETECTION
========================================================= */

async function handleMentionDetection(
  sock,
  chatId,
  message
) {
  try {
    if (!sock || !message) {
      return false;
    }

    if (!chatId) {
      chatId =
        getChatId(message);
    }

    if (!chatId) {
      return false;
    }

    /* GROUP ONLY */

    if (
      !chatId.endsWith("@g.us")
    ) {
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

    console.log(
      "[MENTION] Bot mentioned"
    );

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
   COMMAND
========================================================= */

async function handleMentionCommand(
  sock,
  message,
  args
) {
  const chatId =
    getChatId(message);

  if (!chatId) return;

  const action =
    String(
      args?.[0] || ""
    )
      .trim()
      .toLowerCase();

  /* ON */

  if (action === "on") {
    const state =
      loadState();

    if (!state.url) {
      return sock.sendMessage(
        chatId,
        {
          text:
            "❌ *No URL is set.*\n\n" +
            "Use:\n" +
            "`.mention <mp3/mp4-url>`",
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
          "✅ *Mention Reply ON*",
      },
      {
        quoted: message,
      }
    );
  }

  /* OFF */

  if (action === "off") {
    const state =
      loadState();

    state.enabled = false;

    saveState(state);

    return sock.sendMessage(
      chatId,
      {
        text:
          "❌ *Mention Reply OFF*",
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
    const state =
      loadState();

    return sock.sendMessage(
      chatId,
      {
        text:
          "╭─〔 *MENTION REPLY* 〕\n" +
          "│\n" +
          `│ Status: ${state.enabled ? "ON" : "OFF"}\n` +
          `│ Type: ${state.type || "NONE"}\n` +
          `│ URL: ${state.url ? "SET" : "NOT SET"}\n` +
          "╰────────────────",
      },
      {
        quoted: message,
      }
    );
  }

  /* SET URL */

  return setMentionCommand(
    sock,
    message,
    args
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
    "Reply with MP3 or MP4 when bot is mentioned",

  usage:
    ".mention <mp3/mp4 url> | .mention on | .mention off | .mention status",

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
