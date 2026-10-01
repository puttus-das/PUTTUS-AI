const axios = require("axios");

/* =========================================================
   CHANNEL / NEWSLETTER INFO
========================================================= */

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

/* =========================================================
   HELPERS
========================================================= */

function getChatId(message, options = {}) {
  return (
    options.chatId ||
    message?.key?.remoteJid
  );
}

function findAudioUrl(data) {
  if (!data) return null;

  if (typeof data === "string") {
    if (
      data.startsWith("http://") ||
      data.startsWith("https://")
    ) {
      return data;
    }

    return null;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findAudioUrl(item);

      if (found) return found;
    }

    return null;
  }

  if (typeof data === "object") {
    const possibleKeys = [
      "downloadUrl",
      "download_url",
      "audioUrl",
      "audio_url",
      "url",
      "link",
      "mediaUrl",
      "media_url",
      "audio",
      "download",
    ];

    for (const key of possibleKeys) {
      if (data[key]) {
        const found = findAudioUrl(data[key]);

        if (found) return found;
      }
    }

    for (const key of Object.keys(data)) {
      const found = findAudioUrl(data[key]);

      if (found) return found;
    }
  }

  return null;
}

/* =========================================================
   SONG COMMAND
========================================================= */

module.exports = {
  command: "song",

  aliases: [
    "play",
    "music",
    "mp3",
  ],

  category: "music",

  description:
    "Download song as MP3",

  usage:
    ".song <song name>",

  async handler(
    bot,
    message,
    args,
    options = {}
  ) {
    const chatId = getChatId(
      message,
      options
    );

    const query = args
      .join(" ")
      .trim();

    /* =====================================================
       CHECK QUERY
    ===================================================== */

    if (!query) {
      return await bot.sendMessage(
        chatId,
        {
          text:
            "🎵 *Song Downloader*\n\n" +
            "Usage:\n" +
            ".song <song name>",
          ...channelInfo,
        },
        {
          quoted: message,
        }
      );
    }

    try {
      /* ===================================================
         ONLY DOWNLOADING MESSAGE
         
         NO IMAGE
         NO TITLE
         NO DURATION
      =================================================== */

      await bot.sendMessage(
        chatId,
        {
          text:
            "*ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ... 𝐏ᴜᴛᴛᴜs-𝐀ɪ ᴡᴀɪᴛ...*",

          ...channelInfo,
        },
        {
          quoted: message,
        }
      );

      /* ===================================================
         API URL
      =================================================== */

      const apiUrl =
        "https://apis.davidcyril.name.ng/play";

      /* ===================================================
         REQUEST API
      =================================================== */

      const response = await axios.get(
        apiUrl,
        {
          params: {
            query: query,
          },

          timeout: 60000,

          headers: {
            Accept:
              "application/json",
          },
        }
      );

      const body = response.data;

      console.log(
        "SONG API RESPONSE:",
        JSON.stringify(
          body,
          null,
          2
        )
      );

      /* ===================================================
         API SUCCESS CHECK
      =================================================== */

      if (
        body?.success === false
      ) {
        throw new Error(
          body?.message ||
          "Song API failed"
        );
      }

      /* ===================================================
         FIND AUDIO URL
      =================================================== */

      const audioUrl =
        findAudioUrl(body);

      if (!audioUrl) {
        throw new Error(
          "Audio URL not found in API response"
        );
      }

      console.log(
        "AUDIO URL:",
        audioUrl
      );

      /* ===================================================
         SEND MP3
      =================================================== */

      await bot.sendMessage(
        chatId,
        {
          audio: {
            url: audioUrl,
          },

          mimetype:
            "audio/mpeg",

          fileName:
            "PUTTUS-AI.mp3",

          ptt: false,

          ...channelInfo,
        },
        {
          quoted: message,
        }
      );

    } catch (error) {
      console.error(
        "SONG ERROR:",
        error?.response?.data ||
        error?.message ||
        error
      );

      await bot.sendMessage(
        chatId,
        {
          text:
            "❌ *Download failed!*\n\n" +
            "Please try another song or try again later.",

          ...channelInfo,
        },
        {
          quoted: message,
        }
      );
    }
  },
};
