const {
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");

const isOwnerOrSudo = require("../lib/isOwner");

/* =========================================================
   PUTTUS VCARD
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
   GET QUOTED MESSAGE
========================================================= */

function getQuotedMessage(message) {
  const msg = message?.message;

  if (!msg) return null;

  const types = [
    "extendedTextMessage",
    "imageMessage",
    "videoMessage",
    "buttonsResponseMessage",
    "templateButtonReplyMessage",
    "listResponseMessage",
  ];

  for (const type of types) {
    const quoted =
      msg?.[type]?.contextInfo?.quotedMessage;

    if (quoted) {
      return quoted;
    }
  }

  return null;
}

/* =========================================================
   DOWNLOAD IMAGE
========================================================= */

async function downloadImage(imageMessage) {
  const stream =
    await downloadContentFromMessage(
      imageMessage,
      "image"
    );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/* =========================================================
   LOAD JIMP
========================================================= */

async function loadJimp() {
  const jimpModule = await import("jimp");

  const Jimp = jimpModule.Jimp;
  const ResizeStrategy =
    jimpModule.ResizeStrategy;

  if (
    !Jimp ||
    typeof Jimp.read !== "function"
  ) {
    throw new Error(
      "Jimp image processor is not available."
    );
  }

  return {
    Jimp,
    ResizeStrategy,
  };
}

/* =========================================================
   AUTO ASPECT RATIO
   NO CROP
========================================================= */

async function prepareProfilePicture(
  buffer
) {
  const {
    Jimp,
    ResizeStrategy,
  } = await loadJimp();

  const image =
    await Jimp.read(buffer);

  const originalWidth =
    image.width;

  const originalHeight =
    image.height;

  if (
    !originalWidth ||
    !originalHeight
  ) {
    throw new Error(
      "Unable to read image dimensions."
    );
  }

  /* -------------------------------------------------------
     DETECT ORIGINAL ASPECT RATIO
  ------------------------------------------------------- */

  const aspectRatio =
    originalWidth /
    originalHeight;

  console.log(
    `[SET-PP] Original: ${originalWidth}x${originalHeight}`
  );

  console.log(
    `[SET-PP] Aspect Ratio: ${aspectRatio.toFixed(3)}`
  );

  /*
   * Examples:
   *
   * 1080x1080  = 1:1
   * 1080x1350  = 4:5
   * 1080x1920  = 9:16
   * 1920x1080  = 16:9
   *
   * The original ratio is NOT changed.
   */

  /* -------------------------------------------------------
     WHATSAPP SAFE CANVAS
  ------------------------------------------------------- */

  const canvasSize = 640;

  /*
   * Fit image inside square.
   *
   * IMPORTANT:
   * No crop.
   */

  const scale = Math.min(
    canvasSize / originalWidth,
    canvasSize / originalHeight
  );

  const newWidth =
    Math.max(
      1,
      Math.round(
        originalWidth * scale
      )
    );

  const newHeight =
    Math.max(
      1,
      Math.round(
        originalHeight * scale
      )
    );

  /* -------------------------------------------------------
     RESIZE WITHOUT CHANGING RATIO
  ------------------------------------------------------- */

  image.resize({
    w: newWidth,
    h: newHeight,
    mode:
      ResizeStrategy.BILINEAR,
  });

  /* -------------------------------------------------------
     SQUARE CANVAS
  ------------------------------------------------------- */

  const canvas =
    new Jimp({
      width: canvasSize,
      height: canvasSize,
      color: 0xff000000,
    });

  /* -------------------------------------------------------
     CENTER IMAGE
  ------------------------------------------------------- */

  const x =
    Math.floor(
      (canvasSize - newWidth) / 2
    );

  const y =
    Math.floor(
      (canvasSize - newHeight) / 2
    );

  canvas.composite(
    image,
    x,
    y
  );

  /* -------------------------------------------------------
     FINAL JPEG
  ------------------------------------------------------- */

  const output =
    await canvas.getBuffer(
      "image/jpeg",
      {
        quality: 95,
      }
    );

  console.log(
    `[SET-PP] Final canvas: ${canvasSize}x${canvasSize}`
  );

  console.log(
    `[SET-PP] Original ratio preserved: ${aspectRatio.toFixed(3)}`
  );

  return output;
}

/* =========================================================
   SET PROFILE PICTURE
========================================================= */

module.exports = {
  command: "setpp",

  aliases: [
    "setppic",
    "setdp",
  ],

  category: "owner",

  description:
    "Set bot profile picture while preserving the original image ratio.",

  usage:
    ".setpp (reply to an image)",

  async handler(
    sock,
    message,
    args = [],
    context = {}
  ) {
    const chatId =
      context.chatId ||
      message?.key?.remoteJid;

    try {
      /* =====================================================
         OWNER CHECK
      ===================================================== */

      const senderId =
        message?.key?.participant ||
        message?.key?.remoteJid;

      const owner =
        await isOwnerOrSudo(
          senderId,
          sock,
          chatId
        );

      if (
        !message?.key?.fromMe &&
        !owner
      ) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "*This command is only available for the owner!*",
          },
          {
            quoted:
              getPuttusVCardQuote(),
          }
        );
      }

      /* =====================================================
         GET QUOTED MESSAGE
      ===================================================== */

      const quotedMessage =
        getQuotedMessage(message);

      if (!quotedMessage) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "*⚠️ Reply to an image with .setpp*",
          },
          {
            quoted:
              getPuttusVCardQuote(),
          }
        );
      }

      /* =====================================================
         GET IMAGE
      ===================================================== */

      const imageMessage =
        quotedMessage.imageMessage;

      if (!imageMessage) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "*❌ The replied message must contain an image!*",
          },
          {
            quoted:
              getPuttusVCardQuote(),
          }
        );
      }

      /* =====================================================
         DOWNLOAD ORIGINAL IMAGE
      ===================================================== */

      const originalImage =
        await downloadImage(
          imageMessage
        );

      if (
        !Buffer.isBuffer(
          originalImage
        ) ||
        originalImage.length === 0
      ) {
        throw new Error(
          "Image download failed."
        );
      }

      /* =====================================================
         AUTO RESIZE
         ORIGINAL ASPECT RATIO PRESERVED
      ===================================================== */

      const profilePicture =
        await prepareProfilePicture(
          originalImage
        );

      if (
        !Buffer.isBuffer(
          profilePicture
        ) ||
        profilePicture.length === 0
      ) {
        throw new Error(
          "Profile picture processing failed."
        );
      }

      /* =====================================================
         CHECK WHATSAPP CONNECTION
      ===================================================== */

      if (!sock?.user?.id) {
        throw new Error(
          "WhatsApp connection is not ready."
        );
      }

      /* =====================================================
         UPDATE PROFILE PICTURE
      ===================================================== */

      await sock.updateProfilePicture(
        sock.user.id,
        profilePicture
      );

      /* =====================================================
         SUCCESS
      ===================================================== */

      return await sock.sendMessage(
        chatId,
        {
          text:
            "✅ *⎯꯭⃜ ꯭𔘓⃪꯭[]꯭🩸꯭𝐒꯭ᴜ꯭ᴄ꯭ᴄ꯭ᴇ꯭ꜱ꯭ꜱ꯭ꜰ꯭ᴜ꯭ʟ꯭ʟ꯭ʏ꯭ 𝐔꯭ᴘ꯭ᴅ꯭ᴀ꯭ᴛ꯭ᴇ꯭ᴅ꯭ 𝐁꯭ᴏ꯭ᴛ꯭ 𝐏꯭ɪ꯭ᴄ꯭ ⚡ 𝐀꯭ᴘ꯭ᴜ꯭ʀ꯭ʙ꯭ᴏ꯭/𝐏꯭ᴜ꯭ᴛ꯭ᴛ꯭ᴜ꯭𝐒꯭ ⟶᯦꯭*\n\n" +
            "╭─〔 *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ* 〕\n" +
            "│ ᯓ *AUTO SIZE*\n" +
            "│ ᯓ *ORIGINAL RATIO PRESERVED*\n" +
            "│ ᯓ *NO CROP*\n" +
            "╰──────────────\n\n" +
            "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
        },
        {
          quoted:
            getPuttusVCardQuote(),
        }
      );

    } catch (error) {
      /* =====================================================
         ERROR
      ===================================================== */

      console.error(
        "[SET-PP ERROR]",
        error
      );

      return await sock.sendMessage(
        chatId,
        {
          text:
            "*❌ Failed to update profile picture.*\n\n" +
            `_${error?.message || "Unknown error"}_`,
        },
        {
          quoted:
            getPuttusVCardQuote(),
        }
      );
    }
  },
};
