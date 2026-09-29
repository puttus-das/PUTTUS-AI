module.exports = {
  command: "ping",
  aliases: ["p", "pong"],
  category: "general",
  description: "Check bot response time",
  usage: ".ping",
  isPrefixless: true,

  async handler(sock, message, args) {
    try {
      const start = Date.now();
      const chatId = message.key.remoteJid;

      // ━━━━━ INITIAL PING ━━━━━
      await sock.sendMessage(
        chatId,
        {
          text: " *•𝐏ᴜᴛᴛᴜꜱ•* ",
        },
        { quoted: message }
      );

      const speed = Date.now() - start;

      // ━━━━━ PING RESULT ━━━━━
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
        { quoted: message }
      );

      // ━━━━━ PUTTUS-AI VCARD ━━━━━
      const vcard =
        "BEGIN:VCARD\n" +
        "VERSION:3.0\n" +
        "N:PUTTUS;BOT;;;\n" +
        "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
        "ORG:PUTTUS BOT\n" +
        "TEL;TYPE=CELL;TYPE=VOICE;waid=918967360566:+918967360566\n" +
        "END:VCARD";

      // ━━━━━ SEND VCARD ━━━━━
      await sock.sendMessage(
        chatId,
        {
          contacts: {
            displayName: "🌸•𝐏ᴜᴛᴛᴜꜱ•⌲",
            contacts: [
              {
                displayName: "🌸•𝐏ᴜᴛᴛᴜꜱ•⌲",
                vcard: vcard,
              },
            ],
          },
        },
        { quoted: message }
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
