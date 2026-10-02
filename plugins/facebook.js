const axios = require("axios");

module.exports = {
  command: "facebook",
  aliases: ["fb", "fbdl"],
  category: "download",
  description: "Download Facebook videos",
  usage: ".fb <facebook video link>",

  async handler(sock, message, args = [], context = {}) {
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
            displayName:
              "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
            vcard: vcard,
          },
        },
      };

      /* =========================================================
         GET MESSAGE TEXT
      ========================================================= */

      function getText(msg) {
        const m = msg?.message;

        if (!m) return "";

        return (
          m.conversation ||
          m.extendedTextMessage?.text ||
          m.imageMessage?.caption ||
          m.videoMessage?.caption ||
          m.documentMessage?.caption ||
          ""
        );
      }

      /* =========================================================
         GET FACEBOOK URL
      ========================================================= */

      const messageText = getText(message);

      const argumentText = Array.isArray(args)
        ? args.join(" ")
        : String(args || "");

      const fullText =
        `${argumentText} ${messageText}`.trim();

      const urlMatch = fullText.match(
        /https?:\/\/(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.watch)\/[^\s]+/i
      );

      const url = urlMatch
        ? urlMatch[0].replace(/[)>.,]+$/, "")
        : "";

      /* =========================================================
         NO URL
      ========================================================= */

      if (!url) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "📘 *⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜*\n\n" +
              "❯ *Usage:* .fb <Facebook video link>\n\n" +
              "❯ *Example:*\n" +
              "*.fb https://www.facebook.com/share/r/xxxx/*",
          },
          {
            quoted: statusQuote,
          }
        );
      }

      /* =========================================================
         CHECK FACEBOOK URL
      ========================================================= */

      if (!/(facebook\.com|fb\.watch)/i.test(url)) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *Invalid Facebook Link*\n\n" +
              "Please send a valid Facebook video or Reel URL.",
          },
          {
            quoted: statusQuote,
          }
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

      const api = await axios.get(
        "https://rabbitapi.zone.id/api/fb",
        {
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
        }
      );

      const data = api?.data;

      console.log(
        "[PUTTUS FACEBOOK API]",
        JSON.stringify(data, null, 2)
      );

      /* =========================================================
         API CHECK
      ========================================================= */

      if (!data || data.status !== true) {
        throw new Error(
          "Facebook API returned an invalid response"
        );
      }

      /* =========================================================
         GET HD / SD
      ========================================================= */

      const hd =
        typeof data.hd === "string" &&
        /^https?:\/\//i.test(data.hd)
          ? data.hd
          : null;

      const sd =
        typeof data.sd === "string" &&
        /^https?:\/\//i.test(data.sd)
          ? data.sd
          : null;

      const videoUrl = hd || sd;

      const quality = hd ? "HD" : "SD";

      if (!videoUrl) {
        throw new Error(
          "No downloadable video found"
        );
      }

      /* =========================================================
         DOWNLOAD VIDEO AS BUFFER
      ========================================================= */

      const videoResponse = await axios.get(
        videoUrl,
        {
          responseType: "arraybuffer",
          timeout: 120000,
          maxContentLength: 100 * 1024 * 1024,
          maxBodyLength: 100 * 1024 * 1024,

          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 10; Mobile) " +
              "AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36",
            Referer: "https://www.facebook.com/",
          },
        }
      );

      const videoBuffer = Buffer.from(
        videoResponse.data
      );

      if (!videoBuffer.length) {
        throw new Error(
          "Downloaded video buffer is empty"
        );
      }

      /* =========================================================
         TITLE
      ========================================================= */

      let title =
        typeof data.title === "string"
          ? data.title.trim()
          : "Facebook Video";

      if (title.length > 500) {
        title = title.substring(0, 500);
      }

      /* =========================================================
         CAPTION
      ========================================================= */

      const caption =
        "📘 *⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜*\n\n" +
        `🎬 *${title}*\n\n` +
        `🎞 Quality: *${quality}*\n` +
        `👤 Creator: *${data.creator || "Rabbit API"}*\n\n` +
        "> *_Downloaded by PUTTUS-AI_*";

      /* =========================================================
         SEND VIDEO BUFFER
      ========================================================= */

      await sock.sendMessage(
        chatId,
        {
          video: videoBuffer,
          mimetype: "video/mp4",
          fileName: "PUTTUS-Facebook.mp4",
          caption: caption,
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
        "[PUTTUS-AI FACEBOOK ERROR]",
        error?.response?.data ||
          error?.message ||
          error
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
