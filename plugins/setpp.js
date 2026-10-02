const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const isOwnerOrSudo = require("../lib/isOwner");

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
   GET QUOTED MESSAGE
========================================================= */

function getQuotedMessage(message) {
  const msg = message?.message;

  if (!msg) return null;

  const types = [
    "extendedTextMessage",
    "imageMessage",
    "buttonsResponseMessage",
    "templateButtonReplyMessage",
    "listResponseMessage",
  ];

  for (const type of types) {
    const quoted =
      msg?.[type]?.contextInfo?.quotedMessage;

    if (quoted) {
      return quoted;
    }
  }

  return null;
}

/* =========================================================
   DOWNLOAD ORIGINAL IMAGE
   NO RESIZE
   NO CROP
========================================================= */

async function downloadImage(imageMessage) {
  const stream = await downloadContentFromMessage(
    imageMessage,
    "image"
  );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/* =========================================================
   SET PROFILE PICTURE
========================================================= */

module.exports = {
  command: "setpp",

  aliases: [
    "setppic",
    "setdp",
    "fullpp",
  ],

  category: "owner",

  description:
    "Set bot profile picture from the replied image.",

  usage:
    ".setpp (reply to an image)",

  async handler(
    sock,
    message,
    args = [],
    context = {}
  ) {
    const chatId =
      context.chatId ||
      message?.key?.remoteJid;

    try {
      /* =====================================================
         OWNER CHECK
      ===================================================== */

      const senderId =
        message?.key?.participant ||
        message?.key?.remoteJid;

      const owner =
        await isOwnerOrSudo(
          senderId,
          sock,
          chatId
        );

      if (
        !message?.key?.fromMe &&
        !owner
      ) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "*This command is only available for the owner!*",
          },
          {
            quoted:
              getPuttusVCardQuote(),
          }
        );
      }

      /* =====================================================
         GET REPLIED MESSAGE
      ===================================================== */

      const quotedMessage =
        getQuotedMessage(message);

      if (!quotedMessage) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "*⚠️ Reply to an image with .setpp*",
          },
          {
            quoted:
              getPuttusVCardQuote(),
          }
        );
      }

      /* =====================================================
         IMAGE ONLY
      ===================================================== */

      const imageMessage =
        quotedMessage.imageMessage;

      if (!imageMessage) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "*❌ The replied message must contain an image!*",
          },
          {
            quoted:
              getPuttusVCardQuote(),
          }
        );
      }

      /* =====================================================
         DOWNLOAD ORIGINAL
         NO JIMP
         NO SHARP
         NO RESIZE
         NO CROP
      ===================================================== */

      const image =
        await downloadImage(
          imageMessage
        );

      if (
        !Buffer.isBuffer(image) ||
        image.length === 0
      ) {
        throw new Error(
          "Image download failed."
        );
      }

      console.log(
        "[SET-PP] Original image:",
        image.length,
        "bytes"
      );

      /* =====================================================
         WHATSAPP CONNECTION CHECK
      ===================================================== */

      if (!sock?.user?.id) {
        throw new Error(
          "WhatsApp connection is not ready."
        );
      }

      /* =====================================================
         DIRECT PROFILE PICTURE UPDATE
         SAME IDEA AS FULLPP
      ===================================================== */

      await sock.updateProfilePicture(
        sock.user.id,
        image
      );

      /* =====================================================
         SUCCESS
      ===================================================== */

      return await sock.sendMessage(
        chatId,
        {
          text:
            "✅ *⎯꯭⃜ ꯭𔘓⃪꯭[]꯭🩸꯭𝐒꯭ᴜ꯭ᴄ꯭ᴄ꯭ᴇ꯭ꜱ꯭ꜱ꯭ꜰ꯭ᴜ꯭ʟ꯭ʟ꯭ʏ꯭ 𝐔꯭ᴘ꯭ᴅ꯭ᴀ꯭ᴛ꯭ᴇ꯭ᴅ꯭ 𝐁꯭ᴏ꯭ᴛ꯭ 𝐏꯭ɪ꯭ᴄ꯭ ⚡ 𝐀꯭ᴘ꯭ᴜ꯭ʀ꯭ʙ꯭ᴏ꯭/𝐏꯭ᴜ꯭ᴛ꯭ᴛ꯭ᴜ꯭𝐒꯭*\n\n" +
            "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
        },
        {
          quoted:
            getPuttusVCardQuote(),
        }
      );

    } catch (error) {
      console.error(
        "[SET-PP ERROR]",
        error
      );

      return await sock.sendMessage(
        chatId,
        {
          text:
            "*❌ Failed to update profile picture.*\n\n" +
            `_${error?.message || "Unknown error"}_`,
        },
        {
          quoted:
            getPuttusVCardQuote(),
        }
      );
    }
  },
};
