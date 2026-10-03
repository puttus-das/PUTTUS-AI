/*****************************************************************************
 *                       PUTTUS-AI PLAY DOWNLOADER                           *
 *****************************************************************************/

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
   CHANNEL INFO
========================================================= */

const channelInfo = {
  contextInfo: {
    forwardingScore: 1,

    isForwarded: true,

    forwardedNewsletterMessageInfo: {
      newsletterJid:
        "120363411471428911@newsletter",

      newsletterName:
        "━━━━━━━━━━━〔 𝐏ᴜᴛᴛᴜs - 𝐃ᴀꜱ 〕━━━━━━━━━━━",

      serverMessageId: -1,
    },
  },
};


/* =========================================================
   PLAY COMMAND
========================================================= */

module.exports = {
  command: "play",

  aliases: [
    "ytplay"
  ],

  category: "download",

  description:
    "Play YouTube audio",

  usage:
    ".play <song name>",


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
              `.play Alan Walker Faded`,

            ...channelInfo,
          },
          {
            quoted:
              getPuttusVCardQuote()
          }
        );
      }


      /* =====================================================
         REACTION
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          react: {
            text: "▶️",
            key: message.key
          }
        }
      );


      /* =====================================================
         YOUTUBE SEARCH
      ===================================================== */

      let videoUrl = query;


      const isYouTubeUrl =
        /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i
          .test(query);


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
                `${searchData?.message || "No results found."}`,

              ...channelInfo,
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
                "❌ *কোনো YouTube result পাওয়া যায়নি।*",

              ...channelInfo,
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
                "❌ *YouTube result-এর URL পাওয়া যায়নি।*",

              ...channelInfo,
            },
            {
              quoted:
                getPuttusVCardQuote()
            }
          );
        }
      }


      /* =====================================================
         RABBIT PLAY API
      ===================================================== */

      const playUrl =
        `${PLAY_API}?url=${encodeURIComponent(videoUrl)}`;


      const playResponse =
        await fetch(
          playUrl,
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


      if (!playResponse.ok) {

        throw new Error(
          `Play API HTTP ${playResponse.status}`
        );
      }


      const data =
        await playResponse.json();


      if (
        data?.success === false ||
        data?.status === false
      ) {

        return await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *Play failed.*\n\n` +
              `${data?.message || "Rabbit API failed."}`,

            ...channelInfo,
          },
          {
            quoted:
              getPuttusVCardQuote()
          }
        );
      }


      /* =====================================================
         GET RESULT
      ===================================================== */

      const result =
        data?.result ||
        data?.data ||
        data;


      const audioUrl =
        result?.url ||
        result?.mp3 ||
        result?.audio ||
        result?.download ||
        result?.downloadUrl ||
        data?.url ||
        data?.mp3 ||
        data?.audio ||
        data?.download;


      if (
        !audioUrl ||
        typeof audioUrl !== "string"
      ) {

        console.log(
          "Rabbit Play API Response:",
          JSON.stringify(
            data,
            null,
            2
          )
        );


        return await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *Audio পাওয়া যায়নি।*\n\n` +
              `Rabbit Play API কোনো valid audio URL দেয়নি।`,

            ...channelInfo,
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
        data?.title ||
        query;


      const safeTitle =
        title.replace(
          /[\\/:*?"<>|]/g,
          ""
        );


      /* =====================================================
         SEND AUDIO
         + PUTTUS VCARD QUOTE
         + CHANNEL
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
            false,

          ...channelInfo,
        },
        {
          quoted:
            getPuttusVCardQuote()
        }
      );


      /* =====================================================
         SUCCESS
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
        `PUTTUS-AI PLAY SENT: ${title}`
      );


    } catch (error) {

      console.error(
        "PUTTUS-AI PLAY ERROR:",
        error
      );


      await sock.sendMessage(
        chatId,
        {
          text:
            `❌ *Play failed.*\n\n` +
            `আবার একটু পরে try করো।`,

          ...channelInfo,
        },
        {
          quoted:
            getPuttusVCardQuote()
        }
      );
    }
  }
};
