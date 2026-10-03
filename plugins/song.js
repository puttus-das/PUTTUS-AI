/*****************************************************************************
 *                     Developed By Puttus Das                              *
 *                                                                           *
 *    Description: PUTTUS-AI Song Downloader                                 *
 *****************************************************************************/

const SEARCH_API =
  "https://rabbitapi.zone.id/search/youtube";

const SONG_API =
  "https://rabbitapi.zone.id/api/song";

module.exports = {
  command: "song",
  aliases: ["music", "play"],
  category: "download",
  description: "Search and download YouTube song",
  usage: ".song <song name>",

  async handler(sock, message, args = [], context = {}) {
    const chatId =
      context?.chatId ||
      message?.key?.remoteJid;

    if (!chatId) return;

    try {
      const query = args.join(" ").trim();

      // ───────────── CHECK QUERY ─────────────

      if (!query) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *Song name dao!*\n\n` +
              `Example:\n` +
              `.song Alan Walker Faded`
          },
          { quoted: message }
        );
      }

      // ───────────── REACTION ─────────────

      await sock.sendMessage(chatId, {
        react: {
          text: "🎵",
          key: message.key
        }
      });

      let videoUrl = query;

      // ───────────── CHECK DIRECT YOUTUBE URL ─────────────

      const isYouTubeUrl =
        /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i
          .test(query);

      // ───────────── SEARCH YOUTUBE ─────────────

      if (!isYouTubeUrl) {
        const searchUrl =
          `${SEARCH_API}?q=${encodeURIComponent(query)}&limit=15`;

        const searchResponse = await fetch(
          searchUrl,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "User-Agent": "PUTTUS-AI"
            }
          }
        );

        if (!searchResponse.ok) {
          throw new Error(
            `Search API HTTP ${searchResponse.status}`
          );
        }

        const searchData =
          await searchResponse.json();

        if (searchData?.status !== true) {
          return await sock.sendMessage(
            chatId,
            {
              text:
                `❌ *YouTube search failed.*\n\n` +
                `${searchData?.message || "No results found."}`
            },
            { quoted: message }
          );
        }

        const results = Array.isArray(
          searchData?.result
        )
          ? searchData.result
          : [];

        if (!results.length) {
          return await sock.sendMessage(
            chatId,
            {
              text:
                "❌ *এই নামে কোনো গান পাওয়া যায়নি।*"
            },
            { quoted: message }
          );
        }

        // First YouTube result
        videoUrl = results[0]?.url;

        if (!videoUrl) {
          return await sock.sendMessage(
            chatId,
            {
              text:
                "❌ *YouTube result-এর URL পাওয়া যায়নি।*"
            },
            { quoted: message }
          );
        }
      }

      // ───────────── SONG API ─────────────

      const songUrl =
        `${SONG_API}?url=${encodeURIComponent(videoUrl)}`;

      const songResponse = await fetch(
        songUrl,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "PUTTUS-AI"
          }
        }
      );

      if (!songResponse.ok) {
        throw new Error(
          `Song API HTTP ${songResponse.status}`
        );
      }

      const songData =
        await songResponse.json();

      // Rabbit successful response:
      //
      // {
      //   success: true,
      //   query: "...",
      //   result: {
      //     title: "...",
      //     duration: "3.55 min",
      //     quality: "128kbps",
      //     thumbnail: "...",
      //     format: "MP3",
      //     url: "...mp3",
      //     mp3: "...mp3",
      //     audio: "...mp3",
      //     download: "...mp3"
      //   }
      // }

      if (songData?.success !== true) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *Song download failed.*\n\n` +
              `${songData?.message || "Rabbit API failed."}`
          },
          { quoted: message }
        );
      }

      const result =
        songData?.result || {};

      // ───────────── AUDIO URL ─────────────

      const audioUrl =
        result?.url ||
        result?.mp3 ||
        result?.audio ||
        result?.download;

      if (
        !audioUrl ||
        typeof audioUrl !== "string"
      ) {
        console.log(
          "Rabbit Song API Response:",
          JSON.stringify(
            songData,
            null,
            2
          )
        );

        return await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *Audio পাওয়া যায়নি।*\n\n` +
              `Rabbit API কোনো valid audio URL দেয়নি।`
          },
          { quoted: message }
        );
      }

      // ───────────── SONG INFORMATION ─────────────

      const title =
        result?.title ||
        query;

      const duration =
        result?.duration ||
        "Unknown";

      const quality =
        result?.quality ||
        "128kbps";

      // ───────────── SEND AUDIO ─────────────

      await sock.sendMessage(
        chatId,
        {
          audio: {
            url: audioUrl
          },
          mimetype: "audio/mpeg",
          fileName:
            `${title.replace(/[\\/:*?"<>|]/g, "")}.mp3`,
          ptt: false
        },
        { quoted: message }
      );

      // ───────────── SUCCESS REACTION ─────────────

      await sock.sendMessage(chatId, {
        react: {
          text: "✅",
          key: message.key
        }
      });

      console.log(
        `PUTTUS-AI SONG SENT: ${title} | ${duration} | ${quality}`
      );

    } catch (error) {
      console.error(
        "PUTTUS-AI SONG ERROR:",
        error
      );

      await sock.sendMessage(
        chatId,
        {
          text:
            `❌ *Song download failed.*\n\n` +
            `আবার একটু পরে try করো।`
        },
        { quoted: message }
      );
    }
  }
};
