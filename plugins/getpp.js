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
   GET PROFILE PICTURE
========================================================= */

module.exports = {
  command: "getpp",

  aliases: [
    "dlpp",
    "profilepic",
    "getdp",
  ],

  category: "general",

  description:
    "Get user profile picture",

  usage:
    ".getpp @user or reply or number",

  async handler(
    sock,
    message,
    args,
    context = {},
  ) {
    const chatId =
      message.key.remoteJid;

    const isGroup =
      chatId.endsWith("@g.us");

    let target;
    let displayName = "Unknown";
    let displayNumber = "";

    const quoted =
      message.message
        ?.extendedTextMessage
        ?.contextInfo;

    /* =====================================================
       TARGET USER
    ===================================================== */

    if (quoted?.mentionedJid?.[0]) {
      target =
        quoted.mentionedJid[0];

    } else if (quoted?.participant) {
      target =
        quoted.participant;

      if (quoted.pushName) {
        displayName =
          quoted.pushName;
      }

    } else if (args[0]) {
      const input =
        args[0].replace(
          /[^0-9]/g,
          "",
        );

      if (input.length >= 10) {
        target =
          input +
          "@s.whatsapp.net";
      } else {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *𝐈ɴᴠᴀʟɪᴅ ɴᴜᴍʙᴇʀ.*\n\n" +
              "• *𝐔sᴇ:* `918967360566`\n" +
              "• *𝐎ʀ:* `+918967360566`",
          },
          {
            quoted:
              getPuttusVCardQuote(),
          },
        );
      }

    } else {
      target =
        message.key.participant ||
        message.key.remoteJid;
    }

    try {
      /* =====================================================
         CONVERT LID TO REAL JID
      ===================================================== */

      let realJid = target;

      if (
        target.endsWith("@lid") &&
        isGroup
      ) {
        const metadata =
          await sock.groupMetadata(
            chatId,
          );

        const participant =
          metadata.participants.find(
            (p) =>
              p.lid === target ||
              p.id === target,
          );

        if (participant?.id) {
          realJid =
            participant.id;
        }
      }

      /* =====================================================
         NUMBER
      ===================================================== */

      const cleanNumber =
        realJid
          .replace(
            /@s\.whatsapp\.net|@lid/g,
            "",
          )
          .split(":")[0];

      displayNumber =
        `+${cleanNumber}`;

      /* =====================================================
         GET NAME
      ===================================================== */

      if (
        displayName === "Unknown"
      ) {
        try {
          const name =
            await sock.getName(
              realJid,
            );

          if (
            name &&
            !name.startsWith("+")
          ) {
            displayName =
              name;
          }
        } catch (e) {}
      }

      /* =====================================================
         PROFILE PICTURE
      ===================================================== */

      let ppUrl = null;

      try {
        ppUrl =
          await sock.profilePictureUrl(
            realJid,
            "image",
          );
      } catch (e) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *𝐍ᴏ 𝐏ʀᴏғɪʟᴇ 𝐏ɪᴄᴛᴜʀᴇ 𝐅ᴏᴜɴᴅ*\n\n` +
              `👤 *𝐍ᴀᴍᴇ:* ${displayName}\n` +
              `📱 *𝐍ᴜᴍʙᴇʀ:* ${displayNumber}\n\n` +
              `*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*`,
          },
          {
            quoted:
              getPuttusVCardQuote(),
          },
        );
      }

      /* =====================================================
         SEND PROFILE PICTURE
         VCard is QUOTED with the same message.
         No separate VCard message.
      ===================================================== */

      if (ppUrl) {
        await sock.sendMessage(
          chatId,
          {
            image: {
              url: ppUrl,
            },

            caption:
              `📸 *𝐏ʀᴏғɪʟᴇ 𝐏ɪᴄᴛᴜʀᴇ*\n\n` +
              `👤 *𝐍ᴀᴍᴇ:* ${displayName}\n` +
              `📱 *𝐍ᴜᴍʙᴇʀ:* ${displayNumber}\n\n` +
              `*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*`,
          },
          {
            quoted:
              getPuttusVCardQuote(),
          },
        );
      }

    } catch (error) {
      console.error(
        "GetPP Error:",
        error,
      );

      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *𝐅ᴀɪʟᴇᴅ ᴛᴏ ғᴇᴛᴄʜ 𝐏ʀᴏғɪʟᴇ 𝐏ɪᴄᴛᴜʀᴇ.*\n\n" +
            "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
        },
        {
          quoted:
            getPuttusVCardQuote(),
        },
      );
    }
  },
};
