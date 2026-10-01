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

      /* =========================================================
         STATUS-STYLE CONTACT PREVIEW
      ========================================================= */

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
            vcard: vcard,
          },
        },
      };

      /* =========================================================
         GET URL
      ========================================================= */

      const url = args.join(" ").trim();

      if (!url) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "📘 *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*\n\n" +
              "Usage:\n" +
              "*.fb <facebook video link>*",
          },
          { quoted: statusQuote }
        );
      }

      /* =========================================================
         FACEBOOK URL CHECK
      ========================================================= */

      if (
        !/(?:https?:\/\/)?(?:www\.|m\.|web\.)?(facebook\.com|fb\.watch)\//i.test(
          url
        )
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

      const apiUrl =
        "https://gtech-api-xtp1.onrender.com/api/download/fb" +
        `?url=${encodeURIComponent(url)}` +
        "&apikey=APIKEY";

      const res = await axios.get(apiUrl, {
        timeout: 60000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 Chrome/140.0 Safari/537.36",
          Accept: "application/json, text/plain, */*",
        },
      });

      const body = res?.data;

      /* =========================================================
         FIND VIDEO RESULTS
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
         SINGLE VIDEO
      ========================================================= */

      if (!videos.length) {
        const videoUrl =
          body?.data?.url ||
          body?.data?.video ||
          body?.data?.hd ||
          body?.data?.sd ||
          body?.url ||
          body?.video;

        if (
          typeof videoUrl === "string" &&
          /^https?:\/\//i.test(videoUrl)
        ) {
          videos = [
            {
              url: videoUrl,
              resolution: "Unknown",
            },
          ];
        }
      }

      if (!videos.length) {
        throw new Error("No downloadable Facebook video found");
      }

      /* =========================================================
         CLEAN RESULTS
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
              item?.link,

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
            /^https?:\/\//i.test(item.url)
        );

      if (!cleaned.length) {
        throw new Error("No valid video URL found");
      }

      /* =========================================================
         SELECT BEST QUALITY
      ========================================================= */

      cleaned.sort((a, b) => {
        const qa =
          parseInt(String(a.resolution).replace(/\D/g, "")) || 0;

        const qb =
          parseInt(String(b.resolution).replace(/\D/g, "")) || 0;

        return qb - qa;
      });

      const selected = cleaned[0];

      /* =========================================================
         SEND VIDEO + VCARD QUOTE
      ========================================================= */

      await sock.sendMessage(
        chatId,
        {
          video: {
            url: selected.url,
          },
          mimetype: "video/mp4",
          caption:
            "📘 *⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜*\n\n" +
            `🎞 Quality: *${selected.resolution}*\n\n` +
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
    } catch (err) {
      console.error(
        "[FACEBOOK ERROR]",
        err?.message || err
      );

      try {
       
