const axios = require("axios");

/* =========================================================
   PUTTUS-AI — FACEBOOK DOWNLOADER
========================================================= */

const HTTP_CONFIG = {
  timeout: 60000,
  maxContentLength: 50 * 1024 * 1024,
  maxBodyLength: 50 * 1024 * 1024,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
  },
};

/* =========================================================
   FACEBOOK URL CHECK
========================================================= */

function isFacebookUrl(url) {
  return /^(https?:\/\/)?(www\.|m\.|mbasic\.)?(facebook\.com|fb\.watch)\//i.test(
    url.trim(),
  );
}

/* =========================================================
   GET URL FROM DIFFERENT API RESPONSES
========================================================= */

function findVideoUrl(data) {
  if (!data) return null;

  const candidates = [];

  function scan(value, depth = 0) {
    if (!value || depth > 8) return;

    if (typeof value === "string") {
      if (
        /^https?:\/\//i.test(value) &&
        (
          /\.mp4(\?|$)/i.test(value) ||
          /video/i.test(value) ||
          /fbcdn/i.test(value)
        )
      ) {
        candidates.push(value);
      }

      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        scan(item, depth + 1);
      }

      return;
    }

    if (typeof value === "object") {
      for (const [key, val] of Object.entries(value)) {
        const keyName = key.toLowerCase();

        if (
          typeof val === "string" &&
          /^https?:\/\//i.test(val) &&
          (
            keyName.includes("url") ||
            keyName.includes("video") ||
            keyName.includes("download") ||
            keyName.includes("hd") ||
            keyName.includes("sd")
          )
        ) {
          candidates.push(val);
        }

        scan(val, depth + 1);
      }
    }
  }

  scan(data);

  return candidates.find((url) => /^https?:\/\//i.test(url)) || null;
}

/* =========================================================
   GET QUALITY
========================================================= */

function getQuality(data) {
  const possible =
    data?.resolution ||
    data?.quality ||
    data?.video_info?.quality ||
    data?.videoInfo?.quality ||
    data?.format ||
    "Best";

  return String(possible);
}

/* =========================================================
   MAIN PLUGIN
========================================================= */

module.exports = {
  command: "facebook",

  aliases: ["fb", "fbdl"],

  category: "download",

  description: "Download Facebook videos",

  usage: ".fb <facebook video link>",

  async handler(sock, message, args = [], context = {}) {
    const chatId =
      context?.chatId ||
      message?.key?.remoteJid;

    try {
      /* =====================================================
         GET URL
      ===================================================== */

      let url = args.join(" ").trim();

      if (!url) {
        url =
          message?.message?.conversation ||
          message?.message?.extendedTextMessage?.text ||
          "";
      }

      url = url.trim();

      /* Remove command if it accidentally came through text */
      url = url
        .replace(/^\.?(facebook|fb|fbdl)\s*/i, "")
        .trim();

      /* =====================================================
         NO URL
      ===================================================== */

      if (!url) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "📘 *Facebook Downloader*\n\n" +
              "❯ Usage: *.fb <facebook video link>*",
          },
          {
            quoted: message,
          },
        );
      }

      /* =====================================================
         INVALID URL
      ===================================================== */

      if (!isFacebookUrl(url)) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *Invalid Facebook link!*\n\n" +
              "Please send a valid public Facebook video/Reel URL.",
          },
          {
            quoted: message,
          },
        );
      }

      /* =====================================================
         REACT
      ===================================================== */

      await sock.sendMessage(chatId, {
        react: {
          text: "🔄",
          key: message.key,
        },
      });

      /* =====================================================
         DOWNLOAD MESSAGE
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          text:
            "⏳ *Downloading...*\n\n" +
            "𝙋𝙐𝙏𝙏𝙐𝙎-𝘼𝙄\n" +
            "Please wait...",
        },
        {
          quoted: message,
        },
      );

      /* =====================================================
         API
         
         IMPORTANT:
         Replace this with YOUR working API endpoint.
         The old APIKEY placeholder has intentionally
         been removed.
      ===================================================== */

      const apiUrl =
        "https://fdown.isuru.eu.org/download";

      let response;

      try {
        response = await axios.post(
          apiUrl,
          {
            url,
            quality: "best",
          },
          {
            ...HTTP_CONFIG,
            headers: {
              ...HTTP_CONFIG.headers,
              "Content-Type": "application/json",
            },
          },
        );
      } catch (apiError) {
        console.error(
          "Facebook API request failed:",
          apiError?.response?.data ||
            apiError?.message,
        );

        throw new Error(
          "Facebook API request failed",
        );
      }

      /* =====================================================
         API RESPONSE
      ===================================================== */

      const data = response?.data;

      console.log(
        "[FACEBOOK API RESPONSE]",
        JSON.stringify(data, null, 2),
      );

      if (
        !data ||
        data.status === "error"
      ) {
        throw new Error(
          data?.message ||
            "API could not process the Facebook URL",
        );
      }

      /* =====================================================
         FIND VIDEO URL
      ===================================================== */

      const videoUrl =
        data?.download_url ||
        data?.downloadUrl ||
        data?.url ||
        data?.video_url ||
        data?.videoUrl ||
        data?.data?.download_url ||
        data?.data?.downloadUrl ||
        data?.data?.url ||
        data?.data?.video_url ||
        data?.data?.videoUrl ||
        findVideoUrl(data);

      if (
        !videoUrl ||
        !/^https?:\/\//i.test(videoUrl)
      ) {
        throw new Error(
          "No downloadable video URL returned by API",
        );
      }

      /* =====================================================
         QUALITY
      ===================================================== */

      const quality = getQuality(
        data?.video_info ||
          data?.videoInfo ||
          data,
      );

      /* =====================================================
         CAPTION
      ===================================================== */

      const caption =
        "📘 *Facebook Downloader*\n\n" +
        `🎞 Quality: ${quality}\n` +
        "🤖 𝙋𝙐𝙏𝙏𝙐𝙎-𝘼𝙄";

      /* =====================================================
         SEND VIDEO
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          video: {
            url: videoUrl,
          },
          mimetype: "video/mp4",
          caption,
        },
        {
          quoted: message,
        },
      );

      /* =====================================================
         SUCCESS REACTION
      ===================================================== */

      await sock.sendMessage(chatId, {
        react: {
          text: "✅",
          key: message.key,
        },
      });
    } catch (error) {
      console.error(
        "❌ Facebook downloader error:",
        error?.response?.data ||
          error?.message ||
          error,
      );

      try {
        await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *Facebook download failed!*\n\n" +
              "The video could not be downloaded.\n\n" +
              "💡 Make sure the Facebook video is public and try again.",
          },
          {
            quoted: message,
          },
        );
m
        await sock.sendMessage(chatId, {
          react: {
            text: "❌",
            key: message.key,
          },
        });
      } catch (sendError) {
        console.error(
          "Facebook error message failed:",
          sendError?.message,
        );
      }
    }
  },
};
