const {
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");

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

  if (!msg) {
    return null;
  }

  /* Normal text reply */
  if (
    msg.extendedTextMessage
      ?.contextInfo
      ?.quotedMessage
  ) {
    return (
      msg.extendedTextMessage
        .contextInfo.quotedMessage
    );
  }

  /* Image reply */
  if (
    msg.imageMessage
      ?.contextInfo
      ?.quotedMessage
  ) {
    return (
      msg.imageMessage
        .contextInfo.quotedMessage
    );
  }

  /* Buttons */
  if (
    msg.buttonsResponseMessage
      ?.contextInfo
      ?.quotedMessage
  ) {
    return (
      msg.buttonsResponseMessage
        .contextInfo.quotedMessage
    );
  }

  /* Template buttons */
  if (
    msg.templateButtonReplyMessage
      ?.contextInfo
      ?.quotedMessage
  ) {
    return (
      msg.templateButtonReplyMessage
        .contextInfo.quotedMessage
    );
  }

  /* List */
  if (
    msg.listResponseMessage
      ?.contextInfo
      ?.quotedMessage
  ) {
    return (
      msg.listResponseMessage
        .contextInfo.quotedMessage
    );
  }

  return null;
}

/* =========================================================
   DOWNLOAD IMAGE
========================================================= */

async function downloadImage(
  imageMessage
) {
  const stream =
    await downloadContentFromMessage(
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
   COMMAND
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
    "Set bot profile picture from replied image.",

  usage:
    ".setpp (reply to image)",

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
         CHECK REPLY
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
         CHECK IMAGE
      ===================================================== */

      const imageMessage =
        quotedMessage.imageMessage;

      if (!imageMessage) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "*❌ The replied message is not an image!*",
          },
          {
            quoted:
              getPuttusVCardQuote(),
          }
        );
      }

      /* =====================================================
         IMPORTANT:
         SEND RESPONSE BEFORE PROCESSING
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          text:
            "⏳ *Processing profile picture...*\n\n" +
            "*Please wait.*",
        },
        {
          quoted:
            getPuttusVCardQuote(),
        }
      );

      console.log(
        "[SET-PP] Image reply detected."
      );

      /* =====================================================
         DOWNLOAD ORIGINAL IMAGE
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
          "Downloaded image is empty."
        );
      }

      console.log(
        "[SET-PP] Image downloaded:",
        image.length,
        "bytes"
      );

      /* =====================================================
         CHECK SOCKET
      ===================================================== */

      if (
        !sock ||
        typeof sock.updateProfilePicture !==
          "function"
      ) {
        throw new Error(
          "updateProfilePicture() is not available."
        );
      }

      if (!sock.user?.id) {
        throw new Error(
          "WhatsApp user ID is not available."
        );
      }

      console.log(
        "[SET-PP] Updating profile picture..."
      );

      /* =====================================================
         DIRECT UPDATE
         SAME IDEA AS FULLPP
      ===================================================== */

      await sock.updateProfilePicture(
        sock.user.id,
        image
      );

      console.log(
        "[SET-PP] Profile picture updated."
      );

      /* =====================================================
         SUCCESS
      ===================================================== */

      return await sock.sendMessage(
        chatId,
        {
          text:
            "✅ *⎯꯭⃜ ꯭𔘓⃪꯭[]꯭🩸꯭𝐒꯭ᴜ꯭ᴄ꯭ᴄ꯭ᴇ꯭ꜱ꯭ꜱ꯭ꜰ꯭ᴜ꯭ʟ꯭ʟ꯭ʏ꯭ 𝐔꯭ᴘ꯭ᴅ꯭ᴀ꯭ᴛ꯭ᴇ꯭ᴅ꯭ 𝐁꯭ᴏ꯭ᴛ꯭ 𝐏꯭ɪ꯭ᴄ꯭ ⚡ 𝐀꯭ᴘ꯭ᴜ꯭ʀ꯭ʙ꯭ᴏ꯭/𝐏꯭ᴜ꯭ᴛ꯭ᴛ꯭ᴜ꯭𝐒꯭*\n\n" +
            "╭─〔 *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ* 〕\n" +
            "│ ᯓ *PHOTO UPDATED*\n" +
            "│ ᯓ *ORIGINAL IMAGE USED*\n" +
            "╰──────────────\n\n" +
            "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
        },
        {
          quoted:
            getPuttusVCardQuote(),
        }
      );

    } catch (error) {
      /* =====================================================
         ERROR
      ===================================================== */

      console.error(
        "[SET-PP ERROR]:",
        error
      );

      return await sock.sendMessage(
        chatId,
        {
          text:
            "*❌ SETPP ERROR*\n\n" +
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
