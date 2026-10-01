const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const { UploadFileUgu, TelegraPh } = require("../lib/uploader");

/* =========================================================
   MEDIA BUFFER
========================================================= */

async function getMediaBuffer(msg, sock) {
  return await downloadMediaMessage(
    msg,
    "buffer",
    {},
    {
      logger: sock.logger,
      reuploadRequest: sock.updateMediaMessage,
    },
  );
}

/* =========================================================
   GET QUOTED MESSAGE
========================================================= */

function getQuotedMessage(message) {
  const ctx = message.message?.extendedTextMessage?.contextInfo;

  if (!ctx?.quotedMessage) return null;

  return {
    key: {
      remoteJid: message.key.remoteJid,
      fromMe: false,
      id: ctx.stanzaId,
      participant: ctx.participant,
    },
    message: ctx.quotedMessage,
  };
}

/* =========================================================
   GET MEDIA EXTENSION
========================================================= */

function getExtFromMessage(msg) {
  const m = msg.message;

  if (m.imageMessage) return ".jpg";
  if (m.videoMessage) return ".mp4";
  if (m.audioMessage) return ".mp3";
  if (m.stickerMessage) return ".webp";

  if (m.documentMessage) {
    return (
      path.extname(m.documentMessage.fileName || "") ||
      ".bin"
    );
  }

  return null;
}

/* =========================================================
   PUTTUS VCARD
========================================================= */

function getPuttusVCard() {
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
        displayName: "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
        vcard,
      },
    },
  };
}

/* =========================================================
   MODULE
========================================================= */

module.exports = {
  command: "url",

  aliases: [
    "geturl",
    "mediaurl",
  ],

  category: "tools",

  description:
    "Get a URL for media (image, video, audio, sticker, document).",

  usage:
    ".url (send or reply to media)",

  async handler(sock, message, args, context = {}) {
    const chatId =
      context.chatId || message.key.remoteJid;

    try {
      /* =====================================================
         FIND TARGET MEDIA
      ===================================================== */

      let targetMsg = null;

      if (
        message.message?.imageMessage ||
        message.message?.videoMessage ||
        message.message?.audioMessage ||
        message.message?.stickerMessage ||
        message.message?.documentMessage
      ) {
        targetMsg = message;
      }

      if (!targetMsg) {
        const quoted = getQuotedMessage(message);

        if (quoted) {
          targetMsg = quoted;
        }
      }

      /* =====================================================
         NO MEDIA
      ===================================================== */

      if (!targetMsg) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *ᴍᴇᴅɪᴀ ᴅᴇᴛᴇᴄᴛ ʜᴏʏɴɪ*\n\n" +
              "┃ ⤷ ᴇᴋᴛɪ ᴍᴇᴅɪᴀ sᴇɴᴅ ᴋᴏʀᴏ ᴏʀ ᴍᴇᴅɪᴀ-ᴛᴇ ʀᴇᴘʟʏ ᴋᴏʀᴏ.",
          },
          {
            quoted: getPuttusVCard(),
          },
        );
      }

      /* =====================================================
         GET EXTENSION
      ===================================================== */

      const ext = getExtFromMessage(targetMsg);

      if (!ext) {
        throw new Error("Unsupported media type");
      }

      /* =====================================================
         DOWNLOAD MEDIA
      ===================================================== */

      const buffer = await getMediaBuffer(
        targetMsg,
        sock,
      );

      if (!buffer) {
        throw new Error(
          "Failed to download media",
        );
      }

      /* =====================================================
         TEMP DIRECTORY
      ===================================================== */

      const tempDir = path.join(
        __dirname,
        "../temp",
      );

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, {
          recursive: true,
        });
      }

      const tempPath = path.join(
        tempDir,
        `${Date.now()}${ext}`,
      );

      fs.writeFileSync(
        tempPath,
        buffer,
      );

      /* =====================================================
         UPLOAD
      ===================================================== */

      let url = "";

      try {
        if (
          [".jpg", ".png", ".webp"].includes(ext)
        ) {
          try {
            url = await TelegraPh(
              tempPath,
            );
          } catch {
            const res =
              await UploadFileUgu(
                tempPath,
              );

            url =
              typeof res === "string"
                ? res
                : res.url ||
                  res.url_full ||
                  "";
          }
        } else {
          const res =
            await UploadFileUgu(
              tempPath,
            );

          url =
            typeof res === "string"
              ? res
              : res.url ||
                res.url_full ||
                "";
        }
      } finally {
        setTimeout(() => {
          try {
            fs.unlinkSync(
              tempPath,
            );
          } catch {}
        }, 2000);
      }

      /* =====================================================
         UPLOAD FAILED
      ===================================================== */

      if (!url) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *ᴜᴘʟᴏᴀᴅ ғᴀɪʟᴇᴅ*\n\n" +
              "┃ ⤷ ᴍᴇᴅɪᴀ ᴜʀʟ ɢᴇɴᴇʀᴀᴛᴇ ᴋᴏʀᴀ ɢᴇʟᴏ ɴᴀ.",
          },
          {
            quoted: getPuttusVCard(),
          },
        );
      }

      /* =====================================================
         FINAL OUTPUT
      ===================================================== */

      const output =
        `┏━〔 🔗 ᴜʀʟ ʟɪɴᴋ 〕━┓\n\n` +
        `┃ ⤿ ${url}\n\n` +
        `┗━〔 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕━┛`;

      await sock.sendMessage(
        chatId,
        {
          text: output,
        },
        {
          quoted: getPuttusVCard(),
        },
      );
    } catch (error) {
      console.error(
        "[URL] error:",
        error,
      );

      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *ᴜʀʟ ɢᴇɴᴇʀᴀᴛᴇ ғᴀɪʟᴇᴅ*\n\n" +
            `┃ ⤷ ${error.message || error}`,
        },
        {
          quoted: getPuttusVCard(),
        },
      );
    }
  },
};
