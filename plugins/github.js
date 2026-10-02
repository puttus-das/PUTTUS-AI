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
   SCRIPT / REPOSITORY
========================================================= */

module.exports = {
  command: "script",

  aliases: [
    "repo",
    "sc",
  ],

  category: "info",

  description:
    "Get GitHub repository information",

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
        {
          headers: {
            "User-Agent": "PUTTUS-BOT",
            Accept:
              "application/vnd.github+json",
          },
        },
      );

      if (!res.ok) {
        throw new Error(
          `GitHub API Error: ${res.status}`,
        );
      }

      const json =
        await res.json();

      /* =====================================================
         REPOSITORY TEXT
      ===================================================== */

      let txt =
        `╭━━〔 *𝐆ɪᴛʜᴜʙ 𝐑ᴇᴘᴏsɪᴛᴏʀʏ* 〕━━╮\n\n`;

      txt +=
        `┃ ❯ *𝐍ᴀᴍᴇ:* ${json.name}\n`;

      txt +=
        `┃ ❯ *𝐖ᴀᴛᴄʜᴇʀs:* ${json.watchers_count}\n`;

      txt +=
        `┃ ❯ *𝐒ɪᴢᴇ:* ${(json.size / 1024).toFixed(2)} MB\n`;

      txt +=
        `┃ ❯ *𝐔ᴘᴅᴀᴛᴇᴅ:* ${moment(
          json.updated_at,
        ).format(
          "DD/MM/YY - HH:mm:ss",
        )}\n`;

      txt +=
        `┃ ❯ *𝐅ᴏʀᴋs:* ${json.forks_count}\n`;

      txt +=
        `┃ ❯ *𝐒ᴛᴀʀs:* ${json.stargazers_count}\n\n`;

      txt +=
        `┃ 🌐 *𝐆ɪᴛʜᴜʙ:* \n`;

      txt +=
        `┃ ${json.html_url}\n\n`;

      txt +=
        `╰━━━━━━━━━━━━━━━━╯\n\n`;

      txt +=
        `*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*`;

      /* =====================================================
         REPOSITORY IMAGE
      ===================================================== */

      const imgPath =
        path.join(
          __dirname,
          "../assets/puttus_bot_image_png.png",
        );

      /* =====================================================
         SEND IMAGE + VCARD TOGETHER
      ===================================================== */

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
        "Script Error:",
        error,
      );

      /* =====================================================
         ERROR MESSAGE
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          text:
            "*❌ 𝐏ᴜᴛᴛᴜs 𝐑ᴇᴘᴏ 𝐈ɴғᴏ 𝐅ᴇᴛᴄʜ 𝐅ᴀɪʟᴇᴅ*\n\n" +
            "*𝐏ʟᴇᴀsᴇ 𝐓ʀʏ 𝐀ɢᴀɪɴ 𝐋ᴀᴛᴇʀ.*\n\n" +
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
