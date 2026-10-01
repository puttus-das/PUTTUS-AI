const yts = require("yt-search");
const axios = require("axios");

/* =========================================================
   RATE LIMITER
========================================================= */

const rateLimiter = {
  queue: [],
  processing: false,
  lastRequest: 0,
  minDelay: 1000,

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject,
      });

      this.process();
    });
  },

  async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    const {
      fn,
      resolve,
      reject,
    } = this.queue.shift();

    const now = Date.now();
    const elapsed = now - this.lastRequest;

    if (elapsed < this.minDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minDelay - elapsed)
      );
    }

    this.lastRequest = Date.now();

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    }

    this.processing = false;
    this.process();
  },
};

/* =========================================================
   FETCH WITH RETRY
========================================================= */

async function fetchWithRetry(
  url,
  maxRetries = 3,
  baseDelay = 2000
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout: 30000,

        validateStatus: (status) => status < 500,
      });

      /* -------------------------
         RATE LIMIT
      ------------------------- */

      if (response.status === 429) {
        const retryAfter = response.headers["retry-after"]
          ? parseInt(response.headers["retry-after"]) * 1000
          : baseDelay * attempt;

        if (attempt < maxRetries) {
          console.log(
            `Rate limited. Retrying after ${retryAfter}ms...`
          );

          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter)
          );

          continue;
        }

        throw new Error(
          "Rate limit exceeded. Please try again later."
        );
      }

      /* -------------------------
         API ERROR
      ------------------------- */

      if (response.status >= 400) {
        throw new Error(
          `API error: ${response.status} - ${response.statusText}`
        );
      }

      return response.data;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay =
        baseDelay * Math.pow(2, attempt - 1);

      console.log(
        `Attempt ${attempt} failed. Retrying in ${delay}ms...`
      );

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );
    }
  }
}

/* =========================================================
   EXTRACT YOUTUBE VIDEO ID
========================================================= */

function extractVideoId(input) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const regex of patterns) {
    const match = input.match(regex);

    if (match) {
      return match[1];
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
    "music",
    "play",
    "mp3",
  ],

  category: "music",

  description:
    "Download song from YouTube (MP3)",

  usage:
    ".song <song name | youtube link>",

  async handler(
    bot,
    message,
    args,
    options = {}
  ) {
    const chatId =
      options.chatId ||
      message?.key?.remoteJid;

    const query = args.join(" ").trim();

    /* =====================================================
       NO QUERY
    ===================================================== */

    if (!query) {
      return await bot.sendMessage(
        chatId,
        {
          text:
            "🎵 *Song Downloader*\n\n" +
            "Usage:\n" +
            ".song <song name | YouTube link>",
        },
        {
          quoted: message,
        }
      );
    }

    try {
      let videoInfo;
      let downloadQuery;

      /* ===================================================
         YOUTUBE LINK
      =================================================== */

      if (
        query.includes("youtube.com") ||
        query.includes("youtu.be")
      ) {
        downloadQuery = query;

        try {
          const videoId = extractVideoId(query);

          if (videoId) {
            videoInfo = await yts({
              videoId,
            });
          }
        } catch (error) {
          console.log(
            "Could not fetch video info:",
            error?.message
          );
        }
      }

      /* ===================================================
         SEARCH QUERY
      =================================================== */

      else {
        const searchResult = await yts(query);

        if (
          !searchResult?.videos ||
          searchResult.videos.length === 0
        ) {
          return await bot.sendMessage(
            chatId,
            {
              text:
                "❌ *No results found.*\n\n" +
                "Please try a different search term.",
            },
            {
              quoted: message,
            }
          );
        }

        videoInfo = searchResult.videos[0];

        downloadQuery = videoInfo.url;
      }

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
        },
        {
          quoted: message,
        }
      );

      /* ===================================================
         DOWNLOAD API
      =================================================== */

      const result = await rateLimiter.add(async () => {
        const apiUrl =
          "https://api.qasimdev.dpdns.org/api/loaderto/download" +
          "?apiKey=qasim-dev" +
          "&format=mp3" +
          "&url=" +
          encodeURIComponent(downloadQuery);

        return await fetchWithRetry(apiUrl);
      });

      /* ===================================================
         VALIDATE API RESPONSE
      =================================================== */

      if (
        !result ||
        !result.success ||
        !result.data ||
        !result.data.downloadUrl
      ) {
        throw new Error(
          "Invalid API response"
        );
      }

      const data = result.data;

      /* ===================================================
         GET DOWNLOAD URLS
      =================================================== */

      const downloadUrls = [
        data.downloadUrl,

        ...(data.alternativeUrls
          ?.filter((item) => item?.url)
          .map((item) => item.url) || []),
      ];

      /* ===================================================
         SEND MP3
      =================================================== */

      let sent = false;

      for (const audioUrl of downloadUrls) {
        try {
          await bot.sendMessage(
            chatId,
            {
              audio: {
                url: audioUrl,
              },

              mimetype: "audio/mpeg",

              fileName:
                (
                  data.title ||
                  videoInfo?.title ||
                  "PUTTUS-AI"
                ) + ".mp3",

              ptt: false,
            },
            {
              quoted: message,
            }
          );

          sent = true;
          break;
        } catch (error) {
          console.log(
            `Failed to send from ${audioUrl}:`,
            error?.message
          );

          continue;
        }
      }

      /* ===================================================
         ALL URLS FAILED
      =================================================== */

      if (!sent) {
        throw new Error(
          "All download URLs failed"
        );
      }

    } catch (error) {
      console.error(
        "Song plugin error:",
        error
      );

      let errorMessage =
        "❌ *Failed to download song.*\n\n";

      const errorText =
        error?.message || "";

      if (
        errorText.includes("Rate limit") ||
        errorText.includes("429")
      ) {
        errorMessage +=
          "⚠️ Service is busy. Please try again in a minute.";
      }

      else if (
        errorText.includes("API error")
      ) {
        errorMessage +=
          "⚠️ Service is temporarily unavailable.";
      }

      else if (
        errorText.includes("timeout") ||
        errorText.includes("timed out")
      ) {
        errorMessage +=
          "Download timed out. Try a shorter video.";
      }

      else if (
        errorText.includes("Invalid API response")
      ) {
        errorMessage +=
          "⚠️ Download service returned an invalid response.";
      }

      else {
        errorMessage +=
          "Please try again later.";
      }

      await bot.sendMessage(
        chatId,
        {
          text: errorMessage,
        },
        {
          quoted: message,
        }
      );
    }
  },
};
