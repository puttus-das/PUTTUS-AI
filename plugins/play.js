const settings = require("../settings");

const SEARCH_API =
  "https://rabbitapi.zone.id/search/youtube";

const PLAY_API =
  "https://rabbitapi.zone.id/api/play";


/* =========================================================
   PUTTUS VCARD
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
   SAFE FILE NAME
========================================================= */

function safeFileName(name) {
  return String(name || "PUTTUS-AI")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}


/* =========================================================
   GET YOUTUBE URL
========================================================= */

async function getYouTubeUrl(query) {

  // Direct YouTube URL
  if (
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(
      query
    )
  ) {
    return query;
  }

  const searchUrl =
    `${SEARCH_API}?q=${encodeURIComponent(query)}&limit=1`;

  const response = await fetch(searchUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "PUTTUS-AI",
    },
  });

  if (!response.ok) {
    throw new Error(
      `YouTube Search HTTP ${response.status}`
    );
  }

  const data = await response.json();

  if (data?.status !== true) {
    throw new Error(
      data?.message || "YouTube search failed"
    );
  }

  const result = Array.isArray(data?.result)
    ? data.result[0]
    : null;

  if (!result?.url) {
    throw new Error("No YouTube result found");
  }

  return result.url;
}


/* =========================================================
   PLAY COMMAND
========================================================= */

module.exports = {
  command: "play",

  aliases: [
    "song",
    "music"
  ],

  category: "music",

  description: "Download song from YouTube",

  usage: ".play [song name / YouTube URL]",


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


    const query =
      args.join(" ").trim();


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
         YOUTUBE URL
      =================================================== */

      const youtubeUrl =
        await getYouTubeUrl(query);


      /* ===================================================
         RABBIT PLAY API
      =================================================== */

      const apiUrl =
        `${PLAY_API}?url=${encodeURIComponent(
          youtubeUrl
        )}`;


      const response =
        await fetch(apiUrl, {
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


      const data =
        await response.json();


      /* ===================================================
         RESULT
      =================================================== */

      const result =
        data?.result ||
        data?.data ||
        data;


      /* ===================================================
         AUDIO URL
      =================================================== */

      const audioUrl =
        result?.url ||
        result?.mp3 ||
        result?.audio ||
        result?.download ||
        result?.download_url;


      if (!audioUrl) {
        throw new Error(
          data?.message ||
          "Audio URL not found"
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


      const safeTitle =
        safeFileName(title);


      /* ===================================================
         DOWNLOAD AS DOCUMENT
         
         IMPORTANT:
         এখানে audio: ব্যবহার করা হয়নি।
         তাই WhatsApp audio playback bar
         তৈরি করবে না।
      =================================================== */

      await sock.sendMessage(
        chatId,
        {
          document: {
            url: audioUrl,
          },

          mimetype: "audio/mpeg",

          fileName:
            `${safeTitle}.mp3`,

          caption:
            `╭─〔 *𝐏ᴜᴛᴛᴜs-Bᴏᴛ* 〕─╮\n` +
            `│ 🎵 *${title}*\n` +
            `│ ⏱️ ${duration}\n` +
            `│\n` +
            `│ 📥 *MP3 File*\n` +
            `╰──────────────────╯\n\n` +
            `*Powered by ⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜*`,
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


      /* ===================================================
         ERROR
      =================================================== */

      try {

        await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *Play failed!*\n\n` +
              `Song পাওয়া যায়নি অথবা API/` +
              `WhatsApp connection সমস্যা হয়েছে।\n\n` +
              `আবার try করো।`,
          },
          {
            quoted: getPuttusVCardQuote(),
          }
        );

      } catch (sendError) {

        console.error(
          "PUTTUS-AI ERROR MESSAGE:",
          sendError
        );

      }


      try {

        await sock.sendMessage(chatId, {
          react: {
            text: "❌",
            key: message.key,
          },
        });

      } catch (_) {}

    }
  },
};
