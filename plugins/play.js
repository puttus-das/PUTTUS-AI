const settings = require("../settings");

const PLAY_API = "https://rabbitapi.zone.id/api/play";

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
        displayName: "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
        vcard,
      },
    },
  };
}

function findValue(obj, keys = []) {
  if (!obj || typeof obj !== "object") return null;

  for (const key of keys) {
    if (
      typeof obj[key] === "string" &&
      obj[key].trim()
    ) {
      return obj[key].trim();
    }
  }

  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      const found = findValue(value, keys);
      if (found) return found;
    }
  }

  return null;
}

module.exports = {
  command: "play",

  aliases: [
    "song",
    "music",
    "audio"
  ],

  category: "music",

  description: "Download and play a song from YouTube",

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

    if (!query) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            `❌ *Song name dao!*\n\n` +
            `Example:\n` +
            `*${prefix}play Alan Walker Faded*`
        },
        {
          quoted: message
        }
      );
    }

    try {
      await sock.sendMessage(
        chatId,
        {
          react: {
            text: "🎵",
            key: message.key
          }
        }
      );

      const apiUrl =
        `${PLAY_API}?q=${encodeURIComponent(query)}`;

      const response =
        await fetch(apiUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "PUTTUS-AI"
          }
        });

      if (!response.ok) {
        throw new Error(
          `Rabbit Play HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      console.log(
        "PUTTUS PLAY API RESPONSE:",
        JSON.stringify(data, null, 2)
      );

      const apiStatus =
        data?.status === true ||
        data?.response?.status === true;

      if (!apiStatus) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *Song পাওয়া যায়নি.*\n\n` +
              `${data?.message ||
                data?.response?.message ||
                "Invalid song name or YouTube URL."}`
          },
          {
            quoted:
              getPuttusVCardQuote()
          }
        );
      }

      const title =
        findValue(data, [
          "title",
          "name",
          "song",
          "track"
        ]) || query;

      const thumbnail =
        findValue(data, [
          "thumbnail",
          "thumb",
          "image",
          "cover"
        ]);

      const audioUrl =
        findValue(data, [
          "url",
          "audio",
          "audioUrl",
          "download",
          "downloadUrl",
          "download_url",
          "link",
          "mp3",
          "media"
        ]);

      if (!audioUrl) {
        console.error(
          "PUTTUS PLAY: AUDIO URL NOT FOUND",
          JSON.stringify(data, null, 2)
        );

        return await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *Song download link পাওয়া যায়নি।*\n\n` +
              `API response check করতে console দেখো।`
          },
          {
            quoted:
              getPuttusVCardQuote()
          }
        );
      }

      const caption =
        `╭─〔 *𝐏ᴜᴛᴛᴜs-Bᴏᴛ* 〕─╮\n` +
        `│ 🎵 *PLAYING SONG*\n` +
        `│\n` +
        `│ 🎧 *${title}*\n` +
        `│ 🔎 *Query:* ${query}\n` +
        `╰──────────────────╯\n\n` +
        `💜 *PUTTUS-AI MUSIC*`;

      if (thumbnail) {
        try {
          await sock.sendMessage(
            chatId,
            {
              image: {
                url: thumbnail
              },
              caption
            },
            {
              quoted:
                getPuttusVCardQuote()
            }
          );
        } catch (error) {
          console.log(
            "PUTTUS PLAY THUMBNAIL ERROR:",
            error.message
          );
        }
      }

      await sock.sendMessage(
        chatId,
        {
          audio: {
            url: audioUrl
          },
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`,
          ptt: false
        },
        {
          quoted:
            getPuttusVCardQuote()
        }
      );

      await sock.sendMessage(
        chatId,
        {
          react: {
            text: "✅",
            key: message.key
          }
        }
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
            `❌ *Play Error*\n\n` +
            `গানটি পাওয়া বা download করা যায়নি।\n` +
            `আবার চেষ্টা করো।`
        },
        {
          quoted:
            getPuttusVCardQuote()
        }
      );
    }
  }
};
