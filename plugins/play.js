/*****************************************************************************
 *                         PUTTUS-AI PLAY
 *                         Rabbit API
 *
 *  .play <song name>
 *  .song <song name>
 *  .music <song name>
 *
 *  NO CHANNEL
 *  NO NEWSLETTER
 *  NO EXTERNAL AD REPLY
 *  NO LARGE THUMBNAIL
 *  NO LONG PREVIEW
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
   YOUTUBE URL
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
      data?.message ||
      "YouTube search failed"
    );
  }


  const firstResult =
    Array.isArray(data?.result)
      ? data.result[0]
      : null;


  if (!firstResult?.url) {
    throw new Error(
      "No YouTube result found"
    );
  }


  return firstResult.url;
}


/* =========================================================
   SAFE FILE NAME
========================================================= */

function makeSafeFileName(title) {

  return String(title || "PUTTUS-AI")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
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

  description:
    "Play song from YouTube",

  usage:
    ".play [song name / YouTube URL]",


  async handler(
    sock,
    message,
    args = [],
    context = {}
  ) {

    const chatId =
      context?.chatId ||
      message?.key?.remoteJid;


    if (!chatId) {
      return;
    }


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
          quoted:
            getPuttusVCardQuote(),
        }
      );

    }


    try {

      /* ===================================================
         SEARCH REACTION
      =================================================== */

      await sock.sendMessage(
        chatId,
        {
          react: {
            text: "🎵",
            key: message.key,
          },
        }
      );


      /* ===================================================
         GET YOUTUBE URL
      =================================================== */

      const youtubeUrl =
        await getYouTubeUrl(query);


      /* ===================================================
         RABBIT PLAY API
      =================================================== */

      const playUrl =
        `${PLAY_API}?url=${encodeURIComponent(
          youtubeUrl
        )}`;


      const response =
        await fetch(playUrl, {

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
          `Play API HTTP ${response.status}`
        );

      }


      const data =
        await response.json();


      /* ===================================================
         GET RESULT
      =================================================== */

      const result =
        data?.result ||
        data?.data ||
        data;


      /* ===================================================
         FIND AUDIO URL
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
         SONG INFORMATION
      =================================================== */

      const title =
        result?.title ||
        result?.name ||
        query;


      const duration =
        result?.duration ||
        "-";


      const safeTitle =
        makeSafeFileName(title);


      /* ===================================================
         AUDIO CAPTION
      =================================================== */

      const caption =
        `╭─〔 *𝐏ᴜᴛᴛᴜs-Bᴏᴛ* 〕─╮\n` +
        `│ 🎵 *${title}*\n` +
        `│ ⏱️ ${duration}\n` +
        `│\n` +
        `│ 🎧 *Playing...*\n` +
        `╰──────────────────╯\n\n` +
        `*Powered by ⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜*`;


      /* ===================================================
         SEND AUDIO
         
         IMPORTANT:
         - NO externalAdReply
         - NO channel
         - NO newsletter
         - NO large thumbnail
         - NO forwarded info
         - NO renderLargerThumbnail
      =================================================== */

      await sock.sendMessage(
        chatId,
        {

          audio: {
            url: audioUrl,
          },

          mimetype:
            "audio/mpeg",

          fileName:
            `${safeTitle}.mp3`,

          ptt: false,

          caption:
            caption,

        },
        {

          quoted:
            getPuttusVCardQuote(),

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
        "PUTTUS-AI PLAY ERROR:",
        error
      );


      /* ===================================================
        
