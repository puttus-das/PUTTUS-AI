const {
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");

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
   GET QUOTED MESSAGE
========================================================= */

function getQuotedMessage(message) {
  const contextInfo =
    message?.message?.extendedTextMessage?.contextInfo ||
    message?.message?.imageMessage?.contextInfo ||
    message?.message?.videoMessage?.contextInfo ||
    message?.message?.documentMessage?.contextInfo;

  return contextInfo?.quotedMessage || null;
}

/* =========================================================
   UNWRAP VIEW ONCE
========================================================= */

function unwrapViewOnce(message) {
  if (!message) return null;

  let current = message;

  for (let i = 0; i < 10; i++) {
    if (!current) return null;

    if (current.viewOnceMessage?.message) {
      current = current.viewOnceMessage.message;
      continue;
    }

    if (current.viewOnceMessageV2?.message) {
      current = current.viewOnceMessageV2.message;
      continue;
    }

    if (current.viewOnceMessageV2Extension?.message) {
      current = current.viewOnceMessageV2Extension.message;
      continue;
    }

    if (current.ephemeralMessage?.message) {
      current = current.ephemeralMessage.message;
      continue;
    }

    if (current.documentWithCaptionMessage?.message) {
      current = current.documentWithCaptionMessage.message;
      continue;
    }

    break;
  }

  return current;
}

/* =========================================================
   DOWNLOAD MEDIA
========================================================= */

async function downloadMedia(media, type) {
  const stream = await downloadContentFromMessage(
    media,
    type,
  );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/* =========================================================
   VIEW ONCE PLUGIN
========================================================= */

module.exports = {
  command: "viewonce",

  aliases: [
    "vv",
    "view",
    "viewmedia",
  ],

  category: "general",

  description:
    "Recover and resend a view-once photo or video",

  usage:
    ".vv - reply to a view-once photo/video",

  async handler(
    sock,
    message,
    args = [],
    context = {},
  ) {
    const chatId =
      context?.chatId ||
      message?.key?.remoteJid;

    try {
      /* =====================================================
         GET QUOTED MESSAGE
      ===================================================== */

      const quoted = getQuotedMessage(message);

      if (!quoted) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "👁️ *VIEW ONCE*\n\n" +
              "❯ Reply to a view-once photo/video\n" +
              "❯ Then type *.vv*",
          },
          {
            quoted: message,
          },
        );
      }

      /* =====================================================
         UNWRAP VIEW ONCE
      ===================================================== */

      const media = unwrapViewOnce(quoted);

      if (!media) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *Not a View-Once message!*\n\n" +
              "Reply directly to the original " +
              "view-once photo or video.",
          },
          {
            quoted: message,
          },
        );
      }

      /* =====================================================
         VIEW ONCE IMAGE
      ===================================================== */

      if (media.imageMessage) {
        const image = media.imageMessage;

        await sock.sendMessage(chatId, {
          react: {
            text: "👁️",
            key: message.key,
          },
        });

        const buffer = await downloadMedia(
          image,
          "image",
        );

        await sock.sendMessage(
          chatId,
          {
            image: buffer,

            caption:
              image.caption ||
              "👁️ *View Once Photo*\n\n" +
              "🤖 *𝙋𝙐𝙏𝙏𝙐𝙎-𝘼𝙄*",
          },
          {
            quoted: message,
          },
        );

        /* ===================================================
           PUTTUS VCARD
        =================================================== */

        await sock.sendMessage(
          chatId,
          {
            text: "🌸 *PUTTUS-BOT*",
          },
          {
            quoted: getPuttusVCardQuote(),
          },
        );

        await sock.sendMessage(chatId, {
          react: {
            text: "✅",
            key: message.key,
          },
        });

        return;
      }

      /* =====================================================
         VIEW ONCE VIDEO
      ===================================================== */

      if (media.videoMessage) {
        const video = media.videoMessage;

        await sock.sendMessage(chatId, {
          react: {
            text: "👁️",
            key: message.key,
          },
        });

        const buffer = await downloadMedia(
          video,
          "video",
        );

        await sock.sendMessage(
          chatId,
          {
            video: buffer,

            mimetype:
              video.mimetype ||
              "video/mp4",

            caption:
              video.caption ||
              "👁️ *View Once Video*\n\n" +
              "🤖 *𝙋𝙐𝙏𝙏𝙐𝙎-𝘼𝙄*",
          },
          {
            quoted: message,
          },
        );

        /* ===================================================
           PUTTUS VCARD
        =================================================== */

        await sock.sendMessage(
          chatId,
          {
            text: "🌸 *PUTTUS-BOT*",
          },
          {
            quoted: getPuttusVCardQuote(),
          },
        );

        await sock.sendMessage(chatId, {
          react: {
            text: "✅",
            key: message.key,
          },
        });

        return;
      }

      /* =====================================================
         UNSUPPORTED MEDIA
      ===================================================== */

      return await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *Not a View-Once photo/video!*\n\n" +
            "Only view-once photos and videos are supported.",
        },
        {
          quoted: message,
        },
      );
    } catch (error) {
      console.error(
        "PUTTUS VIEWONCE ERROR:",
        error,
      );

      try {
        await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *View-Once Failed!*\n\n" +
              "The media could not be recovered.",
          },
          {
            quoted: message,
          },
        );

        await sock.sendMessage(chatId, {
          react: {
            text: "❌",
            key: message.key,
          },
        });
      } catch (sendError) {
        console.error(
          "PUTTUS VIEWONCE SEND ERROR:",
          sendError,
        );
      }
    }
  },
};
