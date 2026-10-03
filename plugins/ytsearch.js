/*****************************************************************************
 *                                                                           *
 *                     PUTTUS-AI YouTube Search                             *
 *                                                                           *
 *****************************************************************************/

const settings = require("../settings");

const YT_SEARCH_API =
  "https://rabbitapi.zone.id/search/youtube";

/* =========================================================
   PUTTUS VCARD QUOTE
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
   YOUTUBE SEARCH
========================================================= */

module.exports = {
  command: "ytsearch",

  aliases: [
    "yts",
    "playlist",
    "playlista"
  ],

  category: "music",

  description:
    "Search YouTube",

  usage:
    ".yts [query]",

  async handler(
    sock,
    message,
    args = [],
    context = {}
  ) {
    const chatId =
      context?.chatId ||
      message?.key?.remoteJid;

    if (!chatId) return;

    const query =
      args.join(" ").trim();

    const prefix =
      settings?.prefixes?.[0] ||
      ".";

    /* =====================================================
       QUERY CHECK
    ===================================================== */

    if (!query) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            `❌ *YouTube search query dao!*\n\n` +
            `Example:\n` +
            `*${prefix}yts Alan Walker Faded*`
        },
        {
          quoted: message
        }
      );
    }

    try {

      /* ===================================================
         SEARCH REACTION
      =================================================== */

      await sock.sendMessage(
        chatId,
        {
          react: {
            text: "🔍",
            key: message.key
          }
        }
      );

      /* ===================================================
         RABBIT YOUTUBE SEARCH API
      =================================================== */

      const apiUrl =
        `${YT_SEARCH_API}?q=${encodeURIComponent(query)}&limit=15`;

      const response =
        await fetch(
          apiUrl,
          {
            method: "GET",

            headers: {
              Accept:
                "application/json",

              "User-Agent":
                "PUTTUS-AI"
            }
          }
        );

      /* ===================================================
         HTTP CHECK
      =================================================== */

      if (!response.ok) {
        throw new Error(
          `YouTube Search HTTP ${response.status}`
        );
      }

      /* ===================================================
         JSON RESPONSE
      =================================================== */

      const data =
        await response.json();

      /* ===================================================
         API STATUS CHECK
      =================================================== */

      if (data?.status !== true) {

        return await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *YouTube search failed.*\n\n` +
              `${data?.message || "No results found."}`
          },
          {
            quoted:
              getPuttusVCardQuote()
          }
        );
      }

      /* ===================================================
         RESULTS
      =================================================== */

      const videos =
        Array.isArray(data?.result)
          ? data.result
          : [];

      if (!videos.length) {

        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *কোনো YouTube result পাওয়া যায়নি।*"
          },
          {
            quoted:
              getPuttusVCardQuote()
          }
        );
      }

      /* ===================================================
         SEARCH TEXT
      =================================================== */

      let searchText =
        `╭─〔 *𝐏ᴜᴛᴛᴜs-Bᴏᴛ* 〕─╮\n` +
        `│ 🔎 *YOUTUBE SEARCH*\n` +
        `│\n`;

      videos.forEach(
        (video, index) => {

          const number =
            index + 1;

          searchText +=
            `│ *${number}.* ${video?.title || "Unknown"}\n` +
            `│ ⏱️ ${video?.duration || "Unknown"}\n` +
            `│ 👀 ${video?.views || "Unknown"}\n` +
            `│ 👤 ${video?.author?.name || "Unknown"}\n` +
            `│ 🔗 ${video?.url || "No URL"}\n` +
            `│\n`;
        }
      );

      searchText +=
        `╰──────────────────╯\n` +
        `📌 *Results:* ${videos.length}\n` +
        `🔎 *Query:* ${query}`;

      /* ===================================================
         THUMBNAIL
      =================================================== */

      const thumbnail =
        videos[0]?.thumbnail;

      /* ===================================================
         SEND SEARCH RESULT
         
         IMPORTANT:
         VCARD আলাদা message হিসেবে যাবে না।
         একই message-এর quoted context হিসেবে থাকবে।
      =================================================== */

      if (thumbnail) {

        await sock.sendMessage(
          chatId,
          {
            image: {
              url: thumbnail
            },

            caption:
              searchText
          },
          {
            quoted:
              getPuttusVCardQuote()
          }
        );

      } else {

        await sock.sendMessage(
          chatId,
          {
            text:
              searchText
          },
          {
            quoted:
              getPuttusVCardQuote()
          }
        );
      }

      /* ===================================================
         SUCCESS REACTION
      =================================================== */

      await sock.sendMessage(
        chatId,
        {
          react: {
            text: "✅",
            key: message.key
          }
        }
      );

    } catch (error) {

      /* ===================================================
         ERROR
      =================================================== */

      console.error(
        "PUTTUS-AI YOUTUBE SEARCH ERROR:",
        error
      );

      await sock.sendMessage(
        chatId,
        {
          text:
            `❌ *YouTube Search Error*\n\n` +
            `আবার একটু পরে try করো।`
        },
        {
          quoted:
            getPuttusVCardQuote()
        }
      );
    }
  }
};
