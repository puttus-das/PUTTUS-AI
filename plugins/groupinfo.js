const getPuttusVCardQuote = () => {
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
};

module.exports = {
  command: "groupinfo",

  aliases: [
    "ginfo",
    "gcinfo",
    "infogroup",
  ],

  category: "group",

  description:
    "Display detailed group information",

  usage: ".groupinfo",

  groupOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId =
      context.chatId ||
      message.key.remoteJid;

    try {
      const groupMetadata =
        await sock.groupMetadata(chatId);

      let pp;

      try {
        pp = await sock.profilePictureUrl(
          chatId,
          "image",
        );
      } catch {
        pp =
          "https://files.catbox.moe/fhifrt.jpeg";
      }

      const participants =
        groupMetadata.participants || [];

      const groupAdmins =
        participants.filter(
          (p) => p.admin,
        );

      const listAdmin =
        groupAdmins.length
          ? groupAdmins
              .map(
                (v, i) =>
                  `*${i + 1}. @${v.id.split("@")[0]}*`,
              )
              .join("\n")
          : "*No admins found*";

      const owner =
        groupMetadata.owner ||
        groupAdmins.find(
          (p) =>
            p.admin === "superadmin",
        )?.id ||
        chatId.split("-")[0] +
          "@s.whatsapp.net";

      const description =
        groupMetadata.desc?.toString() ||
        "No description";

      const text = `
┌──「 *𝐆ʀᴏᴜᴘ 𝐈ɴғᴏ* 」
▢ *♻️ 𝐈𝐃:*
• *${groupMetadata.id}*

▢ *🔖 𝐍𝐀𝐌𝐄:*
• *${groupMetadata.subject}*

▢ *👥 𝐌𝐄𝐌𝐁𝐄𝐑𝐒:*
• *${participants.length}*

▢ *🤿 𝐆𝐑𝐎𝐔𝐏 𝐎𝐖𝐍𝐄𝐑:*
• *@${owner.split("@")[0]}*

▢ *🕵🏻‍♂️ 𝐀𝐃𝐌𝐈𝐍𝐒:*
${listAdmin}

▢ *📌 𝐃𝐄𝐒𝐂𝐑𝐈𝐏𝐓𝐈𝐎𝐍:*
• *${description}*
`.trim();

      const mentions = [
        ...groupAdmins.map(
          (v) => v.id,
        ),
        owner,
      ];

      await sock.sendMessage(
        chatId,
        {
          image: {
            url: pp,
          },
          caption: text,
          mentions,
        },
        {
          quoted: message,
        },
      );

      /* =====================================================
         PUTTUS VCARD
      ===================================================== */

      const vcardMessage =
        getPuttusVCardQuote();

      await sock.sendMessage(
        chatId,
        {
          text: "‎",
        },
        {
          quoted: vcardMessage,
        },
      );

    } catch (error) {
      console.error(
        "Error in groupinfo command:",
        error,
      );

      await sock.sendMessage(
        chatId,
        {
          text:
            "*❌ 𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐠𝐞𝐭 𝐠𝐫𝐨ᴜᴘ 𝐢ɴғᴏ!*",
        },
        {
          quoted: message,
        },
      );
    }
  },
};
