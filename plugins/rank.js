const store = require("../lib/lightweight_store");

/* =========================================================
   MESSAGE COUNT HELPERS
========================================================= */

async function incrementMessageCount(chatId, userId) {
  try {
    await store.incrementMessageCount(chatId, userId);
  } catch (error) {
    console.error(
      "Error incrementing message count:",
      error
    );
  }
}

async function loadMessageCounts() {
  try {
    const data = await store.getAllMessageCounts();
    return data.messageCount || {};
  } catch (error) {
    console.error(
      "Error loading message counts:",
      error
    );

    return {};
  }
}

function saveMessageCounts(messageCounts) {
  console.log(
    "[RANK] saveMessageCounts called (no-op - auto-saved by store)"
  );
}

/* =========================================================
   PUTTUS VCARD
========================================================= */

function getPuttusVCard() {
  const botJid =
    "919641092392@s.whatsapp.net";

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
      id: "PUTTUS-RANK-" + Date.now(),
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
   RANK COMMAND
========================================================= */

module.exports = {
  command: "rank",

  aliases: [
    "top",
    "topusers",
    "leaderboard",
    "ranks",
  ],

  category: "group",

  description:
    "Show top 5 most active members based on message count",

  usage: ".rank",

  groupOnly: true,

  async handler(
    sock,
    message,
    args,
    context = {}
  ) {
    const chatId =
      context.chatId ||
      message.key.remoteJid;

    try {
      /* =====================================================
         LOAD COUNTS
      ===================================================== */

      const messageCounts =
        await loadMessageCounts();

      const groupCounts =
        messageCounts[chatId] || {};

      /* =====================================================
         SORT TOP 5
      ===================================================== */

      const sortedMembers =
        Object.entries(groupCounts)
          .sort(
            ([, a], [, b]) =>
              Number(b) - Number(a)
          )
          .slice(0, 5);

      /* =====================================================
         EMPTY LEADERBOARD
      ===================================================== */

      if (sortedMembers.length === 0) {
        const statusQuote =
          getPuttusVCard();

        await sock.sendMessage(
          chatId,
          {
            text:
              "📊 *ɴᴏ ᴍᴇssᴀɢᴇ ᴀᴄᴛɪᴠɪᴛʏ ʀᴇᴄᴏʀᴅᴇᴅ ʏᴇᴛ*\n\n" +
              "💬 *sᴛᴀʀᴛ ᴄʜᴀᴛᴛɪɴɢ ᴛᴏ ᴀᴘᴘᴇᴀʀ ᴏɴ ᴛʜᴇ ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ!*\n\n" +
              "© *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
          },
          {
            quoted: statusQuote,
          }
        );

        return;
      }

      /* =====================================================
         LEADERBOARD
      ===================================================== */

      const medals = [
        "🥇",
        "🥈",
        "🥉",
        "4️⃣",
        "5️⃣",
      ];

      let messageText =
        "🏆 *ᴛᴏᴘ ᴍᴇᴍʙᴇʀs ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ*\n\n";

      sortedMembers.forEach(
        ([userId, count], index) => {
          const username =
            userId.split("@")[0];

          messageText +=
            `${medals[index]} @${username}\n` +
            `💬 *${count} ᴍᴇssᴀɢᴇs*\n\n`;
        }
      );

      messageText +=
        "_ᴋᴇᴇᴘ ᴄʜᴀᴛᴛɪɴɢ ᴛᴏ ᴄʟɪᴍʙ ᴛʜᴇ ʀᴀɴᴋs!_\n\n" +
        "© *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*";

      /* =====================================================
         PUTTUS VCARD QUOTE
      ===================================================== */

      const statusQuote =
        getPuttusVCard();

      /* =====================================================
         SEND LEADERBOARD
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          text: messageText,

          mentions:
            sortedMembers.map(
              ([userId]) => userId
            ),
        },
        {
          quoted: statusQuote,
        }
      );

    } catch (error) {
      console.error(
        "Rank Command Error:",
        error
      );

      try {
        await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *ʀᴀɴᴋ ᴄᴏᴍᴍᴀɴᴅ ᴇʀʀᴏʀ*\n\n" +
              `└─ ${error.message}`,
          },
          {
            quoted: message,
          }
        );
      } catch {}
    }
  },

  incrementMessageCount,

  loadMessageCounts,

  saveMessageCounts,
};
