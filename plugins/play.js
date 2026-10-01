const axios = require("axios");

module.exports = {
  command: "play",
  aliases: ["plays", "music"],
  category: "music",
  description: "Search and download a song as MP3 from Spotify",
  usage: ".play <song name>",

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const searchQuery = args.join(" ").trim();

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const apiCallWithRetry = async (
      url,
      maxRetries = 3,
      baseDelay = 2000
    ) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await wait(1000);

          const response = await axios.get(url, {
            timeout: 45000,
            headers: {
              "User-Agent": "Mozilla/5.0",
            },
          });

          return response;
        } catch (error) {
          const isRateLimited =
            error.response?.status === 429 ||
            error.code === "ECONNABORTED" ||
            error.code === "ETIMEDOUT";

          if (attempt === maxRetries) {
            throw error;
          }

          if (isRateLimited) {
            const delay = baseDelay * Math.pow(2, attempt - 1);

            console.log(
              `Rate limited or timeout. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`
            );

            await wait(delay);
          } else {
            throw error;
          }
        }
      }
    };

    try {
      if (!searchQuery) {
        return await sock.sendMessage(
          chatId,
          {
            text: "*Which song do you want to play?*\nUsage: .play <song name>",
          },
          { quoted: message }
        );
      }

      await sock.sendMessage(
        chatId,
        {
          text: "🔍 *Searching for your song...*",
        },
        { quoted: message }
      );

      // ━━━━━ SEARCH ━━━━━

      const searchUrl =
        `https://api.qasimdev.dpdns.org/api/spotify/search` +
        `?apiKey=qasim-dev&query=${encodeURIComponent(searchQuery)}`;

      const searchResponse = await apiCallWithRetry(searchUrl);

      if (
        !searchResponse.data?.success ||
        !searchResponse.data?.data?.tracks ||
        searchResponse.data.data.tracks.length === 0
      ) {
        return await sock.sendMessage(
          chatId,
          {
            text: "❌ *No songs found!*\nTry a different search term.",
          },
          { quoted: message }
        );
      }

      const topResult = searchResponse.data.data.tracks[0];
      const spotifyUrl = topResult.url;

      // ━━━━━ DOWNLOAD ━━━━━

      await wait(1500);

      const downloadUrl =
        `https://api.qasimdev.dpdns.org/api/spotify/download` +
        `?apiKey=qasim-dev&url=${encodeURIComponent(spotifyUrl)}`;

      const downloadResponse = await apiCallWithRetry(
        downloadUrl,
        3,
        3000
      );

      if (
        !downloadResponse.data?.success ||
        !downloadResponse.data?.data?.download
      ) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *Download failed!*\n" +
              "The API couldn't fetch the audio. Try again later.",
          },
          { quoted: message }
        );
      }

      const songData = downloadResponse.data.data;

      const audioUrl = songData.download;
      const title = songData.title;
      const artist = songData.artist;
      const coverImage = songData.cover;
      const durationMs = songData.duration;

      // ━━━━━ DURATION ━━━━━

      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);

      const formattedDuration =
        `${minutes}:${seconds.toString().padStart(2, "0")}`;

      // ━━━━━ COVER IMAGE ━━━━━

      let thumbnailBuffer = null;

      if (coverImage) {
        try {
          await wait(1000);

          const imgResponse = await axios.get(coverImage, {
            responseType: "arraybuffer",
            timeout: 30000,
          });

          thumbnailBuffer = Buffer.from(imgResponse.data);
        } catch (imgError) {
          console.error(
            "Failed to fetch cover image:",
            imgError.message
          );
        }
      }

      // ━━━━━ PUTTUS VCARD ━━━━━

      const botJid = "919641092392@s.whatsapp.net";

      const vcard =
        "BEGIN:VCARD\n" +
        "VERSION:3.0\n" +
        "N:PUTTUS;BOT;;;\n" +
        "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
        "ORG:PUTTUS BOT\n" +
        "TEL;TYPE=CELL;TYPE=VOICE;waid=919641092392:+919641092392\n" +
        "END:VCARD";

      // ━━━━━ STATUS-STYLE CONTACT PREVIEW ━━━━━

      const statusQuote = {
        key: {
          remoteJid: "status@broadcast",
          fromMe: false,
          id: "PUTTUS-" + Date.now(),
          participant: botJid,
        },
        message: {
          contactMessage: {
            displayName: "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
            vcard: vcard,
          },
        },
      };

      // ━━━━━ SEND AUDIO ━━━━━

      await sock.sendMessage(
        chatId,
        {
          audio: {
            url: audioUrl,
          },
          mimetype: "audio/mpeg",
          fileName: `${title} - ${artist}.mp3`,

          contextInfo: {
            externalAdReply: {
              title: title,
              body: `${artist} • ${formattedDuration}`,
              thumbnail: thumbnailBuffer,
              mediaType: 2,
              mediaUrl: spotifyUrl,
              sourceUrl: spotifyUrl,
            },
          },
        },
        {
          quoted: statusQuote,
        }
      );
    } catch (error) {
      console.error("Play Command Error:", error);

      let errorMsg = "❌ *Download failed!*\n\n";

      if (
        error.code === "ETIMEDOUT" ||
        error.code === "ECONNABORTED"
      ) {
        errorMsg +=
          "*Reason:* Connection timeout\n" +
          "The API took too long to respond.";
      } else if (error.response?.status === 429) {
        errorMsg +=
          "*Reason:* Rate limit exceeded\n" +
          "Too many requests. Please wait a minute and try again.";
      } else if (error.response) {
        errorMsg +=
          `*Status:* ${error.response.status}\n` +
          `*Error:* ${error.response.statusText}`;
      } else {
        errorMsg += `*Error:* ${error.message}`;
      }

      errorMsg +=
        "\n\n💡 *Tip:* Wait 10-15 seconds between requests to avoid rate limits.";

      await sock.sendMessage(
        chatId,
        {
          text: errorMsg,
        },
        { quoted: message }
      );
    }
  },
};
