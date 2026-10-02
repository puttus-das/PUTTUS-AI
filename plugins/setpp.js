const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");
const {
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");

const isOwnerOrSudo = require("../lib/isOwner");

/* =========================================================
   PUTTUS VCARD
   VCard will ONLY be used as quoted message.
   No separate VCard message will be sent.
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
   RUN FFMPEG
========================================================= */

function runFFmpeg(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y",

      "-i",
      inputPath,

      // Take frame at 1 second.
      "-ss",
      "1",

      "-frames:v",
      "1",

      // Square profile-picture frame.
      "-vf",
      "scale=640:640:force_original_aspect_ratio=decrease," +
        "pad=640:640:(ow-iw)/2:(oh-ih)/2",

      "-q:v",
      "3",

      outputPath,
    ]);

    let stderr = "";

    ffmpeg.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffmpeg.on("error", (error) => {
      reject(error);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve();
      } else {
        reject(
          new Error(
            stderr ||
              `FFmpeg exited with code ${code}`,
          ),
        );
      }
    });
  });
}

/* =========================================================
   GET QUOTED MESSAGE
========================================================= */

function getQuotedMessage(message) {
  return (
    message.message
      ?.extendedTextMessage
      ?.contextInfo
      ?.quotedMessage || null
  );
}

/* =========================================================
   COMMAND
========================================================= */

module.exports = {
  command: "setpp",

  aliases: [
    "setppic",
    "setdp",
    "setfullpp",
    "fullpp",
  ],

  category: "owner",

  description:
    "Set or update the bot profile picture from an image or video.",

  usage:
    ".setpp (reply to an image/video)",

  async handler(
    sock,
    message,
    args = [],
    context = {},
  ) {
    const chatId =
      context.chatId ||
      message.key.remoteJid;

    let tempDir = null;

    try {
      /* =====================================================
         OWNER CHECK
      ===================================================== */

      const senderId =
        message.key.participant ||
        message.key.remoteJid;

      const isOwner =
        await isOwnerOrSudo(
          senderId,
          sock,
          chatId,
        );

      if (!message.key.fromMe && !isOwner) {
        await sock.sendMessage(
          chatId,
          {
            text:
              "*This command is only available for the owner!*",
          },
          {
            quoted: message,
          },
        );

        return;
      }

      /* =====================================================
         QUOTED MESSAGE
      ===================================================== */

      const quotedMessage =
        getQuotedMessage(message);

      if (!quotedMessage) {
        await sock.sendMessage(
          chatId,
          {
            text:
              "*⚠️ Reply to an image or video with .setpp*",
          },
          {
            quoted: message,
          },
        );

        return;
      }

      /* =====================================================
         IMAGE
      ===================================================== */

      if (quotedMessage.imageMessage) {
        const image =
          await downloadMedia(
            quotedMessage.imageMessage,
            "image",
          );

        if (!image || !image.length) {
          throw new Error(
            "Image download failed",
          );
        }

        await sock.updateProfilePicture(
          sock.user.id,
          image,
        );

        await sock.sendMessage(
          chatId,
          {
            text:
              "✅ *⎯꯭⃜ ꯭𔘓⃪꯭[]꯭🩸꯭𝐒꯭ᴜ꯭ᴄ꯭ᴄ꯭ᴇ꯭ꜱ꯭ꜱ꯭ꜰ꯭ᴜ꯭ʟ꯭ʟ꯭ʏ꯭ 𝐔꯭ᴘ꯭ᴅ꯭ᴀ꯭ᴛ꯭ᴇ꯭ᴅ꯭ 𝐁꯭ᴏ꯭ᴛ꯭ 𝐏꯭ɪ꯭ᴄ꯭ ⚡ 𝐀꯭ᴘ꯭ᴜ꯭ʀ꯭ʙ꯭ᴏ꯭/𝐏꯭ᴜ꯭ᴛ꯭ᴛ꯭ᴜ꯭𝐒꯭ ⟶᯦꯭*\n\n" +
              "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
          },
          {
            // VCard is quoted here.
            // No separate VCard message.
            quoted: getPuttusVCardQuote(),
          },
        );

        return;
      }

      /* =====================================================
         VIDEO
      ===================================================== */

      if (quotedMessage.videoMessage) {
        tempDir = fs.mkdtempSync(
          path.join(
            os.tmpdir(),
            "puttus-setpp-",
          ),
        );

        const inputPath = path.join(
          tempDir,
          "input_video",
        );

        const outputPath = path.join(
          tempDir,
          "profile.jpg",
        );

        const video =
          await downloadMedia(
            quotedMessage.videoMessage,
            "video",
          );

        if (!video || !video.length) {
          throw new Error(
            "Video download failed",
          );
        }

        fs.writeFileSync(
          inputPath,
          video,
        );

        await runFFmpeg(
          inputPath,
          outputPath,
        );

        if (!fs.existsSync(outputPath)) {
          throw new Error(
            "Could not create image from video",
          );
        }

        const profileImage =
          fs.readFileSync(outputPath);

        await sock.updateProfilePicture(
          sock.user.id,
          profileImage,
        );

        await sock.sendMessage(
          chatId,
          {
            text:
              "✅ *⎯꯭⃜ ꯭𔘓⃪꯭[]꯭🩸꯭𝐒꯭ᴜ꯭ᴄ꯭ᴄ꯭ᴇ꯭ꜱ꯭ꜱ꯭ꜰ꯭ᴜ꯭ʟ꯭ʟ꯭ʏ꯭ 𝐔꯭ᴘ꯭ᴅ꯭ᴀ꯭ᴛ꯭ᴇ꯭ᴅ꯭ 𝐁꯭ᴏ꯭ᴛ꯭ 𝐏꯭ɪ꯭ᴄ꯭ ⚡ 𝐀꯭ᴘ꯭ᴜ꯭ʀ꯭ʙ꯭ᴏ꯭/𝐏꯭ᴜ꯭ᴛ꯭ᴛꯜ꯭ᴜ꯭𝐒꯭ ⟶᯦꯭*\n\n" +
              "_Video frame converted to profile picture._\n\n" +
              "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
          },
          {
            // VCard quoted with response.
            // It will NOT be sent separately.
            quoted: getPuttusVCardQuote(),
          },
        );

        return;
      }

      /* =====================================================
         UNSUPPORTED
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          text:
            "*❌ Reply to an image or video.*",
        },
        {
          quoted: message,
        },
      );
    } catch (error) {
      console.error(
        "SetPP Command Error:",
        error,
      );

      let errorText =
        "*❌ Failed to update profile picture.*";

      if (
        String(error?.message)
          .toLowerCase()
          .includes("ffmpeg")
      ) {
        errorText +=
          "\n\n_❌ FFmpeg is not installed._\n" +
          "_Run: pkg install ffmpeg -y_";
      } else {
        errorText +=
          `\n\n_${error?.message || "Unknown error"}_`;
      }

      await sock.sendMessage(
        chatId,
        {
          text: errorText,
        },
        {
          // VCard is quoted with the error too.
          // No separate VCard message.
          quoted: getPuttusVCardQuote(),
        },
      );
    } finally {
      /* =====================================================
         CLEAN TEMP FILES
      ===================================================== */

      if (tempDir) {
        try {
          fs.rmSync(tempDir, {
            recursive: true,
            force: true,
          });
        } catch {}
      }
    }
  },
};
