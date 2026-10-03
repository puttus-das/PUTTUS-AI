const { isAdmin } = require("../lib/isAdmin");

// ─────────────────────────────────────────────
// PUTTUS-BOT VCARD
// ─────────────────────────────────────────────

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
        displayName: "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
        vcard,
      },
    },
  };
}


// ─────────────────────────────────────────────
// PROMOTION EVENT
// ─────────────────────────────────────────────

async function handlePromotionEvent(sock, groupId, participants, author) {
  try {
    if (!Array.isArray(participants) || participants.length === 0) {
      return;
    }

    const promotedUsernames = participants.map((jid) => {
      const jidString =
        typeof jid === "string"
          ? jid
          : jid.id || jid.toString();

      return `@${jidString.split("@")[0]}`;
    });

    const mentionList = participants.map((jid) => {
      return typeof jid === "string"
        ? jid
        : jid.id || jid.toString();
    });

    let promotedBy;

    if (author && author.length > 0) {
      const authorJid =
        typeof author === "string"
          ? author
          : author.id || author.toString();

      promotedBy = `@${authorJid.split("@")[0]}`;

      mentionList.push(authorJid);
    } else {
      promotedBy = "System";
    }

    const time = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    const promotionMessage =
      `╭─❖ *ɢʀᴏᴜᴘ ᴘʀᴏᴍᴏᴛɪᴏɴ*\n` +
      `│\n` +
      `${promotedUsernames
        .map(
          (name) =>
            `├─ 👤 *ᴘʀᴏᴍᴏᴛᴇᴅ ᴜsᴇʀ:* ${name}`,
        )
        .join("\n")}\n` +
      `├─ 👑 *ᴘʀᴏᴍᴏᴛᴇᴅ ʙʏ:* ${promotedBy}\n` +
      `└─ 🕐 *ᴛɪᴍᴇ:* ${time}\n\n` +
      `*⚡ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*`;

    await sock.sendMessage(
      groupId,
      {
        text: promotionMessage,
        mentions: mentionList,
      },
      {
        quoted: getPuttusVCardQuote(),
      },
    );

  } catch (error) {
    console.error(
      "Error handling promotion event:",
      error,
    );
  }
}


// ─────────────────────────────────────────────
// PROMOTE COMMAND
// ─────────────────────────────────────────────

module.exports = {
  command: "promote",

  aliases: ["admin"],

  category: "admin",

  description: "Promote user(s) to admin",

  usage: ".promote [@user] or reply to message",

  groupOnly: true,

  adminOnly: true,


  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;

    let userToPromote = [];

    const mentionedJids =
      message.message
        ?.extendedTextMessage
        ?.contextInfo
        ?.mentionedJid;


    if (
      mentionedJids &&
      mentionedJids.length > 0
    ) {
      userToPromote = mentionedJids;

    } else if (
      message.message
        ?.extendedTextMessage
        ?.contextInfo
        ?.participant
    ) {
      userToPromote = [
        message.message
          .extendedTextMessage
          .contextInfo
          .participant,
      ];
    }


    if (userToPromote.length === 0) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "Please mention the user or reply to their message to promote!",
          ...channelInfo,
        },
        {
          quoted: message,
        },
      );

      return;
    }


    try {
      await sock.groupParticipantsUpdate(
        chatId,
        userToPromote,
        "promote",
      );


      const usernames = userToPromote.map((jid) => {
        return `@${jid.split("@")[0]}`;
      });


      const promoterJid =
        message.key.participant ||
        message.key.remoteJid;

      const promotedBy =
        `@${promoterJid.split("@")[0]}`;


      const time = new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });


      const promotionMessage =
        `╭─❖ *ɢʀᴏᴜᴘ ᴘʀᴏᴍᴏᴛɪᴏɴ*\n` +
        `│\n` +
        `${usernames
          .map(
            (name) =>
              `├─ 👤 *ᴘʀᴏᴍᴏᴛᴇᴅ ᴜsᴇʀ:* ${name}`,
          )
          .join("\n")}\n` +
        `├─ 👑 *ᴘʀᴏᴍᴏᴛᴇᴅ ʙʏ:* ${promotedBy}\n` +
        `└─ 🕐 *ᴛɪᴍᴇ:* ${time}\n\n` +
        `*⚡ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*`;


      await sock.sendMessage(
        chatId,
        {
          text: promotionMessage,

          mentions: [
            ...userToPromote,
            promoterJid,
          ],

          ...channelInfo,
        },
        {
          quoted: getPuttusVCardQuote(),
        },
      );

    } catch (error) {
      console.error(
        "Error in promote command:",
        error,
      );

      await sock.sendMessage(
        chatId,
        {
          text: "Failed to promote user(s)!",
          ...channelInfo,
        },
        {
          quoted: message,
        },
      );
    }
  },


  // ───────────────────────────────────────────
  // EVENT HANDLER EXPORT
  // ───────────────────────────────────────────

  handlePromotionEvent,
};
