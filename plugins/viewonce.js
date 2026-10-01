const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {
  command: "viewonce",
  aliases: ["viewmedia", "vv"],
  category: "general",
  description: "Re-send a view-once image or video.",
  usage: ".viewonce (reply to a view-once media)",

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const quoted =
        message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      const quotedImage = quoted?.imageMessage;
      const quotedVideo = quoted?.videoMessage;

      let sentMessage;

      /* =========================================================
         VIEW ONCE IMAGE
      ========================================================= */

      if (quotedImage && quotedImage.viewOnce) {
        const stream = await downloadContentFromMessage(
          quotedImage,
          "image"
        );

        let buffer = Buffer.from([]);

        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }

        sentMessage = await sock.sendMessage(
          chatId,
          {
            image: buffer,
            fileName: "media.jpg",
            caption: quotedImage.caption || "",
          },
          { quoted: message }
        );
      }

      /* =========================================================
         VIEW ONCE VIDEO
      ========================================================= */

      else if (quotedVideo && quotedVideo.viewOnce) {
        const stream = await downloadContentFromMessage(
          quotedVideo,
          "video"
        );

        let buffer = Buffer.from([]);

        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }

        sentMessage = await sock.sendMessage(
          chatId,
          {
            video: buffer,
            fileName: "media.mp4",
            caption: quotedVideo.caption || "",
          },
          { quoted: message }
        );
      }

      /* =========================================================
         NO VIEW ONCE MEDIA
      ========================================================= */

      else {
        await sock.sendMessage(
          chatId,
          {
            text: "*Please reply to a view-once image or video.*",
          },
          { quoted: message }
        );

        return;
      }

      /* =========================================================
         PUTTUS VCARD
      ========================================================= */

      const botJid = "919641092392@s.whatsapp.net";

      const vcard =
        "BEGIN:VCARD\n" +
        "VERSION:3.0\n" +
        "N:PUTTUS;BOT;;;\n" +
        "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
        "ORG:PUTTUS BOT\n" +
        "TEL;TYPE=CELL;TYPE=VOICE;waid=919641092392:+919641092392\n" +
        "END:VCARD";

      /* =========================================================
         STATUS-STYLE CONTACT PREVIEW
      ========================================================= */

      const statusQuote = {
        key: {
          remoteJid: "status@broadcast",
          fromMe: false,
          id: "PUTTUS-" + Date.now(),
          participant: botJid,
        },
        message: {
          contactMessage: {
            displayName: "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
            vcard: vcard,
          },
        },
      };

      /* =========================================================
         SEND VCARD
      ========================================================= */

      await sock.sendMessage(
        chatId,
        {
          text: "🌸 *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
        },
        {
          quoted: statusQuote,
        }
      );

    } catch (error) {
      console.error("Error in viewonceCommand:", error);

      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *Failed to retrieve the view-once media.*\n\n" +
            "Please try again later.",
        },
        { quoted: message }
      );
    }
  },
};
