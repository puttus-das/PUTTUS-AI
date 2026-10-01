const axios = require("axios");

module.exports = {
  command: "facebook",
  aliases: ["fb", "fbdl"],
  category: "download",
  description: "Download Facebook videos",
  usage: ".fb <facebook video link>",

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;

    try {
      /* =========================================================
         PUTTUS VCARD
      ========================================================= */

      const botJid = "919641092392@s.whatsapp.net";

      const vcard =
        "BEGIN:VCARD\n" +
        "VERSION:3.0\n" +
        "N:PUTTUS;BOT;;;\n" +
        "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
        "ORG:PUTTUS BOT\n" +
        "TEL;TYPE=CELL;TYPE=VOICE;waid=919641092392:+919641092392\n" +
        "END:VCARD";

      const statusQuote = {
        key: {
          remoteJid: "status@broadcast",
          fromMe: false,
          id: "PUTTUS-FB-" + Date.now(),
          participant: botJid,
        },
        message: {
          contactMessage: {
            displayName: "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
            vcard,
          },
        },
      };

      /* =========================================================
         GET FACEBOOK URL
      ========================================================= */

      const url = args.join(" ").trim();

      if (!url) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "📘 *⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜*\n\n" +
              "❯ *Usage:* .fb <Facebook video link>\n\n" +
              "❯ Example:\n" +
              ".fb https://www.facebook.com/...",
          },
          { quoted: statusQuote }
        );
      }

      /* =========================================================
         FACEBOOK URL CHECK
      ========================================================= */

      if (
        !/(facebook\.com|fb\.watch)/i.test(url)
      ) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *Invalid Facebook Link*\n\n" +
              "Please send a valid Facebook video or Reel URL.",
          },
          { quoted: statusQuote }
        );
      }

      /* =========================================================
         DOWNLOADING
      ========================================================= */

      await sock.sendMessage(chatId, {
        react: {
          text: "🔄",
          key: message.key,
        },
      });

      /* =========================================================
         RABBIT API
      ========================================================= */

      const apiUrl = "https://rabbitapi.zone.id/api/fb";

      const response = await axios.get(apiUrl, {
        params: {
          url: url,
        },
        timeout: 60000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; Mobile) " +
            "AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36",
          Accept: "application/json, text/plain, */*",
        },
      });

      const body = response?.data;

      console.log(
        "[RABBIT FB API RESPONSE]",
        JSON.stringify(body, null, 2)
      );

      /* =========================================================
         FIND VIDEO URL
      ========================================================= */

      let videoUrl = null;
      let quality = "Unknown";

      const findVideo = (obj) => {
        if (!obj || typeof obj !== "object") return null;

        const possibleKeys = [
          "url",
          "video",
          "videoUrl",
          "download",
          "downloadUrl",
          "download_url",
          "hd",
          "hdUrl",
          "hd_url",
          "sd",
          "sdUrl",
          "sd_url",
        ];

        for (const key of possibleKeys) {
          const value = obj[key];

          if (
            typeof value === "string" &&
            /^https?:\/\//i.test(value)
          ) {
            return {
              url: value,
              quality:
                key.toLowerCase().includes("hd")
                  ? "HD"
                  : key.toLowerCase().includes("sd")
                  ? "SD"
                  : "Unknown",
            };
          }
        }

        return null;
      };

      /* =========================================================
         SEARCH COMMON API STRUCTURES
      ========================================================= */

      const candidates = [
        body,
        body?.data,
        body?.result,
        body?.results,
        body?.data?.data,
        body?.data?.result,
        body?.result?.data,
      ];

      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          for (const item of candidate) {
            const found = findVideo(item);

            if (found) {
              videoUrl = found.url;
              quality = found.quality;
              break;
            }
          }
        } else {
          const found = findVideo(candidate);

          if (found) {
            videoUrl = found.url;
            quality = found.quality;
          }
        }

        if (videoUrl) break;
      }

      /* =========================================================
         RECURSIVE FALLBACK
      ========================================================= */

      const recursiveFind = (obj) => {
        if (!obj || typeof obj !== "object") return null;

        const direct = findVideo(obj);

        if (direct) return direct;

        if (Array.isArray(obj)) {
          for (const item of obj) {
            const result = recursiveFind(item);

            if (result) return result;
          }
        } else {
          for (const value of Object.values(obj)) {
            if (value && typeof value === "object") {
              const result = recursiveFind(value);

              if (result) return result;
            }
          }
        }

        return null;
      };

      if (!videoUrl) {
        const found = recursiveFind(body);

        if (found) {
          videoUrl = found.url;
          quality = found.quality;
        }
      }

      /* =========================================================
         NO VIDEO
      ========================================================= */

      if (!videoUrl) {
        throw new Error(
          "Rabbit API did not return a downloadable video URL"
        );
      }

      /* =========================================================
         SEND VIDEO
      ========================================================= */

      await sock.sendMessage(
        chatId,
        {
          video: {
            url: videoUrl,
          },
          mimetype: "video/mp4",
          caption:
            "📘 *⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜*\n\n" +
            `🎞 Quality: *${quality}*\n\n` +
            "> *_Downloaded by PUTTUS-AI_*",
        },
        {
          quoted: statusQuote,
        }
      );

      /* =========================================================
         SUCCESS
      ========================================================= */

      await sock.sendMessage(chatId, {
        react: {
          text: "✅",
          key: message.key,
        },
      });
    } catch (error) {
      console.error(
        "[PUTTUS FACEBOOK ERROR]",
        error?.response?.data || error?.message || error
      );

      try {
        await sock.sendMessage(chatId, {
          react: {
            text: "❌",
            key: message.key,
          },
        });

        await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *Facebook Download Failed*\n\n" +
              "Rabbit API did not return a downloadable video.\n\n" +
              "💡 Try another Facebook/Reel link.",
          },
          {
            quoted: message,
          }
        );
      } catch (sendError) {
        console.error(
          "[FACEBOOK SEND ERROR]",
          sendError?.message || sendError
        );
      }
    }
  },
};
