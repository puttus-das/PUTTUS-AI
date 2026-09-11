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

      // Initial message
      await sock.sendMessage(
        chatId,
        {
          text: " *•𝐏ᴜᴛᴛᴜꜱ•* ",
        },
        { quoted: message }
      );

      const end = Date.now();
      const speed = end - start;

      // PUTTUS-BOT VCard
      const vcard =
        "BEGIN:VCARD\n" +
        "VERSION:3.0\n" +
        "N:𝐏𝐮𝐭ᴛᴜꜱ;𝐁ᴏᴛ;;;\n" +
        "FN:🌸•𝐏𝐮𝐭ᴛᴜꜱ•⌲\n" +
        "ORG:PUTTUS BOT;\n" +
        "TITLE:WhatsApp Bot Developer\n" +
        "TEL;type=CELL;type=VOICE;waid=918967360566:+91 8967360566\n" +
        "END:VCARD";

      // Speed message
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

      // VCard
      await sock.sendMessage(
        chatId,
        {
          contacts: {
            displayName: "🌸•𝐏𝐮𝐭ᴛᴜꜱ•⌲",
            contacts: [
              {
                displayName: "🌸•𝐏𝐮ᴛᴛᴜꜱ•⌲",
                vcard: vcard,
              },
            ],
          },
        },
        { quoted: message }
      );
    } catch (error) {
      console.error("PING ERROR:", error);

      await sock.sendMessage(
        message.key.remoteJid,
        {
          text: `❌ Ping Error!\n\n${error.message}`,
        },
        { quoted: message }
      );
    }
  },
};
