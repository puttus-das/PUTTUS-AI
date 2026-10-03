const settings = require("../settings");

const API =
  "https://rabbitapi.zone.id/api/fb";

/* =========================================================
   PUTTUS VCard — QUOTED ONLY
   ========================================================= */

function getPuttusVCardQuote() {
  const botJid = "919641092392@s.whatsapp.net";

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
   FACEBOOK DOWNLOADER
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
    const chatId =
      context?.chatId ||
      message?.key?.remoteJid;

    if (!chatId) return;

    const url =
      args.join(" ").trim();

    const prefix =
      settings?.prefixes?.[0] || ".";

    /* =====================================================
       URL CHECK
       ===================================================== */

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
          quoted: getPuttusVCardQuote(),
        }
      );
    }

    if (
      !/facebook\.com|fb\.watch/i.test(url)
    ) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            `*❌ ɪɴᴠᴀʟɪᴅ ғᴀᴄᴇʙᴏᴏᴋ ᴜʀʟ!*\n\n` +
            `*𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*`,
        },
        {
          quoted: getPuttusVCardQuote(),
        }
      );
    }

    try {
      /* ===================================================
         REACTION
         =================================================== */

      await sock.sendMessage(
        chatId,
        {
          react: {
            text: "📥",
            key: message.key,
          },
        }
      );

      /* ===================================================
         API REQUEST
         =================================================== */

      const apiUrl =
        `${API}?url=${encodeURIComponent(url)}`;

      const response =
        await fetch(apiUrl, {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            "User-Agent":
              "PUTTUS-AI",
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
        "PUTTUS-AI FB API:",
        data
      );

      /* ===================================================
         RESPONSE URL
         =================================================== */

      const videoUrl =
        data?.url ||
        data?.result?.url ||
        data?.data?.url ||
        data?.result?.video ||
        data?.data?.video ||
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

      /* ===================================================
         SEND VIDEO + VCARD AS QUOTED
         =================================================== */

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
          quoted: getPuttusVCardQuote(),
        }
      );

      /* ===================================================
         SUCCESS REACTION
         =================================================== */

      await sock.sendMessage(
        chatId,
        {
          react: {
            text: "✅",
            key: message.key,
          },
        }
      );

    } catch (error) {
      console.error(
        "PUTTUS-AI FB ERROR:",
        error
      );

      try {
        await sock.sendMessage(
          chatId,
          {
            text:
              `*❌ ғᴀᴄᴇʙᴏᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ!*\n\n` +
              `*𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*`,
          },
          {
            quoted: getPuttusVCardQuote(),
          }
        );
      } catch (_) {}

      try {
        await sock.sendMessage(
          chatId,
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
