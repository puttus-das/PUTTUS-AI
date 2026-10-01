const axios = require("axios");

/* =========================================================
   CHANNEL / NEWSLETTER INFO
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

async function downloadAudioBuffer(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",

    timeout: 120000,

    maxContentLength: 100 * 1024 * 1024,

    maxBodyLength: 100 * 1024 * 1024,

    headers: {
      Accept:
        "audio/mpeg,audio/*,*/*",

      "User-Agent":
        "Mozilla/5.0 (Android 14; Mobile) AppleWebKit/537.36 Chrome/140 Safari/537.36",
    },

    validateStatus: (status) =>
      status >= 200 && status < 400,
  });

  const buffer = Buffer.from(
    response.data
  );

  if (!buffer || buffer.length < 1024) {
    throw new Error(
      "Downloaded audio is empty or invalid."
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

    const query = args
      .join(" ")
      .trim();

    /* =====================================================
       CHECK QUERY
    ===================================================== */

    if (!query) {
      return await bot.sendMessage(
        chatId,
        {
          text:
            "🎵 *Song Downloader*\n\n" +
            "Usage:\n" +
            ".song <song name>",

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
         
         NO IMAGE
         NO TITLE
         NO DURATION
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
                "Mozilla/5.0",
            },
          }
        );

      const apiData =
        apiResponse.data;

      console.log(
        "SONG API RESPONSE:",
        JSON.stringify(
          apiData,
          null,
          2
        )
      );

      /* ===================================================
         CHECK API STATUS
      =================================================== */

      if (
        !apiData ||
        apiData.status !== true
      ) {
        throw new Error(
          apiData?.message ||
          "Song API failed."
        );
      }

      /* ===================================================
         GET RESULT
      =================================================== */

      const result =
        apiData.result;

      if (!result) {
        throw new Error(
          "No song result received."
        );
      }

      /* ===================================================
         GET DOWNLOAD URL
      =================================================== */

      const downloadUrl =
        result.download_url;

      if (!downloadUrl) {
        throw new Error(
          "Download URL not found."
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
        "Downloading audio into Buffer..."
      );

      const audioBuffer =
        await downloadAudioBuffer(
          downloadUrl
        );

      console.log(
        "Audio Buffer size:",
        audioBuffer.length,
        "bytes"
      );

      /* ===================================================
         FILE NAME
      =================================================== */

      let fileName =
        result.title ||
        "PUTTUS-AI";

      fileName = fileName
        .replace(/[\\/:*?"<>|]/g, "")
        .trim();

      if (!fileName) {
        fileName = "PUTTUS-AI";
      }

      fileName += ".mp3";

     
