module.exports = {
  command: "ping",
  aliases: ["p", "pong"],
  category: "general",
  description: "Check bot response time",
  usage: ".ping",
  isPrefixless: true,

  async handler(sock, message, args) {
    try {
      const chatId = message.key.remoteJid;
      const start = Date.now();

      // ━━━━━ PUTTUS VCARD ━━━━━
      const botJid = "918967360566@s.whatsapp.net";

      const vcard =
        "BEGIN:VCARD\n" +
        "VERSION:3.0\n" +
        "N:PUTTUS;BOT;;;\n" +
        "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
        "ORG:PUTTUS BOT\n" +
        "TEL;TYPE=CELL;TYPE=VOICE;waid=918967360566:+918967360566\n" +
        "END:VCARD";

      // ━━━━━ STATUS-STYLE CONTACT PREVIEW ━━━━━
      const statusQuote = {
        key: {
          remoteJid: "status@broadcast",
          fromMe: false,
          id: "PUTTUS-" + Date.now(),
          participant: botJid,
        },
        message: {
          contactMessage: {
            displayName: "🌸•𝐏ᴜᴛᴛᴜꜱ•⌲",
            vcard: vcard,
          },
        },
      };

      const speed = Date.now() - start;

      // ━━━━━ PING RESULT WITH STATUS-STYLE VCARD ━━━━━
      await sock.sendMessage(
        chatId,
        {
          text:
            "╭─❖ 𝐏𝐔𝐓𝐓𝐔𝐒 𝐏𝐈𝐍𝐆 ❖─╮\n" +
            `│ ⚡ Speed : ${speed} ms\n` +
            "│ 🟢 Status : Online\n" +
            "│ 🤖 Bot : PUTTUS-AI\n" +
            "╰─❖ 𝐏𝐔𝐓𝐓𝐔𝐒 ❖─╯",
        },
        {
          quoted: statusQuote,
        }
      );

    } catch (error) {
      console.error("PUTTUS-AI PING ERROR:", error);

      await sock.sendMessage(
        message.key.remoteJid,
        {
          text:
            "❌ *PING ERROR*\n\n" +
            `└─ ${error.message}`,
        },
        { quoted: message }
      );
    }
  },
};
