const fs = require("fs");
const path = require("path");
const os = require("os");
const ffmpeg = require("fluent-ffmpeg");
const {
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");

/* =========================================================
   PUTTUS VCARD — QUOTED ONLY
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
   DOWNLOAD MEDIA
========================================================= */

async function downloadMedia(media, type) {
  const stream = await downloadContentFromMessage(
    media,
    type,
  );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/* =========================================================
   VIDEO → JPG FRAME
========================================================= */

function videoToImage(videoBuffer) {
  return new Promise((resolve, reject) => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "puttus-pp-"),
    );

    const input = path.join(
      tempDir,
      "input.mp4",
    );

    const output = path.join(
      tempDir,
      "pp.jpg",
    );

    try {
      fs.writeFileSync(input, videoBuffer);

      ffmpeg(input)
        .screenshots({
          timestamps: ["00:00:01"],
          filename: "pp.jpg",
          folder: tempDir,
          size: "640x640",
        })
        .on("end", () => {
          try {
            const image =
              fs.readFileSync(output);

            fs.rmSync(tempDir, {
              recursive: true,
              force: true,
            });

            resolve(image);
          } catch (error) {
            reject(error);
          }
        })
        .on("error", (error) => {
          try {
            fs.rmSync(tempDir, {
              recursive: true,
              force: true,
            });
          } catch {}

          reject(error);
        });
    } catch (error) {
      try {
        fs.rmSync(tempDir, {
          recursive: true,
          force: true,
        });
      } catch {}

      reject(error);
    }
  });
}

/* =========================================================
   SETFULLPP
========================================================= */

module.exports = {
  command: "setfullpp",

  aliases: [
    "setpp",
    "setdp",
    "fullpp",
  ],

  category: "owner",

  description:
    "Set bot profile picture from image or video.",

  usage:
    ".setfullpp (reply to image/video)",

  async handler(
    sock,
    message,
    args = [],
    context = {},
  ) {
    const chatId =
      context.chatId ||
      message.key.remoteJid;

    const vcardQuote =
      getPuttusVCardQuote();

    try {
      /* =====================================================
         GET REPLIED MESSAGE
      ===================================================== */

      const quoted =
        message.message
          ?.extendedTextMessage
          ?.contextInfo
          ?.quotedMessage;

      if (!quoted) {
        await sock.sendMessage(
          chatId,
          {
            text:
              "*❌ Reply to an image or video with .setfullpp*",
          },
          {
            quoted: vcardQuote,
          },
        );

        return;
      }

      /* =====================================================
         IMAGE → DP
      ===================================================== */

      if (quoted.imageMessage) {
        const image =
          await downloadMedia(
            quoted.imageMessage,
            "image",
          );

        await sock.updateProfilePicture(
          sock.user.id,
          image,
        );

        await sock.sendMessage(
          chatId,
          {
            text:
              "*✅ Profile picture updated successfully.*\n\n" +
              "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
          },
          {
            quoted: vcardQuote,
          },
        );

        return;
      }

      /* =====================================================
         VIDEO → FRAME → DP
      ===================================================== */

      if (quoted.videoMessage) {
        const video =
          await downloadMedia(
            quoted.videoMessage,
            "video",
          );

        await sock.sendMessage(
          chatId,
          {
            text:
              "*⏳ Processing video...*\n\n" +
              "_Creating a profile-picture frame._",
          },
          {
            quoted: vcardQuote,
          },
        );

        const image =
          await videoToImage(video);

        await sock.updateProfilePicture(
          sock.user.id,
          image,
        );

        await sock.sendMessage(
          chatId,
          {
            text:
              "*✅ Profile picture updated from video.*\n\n" +
              "_WhatsApp uses a static profile picture, so a frame from the video was used._\n\n" +
              "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
          },
          {
            quoted: vcardQuote,
          },
        );

        return;
      }

      /* =====================================================
         UNSUPPORTED MEDIA
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          text:
            "*❌ Only images and videos are supported.*",
        },
        {
          quoted: vcardQuote,
        },
      );
    } catch (error) {
      console.error(
        "SETFULLPP ERROR:",
        error,
      );

      await sock.sendMessage(
        chatId,
        {
          text:
            "*❌ Failed to update profile picture.*\n\n" +
            `_${error?.message || "Unknown error"}_`,
        },
        {
          quoted: vcardQuote,
        },
      );
    }
  },
};
