const {
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");

/* =========================================================
   PUTTUS VCard
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
   GET VIEW-ONCE MESSAGE
========================================================= */

function getViewOnceMessage(message) {
  if (!message?.message) return null;

  const msg = message.message;

  if (msg.viewOnceMessage?.message) {
    return msg.viewOnceMessage.message;
  }

  if (msg.viewOnceMessageV2?.message) {
    return msg.viewOnceMessageV2.message;
  }

  if (msg.viewOnceMessageV2Extension?.message) {
    return msg.viewOnceMessageV2Extension.message;
  }

  return null;
}

/* =========================================================
   DOWNLOAD MEDIA
========================================================= */

async function downloadMedia(media, type) {
  const stream = await downloadContentFromMessage(media, type);

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

  description: "Recover and resend a view-once photo or video",

  usage: ".vv (reply to a view-once photo/video)",

  async handler(sock, message, args = [], context = {}) {
    const chatId =
      context?.chatId ||
      message?.key?.remoteJid;

    try {
      /* =====================================================
         CHECK REPLIED MESSAGE
      ===================================================== */

      const quoted =
        message?.message?.extendedTextMessage?.contextInfo
          ?.quotedMessage;

      if (!quoted) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "👁️ *View Once*\n\n" +
              "❯ Reply to a *view-once photo/video*\n" +
              "❯ Then use *.vv*",
          },
          {
            quoted: message,
          },
        );
      }

      /* =====================================================
         FIND VIEW ONCE
      ===================================================== */

      const viewOnce = getViewOnceMessage({
        message: quoted,
      });

      if (!viewOnce) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *Not a View-Once message!*\n\n" +
              "Reply directly to a view-once photo or video.",
          },
          {
            quoted: message,
          },
        );
      }

      /* =====================================================
         VIEW-ONCE IMAGE
      ===================================================== */

      if (viewOnce.imageMessage) {
        const media = viewOnce.imageMessage;

        await sock.sendMessage(chatId, {
          react: {
            text: "👁️",
            key: message.key,
          },
        });

        const buffer = await downloadMedia(
          media,
          "image",
        );

        await sock.sendMessage(
          chatId,
          {
            image: buffer,
            caption:
              media.caption ||
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
              displayName: PUTTUS_VCARD.displayName,
              contacts: [PUTTUS_VCARD],
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
         VIEW-ONCE VIDEO
      ===================================================== */

      if (viewOnce.videoMessage) {
        const media = viewOnce.videoMessage;

        await sock.sendMessage(chatId, {
          react: {
            text: "👁️",
            key: message.key,
          },
        });

        const buffer = await downloadMedia(
          media,
          "video",
        );

        await sock.sendMessage(
          chatId,
          {
            video: buffer,
            mimetype:
              media.mimetype || "video/mp4",
            caption:
              media.caption ||
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
              displayName: PUTTUS_VCARD.displayName,
              contacts: [PUTTUS_VCARD],
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
         OTHER MEDIA
      ===================================================== */

      return await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *Unsupported View-Once Media!*\n\n" +
            "Only view-once *photos and videos* are supported.",
        },
        {
          quoted: message,
        },
      );
    } catch (error) {
      console.error(
        "[PUTTUS VIEWONCE ERROR]",
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
          "[PUTTUS VIEWONCE SEND ERROR]",
          sendError,
        );
      }
    }
  },
};
