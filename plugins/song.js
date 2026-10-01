const axios = require("axios");

/* =========================================================
   CHANNEL INFO
========================================================= */

const channelInfo = {
  forwardingScore: 1,

  isForwarded: true,

  forwardedNewsletterMessageInfo: {
    newsletterJid:
      "120363411471428911@newsletter",

    newsletterName:
      "━[ 𝐏ᴜᴛᴛᴜꜱ - 𝐃ᴀꜱ]━",

    serverMessageId: -1,
  },
};

/* =========================================================
   DOWNLOAD AUDIO AS BUFFER
========================================================= */

async function downloadAudio(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",

    timeout: 120000,

    maxContentLength: 100 * 1024 * 1024,

    maxBodyLength: 100 * 1024 * 1024,

    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36",

      Accept:
        "audio/mpeg,audio/*,*/*",
    },

    validateStatus: (status) =>
      status >= 200 && status < 400,
  });

  const buffer = Buffer.from(response.data);

  if (!buffer || buffer.length < 1024) {
    throw new Error(
      "Invalid or empty audio file"
    );
  }

  return buffer;
}

/* =========================================================
   SONG PLUGIN
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
    "Download YouTube songs as MP3",

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

    const query = Array.isArray(args)
      ? args.join(" ").trim()
      : String(args || "").trim();

    /* =====================================================
       NO QUERY
    ===================================================== */

    if (!query) {
      return await bot.sendMessage(
        chatId,
        {
          text:
            "🎵 *Song Downloader*\n\n" +
            "Usage:\n" +
            "`.song <song name>`",

          ...channelInfo,
        },
        {
          quoted: message,
        }
      );
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

          ...channelInfo,
        },
        {
          quoted: message,
        }
      );

      /* ===================================================
         DAVID CYRIL API
      =================================================== */

      const response = await axios.get(
        "https://apis.davidcyril.name.ng/play",
        {
          params: {
            query: query,
          },

          timeout: 60000,

          headers: {
            Accept: "application/json",

            "User-Agent":
              "Mozilla/5.0",
          },
        }
      );

      const apiData = response.data;

      console.log(
        "SONG API RESPONSE:",
        JSON.stringify(
          apiData,
          null,
          2
        )
      );

      /* ===================================================
         CHECK API RESPONSE
      =================================================== */

      if (
        !apiData ||
        apiData.status !== true ||
        !apiData.result
      ) {
        throw new Error(
          apiData?.message ||
          "Song information not found"
        );
      }

      const song = apiData.result;

      /* ===================================================
         GET DOWNLOAD URL
      =================================================== */

      const downloadUrl =
        song.download_url;

      if (!downloadUrl) {
        throw new Error(
          "Download URL not found"
        );
      }

      console.log(
        "DOWNLOAD URL:",
        downloadUrl
      );

      /* ===================================================
         DOWNLOAD MP3 INTO BUFFER
      =================================================== */

      console.log(
        "Downloading MP3..."
      );

      const audioBuffer =
        await downloadAudio(
          downloadUrl
        );

      console.log(
        `Audio downloaded: ${audioBuffer.length} bytes`
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
        fileName = "PUTTUS-AI";
      }

      if (
        !fileName
          .toLowerCase()
          .endsWith(".mp3")
      ) {
        fileName += ".mp3";
      }

      /* ===================================================
         SEND AUDIO BUFFER
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

          ...channelInfo,
        },
        {
          quoted: message,
        }
      );

      console.log(
        `Song sent successfully: ${fileName}`
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
      }

      else if (
        errorMessage.includes("404")
      ) {
        errorText +=
          "🔍 *Song download not found.*\n" +
          "Please try another song.";
      }

      else if (
        errorMessage.includes("403") ||
        errorMessage.includes("401")
      ) {
        errorText +=
          "🔒 *
