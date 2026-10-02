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
   GROUP INFO
========================================================= */

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

  usage:
    ".groupinfo",

  groupOnly: true,

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
         GET GROUP METADATA
      ===================================================== */

      const groupMetadata =
        await sock.groupMetadata(chatId);

      /* =====================================================
         GROUP PROFILE PICTURE
      ===================================================== */

      let pp;

      try {
        pp =
          await sock.profilePictureUrl(
            chatId,
            "image",
          );
      } catch {
        pp =
          "https://files.catbox.moe/fhifrt.jpeg";
      }

      /* =====================================================
         PARTICIPANTS
      ===================================================== */

      const participants =
        groupMetadata.participants || [];

      const groupAdmins =
        participants.filter(
          (p) => p.admin,
        );

      /* =====================================================
         ADMIN LIST
      ===================================================== */

      const listAdmin =
        groupAdmins
          .map(
            (v, i) =>
              `*${i + 1}. @${v.id.split("@")[0]}*`,
          )
          .join("\n");

      /* =====================================================
         GROUP OWNER
      ===================================================== */

      const owner =
        groupMetadata.owner ||
        groupAdmins.find(
          (p) =>
            p.admin === "superadmin",
        )?.id ||
        chatId.split("-")[0] +
          "@s.whatsapp.net";

      /* =====================================================
         GROUP INFO TEXT
      ===================================================== */

      const text = `
┌──「 *𝐆ʀᴏᴜᴘ 𝐈ɴғᴏ* 」

▢ *♻️ 𝐈𝐃:*
• *${groupMetadata.id}*

▢ *🔖 𝐍𝐀𝐌𝐄:*
• *${groupMetadata.subject || "Unknown"}*

▢ *👥 𝐌𝐄𝐌𝐁𝐄𝐑𝐒:*
• *${participants.length}*

▢ *🤿 𝐆𝐑𝐎𝐔𝐏 𝐎𝐖𝐍𝐄𝐑:*
• *@${owner.split("@")[0]}*

▢ *🕵🏻‍♂️ 𝐀𝐃𝐌𝐈𝐍𝐒:*
${listAdmin || "*No admins found*"}

▢ *📌 𝐃𝐄𝐒𝐂𝐑𝐈𝐏𝐓𝐈𝐎𝐍:*
• *${groupMetadata.desc?.toString() || "No description"}*

*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*
`.trim();

      /* =====================================================
         MENTIONS
      ===================================================== */

      const mentions = [
        ...groupAdmins.map(
          (v) => v.id,
        ),
        owner,
      ];

      /* =====================================================
         IMPORTANT
         VCard is ONLY used as quoted message.
         No separate VCard message is sent.
      ===================================================== */

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
          quoted:
            getPuttusVCardQuote(),
        },
      );

    } catch (error) {
      console.error(
        "GroupInfo Error:",
        error,
      );

      /* =====================================================
         ERROR MESSAGE
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          text:
            "*❌ Failed to get group information.*\n\n" +
            "*Please try again later.*",
        },
        {
          quoted: message,
        },
      );
    }
  },
};
