const {
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");

/* =========================================================
   PUTTUS VCARD
   EXACT SAME AS ANTILINK
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
   VIEW ONCE
========================================================= */

module.exports = {
  command: "viewonce",

  aliases: [
    "viewmedia",
    "vv",
  ],

  category: "general",

  description:
    "Re-send a view-once image or video.",

  usage:
    ".viewonce (reply to a view-once media)",

  async handler(
    sock,
    message,
    args,
    context = {},
  ) {
    const chatId =
      context.chatId ||
      message?.key?.remoteJid;

    try {
      /* =====================================================
         GET QUOTED MESSAGE
      ===================================================== */

      const quoted =
        message.message
          ?.extendedTextMessage
          ?.contextInfo
          ?.quotedMessage;

      const quotedImage =
        quoted?.imageMessage;

      const quotedVideo =
        quoted?.videoMessage;

      /* =====================================================
         IMAGE
      ===================================================== */

      if (
        quotedImage &&
        quotedImage.viewOnce
      ) {
        const stream =
          await downloadContentFromMessage(
            quotedImage,
            "image",
          );

        let buffer = Buffer.from([]);

        for await (const chunk of stream) {
          buffer = Buffer.concat([
            buffer,
            chunk,
          ]);
        }

        /* ===================================================
           SEND RECOVERED PHOTO
           
           IMPORTANT:
           AntiLink VCard is used directly
           as the quoted message.
        =================================================== */

        await sock.sendMessage(
          chatId,
          {
            image: buffer,

            fileName: "media.jpg",

            caption:
              quotedImage.caption ||
              "👁️ *View Once Photo*\n\n" +
              "🤖 *𝙋𝙐𝙏𝙏𝙐𝙎-𝘼𝙄*",
          },
          {
            quoted:
              getPuttusVCardQuote(),
          },
        );

        return;
      }

      /* =====================================================
         VIDEO
      ===================================================== */

      if (
        quotedVideo &&
        quotedVideo.viewOnce
      ) {
        const stream =
          await downloadContentFromMessage(
            quotedVideo,
            "video",
          );

        let buffer = Buffer.from([]);

        for await (const chunk of stream) {
          buffer = Buffer.concat([
            buffer,
            chunk,
          ]);
        }

        /* ===================================================
           SEND RECOVERED VIDEO
           
           IMPORTANT:
           AntiLink VCard is used directly
           as the quoted message.
        =================================================== */

        await sock.sendMessage(
          chatId,
          {
            video: buffer,

            fileName: "media.mp4",

            mimetype:
              quotedVideo.mimetype ||
              "video/mp4",

            caption:
              quotedVideo.caption ||
              "👁️ *View Once Video*\n\n" +
              "🤖 *𝙋𝙐𝙏𝙏𝙐𝙎-𝘼𝙄*",
          },
          {
            quoted:
              getPuttusVCardQuote(),
          },
        );

        return;
      }

      /* =====================================================
         NOT VIEW ONCE
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *Please reply to a view-once image or video.*",
        },
        {
          quoted: message,
        },
      );

    } catch (error) {
      console.error(
        "Error in viewonceCommand:",
        error,
      );

      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *Failed to retrieve the view-once media.*\n\n" +
            "Please try again later.",
        },
        {
          quoted: message,
        },
      );
    }
  },
};
