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

      function getMessageText(msg) {
        const m = msg?.message;
        if (!m) return "";

        return (
          m.conversation ||
          m.extendedTextMessage?.text ||
          m.imageMessage?.caption ||
          m.videoMessage?.caption ||
          m.documentMessage?.caption ||
          m.buttonsResponseMessage?.selectedButtonId ||
          m.listResponseMessage?.singleSelectReply?.selectedRowId ||
          ""
        );
      }

      const rawText = getMessageText(message);

      const argText = Array.isArray(args)
        ? args.join(" ")
        : String(args || "");

      const combinedText = `${argText} ${rawText}`.trim();

      const urlMatch = combinedText.match(
        /https?:\/\/(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.watch)\/[^\s]+/i
      );

      const url = urlMatch
        ? urlMatch[0].replace(/[)>.,]+$/, "")
        : "";

      if (!url) {
        return await sock.sendMessage(
          chatId,
          {
            text: "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
          },
          { quoted: statusQuote }
        );
      }

      if (!/(facebook\.com|fb\.watch)/i.test(url)) {
        return await sock.sendMessage(
          chatId,
          {
            text: "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
          },
          { quoted: statusQuote }
        );
      }

      await sock.sendMessage(chatId, {
        react: {
          text: "🔄",
          key: message.key,
        },
      });

      const response = await axios.get(
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

      const data = response?.data;

      if (!data || data.status !== true) {
        throw new Error("Rabbit API failed");
      }

      const hdUrl =
        typeof data.hd === "string" &&
        /^https?:\/\//i.test(data.hd)
          ? data.hd
          : null;

      const sdUrl =
        typeof data.sd === "string" &&
        /^https?:\/\//i.test(data.sd)
          ? data.sd
          : null;

      const videoUrl = hdUrl || sdUrl;

      if (!videoUrl) {
        throw new Error("No video URL");
      }

      const quality = hdUrl ? "HD" : "SD";

      await sock.sendMessage(
        chatId,
        {
          video: {
            url: videoUrl,
          },
          mimetype: "video/mp4",
          caption:
            "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜\n\n" +
            `🎞 *${quality}*`,
        },
        {
          quoted: statusQuote,
        }
      );

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
            text: "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
          },
          { quoted: message }
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
