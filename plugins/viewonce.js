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
        vcard,
      },
    },
  };
}

/* =========================================================
   DOWNLOAD MEDIA
========================================================= */

async function downloadMedia(media, type) {
  const stream = await downloadContentFromMessage(
    media,
    type
  );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/* =========================================================
   VIEW ONCE
========================================================= */

module.exports = {
  command: "viewonce",

  aliases: [
    "vv",
    "viewmedia",
  ],

  category: "general",

  description:
    "Recover view-once image or video.",

  usage:
    ".vv",

  async handler(
    sock,
    message,
    args = [],
    context = {}
  ) {
    const chatId =
      context?.chatId ||
      message?.key?.remoteJid;

    try {
      if (!chatId) {
        return;
      }

      /* =====================================================
         GET REPLIED MESSAGE
      ===================================================== */

      const quoted =
        message?.message
          ?.extendedTextMessage
          ?.contextInfo
          ?.quotedMessage;

      if (!quoted) {
        await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *ᴘʟᴇᴀsᴇ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴠɪᴇᴡ ᴏɴᴄᴇ ᴘʜᴏᴛᴏ ᴏʀ ᴠɪᴅᴇᴏ.*",
          },
          {
            quoted: message,
          }
        );

        return;
      }

      /* =====================================================
         IMAGE
      ===================================================== */

      let image = quoted.imageMessage;

      if (image?.viewOnceMessage) {
        image =
          image.viewOnceMessage.message
            ?.imageMessage;
      }

      if (image?.viewOnceMessageV2) {
        image =
          image.viewOnceMessageV2.message
            ?.imageMessage;
      }

      if (image?.viewOnceMessageV2Extension) {
        image =
          image.viewOnceMessageV2Extension.message
            ?.imageMessage;
      }

      /* =====================================================
         VIDEO
      ===================================================== */

      let video = quoted.videoMessage;

      if (video?.viewOnceMessage) {
        video =
          video.viewOnceMessage.message
            ?.videoMessage;
      }

      if (video?.viewOnceMessageV2) {
        video =
          video.viewOnceMessageV2.message
            ?.videoMessage;
      }

      if (video?.viewOnceMessageV2Extension) {
        video =
          video.viewOnceMessageV2Extension.message
            ?.videoMessage;
      }

      /* =====================================================
         IMAGE FOUND
      ===================================================== */

      if (image) {
        const buffer =
          await downloadMedia(
            image,
            "image"
          );

        await sock.sendMessage(
          chatId,
          {
            image: buffer,

            mimetype:
              image.mimetype ||
              "image/jpeg",

            caption:
              image.caption
                ? image.caption +
                  "\n\n" +
                  "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*"
                : "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
          },
          {
            quoted:
              getPuttusVCardQuote(),
          }
        );

        return;
      }

      /* =====================================================
         VIDEO FOUND
      ===================================================== */

      if (video) {
        const buffer =
          await downloadMedia(
            video,
            "video"
          );

        await sock.sendMessage(
          chatId,
          {
            video: buffer,

            mimetype:
              video.mimetype ||
              "video/mp4",

            caption:
              video.caption
                ? video.caption +
                  "\n\n" +
                  "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*"
                : "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
          },
          {
            quoted:
              getPuttusVCardQuote(),
          }
        );

        return;
      }

      /* =====================================================
         NOT VIEW ONCE MEDIA
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *ᴘʟᴇᴀsᴇ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴠɪᴇᴡ ᴏɴᴄᴇ ᴘʜᴏᴛᴏ ᴏʀ ᴠɪᴅᴇᴏ.*",
        },
        {
          quoted: message,
        }
      );

    } catch (error) {
      console.error(
        "VV ERROR:",
        error
      );

      try {
        await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *ᴠɪᴇᴡ ᴏɴᴄᴇ ᴍᴇᴅɪᴀ ᴄᴏᴜʟᴅ ɴᴏᴛ ʙᴇ ʀᴇᴄᴏᴠᴇʀᴇᴅ.*\n\n" +
              "*ᴘʟᴇᴀsᴇ ʀᴇᴘʟʏ ᴛᴏ ᴛʜᴇ ᴠɪᴇᴡ ᴏɴᴄᴇ ᴘʜᴏᴛᴏ ᴏʀ ᴠɪᴅᴇᴏ ᴀɴᴅ ᴛʀʏ ᴀɢᴀɪɴ.*",
          },
          {
            quoted: message,
          }
        );
      } catch (sendError) {
        console.error(
          "VV SEND ERROR:",
          sendError
        );
      }
    }
  },
};
