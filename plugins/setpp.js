const {
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");

const isOwnerOrSudo = require("../lib/isOwner");

/* =========================================================
   PUTTUS-BOT VCARD
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
   GET REPLIED MESSAGE
========================================================= */

function getQuotedMessage(message) {
  return (
    message?.message
      ?.extendedTextMessage
      ?.contextInfo
      ?.quotedMessage ||
    message?.message
      ?.imageMessage
      ?.contextInfo
      ?.quotedMessage ||
    null
  );
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
   SETPP COMMAND
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

  async handler(
    sock,
    message,
    args = [],
    context = {},
  ) {
    const chatId =
      context?.chatId ||
      message?.key?.remoteJid;

    if (!chatId) {
      return;
    }

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
          chatId,
        );

      if (
        !message?.key?.fromMe &&
        !owner
      ) {
        await sock.sendMessage(
          chatId,
          {
            text:
              "*❌ Owner only command!*",
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

      const quoted =
        getQuotedMessage(message);

      if (!quoted) {
        await sock.sendMessage(
          chatId,
          {
            text:
              "*⚠️ Reply to a photo with .setpp*",
          },
          {
            quoted:
              getPuttusVCardQuote(),
          },
        );

        return;
      }

      /* =====================================================
         PHOTO ONLY
      ===================================================== */

      const imageMessage =
        quoted?.imageMessage;

      if (!imageMessage) {
        await sock.sendMessage(
          chatId,
          {
            text:
              "*❌ Only photos are supported.*",
          },
          {
            quoted:
              getPuttusVCardQuote(),
          },
        );

        return;
      }

      /* =====================================================
         DOWNLOAD PHOTO
      ===================================================== */

      const image =
        await downloadImage(
          imageMessage,
        );

      if (
        !Buffer.isBuffer(image) ||
        image.length === 0
      ) {
        throw new Error(
          "Photo download failed.",
        );
      }

      /* =====================================================
         CHECK CONNECTION
      ===================================================== */

      if (
        !sock.user ||
        !sock.user.id
      ) {
        throw new Error(
          "WhatsApp is not connected.",
        );
      }

      /* =====================================================
         UPDATE BOT PROFILE PICTURE

         Baileys handles the required
         profile-picture processing here.
      ===================================================== */

      await sock.updateProfilePicture(
        sock.user.id,
        image,
      );

      /* =====================================================
         SUCCESS RESPONSE + VCARD
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
        "[SETPP ERROR]",
        error,
      );

      /* =====================================================
         SAFE ERROR RESPONSE
      ===================================================== */

      let text =
        "*❌ Failed to update bot profile picture.*";

      const errorText =
        String(
          error?.message || "",
        );

      if (
        errorText.includes(
          "No image processing library",
        )
      ) {
        text +=
          "\n\n*Image processor is unavailable on this device.*";
      } else if (
        errorText.includes(
          "Connection Closed",
        )
      ) {
        text +=
          "\n\n*WhatsApp connection was closed. Please try again after the bot reconnects.*";
      } else {
        text +=
          "\n\n_" +
          errorText +
          "_";
      }

      try {
        await sock.sendMessage(
          chatId,
          {
            text,
          },
          {
            quoted:
              getPuttusVCardQuote(),
          },
        );
      } catch (sendError) {
        console.error(
          "[SETPP SEND ERROR]",
          sendError,
        );
      }
    }
  },
};
