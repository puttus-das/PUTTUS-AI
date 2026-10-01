const axios = require("axios");

const AXIOS_DEFAULTS = {
  timeout: 60000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
  },
};

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
         GET URL
      ========================================================= */

      let url = args.join(" ").trim();

      if (!url) {
        const text =
          message.message?.conversation ||
          message.message?.extendedTextMessage?.text ||
          "";

        url = text
          .replace(/^\.?(facebook|fb|fbdl)\s*/i, "")
          .trim();
      }

      if (!url) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "📘 *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*\n\n" +
              "Usage:\n" +
              "*.fb <facebook video link>*",
          },
          { quoted: message },
        );
      }

      /* =========================================================
         FACEBOOK URL CHECK
      ========================================================= */

      const isFacebook =
        /(?:https?:\/\/)?(?:www\.|m\.|web\.)?(facebook\.com|fb\.watch)\//i.test(
          url,
        );

      if (!isFacebook) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *Invalid Facebook Link*\n\n" +
              "Please send a valid Facebook video or Reel URL.",
          },
          { quoted: message },
        );
      }

      await sock.sendMessage(chatId, {
        react: {
          text: "🔄",
          key: message.key,
        },
      });

      /* =========================================================
         FACEBOOK API
      ========================================================= */

      const apiUrl =
        "https://gtech-api-xtp1.onrender.com/api/download/fb" +
        `?url=${encodeURIComponent(url)}` +
        "&apikey=APIKEY";

      console.log("[FACEBOOK] URL:", url);

      const res = await axios.get(apiUrl, AXIOS_DEFAULTS);

      console.log(
        "[FACEBOOK] API RESPONSE:",
        JSON.stringify(res.data, null, 2),
      );

      const body = res?.data;

      /* =========================================================
         FIND VIDEO LIST
      ========================================================= */

      let videos = [];

      if (Array.isArray(body?.data?.data)) {
        videos = body.data.data;
      } else if (Array.isArray(body?.data)) {
        videos = body.data;
      } else if (Array.isArray(body?.result)) {
        videos = body.result;
      } else if (Array.isArray(body?.results)) {
        videos = body.results;
      }

      /* =========================================================
         SINGLE VIDEO RESULT
      ========================================================= */

      if (!videos.length) {
        const possible =
          body?.data?.url ||
          body?.data?.video ||
          body?.data?.hd ||
          body?.data?.sd ||
          body?.url ||
          body?.video;

        if (
          typeof possible === "string" &&
          /^https?:\/\//i.test(possible)
        ) {
          videos = [
            {
              url: possible,
              resolution: "Unknown",
            },
          ];
        }
      }

      if (!videos.length) {
        throw new Error(
          "No downloadable Facebook video found",
        );
      }

      /* =========================================================
         NORMALIZE RESULTS
      ========================================================= */

      const cleaned = videos
        .map((item) => {
          if (typeof item === "string") {
            return {
              url: item,
              resolution: "Unknown",
            };
          }

          return {
            url:
              item?.url ||
              item?.download ||
              item?.downloadUrl ||
              item?.video ||
              item?.link ||
              null,

            resolution:
              item?.resolution ||
              item?.quality ||
              item?.qualityLabel ||
              item?.format ||
              "Unknown",
          };
        })
        .filter(
          (item) =>
            typeof item.url === "string" &&
            /^https?:\/\//i.test(item.url),
        );

      if (!cleaned.length) {
        throw new Error("No valid video URL found");
      }

      /* =========================================================
         BEST QUALITY
      ========================================================= */

      cleaned.sort((a, b) => {
        const qa =
          parseInt(String(a.resolution).replace(/\D/g, "")) || 0;

        const qb =
          parseInt(String(b.resolution).replace(/\D/g, "")) || 0;

        return qb - qa;
      });

      const selected = cleaned[0];

      console.log("[FACEBOOK] SELECTED:", selected);

      /* =========================================================
         VIDEO CAPTION
      ========================================================= */

      const caption =
        "📘 *⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜*\n\n" +
        `🎞 Quality: *${selected.resolution}*\n\n` +
        "> *_Downloaded by PUTTUS-AI_*";

      /* =========================================================
         SEND VIDEO
      ========================================================= */

      await sock.sendMessage(
        chatId,
        {
          video: {
            url: selected.url,
          },
          mimetype: "video/mp4",
          caption: caption,
        },
        {
          quoted: message,
        },
      );

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

      /* =========================================================
         STATUS-STYLE CONTACT PREVIEW
      ========================================================= */

      const statusQuote = {
        key: {
          remoteJid: "status@broadcast",
          fromMe: false,
          id: "PUTTUS-" + Date.now(),
          participant: botJid,
        },
        message: {
          contactMessage: {
            displayName:
              "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
            vcard: vcard,
          },
        },
      };

      /* =========================================================
         SEND VCARD
      ========================================================= */

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
          quoted: statusQuote,
        },
      );

      /* =========================================================
         SUCCESS REACTION
      ========================================================= */

      await sock.sendMessage(chatId, {
        react: {
          text: "✅",
          key: message.key,
        },
      });
    } catch (err) {
      console.error("\n========== FACEBOOK ERROR ==========");
      console.error(err?.message || err);
      console.error(err?.response?.status);
      console.error(err?.response?.data);
      console.error("====================================\n");

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
              "The Facebook video could not be downloaded right now.\n\n" +
              "💡 Try another Facebook/Reel link.",
          },
          { quoted: message },
        );
      } catch (sendError) {
        console.error(
          "Error message failed:",
          sendError?.message || sendError,
        );
      }
    }
  },
};
