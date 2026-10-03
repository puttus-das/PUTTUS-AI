/*****************************************************************************
 *                         PUTTUS-AI PLAY
 *                         Rabbit API
 *****************************************************************************/

const settings = require("../settings");

const SEARCH_API =
  "https://rabbitapi.zone.id/search/youtube";

const PLAY_API =
  "https://rabbitapi.zone.id/api/play";


/* =========================================================
   PUTTUS VCARD QUOTE
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
   GET YOUTUBE URL
========================================================= */

async function getYouTubeUrl(query) {
  if (
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(query)
  ) {
    return query;
  }

  const url =
    `${SEARCH_API}?q=${encodeURIComponent(query)}&limit=1`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "PUTTUS-AI",
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube Search HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data?.status !== true) {
    throw new Error(
      data?.message || "YouTube search failed"
    );
  }

  const first = Array.isArray(data?.result)
    ? data.result[0]
    : null;

  if (!first?.url) {
    throw new Error("No YouTube result found");
  }

  return first.url;
}


/* =========================================================
   COMMAND
========================================================= */

module.exports = {
  command: "play",

  aliases: ["song", "music"],

  category: "music",

  description: "Play song from YouTube",

  usage: ".play [song name / YouTube URL]",


  async handler(sock, message, args = [], context = {}) {

    const chatId =
      context?.chatId ||
      message?.key?.remoteJid;

    if (!chatId) return;


    const query = args.join(" ").trim();

    const prefix =
      settings?.prefixes?.[0] || ".";


    /* =====================================================
       NO QUERY
    ===================================================== */

    if (!query) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            `❌ *Song name dao!*\n\n` +
            `Example:\n` +
            `*${prefix}play Alan Walker Faded*`,
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

      await sock.sendMessage(chatId, {
        react: {
          text: "🎵",
          key: message.key,
        },
      });


      /* ===================================================
         GET YOUTUBE URL
      =================================================== */

      const youtubeUrl =
        await getYouTubeUrl(query);


      /* ===================================================
         RABBIT PLAY API
      =================================================== */

      const apiUrl =
        `${PLAY_API}?url=${encodeURIComponent(youtubeUrl)}`;


      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "PUTTUS-AI",
        },
      });


      if (!response.ok) {
        throw new Error(
          `Play API HTTP ${response.status}`
        );
      }


      const data = await response.json();


      /* ===================================================
         RESULT
      =================================================== */

      const result =
        data?.result ||
        data?.data ||
        data;


      const audioUrl =
        result?.url ||
        result?.mp3 ||
        result?.audio ||
        result?.download ||
        result?.download_url;


      if (!audioUrl) {
        throw new Error(
          data?.message ||
          "Audio URL not found in API response"
        );
      }


      /* ===================================================
         SONG INFO
      =================================================== */

      const title =
        result?.title ||
        result?.name ||
        query;


      const duration =
        result?.duration ||
        "-";


      const thumbnail =
        result?.thumbnail ||
        result?.thumb ||
        result?.image ||
        "";


      /* ===================================================
         CAPTION
      =================================================== */

      const caption =
        `╭─〔 *𝐏ᴜᴛᴛᴜs-Bᴏᴛ* 〕─╮\n` +
        `│ 🎵 *${title}*\n` +
        `│ ⏱️ ${duration}\n` +
        `│\n` +
        `│ 🎧 *Playing your song...*\n` +
        `╰──────────────────╯\n\n` +
        `*Powered by ⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜*`;


      /* ===================================================
         SEND AUDIO
         NO CHANNEL
         NO LONG BAR
         NO NEWSLETTER
      =================================================== */

      await sock.sendMessage(
        chatId,
        {
          audio: {
            url: audioUrl,
          },

          mimetype: "audio/mpeg",

          fileName:
            `${title.replace(/[\\/:*?"<>|]/g, "_")}.mp3`,

          ptt: false,

          caption,

          ...(thumbnail
            ? {
                contextInfo: {
                  externalAdReply: {
                    title: title,
                    body:
                      "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
                    mediaType: 1,
                    thumbnailUrl: thumbnail,
                    sourceUrl: youtubeUrl,
                  },
                },
              }
            : {}),
        },
        {
          quoted: getPuttusVCardQuote(),
        }
      );


      /* ===================================================
         SUCCESS
      =================================================== */

      await sock.sendMessage(chatId, {
        react: {
          text: "✅",
          key: message.key,
        },
      });


    } catch (error) {

      console.error(
        "PUTTUS-AI PLAY ERROR:",
        error
      );


      await sock.sendMessage(
        chatId,
        {
          text:
            `❌ *Play failed!*\n\n` +
            `Songটা পাওয়া যায়নি বা API এখন কাজ করছে না।\n` +
            `আবার একটু পরে try করো।`,
        },
        {
          quoted: getPuttusVCardQuote(),
        }
      );


      await sock.sendMessage(chatId, {
        react: {
          text: "❌",
          key: message.key,
        },
      });
    }
  },
};
