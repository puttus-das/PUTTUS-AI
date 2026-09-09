const moment = require("moment-timezone");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

module.exports = {
  command: "script",
  aliases: ["repo", "sc"],
  category: "info",
  description: "Get PUTTUS-AI GitHub repository information",
  usage: ".script",

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      const res = await fetch(
        "https://api.github.com/repos/puttus-das/PUTTUS-AI"
      );

      if (!res.ok) {
        throw new Error("Error fetching repository data");
      }

      const json = await res.json();

      let txt = `𝆹꯭𝅥𝐁꯭ᴀ꯭ʟ꯭ 𝐏꯭ᴀ꯭ʙ꯭ɪ꯭ 𝐑꯭ᴇ꯭ᴘ꯭ᴏ꯭𝆺𝅥𝆺꯭𝅥\n\n`;

      txt += `ᐟᴘᴜᴛᴛᴜꜱ^᪲᪲᪲ 𝐍ᴀᴍᴇ : ${json.name}\n`;
      txt += `ᐟᴘᴜᴛᴛᴜꜱ^᪲᪲᪲ 𝐖ᴀᴛᴄʜᴇʀꜱ : ${json.watchers_count}\n`;
      txt += `ᐟᴘᴜᴛᴛᴜꜱ^᪲᪲᪲ 𝐒ɪᴢᴇ : ${(json.size / 1024).toFixed(2)} MB\n`;
      txt += `ᐟᴘᴜᴛᴛᴜꜱ^᪲᪲᪲ 𝐔ᴘᴅᴀᴛᴇᴅ : ${moment(json.updated_at).format(
        "DD/MM/YY - HH:mm:ss"
      )}\n`;
      txt += `ᐟᴘᴜᴛᴛᴜꜱ^᪲᪲᪲ 𝐅ᴏʀᴋꜱ : ${json.forks_count}\n`;
      txt += `ᐟᴘᴜᴛᴛᴜꜱ^᪲᪲᪲ 𝐒ᴛᴀʀꜱ : ${json.stargazers_count}\n\n`;

      txt += `𓆩⚡𓆪 𝐏𝐔𝐓𝐓𝐔𝐒-𝐀𝐈`;

      // Image
      const imgPath = path.join(__dirname, "../assets/bot_image.jpg");

      if (fs.existsSync(imgPath)) {
        const imgBuffer = fs.readFileSync(imgPath);

        await sock.sendMessage(
          chatId,
          {
            image: imgBuffer,
            caption: txt,
          },
          {
            quoted: message,
          }
        );
      } else {
        await sock.sendMessage(
          chatId,
          {
            text: txt,
          },
          {
            quoted: message,
          }
        );
      }

      // VCard
      const vcard =
        "BEGIN:VCARD\n" +
        "VERSION:3.0\n" +
        "FN:🌸•𝐏𝐮𝐭ᴛᴜꜱ•⌲\n" +
        "ORG:PUTTUS BOT;\n" +
        "TEL;type=CELL;type=VOICE;waid=918967360566:+91 8967360566\n" +
        "END:VCARD";

      await sock.sendMessage(
        chatId,
        {
          contacts: {
            displayName: "⎯꯭̽ꪹ𝙋𝙐𝙏𝙏𝙐𝙎_- 𝘿𝘼𝙎⸙",
            contacts: [{ vcard }],
          },
        },
        {
          quoted: message,
        }
      );
    } catch (error) {
      console.error("Error in github command:", error);

      await sock.sendMessage(
        chatId,
        {
          text: "❌ 𝐏ᴜᴛᴛᴜꜱ 𝐑ᴇᴘᴏ 𝐈ɴғᴏ 𝐅ᴇᴛᴄʜ 𝐅ᴀɪʟᴇᴅ",
        },
        {
          quoted: message,
        }
      );
    }
  },
};
