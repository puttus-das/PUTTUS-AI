const axios = require("axios");

/* =========================================================
   PUTTUS-BOT VCARD
   No Newsletter
========================================================= */

const vcard = `BEGIN:VCARD
VERSION:3.0
FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲
ORG:PUTTUS BOT;
TEL;type=CELL;type=VOICE;waid=918967360566:+91 8967360566
END:VCARD`;

/* =========================================================
   SEND VCARD
========================================================= */

async function sendVCard(bot, chatId, quoted) {
  try {
    await bot.sendMessage(
      chatId,
      {
        contacts: {
          displayName:
            "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",

          contacts: [
            {
              vcard: vcard,
            },
          ],
        },
      },
      {
        quoted,
      }
    );
  } catch (error) {
    console.error(
      "VCard Error:",
      error?.message || error
    );
  }
}

/* =========================================================
   DOWNLOAD AUDIO AS BUFFER
========================================================= */

async function downloadAudio(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",

    timeout: 120000,

    maxContentLength:
      100 * 1024 * 1024,

    maxBodyLength:
      100 * 1024 * 1024,

    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36",

      Accept:
        "audio/mpeg,audio/*,*/*",
    },

    validateStatus: (status) =>
      status >= 200 && status < 400,
  });

  const buffer = Buffer.from(
    response.data
  );

  if (
    !buffer ||
    buffer.length < 1024
  ) {
    throw new Error(
      "Invalid or empty audio file"
    );
  }

  return buffer;
}

/* =========================================================
   SONG COMMAND
========================================================= */

module.exports = {
  command: "song",

  aliases: [
    "play",
    "music",
    "mp3",
  ],

  category: "music",

  description:
    "Download YouTube song as MP3",

  usage:
    ".song <song name>",

  async handler(
    bot,
    message,
    args,
    options = {}
  ) {
    const chatId =
      options.chatId ||
      message?.key?.remoteJid;

    const query =
      Array.isArray(args)
        ? args.join(" ").trim()
        : String(args || "").trim();

    /* =====================================================
       NO QUERY
    ===================================================== */

    if (!query) {
      await bot.sendMessage(
        chatId,
        {
          text:
            "🎵 *Song Downloader*\n\n" +
            "Usage:\n" +
            "`.song <song name>`",
        },
        {
          quoted: message,
        }
      );

      await sendVCard(
        bot,
        chatId,
        message
      );

      return;
    }

    try {
      /* ===================================================
         DOWNLOADING MESSAGE
      =================================================== */

      await bot.sendMessage(
        chatId,
        {
          text:
            "*ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ... 𝐏ᴜᴛᴛᴜs-𝐀ɪ ᴡᴀɪᴛ...*",
        },
        {
          quoted: message,
        }
      );

      /* ===================================================
         DAVID CYRIL API
      =================================================== */

      const apiResponse =
        await axios.get(
          "https://apis.davidcyril.name.ng/play",
          {
            params: {
              query: query,
            },

            timeout: 60000,

            headers: {
              Accept:
                "application/json",

              "User-Agent":
                "PUTTUS-AI",
            },
          }
        );

      const data =
        apiResponse.data;

      console.log(
        "SONG API RESPONSE:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      /* ===================================================
         VALIDATE API
      =================================================== */

      if (
        !data ||
        data.status !== true ||
        !data.result
      ) {
        throw new Error(
          data?.message ||
          "Invalid API response"
        );
      }

      const song =
        data.result;

      if (!song.download_url) {
        throw new Error(
          "Download URL not found"
        );
      }

      console.log(
        "AUDIO URL:",
        song.download_url
      );

      /* ===================================================
         DOWNLOAD AUDIO
      =================================================== */

      const audioBuffer =
        await downloadAudio(
          song.download_url
        );

      console.log(
        "Audio Buffer Size:",
        audioBuffer.length
      );

      /* ===================================================
         FILE NAME
      =================================================== */

      let fileName =
        song.title ||
        "PUTTUS-AI";

      fileName = fileName
        .replace(
          /[\\/:*?"<>|]/g,
          ""
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();

      if (!fileName) {
        fileName =
          "PUTTUS-AI";
      }

      if (
        !fileName
          .toLowerCase()
          .endsWith(".mp3")
      ) {
        fileName += ".mp3";
      }

      /* ===================================================
         SEND MP3
      =================================================== */

      await bot.sendMessage(
        chatId,
        {
          audio: audioBuffer,

          mimetype:
            "audio/mpeg",

          fileName:
            fileName,

          ptt: false,
        },
        {
          quoted: message,
        }
      );

      console.log(
        "Song sent successfully:",
        fileName
      );

      /* ===================================================
         SEND VCARD
      =================================================== */

      await sendVCard(
        bot,
        chatId,
        message
      );

    } catch (error) {
      console.error(
        "Song Command Error:",
        error?.response?.data ||
        error?.message ||
        error
      );

      /* ===================================================
         ERROR MESSAGE
      =================================================== */

      let errorText =
        "❌ *Song download failed!*\n\n";

      const errorMessage =
        String(
          error?.message || ""
        ).toLowerCase();

      if (
        errorMessage.includes(
          "timeout"
        ) ||
        errorMessage.includes(
          "etimedout"
        )
      ) {
        errorText +=
          "⏱️ *Download timed out.*\n" +
          "Please try again.";
      } else if (
        errorMessage.includes(
          "404"
        )
      ) {
        errorText +=
          "🔍 *Song download not found.*\n" +
          "Try another song.";
      } else if (
        errorMessage.includes(
          "403"
        ) ||
        errorMessage.includes(
          "401"
        )
      ) {
        errorText +=
          "🔒 *Download server rejected the request.*\n" +
          "Please try again later.";
      } else {
        errorText +=
          "Please try again later.";
      }

      await bot.sendMessage(
        chatId,
        {
          text: errorText,
        },
        {
          quoted: message,
        }
      );

      /* ===================================================
         VCARD AFTER ERROR
      =================================================== */

      await sendVCard(
        bot,
        chatId,
        message
      );
    }
  },
};
