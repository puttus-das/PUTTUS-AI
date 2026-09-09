module.exports = {
  command: "ping",
  aliases: ["p", "pong"],
  category: "general",
  description: "Check bot response time",
  usage: ".ping",
  isPrefixless: true,

  async handler(sock, message, args) {
    const start = Date.now();
    const chatId = message.key.remoteJid;

    const sent = await sock.sendMessage(chatId, {
      text: " *•𝐏ᴜᴛᴛᴜꜱ•* ",
    });

    const end = Date.now();

    // PUTTUS BOT VCard
    const vcard =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      'FN:🌸•𝐏𝐮𝐭ᴛᴜꜱ•⌲\n' +
      'ORG:PUTTUS BOT;\n' +
      'TEL;type=CELL;type=VOICE;waid=918967360566:+91 8967360566\n' +
      'END:VCARD';

    const vcardReply = {
      key: {
        fromMe: false,
        participant: '918967360566@s.whatsapp.net',
        remoteJid: 'status@broadcast'
      },
      message: {
        contactMessage: {
          displayName: '⎯꯭̽ꪹ𝙋𝙐𝙏𝙏𝙐𝙎_- 𝘿𝘼𝙎⸙',
          vcard
        }
      }
    };

    await sock.sendMessage(chatId, {
      text: `*sᴘᴇᴇᴅ →* : ${end - start} ᴍs`,
    }, {
      quoted: vcardReply
    });

    // Send VCard
    await sock.sendMessage(chatId, {
      contacts: {
        displayName: '⎯꯭̽ꪹ𝙋𝙐𝙏𝙏𝙐𝙎_- 𝘿𝘼𝙎⸙',
        contacts: [
          {
            vcard
          }
        ]
      }
    });
  },
};
