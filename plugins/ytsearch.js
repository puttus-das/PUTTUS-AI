/*****************************************************************************
 *                     Developed By Puttus Das                              *
 *                                                                           *
 *    Description: PUTTUS-AI YouTube Search Plugin                          *
 *****************************************************************************/

const settings = require("../settings");

const YT_SEARCH_API = "https://rabbitapi.zone.id/search/youtube";

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
      settings?.prefixes?.[0] ||
      ".";

    // ───────────── CHECK QUERY ─────────────

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
      // ───────────── REACTION ─────────────

      await sock.sendMessage(chatId, {
        react: {
          text: "🔍",
          key: message.key
        }
      });

      // ───────────── RABBIT SEARCH API ─────────────

      const apiUrl =
        `${YT_SEARCH_API}?q=${encodeURIComponent(query)}&limit=15`;

      const response = await fetch(apiUrl, {
        method: "GET",
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

      // Rabbit API:
      // {
      //   status: true,
      //   query: "...",
      //   total: 15,
      //   result: [...]
      // }

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

      // ───────────── BUILD RESULT ─────────────

      let searchText =
        `╭─〔 *𝐏ᴜᴛᴛᴜs-Bᴏᴛ* 〕─╮\n` +
        `│ 🔎 *YOUTUBE SEARCH*\n` +
        `│\n`;

      videos.forEach((video, index) => {
        const number = index + 1;

        searchText +=
          `│ *${number}.* ${video?.title || "Unknown"}\n` +
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

      // ───────────── SEND IMAGE + RESULTS ─────────────

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

      // ───────────── SUCCESS REACTION ─────────────

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
