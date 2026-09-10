module.exports = {
  command: "tagall",
  aliases: ["everyone", "all"],
  category: "admin",
  description: "Tag all group members with their usernames",
  usage: ".tagall",
  groupOnly: true,
  adminOnly: true,

  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // VCard
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
          displayName: '⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜',
          vcard
        }
      }
    };

    try {
      const groupMetadata = await sock.groupMetadata(chatId);
      const participants = groupMetadata.participants;

      if (!participants || participants.length === 0) {
        await sock.sendMessage(
          chatId,
          {
            text: "No participants found in the group.",
            ...channelInfo,
          },
          { quoted: vcardReply }
        );
        return;
      }

      let messageText = "━[ 𝐏ᴜᴛᴛᴜꜱ - 𝐃ᴀꜱ ]━:\n\n";

      participants.forEach((participant) => {
        const number = participant.id.split("@")[0];
        messageText += `@${number}\n`;
      });

      await sock.sendMessage(
        chatId,
        {
          text: messageText,
          mentions: participants.map((p) => p.id),
          ...channelInfo,
        },
        { quoted: vcardReply }
      );

    } catch (error) {
      console.error("Error in tagall command:", error);

      await sock.sendMessage(
        chatId,
        {
          text: "Failed to tag all members.",
          ...channelInfo,
        },
        { quoted: vcardReply }
      );
    }
  },
};
