/*****************************************************************************
 *                     PUTTUS-AI Play Plugin                                 *
 *****************************************************************************/

const PLAY_API =
  "https://rabbitapi.zone.id/api/play";

const BOT_VCARD = `
BEGIN:VCARD
VERSION:3.0
N:PUTTUS;BOT;;;
FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲
ORG:PUTTUS BOT
TEL;TYPE=CELL;TYPE=VOICE;waid=919641092392:+919641092392
END:VCARD
`;

async function sendVCard(sock, chatId, quoted) {
  try {
    await sock.sendMessage(
      chatId,
      {
        contacts: {
          displayName: "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
          contacts: [
            {
              vcard: BOT_VCARD
            }
          ]
        }
      },
      { quoted }
    );
  } catch (error) {
    console.error("PLAY VCARD ERROR:", error);
  }
}

module.exports = {
  command: "play",
  aliases: ["ytplay"],
  category: "download",
  description: "Play/download YouTube song",
  usage: ".play <song name or YouTube URL>",

  async handler(sock, message, args = [], context = {}) {
    const chatId =
      context?.chatId ||
      message?.key?.remoteJid;

    if (!chatId) return;

    try {
      const query = args.join(" ").trim();

      if (!query) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *Song name dao!*\n\n` +
              `Example:\n` +
              `.play Alan Walker Faded`
          },
          { quoted: message }
        );
      }

      await sock.sendMessage(chatId, {
        react: {
          text: "🎵",
          key: message.key
        }
      });

      const apiUrl =
        `${PLAY_API}?url=${encodeURIComponent(query)}`;

      const response = await fetch(apiUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "PUTTUS-AI"
        }
      });

      if (!response.ok) {
        throw new Error(
          `Play API HTTP ${response.status}`
        );
      }

      const data = await response.json();

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

      if (!audioUrl) {
        console.log(
          "Rabbit Play API Response:",
          JSON.stringify(data, null, 2)
        );

        return await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *Audio পাওয়া যায়নি।*\n\n` +
              `Rabbit Play API কোনো valid audio URL দেয়নি।`
          },
          { quoted: message }
        );
      }

      const title =
        result?.title ||
        data?.title ||
        query;

      const safeTitle =
        String(title).replace(/[\\/:*?"<>|]/g, "");

      await sock.sendMessage(
        chatId,
        {
          audio: {
            url: audioUrl
          },
          mimetype: "audio/mpeg",
          fileName: `${safeTitle}.mp3`,
          ptt: false
        },
        { quoted: message }
      );

      await sendVCard(sock, chatId, message);

      await sock.sendMessage(chatId, {
        react: {
          text: "✅",
          key: message.key
        }
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
            `❌ *Play failed.*\n\n` +
            `আবার একটু পরে try করো।`
        },
        { quoted: message }
      );
    }
  }
};
