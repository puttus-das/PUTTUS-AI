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

async function handleDemotionEvent(sock, groupId, participants, author) {
  try {
    if (!Array.isArray(participants) || participants.length === 0) return;

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const demotedUsernames = participants.map((jid) => {
      const jidString =
        typeof jid === "string" ? jid : jid.id || jid.toString();

      return `@${jidString.split("@")[0]}`;
    });

    let demotedBy = "System";
    const mentionList = participants.map((jid) =>
      typeof jid === "string" ? jid : jid.id || jid.toString(),
    );

    if (author) {
      const authorJid =
        typeof author === "string" ? author : author.id || author.toString();

      demotedBy = `@${authorJid.split("@")[0]}`;
      mentionList.push(authorJid);
    }

    const now = new Date();

    const time = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    const demotionMessage =
      `┌─❖ *ɢʀᴏᴜᴘ ᴅᴇᴍᴏᴛɪᴏɴ*\n` +
      `│\n` +
      `${demotedUsernames.map((name) => `├─ 👤 ${name}`).join("\n")}\n` +
      `├─ 👑 ${demotedBy}\n` +
      `└─ 🕐 ${time}\n\n` +
      `*⚡ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*`;

    await sock.sendMessage(
      groupId,
      {
        text: demotionMessage,
        mentions: mentionList,
      },
      {
        quoted: getPuttusVCardQuote(),
      },
    );
  } catch (error) {
    console.error("Error handling demotion event:", error);
  }
}

module.exports = {
  command: "demote",
  aliases: ["dmt", "removeadmin"],
  category: "admin",
  description: "Demote user(s) from admin to member",
  usage: ".demote @user or reply to message",
  groupOnly: true,
  adminOnly: true,

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const isBotAdmin = context.isBotAdmin;

    if (!isBotAdmin) {
      await sock.sendMessage(
        chatId,
        {
          text: "❌ *Please make the bot an admin first*",
        },
        { quoted: message },
      );
      return;
    }

    let userToDemote = [];

    const mentionedJids =
      message.message?.extendedTextMessage?.contextInfo?.mentionedJid;

    if (mentionedJids?.length > 0) {
      userToDemote = mentionedJids;
    } else if (
      message.message?.extendedTextMessage?.contextInfo?.participant
    ) {
      userToDemote = [
        message.message.extendedTextMessage.contextInfo.participant,
      ];
    }

    if (userToDemote.length === 0) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *Please mention a user or reply to their message*\n\n" +
            "Usage: `.demote @user` or reply with `.demote`",
        },
        { quoted: message },
      );
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await sock.groupParticipantsUpdate(
        chatId,
        userToDemote,
        "demote",
      );

      const usernames = userToDemote.map(
        (jid) => `@${jid.split("@")[0]}`,
      );

      const authorJid =
        message.key.participant || message.key.remoteJid;

      const authorName = `@${authorJid.split("@")[0]}`;

      const time = new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });

      const demotionMessage =
        `┌─❖ *ɢʀᴏᴜᴘ ᴅᴇᴍᴏᴛɪᴏɴ*\n` +
        `│\n` +
        `${usernames.map((name) => `├─ 👤 ${name}`).join("\n")}\n` +
        `├─ 👑 ${authorName}\n` +
        `└─ 🕐 ${time}\n\n` +
        `*⚡ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*`;

      await sock.sendMessage(
        chatId,
        {
          text: demotionMessage,
          mentions: [...userToDemote, authorJid],
        },
        {
          quoted: getPuttusVCardQuote(),
        },
      );
    } catch (error) {
      console.error("Error in demote command:", error);

      if (error.data === 429) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *Rate limit reached*\n\n" +
              "Please try again in a few seconds.",
          },
          { quoted: message },
        );
      } else {
        await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *Failed to demote user(s)*\n\n" +
              "Make sure the bot has sufficient permissions.",
          },
          { quoted: message },
        );
      }
    }
  },

  handleDemotionEvent,
};
