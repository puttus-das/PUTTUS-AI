/*****************************************************************************
 *                     PUTTUS-AI YouTube Search                              *
 *****************************************************************************/

const settings = require("../settings");

const YT_SEARCH_API =
  "https://rabbitapi.zone.id/search/youtube";

const BOT_VCARD = `
BEGIN:VCARD
VERSION:3.0
N:PUTTUS;BOT;;;
FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲
ORG:PUTTUS BOT
TEL;TYPE=CELL;TYPE=VOICE;waid=919641092392:+919641092392
END:VCARD
`;

async function sendVCard(sock, chatId, quoted) {
  try {
    await sock.sendMessage(
      chatId,
      {
        contacts: {
          displayName: "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
          contacts: [
            {
              vcard: BOT_VCARD
            }
          ]
        }
      },
      { quoted }
    );
  } catch (error) {
    console.error("YTSEARCH VCARD ERROR:", error);
  }
}

module.exports = {
  command: "ytsearch",
  aliases: ["yts", "playlist", "playlista"],
  category: "music",
  description: "Search YouTube",
  usage: ".yts [query]",

  async handler(sock, message, args = [], context = {}) {
    const chatId =
      context?.chatId ||
      message?.key?.remoteJid;

    if (!chatId) return;

    const query = args.join(" ").trim();

    const prefix =
      settings?.prefixes?.[0] || ".";

    if (!query) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            `❌ *YouTube search query dao!*\n\n` +
            `Example:\n` +
            `*${prefix}yts Alan Walker Faded*`
        },
        { quoted: message }
      );
    }

    try {
      await sock.sendMessage(chatId, {
        react: {
          text: "🔍",
          key: message.key
        }
      });

      const apiUrl =
        `${YT_SEARCH_API}?q=${encodeURIComponent(query)}&limit=15`;

      const response = await fetch(apiUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "PUTTUS-AI"
        }
      });

      if (!response.ok) {
        throw new Error(
          `YouTube Search HTTP ${response.status}`
        );
      }

      const data = await response.json();

      if (data?.status !== true) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *YouTube search failed.*\n\n` +
              `${data?.message || "No results found."}`
          },
          { quoted: message }
        );
      }

      const videos = Array.isArray(data?.result)
        ? data.result
        : [];

      if (!videos.length) {
        return await sock.sendMessage(
          chatId,
          {
            text: "❌ *কোনো YouTube result পাওয়া যায়নি।*"
          },
          { quoted: message }
        );
      }

      let searchText =
        `╭─〔 *𝐏ᴜᴛᴛᴜs-Bᴏᴛ* 〕─╮\n` +
        `│ 🔎 *YOUTUBE SEARCH*\n` +
        `│\n`;

      videos.forEach((video, index) => {
        searchText +=
          `│ *${index + 1}.* ${video?.title || "Unknown"}\n` +
          `│ ⏱️ ${video?.duration || "Unknown"}\n` +
          `│ 👀 ${video?.views || "Unknown"}\n` +
          `│ 👤 ${video?.author?.name || "Unknown"}\n` +
          `│ 🔗 ${video?.url || "No URL"}\n` +
          `│\n`;
      });

      searchText +=
        `╰──────────────────╯\n` +
        `📌 *Results:* ${videos.length}\n` +
        `🔎 *Query:* ${query}`;

      const thumbnail = videos[0]?.thumbnail;

      if (thumbnail) {
        await sock.sendMessage(
          chatId,
          {
            image: {
              url: thumbnail
            },
            caption: searchText
          },
          { quoted: message }
        );
      } else {
        await sock.sendMessage(
          chatId,
          {
            text: searchText
          },
          { quoted: message }
        );
      }

      await sendVCard(sock, chatId, message);

      await sock.sendMessage(chatId, {
        react: {
          text: "✅",
          key: message.key
        }
      });

    } catch (error) {
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
        { quoted: message }
      );
    }
  }
};
