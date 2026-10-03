const os = require("os");
const process = require("process");
const settings = require("../settings");

function getPuttusVCardQuote() {
  const botJid = "919641092392@s.whatsapp.net";

  const vcard =
    "BEGIN:VCARD\n" +
    "VERSION:3.0\n" +
    "N:PUTTUS;BOT;;;\n" +
    "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
    "ORG:PUTTUS BOT;\n" +
    "TEL;type=CELL;type=VOICE;waid=919641092392:+91 9641092392\n" +
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

module.exports = {
  command: "alive",
  aliases: ["status", "bot"],
  category: "general",
  description: "Check bot status and system info",
  usage: ".alive",
  isPrefixless: true,

  async handler(sock, message, args, context = {}) {
    const chatId =
      context.chatId ||
      message.key.remoteJid;

    try {
      let uptime = Math.floor(process.uptime());

      const days = Math.floor(uptime / 86400);
      uptime %= 86400;

      const hours = Math.floor(uptime / 3600);
      uptime %= 3600;

      const minutes = Math.floor(uptime / 60);
      const seconds = uptime % 60;

      const uptimeParts = [];

      if (days) uptimeParts.push(`${days}d`);
      if (hours) uptimeParts.push(`${hours}h`);
      if (minutes) uptimeParts.push(`${minutes}m`);

      if (
        seconds ||
        uptimeParts.length === 0
      ) {
        uptimeParts.push(`${seconds}s`);
      }

      const uptimeText =
        uptimeParts.join(" ");

      const totalMem =
        os.totalmem() / 1024 / 1024;

      const freeMem =
        os.freemem() / 1024 / 1024;

      const usedMem =
        (totalMem - freeMem).toFixed(0);

      const cpuLoad =
        os.loadavg()[0].toFixed(2);

      const nodeVersion =
        process.version;

      const text =
        `*🤖 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ ɪs ᴀᴄᴛɪᴠᴇ!*\n\n` +
        `*╭─❯ 📦 ᴠᴇʀsɪᴏɴ: ${settings.version}*\n` +
        `*├─❯ ⏱️ ᴜᴘᴛɪᴍᴇ: ${uptimeText}*\n` +
        `*├─❯ 🧠 ʀᴀᴍ: ${usedMem} MB*\n` +
        `*├─❯ ⚡ ᴄᴘᴜ: ${cpuLoad}*\n` +
        `*╰─❯ 🟢 ɴᴏᴅᴇ: ${nodeVersion}*`;

      // Alive message + NEW PUTTUS VCard as quoted
      await sock.sendMessage(
        chatId,
        {
          text,
        },
        {
          quoted:
            getPuttusVCardQuote(),
        }
      );

    } catch (error) {
      console.error(
        "Error in alive command:",
        error
      );

      await sock.sendMessage(
        chatId,
        {
          text:
            "✅ Bot is alive and running!",
        },
        {
          quoted:
            getPuttusVCardQuote(),
        }
      );
    }
  },
};
