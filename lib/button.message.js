"use strict";

/*
╭──────────────────────────────────────────────╮
│              PUTTUS-AI                      │
│          ButtonsMessage.js                  │
│                                              │
│  Reusable WhatsApp Button Helper            │
╰──────────────────────────────────────────────╯
*/

const DEFAULT_FOOTER = "© PUTTUS-AI • Puttus Das";

/**
 * Send a simple button message
 *
 * @param {object} sock      Baileys socket
 * @param {string} jid       Chat JID
 * @param {string} text      Message text
 * @param {Array} buttons    Button list
 * @param {object} options   Extra options
 */

async function sendButtons(
  sock,
  jid,
  text,
  buttons = [],
  options = {}
) {
  if (!sock) {
    throw new Error("Baileys socket (sock) is required.");
  }

  if (!jid) {
    throw new Error("Chat JID is required.");
  }

  if (!text) {
    throw new Error("Message text is required.");
  }

  if (!Array.isArray(buttons)) {
    throw new Error("Buttons must be an array.");
  }

  const footer =
    options.footer ||
    DEFAULT_FOOTER;

  const buttonList = buttons.map((button, index) => {
    if (typeof button === "string") {
      return {
        buttonId: `puttus_${index + 1}`,
        buttonText: {
          displayText: button,
        },
        type: 1,
      };
    }

    return {
      buttonId:
        button.id ||
        `puttus_${index + 1}`,

      buttonText: {
        displayText:
          button.text ||
          button.displayText ||
          `Button ${index + 1}`,
      },

      type: 1,
    };
  });

  const content = {
    text: String(text),

    footer: String(footer),

    buttons: buttonList,

    headerType:
      options.headerType || 1,
  };

  if (options.image) {
    content.image = {
      url: options.image,
    };

    content.caption = String(text);

    delete content.text;
  }

  if (options.video) {
    content.video = {
      url: options.video,
    };

    content.caption = String(text);

    delete content.text;
  }

  const sendOptions = {};

  if (options.quoted) {
    sendOptions.quoted = options.quoted;
  }

  if (options.mentions) {
    content.mentions = options.mentions;
  }

  return await sock.sendMessage(
    jid,
    content,
    sendOptions
  );
}


/**
 * Send button message from a message object
 */
async function sendButtonsFromMessage(
  sock,
  message,
  text,
  buttons = [],
  options = {}
) {
  if (!message) {
    throw new Error("Message object is required.");
  }

  const jid =
    message?.key?.remoteJid ||
    message?.chat;

  if (!jid) {
    throw new Error(
      "Could not find chat JID from message."
    );
  }

  return await sendButtons(
    sock,
    jid,
    text,
    buttons,
    {
      ...options,
      quoted:
        options.quoted !== undefined
          ? options.quoted
          : message,
    }
  );
}


/**
 * PUTTUS-AI Main Menu Buttons
 */
async function sendMenuButtons(
  sock,
  jid,
  options = {}
) {
  const menuText =
`╭━━〔 𓆩⚡𓆪 *PUTTUS-AI* 〕━━╮
┃
┃ ʜᴇʟʟᴏ, ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ᴘᴜᴛᴛᴜs-ᴀɪ
┃
┃ ⚡ Fast • Stable • Powerful
┃
╰━━━━━━━━━━━━━━━━━━━━╯`;

  const buttons = [
    {
      id: "puttus_ping",
      text: "⚡ PING",
    },
    {
      id: "puttus_menu",
      text: "📜 MENU",
    },
    {
      id: "puttus_owner",
      text: "👤 OWNER",
    },
  ];

  return await sendButtons(
    sock,
    jid,
    menuText,
    buttons,
    {
      footer:
        options.footer ||
        "© PUTTUS-AI • Puttus Das",

      quoted:
        options.quoted,

      image:
        options.image,

      video:
        options.video,
    }
  );
}


/**
 * Send buttons with an image
 */
async function sendImageButtons(
  sock,
  jid,
  image,
  caption,
  buttons = [],
  options = {}
) {
  return await sendButtons(
    sock,
    jid,
    caption,
    buttons,
    {
      ...options,
      image: image,
    }
  );
}


/**
 * Send buttons with a video
 */
async function sendVideoButtons(
  sock,
  jid,
  video,
  caption,
  buttons = [],
  options = {}
) {
  return await sendButtons(
    sock,
    jid,
    caption,
    buttons,
    {
      ...options,
      video: video,
    }
  );
}


/**
 * Button ID helper
 */
function getButtonId(buttonMessage) {
  try {
    return (
      buttonMessage?.buttonsResponseMessage
        ?.selectedButtonId ||

      buttonMessage?.templateButtonReplyMessage
        ?.selectedId ||

      buttonMessage?.interactiveResponseMessage
        ?.nativeFlowResponseMessage
        ?.paramsJson
    );
  } catch {
    return null;
  }
}


/**
 * Check whether incoming message
 * contains a button response
 */
function isButtonResponse(message) {
  if (!message) return false;

  const msg =
    message?.message ||
    message;

  return Boolean(
    msg?.buttonsResponseMessage ||
    msg?.templateButtonReplyMessage ||
    msg?.interactiveResponseMessage
  );
}


/**
 * Export everything
 */
module.exports = {
  sendButtons,
  sendButtonsFromMessage,
  sendMenuButtons,
  sendImageButtons,
  sendVideoButtons,
  getButtonId,
  isButtonResponse,
};
