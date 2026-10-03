const settings = require("../settings");

const API =
  "https://rabbitapi.zone.id/api/fb";

/* =========================================================
   PUTTUS VCard
========================================================= */

function getPuttusVCardQuote() {
  const botJid =
    "919641092392@s.whatsapp.net";

  const vcard =
    "BEGIN:VCARD\n" +
    "VERSION:3.0\n" +
    "N:PUTTUS;BOT;;;\n" +
    "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
    "ORG:PUTTUS BOT\n" +
    "TEL;TYPE=CELL;TYPE=VOICE;waid=919641092392:+919641092392\n" +
    "END:VCARD";

  return {
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
        vcard,
      },
    },
  };
}

/* =========================================================
   GET URL
========================================================= */

function getFacebookUrl(message, args = [], context = {}) {
  // 1. Try args first
  const fromArgs =
    Array.isArray(args)
      ? args.join(" ").trim()
      : String(args || "").trim();

  if (
    /(?:facebook\.com|fb\.watch)/i.test(
      fromArgs
    )
  ) {
    const match =
      fromArgs.match(
        /https?:\/\/[^\s]+/i
      );

    if (match) {
      return match[0].trim();
    }
  }

  // 2. Try context text
  const contextText =
    context?.text ||
    context?.body ||
    context?.messageText ||
    "";

  if (
    /(?:facebook\.com|fb\.watch)/i.test(
      contextText
    )
  ) {
    const match =
      String(contextText).match(
        /https?:\/\/[^\s]+/i
      );

    if (match) {
      return match[0].trim();
    }
  }

  // 3. Try message text directly
  const messageText =
    message?.message?.conversation ||
    message?.message?.extendedTextMessage?.text ||
    message?.text ||
    "";

  if (
    /(?:facebook\.com|fb\.watch)/i.test(
      messageText
    )
  ) {
    const match =
      String(messageText).match(
        /https?:\/\/[^\s]+/i
      );

    if (match) {
      return match[0].trim();
    }
  }

  return "";
}

/* =========================================================
   PLUGIN
========================================================= */

module.exports = {
  command: "fb",

  aliases: [
    "facebook",
  ],

  category: "downloader",

  description:
    "Download Facebook video",

  usage:
    ".fb <Facebook video URL>",

  async handler(
    sock,
    message,
    args = [],
    context = {}
  ) {
    try {
      const chatId =
        context?.chatId ||
        message?.key?.remoteJid;

      if (!chatId) {
        return;
      }

      const prefix =
        settings?.prefixes?.[0] || ".";

      /* =========================================
         GET FACEBOOK URL
      ========================================= */

      let url =
        getFacebookUrl(
          message,
          args,
          context
        );

      // Remove trailing punctuation
      url = url.replace(
        /[)\]}>.,!?]+$/,
        ""
      );

      console.log(
        "PUTTUS-AI FB URL:",
        url
      );

      /* =========================================
         NO URL
      ========================================= */

      if (!url) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              `*❌ ғᴀᴄᴇʙᴏᴏᴋ ᴜʀʟ ᴅᴀᴏ!*\n\n` +
              `*ᴇxᴀᴍᴘʟᴇ: ${prefix}ғʙ https://www.facebook.com/...*\n\n` +
              `*𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*`,
          },
          {
            quoted:
              getPuttusVCardQuote(),
          }
        );
      }

      /* =========================================
         VALIDATE URL
      ========================================= */

      if (
        !/facebook\.com|fb\.watch/i.test(
          url
        )
      ) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              `*❌ ɪɴᴠᴀʟɪᴅ ғᴀᴄᴇʙᴏᴏᴋ ᴜʀʟ!*\n\n` +
              `*𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*`,
          },
          {
            quoted:
              getPuttusVCardQuote(),
          }
        );
      }

      /* =========================================
         DOWNLOADING REACTION
      ========================================= */

      try {
        await sock.sendMessage(
          chatId,
          {
            react: {
              text: "📥",
              key: message.key,
            },
          }
        );
      } catch (_) {}

      /* =========================================
         RABBIT API
      ========================================= */

      const apiUrl =
        `${API}?url=${encodeURIComponent(url)}`;

      console.log(
        "PUTTUS-AI FB API:",
        apiUrl
      );

      const response =
        await fetch(apiUrl, {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            "User-Agent":
              "Mozilla/5.0 PUTTUS-AI",
          },
        });

      if (!response.ok) {
        throw new Error(
          `Facebook API HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      console.log(
        "PUTTUS-AI FB RESPONSE:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      /* =========================================
         GET VIDEO
      ========================================= */

      const videoUrl =
        data?.hd ||
        data?.sd ||
        data?.url ||
        data?.video;

      if (
        data?.status !== true ||
        !videoUrl
      ) {
        throw new Error(
          data?.message ||
          data?.response?.message ||
          "Facebook video URL not found"
        );
      }

      /* =========================================
         SEND VIDEO
      ========================================= */

      await sock.sendMessage(
        chatId,
        {
          video: {
            url: videoUrl,
          },

          mimetype:
            "video/mp4",

          caption:
            `│ 📥 *ғᴀᴄᴇʙᴏᴏᴋ ᴠɪᴅᴇᴏ*\n` +
            `│\n` +
            `│ ⚡ *ᴅᴏᴡɴʟᴏᴀᴅᴇᴅ sᴜᴄᴄᴇssғᴜʟʟʏ*\n\n` +
            `*ᴘᴏᴡᴇʀᴇᴅ ʙʏ ⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜*`,
        },

        {
          quoted:
            getPuttusVCardQuote(),
        }
      );

      /* =========================================
         SUCCESS REACTION
      ========================================= */

      try {
        await sock.sendMessage(
          chatId,
          {
            react: {
              text: "✅",
              key: message.key,
            },
          }
        );
      } catch (_) {}

    } catch (error) {

      console.error(
        "PUTTUS-AI FB ERROR:",
        error
      );

      /* =========================================
         ERROR MESSAGE
      ========================================= */

      try {
        await sock.sendMessage(
          message?.key?.remoteJid ||
            context?.chatId,
          {
            text:
              `*❌ ғᴀᴄᴇʙᴏᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ!*\n\n` +
              `*𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*`,
          },
          {
            quoted:
              getPuttusVCardQuote(),
          }
        );
      } catch (_) {}

      /* =========================================
         ERROR REACTION
      ========================================= */

      try {
        await sock.sendMessage(
          message?.key?.remoteJid ||
            context?.chatId,
          {
            react: {
              text: "❌",
              key: message.key,
            },
          }
        );
      } catch (_) {}
    }
  },
};
