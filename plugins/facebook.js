const axios = require("axios");

const AXIOS_DEFAULTS = {
  timeout: 60000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
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

    const url =
      args.join(" ") ||
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text;

    try {
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

      // ━━━━━ CHECK URL ━━━━━
      if (!url) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "📘 *Facebook Downloader*\n\n" +
              "Usage:\n" +
              "*.fb <facebook video link>*",
          },
          {
            quoted: statusQuote,
          }
        );
      }

      // ━━━━━ FACEBOOK URL CHECK ━━━━━
      if (!/facebook\.com|fb\.watch/i.test(url)) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *Invalid Facebook link.*\n\n" +
              "Please send a valid Facebook video URL.",
          },
          {
            quoted: statusQuote,
          }
        );
      }

      // ━━━━━ REACTION ━━━━━
      await sock.sendMessage(chatId, {
        react: {
          text: "🔄",
          key: message.key,
        },
      });

      // ━━━━━ FACEBOOK API ━━━━━
      const apiUrl =
        `https://gtech-api-xtp1.onrender.com/api/download/fb?url=${encodeURIComponent(
          url
        )}&apikey=APIKEY`;

      const res = await axios.get(apiUrl, AXIOS_DEFAULTS);

      const videos = res?.data?.data?.data;

      if (
        !res?.data?.status ||
        !Array.isArray(videos) ||
        !videos.length
      ) {
        throw new Error("No downloadable video found");
      }

      // ━━━━━ SORT QUALITY ━━━━━
      const sorted = videos.sort((a, b) => {
        const qa = parseInt(a.resolution) || 0;
        const qb = parseInt(b.resolution) || 0;

        return qb - qa;
      });

      const selected = sorted[0];

      if (!selected?.url) {
        throw new Error("Video URL not found");
      }

      const videoUrl = selected.url.startsWith("http")
        ? selected.url
        : `https://gtech-api-xtp1.onrender.com${selected.url}`;

      // ━━━━━ CAPTION ━━━━━
      const caption =
        "📘 *Facebook Downloader*\n\n" +
        `🎞 Quality: *${selected.resolution || "Unknown"}*\n\n` +
        "> *_Downloaded by PUTTUS-AI_*";

      // ━━━━━ SEND VIDEO ━━━━━
      await sock.sendMessage(
        chatId,
        {
          video: {
            url: videoUrl,
          },
          mimetype: "video/mp4",
          caption: caption,
        },
        {
          quoted: statusQuote,
        }
      );

      // ━━━━━ SUCCESS ━━━━━
      await sock.sendMessage(chatId, {
        react: {
          text: "✅",
          key: message.key,
        },
      });

    } catch (err) {
      console.error("Facebook downloader error:", err);

      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *Failed to download Facebook video.*\n\n" +
            "Please try again later.",
        },
        {
          quoted: statusQuote,
        }
      );
    }
  },
};
