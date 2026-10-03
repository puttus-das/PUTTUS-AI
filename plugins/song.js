/*****************************************************************************
 *                     PUTTUS-AI SONG DOWNLOADER                            *
 *****************************************************************************/

const SEARCH_API =
  "https://rabbitapi.zone.id/search/youtube";

const SONG_API =
  "https://rabbitapi.zone.id/api/song";


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
   SONG COMMAND
========================================================= */

module.exports = {
  command: "song",

  aliases: [
    "music"
  ],

  category: "download",

  description:
    "Search and download YouTube song",

  usage:
    ".song <song name>",


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


    try {

      const query =
        args.join(" ").trim();


      /* =====================================================
         QUERY CHECK
      ===================================================== */

      if (!query) {

        return await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *Song name dao!*\n\n` +
              `Example:\n` +
              `.song Alan Walker Faded`
          },
          {
            quoted:
              getPuttusVCardQuote()
          }
        );
      }


      /* =====================================================
         START REACTION
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          react: {
            text: "🎵",
            key: message.key
          }
        }
      );


      /* =====================================================
         CHECK YOUTUBE URL
      ===================================================== */

      let videoUrl = query;

      const isYouTubeUrl =
        /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i
          .test(query);


      /* =====================================================
         SEARCH YOUTUBE
      ===================================================== */

      if (!isYouTubeUrl) {

        const searchUrl =
          `${SEARCH_API}?q=${encodeURIComponent(query)}&limit=15`;


        const searchResponse =
          await fetch(
            searchUrl,
            {
              method: "GET",

              headers: {
                Accept:
                  "application/json",

                "User-Agent":
                  "PUTTUS-AI"
              }
            }
          );


        if (!searchResponse.ok) {

          throw new Error(
            `Search API HTTP ${searchResponse.status}`
          );
        }


        const searchData =
          await searchResponse.json();


        if (searchData?.status !== true) {

          return await sock.sendMessage(
            chatId,
            {
              text:
                `❌ *YouTube search failed.*\n\n` +
                `${searchData?.message || "No results found."}`
            },
            {
              quoted:
                getPuttusVCardQuote()
            }
          );
        }


        const results =
          Array.isArray(searchData?.result)
            ? searchData.result
            : [];


        if (!results.length) {

          return await sock.sendMessage(
            chatId,
            {
              text:
                "❌ *এই নামে কোনো গান পাওয়া যায়নি।*"
            },
            {
              quoted:
                getPuttusVCardQuote()
            }
          );
        }


        videoUrl =
          results[0]?.url;


        if (!videoUrl) {

          return await sock.sendMessage(
            chatId,
            {
              text:
                "❌ *YouTube result-এর URL পাওয়া যায়নি।*"
            },
            {
              quoted:
                getPuttusVCardQuote()
            }
          );
        }
      }


      /* =====================================================
         RABBIT SONG API
      ===================================================== */

      const songUrl =
        `${SONG_API}?url=${encodeURIComponent(videoUrl)}`;


      const songResponse =
        await fetch(
          songUrl,
          {
            method: "GET",

            headers: {
              Accept:
                "application/json",

              "User-Agent":
                "PUTTUS-AI"
            }
          }
        );


      if (!songResponse.ok) {

        throw new Error(
          `Song API HTTP ${songResponse.status}`
        );
      }


      const songData =
        await songResponse.json();


      if (songData?.success !== true) {

        return await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *Song download failed.*\n\n` +
              `${songData?.message || "Rabbit API failed."}`
          },
          {
            quoted:
              getPuttusVCardQuote()
          }
        );
      }


      const result =
        songData?.result || {};


      /* =====================================================
         AUDIO URL
      ===================================================== */

      const audioUrl =
        result?.url ||
        result?.mp3 ||
        result?.audio ||
        result?.download;


      if (
        !audioUrl ||
        typeof audioUrl !== "string"
      ) {

        console.log(
          "Rabbit Song API Response:",
          JSON.stringify(
            songData,
            null,
            2
          )
        );


        return await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *Audio পাওয়া যায়নি।*\n\n` +
              `Rabbit API কোনো valid audio URL দেয়নি।`
          },
          {
            quoted:
              getPuttusVCardQuote()
          }
        );
      }


      /* =====================================================
         TITLE
      ===================================================== */

      const title =
        result?.title ||
        query;


      const safeTitle =
        title.replace(
          /[\\/:*?"<>|]/g,
          ""
        );


      /* =====================================================
         SEND AUDIO + PUTTUS VCARD QUOTE
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          audio: {
            url: audioUrl
          },

          mimetype:
            "audio/mpeg",

          fileName:
            `${safeTitle}.mp3`,

          ptt:
            false
        },
        {
          quoted:
            getPuttusVCardQuote()
        }
      );


      /* =====================================================
         SUCCESS REACTION
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          react: {
            text: "✅",
            key: message.key
          }
        }
      );


      console.log(
        `PUTTUS-AI SONG SENT: ${title}`
      );


    } catch (error) {

      console.error(
        "PUTTUS-AI SONG ERROR:",
        error
      );


      await sock.sendMessage(
        chatId,
        {
          text:
            `❌ *Song download failed.*\n\n` +
            `আবার একটু পরে try করো।`
        },
        {
          quoted:
            getPuttusVCardQuote()
        }
      );
    }
  }
};
