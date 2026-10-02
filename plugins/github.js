const moment = require("moment-timezone");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

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
   SCRIPT / REPO
========================================================= */

module.exports = {
  command: "script",

  aliases: [
    "repo",
    "sc",
  ],

  category: "info",

  description:
    "Get PUTTUS-AI GitHub repository information",

  usage:
    ".script",

  async handler(
    sock,
    message,
    args,
    context = {},
  ) {
    const chatId =
      context.chatId ||
      message.key.remoteJid;

    try {
      /* =====================================================
         GITHUB API
      ===================================================== */

      const res = await fetch(
        "https://api.github.com/repos/puttus-das/PUTTUS-AI",
      );

      if (!res.ok) {
        throw new Error(
          "Error fetching repository data",
        );
      }

      const json =
        await res.json();

      /* =====================================================
         REPO TEXT
      ===================================================== */

      let txt =
        `𝆹꯭𝅥𝐏꯭ᴜ꯭ᴛ꯭ᴛ꯭ᴜ꯭s꯭ 𝐑꯭ᴇ꯭ᴘ꯭ᴏ꯭𝆺𝅥𝆺꯭𝅥\n\n`;

      txt +=
        `ᐟᴘᴜᴛᴛᴜꜱ^᪲᪲᪲ *𝐍ᴀᴍᴇ:* ${json.name}\n`;

      txt +=
        `ᐟᴘᴜᴛᴛᴜꜱ^᪲᪲᪲ *𝐖ᴀᴛᴄʜᴇʀs:* ${json.watchers_count}\n`;

      txt +=
        `ᐟᴘᴜᴛᴛᴜꜱ^᪲᪲᪲ *𝐒ɪᴢᴇ:* ${(json.size / 1024).toFixed(2)} MB\n`;

      txt +=
        `ᐟᴘᴜᴛᴛᴜꜱ^᪲᪲᪲ *𝐔ᴘᴅᴀᴛᴇᴅ:* ${moment(
          json.updated_at,
        ).format(
          "DD/MM/YY - HH:mm:ss",
        )}\n`;

      txt +=
        `ᐟᴘᴜᴛᴛᴜꜱ^᪲᪲᪲ *𝐅ᴏʀᴋs:* ${json.forks_count}\n`;

      txt +=
        `ᐟᴘᴜᴛᴛᴜꜱ^᪲᪲᪲ *𝐒ᴛᴀʀs:* ${json.stargazers_count}\n\n`;

      txt +=
        `𓆩⚡𓆪 *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*\n\n`;

      txt +=
        `*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*`;

      /* =====================================================
         IMAGE
         VCard is quoted directly with the same message.
         No separate VCard message.
      ===================================================== */

      const imgPath =
        path.join(
          __dirname,
          "../assets/puttus_bot_image_png.png",
        );

      if (
        fs.existsSync(imgPath)
      ) {
        const imgBuffer =
          fs.readFileSync(
            imgPath,
          );

        await sock.sendMessage(
          chatId,
          {
            image: imgBuffer,
            caption: txt,
          },
          {
            quoted:
              getPuttusVCardQuote(),
          },
        );

      } else {
        await sock.sendMessage(
          chatId,
          {
            text: txt,
          },
          {
            quoted:
              getPuttusVCardQuote(),
          },
        );
      }

    } catch (error) {
      console.error(
        "Error in github command:",
        error,
      );

      /* =====================================================
         ERROR
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *𝐏ᴜᴛᴛᴜs 𝐑ᴇᴘᴏ 𝐈ɴғᴏ 𝐅ᴇᴛᴄʜ 𝐅ᴀɪʟᴇᴅ*\n\n" +
            "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
        },
        {
          quoted:
            getPuttusVCardQuote(),
        },
      );
    }
  },
};
