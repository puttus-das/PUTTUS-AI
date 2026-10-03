const settings = require("../settings");

const API =
  "https://rabbitapi.zone.id/api/insta";

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
   INSTAGRAM DOWNLOADER
   ========================================================= */

module.exports = {
  command: "ig",

  aliases: [
    "instagram",
    "insta",
  ],

  category: "downloader",

  description:
    "Download Instagram video",

  usage:
    ".ig <Instagram video/reel URL>",

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
            `*❌ ɪɴsᴛᴀɢʀᴀᴍ ᴜʀʟ ᴅᴀᴏ!*\n\n` +
            `*ᴇxᴀᴍᴘʟᴇ: ${prefix}ɪɢ https://www.instagram.com/reel/...*\n\n` +
            `*𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*`,
        },
        {
          quoted: getPuttusVCardQuote(),
        }
      );
    }

    if (
      !/instagram\.com/i.test(url)
    ) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            `*❌ ɪɴᴠᴀʟɪᴅ ɪɴsᴛᴀɢʀᴀᴍ ᴜʀʟ!*\n\n` +
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
          `Instagram API HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      console.log(
        "PUTTUS-AI IG API:",
        data
      );

      /* ===================================================
         API RESPONSE
         =================================================== */

      if (
        data?.status !== true ||
        !data?.url
      ) {
        throw new Error(
          data?.message ||
          data?.response?.message ||
          "Instagram video URL not found"
        );
      }

      /* ===================================================
         SEND VIDEO + VCARD AS QUOTED
         =================================================== */

      await sock.sendMessage(
        chatId,
        {
          video: {
            url: data.url,
          },

          mimetype:
            "video/mp4",

          caption:
            `│ 📥 *ɪɴsᴛᴀɢʀᴀᴍ ᴠɪᴅᴇᴏ*\n` +
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
        "PUTTUS-AI IG ERROR:",
        error
      );

      try {
        await sock.sendMessage(
          chatId,
          {
            text:
              `*❌ ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ!*\n\n` +
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
