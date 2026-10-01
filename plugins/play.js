const axios = require("axios");

module.exports = {
  command: "play",
  aliases: ["plays", "music"],
  category: "music",
  description: "Search and download a song as MP3 from Spotify",
  usage: ".play <song name>",

  async handler(sock, message, args, context = {}) {
    const chatId =
      context.chatId || message.key.remoteJid;

    const searchQuery =
      args.join(" ").trim();

    // =========================================================
    // HELPERS
    // =========================================================

    const wait = (ms) =>
      new Promise((resolve) =>
        setTimeout(resolve, ms)
      );

    const apiCallWithRetry = async (
      url,
      maxRetries = 3,
      baseDelay = 2000
    ) => {
      for (
        let attempt = 1;
        attempt <= maxRetries;
        attempt++
      ) {
        try {
          await wait(1000);

          const response = await axios.get(
            url,
            {
              timeout: 45000,

              headers: {
                "User-Agent":
                  "Mozilla/5.0",
                Accept:
                  "application/json",
              },
            }
          );

          return response;
        } catch (error) {
          const retryable =
            error.response?.status ===
              429 ||
            error.code ===
              "ECONNABORTED" ||
            error.code ===
              "ETIMEDOUT";

          if (
            attempt === maxRetries
          ) {
            throw error;
          }

          if (retryable) {
            const delay =
              baseDelay *
              Math.pow(
                2,
                attempt - 1
              );

            console.log(
              `Retrying in ${delay}ms... ` +
                `(Attempt ${attempt}/${maxRetries})`
            );

            await wait(delay);
          } else {
            throw error;
          }
        }
      }
    };

    try {
      // =======================================================
      // CHECK QUERY
      // =======================================================

      if (!searchQuery) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "*Which song do you want to play?*\n\n" +
              "Usage: .play <song name>",
          },
          {
            quoted: message,
          }
        );
      }

      // =======================================================
      // SEARCH
      // =======================================================

      await sock.sendMessage(
        chatId,
        {
          text:
            "🔍 *Searching for your song...*",
        },
        {
          quoted: message,
        }
      );

      const searchUrl =
        "https://api.qasimdev.dpdns.org/api/spotify/search" +
        `?apiKey=qasim-dev&query=${encodeURIComponent(
          searchQuery
        )}`;

      const searchResponse =
        await apiCallWithRetry(
          searchUrl
        );

      if (
        !searchResponse.data?.success ||
        !searchResponse.data?.data?.tracks ||
        searchResponse.data.data
          .tracks.length === 0
      ) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *No songs found!*\n" +
              "Try a different search term.",
          },
          {
            quoted: message,
          }
        );
      }

      const topResult =
        searchResponse.data.data
          .tracks[0];

      const spotifyUrl =
        topResult.url;

      if (!spotifyUrl) {
        throw new Error(
          "Spotify URL not found."
        );
      }

      // =======================================================
      // DOWNLOAD API
      // =======================================================

      await wait(1500);

      const downloadUrl =
        "https://api.qasimdev.dpdns.org/api/spotify/download" +
        `?apiKey=qasim-dev&url=${encodeURIComponent(
          spotifyUrl
        )}`;

      const downloadResponse =
        await apiCallWithRetry(
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
              "The API couldn't fetch the audio.",
          },
          {
            quoted: message,
          }
        );
      }

      const songData =
        downloadResponse.data.data;

      const audioUrl =
        songData.download;

      const title =
        songData.title ||
        searchQuery;

      const artist =
        songData.artist ||
        "Unknown Artist";

      if (!audioUrl) {
        throw new Error(
          "Audio download URL is missing."
        );
      }

      console.log(
        "Audio URL:",
        audioUrl
      );

      // =======================================================
      // PUTTUS VCARD
      // =======================================================

      const botJid =
        "919641092392@s.whatsapp.net";

      const vcard =
        "BEGIN:VCARD\n" +
        "VERSION:3.0\n" +
        "N:PUTTUS;BOT;;;\n" +
        "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
        "ORG:PUTTUS BOT\n" +
        "TEL;TYPE=CELL;TYPE=VOICE;" +
        "waid=919641092392:" +
        "+919641092392\n" +
        "END:VCARD";

      // =======================================================
      // CHANNEL INFO
      // =======================================================

      const channelInfo = {
        forwardingScore: 1,

        isForwarded: true,

        forwardedNewsletterMessageInfo: {
          newsletterJid:
            "120363411471428911@newsletter",

          newsletterName:
            "━[ 𝐏ᴜᴛᴛᴜꜱ - 𝐃ᴀꜱ]━",

          serverMessageId: -1,
        },
      };

      // =======================================================
      // SEND VCARD
      // =======================================================

      const vcardMessage =
        await sock.sendMessage(
          chatId,
          {
            contacts: {
              displayName:
                "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",

              contacts: [
                {
                  displayName:
                    "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",

                  vcard: vcard,
                },
              ],
            },
          },
          {
            quoted: message,
          }
        );

      // =======================================================
      // SEND MP3 DIRECTLY FROM API URL
      // =======================================================

      await sock.sendMessage(
        chatId,
        {
          audio: {
            url: audioUrl,
          },

          mimetype:
            "audio/mpeg",

          fileName:
            `${title} - ${artist}.mp3`,

          // Normal long WhatsApp
          // music player
          ptt: false,

          contextInfo: {
            ...channelInfo,
          },
        },
        {
          quoted:
            vcardMessage,
        }
      );

      console.log(
        `Successfully sent: ${title}`
      );

    } catch (error) {
      // =======================================================
      // ERROR
      // =======================================================

      console.error(
        "Play Command Error:",
        error
      );

      let errorMsg =
        "❌ *Download failed!*\n\n";

      if (
        error.code ===
          "ETIMEDOUT" ||
        error.code ===
          "ECONNABORTED"
      ) {
        errorMsg +=
          "*Reason:* Connection timeout\n" +
          "The server took too long to respond.";
      } else if (
        error.response?.status ===
        429
      ) {
        errorMsg +=
          "*Reason:* Rate limit exceeded\n" +
          "Please wait a little and try again.";
      } else if (
        error.response?.status
      ) {
        errorMsg +=
          `*Status:* ${error.response.status}\n` +
          `*Error:* ${error.response.statusText}`;
      } else {
        errorMsg +=
          `*Error:* ${error.message}`;
      }

      errorMsg +=
        "\n\n💡 *Tip:* Wait 10-15 seconds between requests.";

      await sock.sendMessage(
        chatId,
        {
          text: errorMsg,
        },
        {
          quoted: message,
        }
      );
    }
  },
};

এবার flow হবে: ".play song" → search → PUTTUS VCard → normal "audio/mpeg" MP3 long player, এবং MP3-এর message-এ তোমার Puttus Das channel-forward info থাকবে।

একটা জিনিস খেয়াল রেখো: যদি এই version-এও "404" আসে, তাহলে সেটা আর MP3 Buffer code-এর সমস্যা নয়—API যে "download" URL দিচ্ছে সেটাই 404/expired, তখন API endpoint বদলাতে হবে।
