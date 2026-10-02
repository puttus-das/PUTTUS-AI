const SEARCH_API = "https://rabbitapi.zone.id/search/youtube";
const SONG_API = "https://rabbitapi.zone.id/api/song";

module.exports = {
  command: "song",
  aliases: ["music", "play"],
  category: "download",
  description: "Search and download YouTube song",
  usage: ".song <song name>",

  async handler(sock, message, args = []) {
    const chatId = message?.key?.remoteJid;

    if (!chatId) return;

    try {
      const query = args.join(" ").trim();

      // ───────────── CHECK QUERY ─────────────
      if (!query) {
        return await sock.sendMessage(chatId, {
          text:
            "❌ *Song name dao!*\n\n" +
            "Example:\n" +
            "`.song Alan Walker Faded`"
        });
      }

      // ───────────── SEARCH YOUTUBE ─────────────
      const searchUrl =
        `${SEARCH_API}?q=${encodeURIComponent(query)}&limit=5`;

      const searchResponse = await fetch(searchUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "PUTTUS-AI"
        }
      });

      if (!searchResponse.ok) {
        throw new Error(
          `Search API HTTP ${searchResponse.status}`
        );
      }

      const searchData = await searchResponse.json();

      // ───────────── GET FIRST RESULT ─────────────
      const results =
        searchData?.response?.results ||
        searchData?.results ||
        searchData?.data ||
        searchData?.result ||
        [];

      let firstResult = Array.isArray(results)
        ? results[0]
        : results;

      if (!firstResult) {
        return await sock.sendMessage(chatId, {
          text: "❌ *Song খুঁজে পাওয়া যায়নি।*"
        });
      }

      // ───────────── FIND YOUTUBE URL ─────────────
      let videoUrl =
        firstResult?.url ||
        firstResult?.videoUrl ||
        firstResult?.video_url ||
        firstResult?.link ||
        firstResult?.video ||
        firstResult?.watch;

      // Sometimes API may directly return a URL string
      if (typeof firstResult === "string") {
        videoUrl = firstResult;
      }

      if (!videoUrl || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(videoUrl)) {
        return await sock.sendMessage(chatId, {
          text: "❌ *YouTube result-এর URL পাওয়া যায়নি।*"
        });
      }

      // ───────────── SONG API ─────────────
      const songUrl =
        `${SONG_API}?url=${encodeURIComponent(videoUrl)}`;

      const songResponse = await fetch(songUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "PUTTUS-AI"
        }
      });

      if (!songResponse.ok) {
        throw new Error(
          `Song API HTTP ${songResponse.status}`
        );
      }

      const songData = await songResponse.json();

      // ───────────── GET AUDIO URL ─────────────
      const audioUrl =
        songData?.url ||
        songData?.download ||
        songData?.downloadUrl ||
        songData?.download_url ||
        songData?.audio ||
        songData?.audioUrl ||
        songData?.audio_url ||
        songData?.result?.url ||
        songData?.result?.download ||
        songData?.result?.downloadUrl ||
        songData?.result?.audio ||
        songData?.result?.audioUrl ||
        songData?.data?.url ||
        songData?.data?.download ||
        songData?.data?.downloadUrl ||
        songData?.data?.audio ||
        songData?.data?.audioUrl;

      if (!audioUrl || typeof audioUrl !== "string") {
        console.log(
          "Rabbit Song API response:",
          JSON.stringify(songData, null, 2)
        );

        return await sock.sendMessage(chatId, {
          text:
            "❌ *Audio পাওয়া যায়নি।*\n\n" +
            "Rabbit API কোনো valid audio URL দেয়নি।"
        });
      }

      // ───────────── SEND AUDIO ─────────────
      await sock.sendMessage(chatId, {
        audio: {
          url: audioUrl
        },
        mimetype: "audio/mpeg",
        ptt: false
      });

    } catch (error) {
      console.error("PUTTUS-AI SONG ERROR:", error);

      await sock.sendMessage(chatId, {
        text:
          "❌ *Song download failed.*\n\n" +
          "আবার একটু পরে try করো।"
      });
    }
  }
};
