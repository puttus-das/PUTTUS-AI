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

  if (!msg) {
    return null;
  }

  const messageTypes = [
    "extendedTextMessage",
    "imageMessage",
    "videoMessage",
    "buttonsResponseMessage",
    "templateButtonReplyMessage",
    "listResponseMessage",
  ];

  for (const type of messageTypes) {
    const contextInfo =
      msg?.[type]?.contextInfo;

    if (contextInfo?.quotedMessage) {
      return contextInfo.quotedMessage;
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
   JIMP LOADER
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
      "Jimp is installed but Jimp.read() is unavailable."
    );
  }

  return {
    Jimp,
    ResizeStrategy,
  };
}

/* =========================================================
   CREATE 9:16 LONG IMAGE
   NO CROP
========================================================= */

async function createLong9x16(
  inputBuffer
) {
  const {
    Jimp,
    ResizeStrategy,
  } = await loadJimp();

  const image =
    await Jimp.read(inputBuffer);

  const originalWidth =
    image.width;

  const originalHeight =
    image.height;

  if (
    !originalWidth ||
    !originalHeight
  ) {
    throw new Error(
      "Unable to detect image dimensions."
    );
  }

  /*
   * Target 9:16
   *
   * 1080 x 1920
   */

  const targetWidth = 1080;
  const targetHeight = 1920;

  /*
   * FIT INSIDE 9:16
   * NEVER CROP
   */

  const scale = Math.min(
    targetWidth / originalWidth,
    targetHeight / originalHeight
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

  image.resize({
    w: newWidth,
    h: newHeight,
    mode:
      ResizeStrategy.BILINEAR,
  });

  /*
   * Create 9:16 canvas
   */

  const longCanvas =
    new Jimp({
      width: targetWidth,
      height: targetHeight,
      color: 0xff000000,
    });

  /*
   * Center image
   */

  const x = Math.floor(
    (targetWidth - newWidth) / 2
  );

  const y = Math.floor(
    (targetHeight - newHeight) / 2
  );

  longCanvas.composite(
    image,
    x,
    y
  );

  return await longCanvas.getBuffer(
    "image/jpeg",
    {
      quality: 95,
    }
  );
}

/* =========================================================
   PUT 9:16 IMAGE INSIDE SQUARE
   IMPORTANT:
   BAILEYS updateProfilePicture() EXPECTS SQUARE
========================================================= */

async function createWhatsAppDP(
  longBuffer
) {
  const {
    Jimp,
    ResizeStrategy,
  } = await loadJimp();

  const longImage =
    await Jimp.read(longBuffer);

  const longWidth =
    longImage.width;

  const longHeight =
    longImage.height;

  if (
    !longWidth ||
    !longHeight
  ) {
    throw new Error(
      "Unable to read 9:16 image."
    );
  }

  /*
   * WhatsApp-safe square
   */

  const canvasSize = 640;

  /*
   * Fit 9:16 image inside
   * 640 x 640
   *
   * NO CROP
   */

  const scale = Math.min(
    canvasSize / longWidth,
    canvasSize / longHeight
  );

  const newWidth =
    Math.max(
      1,
      Math.round(
        longWidth * scale
      )
    );

  const newHeight =
    Math.max(
      1,
      Math.round(
        longHeight * scale
      )
    );

  longImage.resize({
    w: newWidth,
    h: newHeight,
    mode:
      ResizeStrategy.BILINEAR,
  });

  /*
   * Black square background
   */

  const square =
    new Jimp({
      width: canvasSize,
      height: canvasSize,
      color: 0xff000000,
    });

  /*
   * Center 9:16 image
   */

  const x = Math.floor(
    (canvasSize - newWidth) / 2
  );

  const y = Math.floor(
    (canvasSize - newHeight) / 2
  );

  square.composite(
    longImage,
    x,
    y
  );

  /*
   * JPEG output
   */

  return await square.getBuffer(
    "image/jpeg",
    {
      quality: 95,
    }
  );
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
    "Set bot profile picture using 9:16 long format without cropping.",

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
         GET REPLIED MESSAGE
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
         DOWNLOAD ORIGINAL
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

      console.log(
        "[SET-PP] Original image:",
        originalImage.length,
        "bytes"
      );

      /* =====================================================
         STEP 1
         CREATE 9:16 LONG IMAGE
      ===================================================== */

      const longImage =
        await createLong9x16(
          originalImage
        );

      if (
        !Buffer.isBuffer(
          longImage
        ) ||
        longImage.length === 0
      ) {
        throw new Error(
          "9:16 image creation failed."
        );
      }

      console.log(
        "[SET-PP] 9:16 image created:",
        longImage.length,
        "bytes"
      );

      /* =====================================================
         STEP 2
         CREATE SQUARE WHATSAPP DP
         WITHOUT CROPPING
      ===================================================== */

      const profilePicture =
        await createWhatsAppDP(
          longImage
        );

      if (
        !Buffer.isBuffer(
          profilePicture
        ) ||
        profilePicture.length === 0
      ) {
        throw new Error(
          "WhatsApp DP processing failed."
        );
      }

      console.log(
        "[SET-PP] Final DP created:",
        profilePicture.length,
        "bytes"
      );

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
            "│ ᯓ 9:16 *LONG FORMAT*\n" +
            "│ ᯓ *NO CROP*\n" +
            "│ ᯓ *FULL IMAGE PRESERVED*\n" +
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
