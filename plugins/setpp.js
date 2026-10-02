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
   DOWNLOAD PHOTO
========================================================= */

async function downloadImage(imageMessage) {
  const stream = await downloadContentFromMessage(
    imageMessage,
    "image",
  );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/* =========================================================
   SETPP
========================================================= */

module.exports = {
  command: "setpp",

  aliases: [
    "setppic",
    "setdp",
  ],

  category: "owner",

  description:
    "Set bot profile picture from a replied photo.",

  usage:
    ".setpp",

  async handler(sock, message, args = [], context = {}) {
    const chatId =
      context.chatId ||
      message.key.remoteJid;

    try {
      /* =====================================================
         OWNER CHECK
      ===================================================== */

      const senderId =
        message.key.participant ||
        message.key.remoteJid;

      const owner =
        await isOwnerOrSudo(
          senderId,
          sock,
          chatId,
        );

      if (!message.key.fromMe && !owner) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "*❌ Owner only command!*",
          },
          {
            quoted: message,
          },
        );
      }

      /* =====================================================
         GET REPLIED MESSAGE
      ===================================================== */

      const contextInfo =
        message.message
          ?.extendedTextMessage
          ?.contextInfo;

      const quotedMessage =
        contextInfo?.quotedMessage;

      if (!quotedMessage) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "*⚠️ Reply to a photo with .setpp*",
          },
          {
            quoted: message,
          },
        );
      }

      /* =====================================================
         PHOTO ONLY
         VIDEO NOT SUPPORTED
      ===================================================== */

      const imageMessage =
        quotedMessage.imageMessage;

      if (!imageMessage) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "*❌ Only photos are supported!*",
          },
          {
            quoted: message,
          },
        );
      }

      /* =====================================================
         DOWNLOAD PHOTO
      ===================================================== */

      const image =
        await downloadImage(imageMessage);

      if (
        !Buffer.isBuffer(image) ||
        image.length === 0
      ) {
        throw new Error(
          "Unable to download the photo.",
        );
      }

      /* =====================================================
         SET BOT DP

         Baileys automatically handles the
         profile-picture resize/crop.
      ===================================================== */

      await sock.updateProfilePicture(
        sock.user.id,
        image,
      );

      /* =====================================================
         SUCCESS + VCARD
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          text:
            "✅ *Bot profile picture updated successfully!*\n\n" +
            "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
        },
        {
          quoted:
            getPuttusVCardQuote(),
        },
      );

    } catch (error) {
      console.error(
        "SETPP ERROR:",
        error,
      );

      /* =====================================================
         ERROR + VCARD
      ===================================================== */

      try {
        await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *Failed to update bot profile picture.*\n\n" +
              `_${error?.message || "Unknown error"}_`,
          },
          {
            quoted:
              getPuttusVCardQuote(),
          },
        );
      } catch (sendError) {
        console.error(
          "SETPP RESPONSE ERROR:",
          sendError,
        );
      }
    }
  },
};
