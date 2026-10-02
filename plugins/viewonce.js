const {
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");

/* =========================================================
   PUTTUS VCARD
   SAME AS ANTILINK — DO NOT CHANGE
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
  if (!message?.message) {
    return null;
  }

  const msg = message.message;

  /* Normal text reply */
  if (msg.extendedTextMessage?.contextInfo?.quotedMessage) {
    return msg.extendedTextMessage.contextInfo.quotedMessage;
  }

  /* Image reply */
  if (msg.imageMessage?.contextInfo?.quotedMessage) {
    return msg.imageMessage.contextInfo.quotedMessage;
  }

  /* Video reply */
  if (msg.videoMessage?.contextInfo?.quotedMessage) {
    return msg.videoMessage.contextInfo.quotedMessage;
  }

  /* Document reply */
  if (msg.documentMessage?.contextInfo?.quotedMessage) {
    return msg.documentMessage.contextInfo.quotedMessage;
  }

  /* Buttons / interactive reply */
  if (msg.buttonsResponseMessage?.contextInfo?.quotedMessage) {
    return msg.buttonsResponseMessage.contextInfo.quotedMessage;
  }

  if (
    msg.templateButtonReplyMessage?.contextInfo
      ?.quotedMessage
  ) {
    return msg.templateButtonReplyMessage.contextInfo
      .quotedMessage;
  }

  return null;
}

/* =========================================================
   UNWRAP MESSAGE
========================================================= */

function unwrapMessage(message) {
  if (!message) {
    return null;
  }

  let current = message;

  for (let i = 0; i < 15; i++) {
    if (!current) {
      return null;
    }

    /* View Once V1 */
    if (current.viewOnceMessage?.message) {
      current = current.viewOnceMessage.message;
      continue;
    }

    /* View Once V2 */
    if (current.viewOnceMessageV2?.message) {
      current = current.viewOnceMessageV2.message;
      continue;
    }

    /* View Once V2 Extension */
    if (current.viewOnceMessageV2Extension?.message) {
      current =
        current.viewOnceMessageV2Extension.message;
      continue;
    }

    /* Ephemeral */
    if (current.ephemeralMessage?.message) {
      current = current.ephemeralMessage.message;
      continue;
    }

    /* Document with caption */
    if (current.documentWithCaptionMessage?.message) {
      current =
        current.documentWithCaptionMessage.message;
      continue;
    }

    /* Edited message wrapper */
    if (current.editedMessage?.message) {
      current = current.editedMessage.message;
      continue;
    }

    break;
  }

  return current;
}

/* =========================================================
   GET MEDIA
========================================================= */

function getMedia(message) {
  const unwrapped = unwrapMessage(message);

  if (!unwrapped) {
    return null;
  }

  if (unwrapped.imageMessage) {
    return {
      type: "image",
      data: unwrapped.imageMessage,
    };
  }

  if (unwrapped.videoMessage) {
    return {
      type: "video",
      data: unwrapped.videoMessage,
    };
  }

  return null;
}

/* =========================================================
   DOWNLOAD MEDIA
========================================================= */

async function downloadMedia(media, type) {
  if (!media) {
    throw new Error("Media not found");
  }

  const stream =
    await downloadContentFromMessage(
      media,
      type,
    );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    throw new Error("Downloaded media is empty");
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
         BASIC CHECK
      ===================================================== */

      if (!sock || !chatId) {
        return;
      }

      /* =====================================================
         GET QUOTED MESSAGE
      ===================================================== */

      const quoted =
        getQuotedMessage(message);

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
         FIND VIEW ONCE MEDIA
      ===================================================== */

      const media =
        getMedia(quoted);

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
         REACT
      ===================================================== */

      try {
        await sock.sendMessage(
          chatId,
          {
            react: {
              text: "👁️",
              key: message.key,
            },
          },
        );
      } catch (_) {}

      /* =====================================================
         DOWNLOAD PHOTO / VIDEO
      ===================================================== */

      const buffer =
        await downloadMedia(
          media.data,
          media.type,
        );

      if (!buffer || !buffer.length) {
        throw new Error(
          "Media buffer is empty",
        );
      }

      /* =====================================================
         IMPORTANT

         VCard is NOT sent separately.

         The recovered photo/video itself is sent
         QUOTED TO THE PUTTUS VCARD.

         Result:

         [ PUTTUS VCARD ]
                 ↓
         [ RECOVERED PHOTO/VIDEO ]
      ===================================================== */

      const vcardQuote =
        getPuttusVCardQuote();

      /* =====================================================
         SEND PHOTO
      ===================================================== */

      if (media.type === "image") {
        const image =
          media.data;

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
            quoted: vcardQuote,
          },
        );
      }

      /* =====================================================
         SEND VIDEO
      ===================================================== */

      else if (media.type === "video") {
        const video =
          media.data;

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
            quoted: vcardQuote,
          },
        );
      }

      /* =====================================================
         SUCCESS REACTION
      ===================================================== */

      try {
        await sock.sendMessage(
          chatId,
          {
            react: {
              text: "✅",
              key: message.key,
            },
          },
        );
      } catch (_) {}

      return;

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
              "The photo/video could not be recovered.",
          },
          {
            quoted: message,
          },
        );

        try {
          await sock.sendMessage(
            chatId,
            {
              react: {
                text: "❌",
                key: message.key,
              },
            },
          );
        } catch (_) {}

      } catch (sendError) {
        console.error(
          "PUTTUS VIEWONCE SEND ERROR:",
          sendError,
        );
      }
    }
  },
};
