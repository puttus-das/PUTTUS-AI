const {
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");

const isOwnerOrSudo = require("../lib/isOwner");

/* =========================================================
   PUTTUS-BOT VCARD
   VCard will be quoted with the response.
   No separate VCard message.
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
   DOWNLOAD IMAGE
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
    "Set the bot profile picture.",

  usage:
    ".setpp (reply to an image)",

  async handler(
    sock,
    message,
    args = [],
    context = {},
  ) {
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

      const isOwner =
        await isOwnerOrSudo(
          senderId,
          sock,
          chatId,
        );

      if (!message.key.fromMe && !isOwner) {
        await sock.sendMessage(
          chatId,
          {
            text:
              "*This command is only available for the owner!*",
          },
          {
            quoted: message,
          },
        );

        return;
      }

      /* =====================================================
         GET REPLIED MESSAGE
      ===================================================== */

      const quotedMessage =
        message.message
          ?.extendedTextMessage
          ?.contextInfo
          ?.quotedMessage;

      if (!quotedMessage) {
        await sock.sendMessage(
          chatId,
          {
            text:
              "*⚠️ Reply to an image with .setpp*",
          },
          {
            quoted: message,
          },
        );

        return;
      }

      /* =====================================================
         IMAGE ONLY
      ===================================================== */

      const imageMessage =
        quotedMessage.imageMessage;

      if (!imageMessage) {
        await sock.sendMessage(
          chatId,
          {
            text:
              "*❌ The replied message must contain an image!*",
          },
          {
            quoted: message,
          },
        );

        return;
      }

      /* =====================================================
         DOWNLOAD IMAGE
      ===================================================== */

      const image =
        await downloadImage(imageMessage);

      if (!image || !image.length) {
        throw new Error(
          "Image download failed",
        );
      }

      /* =====================================================
         UPDATE BOT PROFILE PICTURE
      ===================================================== */

      await sock.updateProfilePicture(
        sock.user.id,
        image,
      );

      /* =====================================================
         SUCCESS
         VCARD IS QUOTED HERE
         NO SEPARATE VCARD MESSAGE
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          text:
            "✅ *⎯꯭⃜ ꯭𔘓⃪꯭[]꯭🩸꯭𝐒꯭ᴜ꯭ᴄ꯭ᴄ꯭ᴇ꯭ꜱ꯭ꜱ꯭ꜰ꯭ᴜ꯭ʟ꯭ʟ꯭ʏ꯭ 𝐔꯭ᴘ꯭ᴅ꯭ᴀ꯭ᴛ꯭ᴇ꯭ᴅ꯭ 𝐁꯭ᴏ꯭ᴛ꯭ 𝐏꯭ɪ꯭ᴄ꯭ ⚡ 𝐀꯭ᴘ꯭ᴜ꯭ʀ꯭ʙ꯭ᴏ꯭/𝐏꯭ᴜ꯭ᴛ꯭ᴛ꯭ᴜ꯭𝐒꯭ ⟶᯦꯭*\n\n" +
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

      await sock.sendMessage(
        chatId,
        {
          text:
            "*❌ Failed to update profile picture.*\n\n" +
            `_${error?.message || "Unknown error"}_`,
        },
        {
          quoted:
            getPuttusVCardQuote(),
        },
      );
    }
  },
};
