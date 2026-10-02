const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const isOwnerOrSudo = require("../lib/isOwner");

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
        displayName: "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
        vcard,
      },
    },
  };
}

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

module.exports = {
  command: "fullpp",
  aliases: ["setpp", "setppic", "setdp"],
  category: "owner",
  description: "Set the bot profile picture.",
  usage: ".fullpp (reply to an image)",

  async handler(sock, message, args = [], context = {}) {
    const chatId =
      context.chatId ||
      message.key.remoteJid;

    try {
      const senderId =
        message.key.participant ||
        message.key.remoteJid;

      const owner = await isOwnerOrSudo(
        senderId,
        sock,
        chatId
      );

      if (!message.key.fromMe && !owner) {
        return await sock.sendMessage(
          chatId,
          {
            text: "*❌ Owner only command.*",
          },
          {
            quoted: getPuttusVCardQuote(),
          }
        );
      }

      const quotedMessage =
        message.message
          ?.extendedTextMessage
          ?.contextInfo
          ?.quotedMessage;

      if (!quotedMessage?.imageMessage) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "*❌ Reply to an image with .fullpp*",
          },
          {
            quoted: getPuttusVCardQuote(),
          }
        );
      }

      const image = await downloadImage(
        quotedMessage.imageMessage
      );

      if (!image?.length) {
        throw new Error("Image download failed");
      }

      await sock.updateProfilePicture(
        sock.user.id,
        image
      );

      return await sock.sendMessage(
        chatId,
        {
          text:
            "✅ *Bot profile picture updated successfully!*\n\n" +
            "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
        },
        {
          quoted: getPuttusVCardQuote(),
        }
      );

    } catch (error) {
      console.error("FULLPP ERROR:", error);

      return await sock.sendMessage(
        chatId,
        {
          text:
            "*❌ Failed to update profile picture.*\n\n" +
            `_${error?.message || "Unknown error"}_`,
        },
        {
          quoted: getPuttusVCardQuote(),
        }
      );
    }
  },
};
