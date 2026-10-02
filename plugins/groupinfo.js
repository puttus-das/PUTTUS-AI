/* =========================================================
   PUTTUS-BOT GROUP INFO
========================================================= */

function getPuttusVCard() {
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
   SEND PUTTUS VCARD
========================================================= */

async function sendPuttusVCard(sock, chatId) {
  try {
    const vcardMessage = getPuttusVCard();

    await sock.relayMessage(
      chatId,
      vcardMessage.message,
      {
        messageId: vcardMessage.key.id,
      },
    );
  } catch (error) {
    console.error(
      "[GROUPINFO] VCard send error:",
      error.message,
    );
  }
}

/* =========================================================
   GROUP INFO COMMAND
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

  usage: ".groupinfo",

  groupOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId =
      context.chatId ||
      message.key.remoteJid;

    const channelInfo =
      context.channelInfo || {};

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
        pp = await sock.profilePictureUrl(
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

      /* =====================================================
         ADMINS
      ===================================================== */

      const groupAdmins =
        participants.filter(
          (p) => p.admin,
        );

      const listAdmin =
        groupAdmins.length
          ? groupAdmins
              .map(
                (v, i) =>
                  `${i + 1}. @${v.id.split("@")[0]}`,
              )
              .join("\n")
          : "No admins found";

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
         GROUP DESCRIPTION
      ===================================================== */

      const description =
        groupMetadata.desc
          ? groupMetadata.desc.toString()
          : "No description";

      /* =====================================================
         GROUP INFO TEXT
      ===================================================== */

      const text = `
┌──「 *INFO GROUP* 」
▢ *♻️ ID:*
   • ${groupMetadata.id}

▢ *🔖 NAME:*
   • ${groupMetadata.subject}

▢ *👥 Members:*
   • ${participants.length}

▢ *🤿 Group Owner:*
   • @${owner.split("@")[0]}

▢ *🕵🏻‍♂️ Admins:*
${listAdmin}

▢ *📌 Description:*
   • ${description}

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
         SEND GROUP INFO
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          image: {
            url: pp,
          },

          caption: text,

          mentions,

          ...channelInfo,
        },
        {
          quoted: message,
        },
      );

      /* =====================================================
         SEND PUTTUS VCARD
      ===================================================== */

      await sendPuttusVCard(
        sock,
        chatId,
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
            "❌ *Failed to get group info.*\n\n" +
            "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",

          ...channelInfo,
        },
        {
          quoted: message,
        },
      );
    }
  },
};
