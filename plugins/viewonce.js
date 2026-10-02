const {
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");

/* =========================================================
   PUTTUS VCARD
========================================================= */

const PUTTUS_VCARD = {
  displayName: "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
  vcard: `BEGIN:VCARD
VERSION:3.0
FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲
ORG:PUTTUS BOT;
TEL;type=CELL;type=VOICE;waid=918967360566:+91 8967360566
END:VCARD`,
};

/* =========================================================
   GET QUOTED MESSAGE
========================================================= */

function getQuotedMessage(message) {
  const contextInfo =
    message?.message?.extendedTextMessage?.contextInfo ||
    message?.message?.imageMessage?.contextInfo ||
    message?.message?.videoMessage?.contextInfo;

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

async function downloadMedia(message, type) {
  const stream = await downloadContentFromMessage(
    message,
    type,
  );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/* =========================================================
   PLUGIN
========================================================= */

module.exports = {
  command: "viewonce",
  aliases: ["vv", "view", "viewmedia"],

  category: "general",

  description:
    "Recover and resend a view-once photo or video",

  usage:
    ".vv - reply to a view-once photo/video",

  async handler(sock, message, args = [], context = {}) {
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
         DEBUG STRUCTURE
      ===================================================== */

      console.log(
        "[PUTTUS VV] Quoted message:",
        JSON.stringify(
          Object.keys(quoted),
          null,
          2,
        ),
      );

      /* =====================================================
         UNWRAP
      ===================================================== */

      const media = unwrapViewOnce(quoted);

      if (!media) {
        throw new Error(
          "Unable to unwrap quoted message",
        );
      }

      /* =====================================================
         IMAGE
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

        /* VCard */

        await sock.sendMessage(
          chatId,
          {
            contacts: {
              displayName:
                PUTTUS_VCARD.displayName,

              contacts: [
                PUTTUS_VCARD,
              ],
            },
          },
          {
            quoted: message,
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
         VIDEO
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

        /* VCard */

        await sock.sendMessage(
          chatId,
          {
            contacts: {
              displayName:
                PUTTUS_VCARD.displayName,

              contacts: [
                PUTTUS_VCARD,
              ],
            },
          },
          {
            quoted: message,
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
         NOT SUPPORTED
      ===================================================== */

      return await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *Not a View-Once photo/video!*\n\n" +
            "Reply directly to the original\n" +
            "view-once photo or video and use *.vv*.",
        },
        {
          quoted: message,
        },
      );
    } catch (error) {
      console.error(
        "[PUTTUS VV ERROR]",
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
          "[PUTTUS VV SEND ERROR]",
          sendError,
        );
      }
    }
  },
};
