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
            vcard: vcard,
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
              "*.fb https://www.facebook.com/...*",
          },
          { quoted: statusQuote }
        );
      }

      /* =========================================================
         FACEBOOK URL CHECK
      ========================================================= */

      if (!/(facebook\.com|fb\.watch)/i.test(url)) {
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
         DOWNLOADING REACTION
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
          Accept: "application/json",
        },
      });

      const data = response?.data;

      console.log(
        "[PUTTUS FB API]",
        JSON.stringify(data, null, 2)
      );

      /* =========================================================
         API STATUS CHECK
      ========================================================= */

      if (!data || data.status !== true) {
        throw new Error("Facebook API returned an unsuccessful response");
      }

      /* =========================================================
         GET VIDEO
      ========================================================= */

      const hd = data?.hd;
      const sd = data?.sd;

      const videoUrl =
        typeof hd === "string" && /^https?:\/\//i.test(hd)
          ? hd
          : typeof sd === "string" && /^https?:\/\//i.test(sd)
          ? sd
          : null;

      const quality =
        videoUrl === hd
          ? "HD"
          : videoUrl === sd
          ? "SD"
          : "Unknown";

      if (!videoUrl) {
        throw new Error("No HD/SD video URL returned by API");
      }

      /* =========================================================
         TITLE
      ========================================================= */

      const title =
        typeof data?.title === "string"
          ? data.title.trim()
          : "Facebook Video";

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
            `🎬 *${title}*\n\n` +
            `🎞 Quality: *${quality}*\n` +
            `👤 Creator: *${data.creator || "Rabbit API"}*\n\n` +
            "> *_Downloaded by PUTTUS-AI_*",
        },
        {
          quoted: statusQuote,
        }
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
    } catch (error) {
      console.error(
        "[PUTTUS-AI FACEBOOK ERROR]",
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
              "The Facebook video could not be downloaded right now.\n\n" +
              "💡 Try another Facebook/Reel link.",
          },
          {
            quoted: message,
          }
        );
      } catch (sendError) {
        console.error(
          "[PUTTUS-AI FACEBOOK SEND ERROR]",
          sendError?.message || sendError
        );
      }
    }
  },
};
