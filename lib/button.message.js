"use strict";

/*
╭──────────────────────────────────────────────╮
│              PUTTUS-AI                      │
│          ButtonsMessage.js                  │
│                                              │
│       Baileys Native Flow Helper            │
╰──────────────────────────────────────────────╯
*/

async function sendMenuButtons(
  sock,
  jid,
  options = {}
) {
  if (!sock) {
    throw new Error("Socket is required.");
  }

  if (!jid) {
    throw new Error("Chat JID is required.");
  }

  const text =
    options.text ||
`╭━━〔 愛 ᴘᴜᴛᴛᴜs 〕━━╮

│ 𖤐 ᴘᴜᴛᴛᴜs-ᴀɪ
│
│ ⚡ Fast • Stable • Powerful
│
╰━━━━━━━━━━━━━━━━━━╯`;

  const footer =
    options.footer ||
    "© PUTTUS-AI • Puttus Das";

  const buttons = [
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "👑 OWNER",
        id: ".owner",
      }),
    },

    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "⚡ PING",
        id: ".ping",
      }),
    },
  ];

  const message = {
    interactiveMessage: {
      body: {
        text: String(text),
      },

      footer: {
        text: String(footer),
      },

      nativeFlowMessage: {
        buttons,
      },
    },
  };

  /*
   * Image/video কখনো null অবস্থায় পাঠানো হবে না।
   */

  if (options.image) {
    message.interactiveMessage.header = {
      title: "PUTTUS-AI",
      hasMediaAttachment: true,
    };

    message.interactiveMessage.header.imageMessage = {
      url: options.image,
    };
  }

  return await sock.sendMessage(
    jid,
    message,
    options.quoted
      ? {
          quoted: options.quoted,
        }
      : {}
  );
}


/*
╭──────────────────────────────────────────────╮
│              GENERIC BUTTONS                │
╰──────────────────────────────────────────────╯
*/

async function sendButtons(
  sock,
  jid,
  text,
  buttons = [],
  options = {}
) {
  if (!sock) {
    throw new Error("Socket is required.");
  }

  if (!jid) {
    throw new Error("Chat JID is required.");
  }

  const flowButtons = buttons.map(
    (button, index) => ({
      name: "quick_reply",

      buttonParamsJson:
        JSON.stringify({
          display_text:
            button.text ||
            button.displayText ||
            `Button ${index + 1}`,

          id:
            button.id ||
            `puttus_${index + 1}`,
        }),
    })
  );

  const message = {
    interactiveMessage: {
      body: {
        text: String(text),
      },

      footer: {
        text:
          options.footer ||
          "© PUTTUS-AI • Puttus Das",
      },

      nativeFlowMessage: {
        buttons: flowButtons,
      },
    },
  };

  return await sock.sendMessage(
    jid,
    message,
    options.quoted
      ? {
          quoted: options.quoted,
        }
      : {}
  );
}


/*
╭──────────────────────────────────────────────╮
│        BUTTON MESSAGE FROM MESSAGE          │
╰──────────────────────────────────────────────╯
*/

async function sendButtonsFromMessage(
  sock,
  message,
  text,
  buttons = [],
  options = {}
) {
  const jid =
    message?.key?.remoteJid ||
    message?.chat;

  if (!jid) {
    throw new Error(
      "Chat JID not found."
    );
  }

  return sendButtons(
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


/*
╭──────────────────────────────────────────────╮
│              BUTTON RESPONSE                │
╰──────────────────────────────────────────────╯
*/

function getButtonId(message) {
  try {
    const msg =
      message?.message ||
      message;

    return (
      msg
        ?.buttonsResponseMessage
        ?.selectedButtonId ||

      msg
        ?.templateButtonReplyMessage
        ?.selectedId ||

      null
    );
  } catch {
    return null;
  }
}


function isButtonResponse(message) {
  if (!message) {
    return false;
  }

  const msg =
    message?.message ||
    message;

  return Boolean(
    msg?.buttonsResponseMessage ||
    msg?.templateButtonReplyMessage ||
    msg?.interactiveResponseMessage
  );
}


/*
╭──────────────────────────────────────────────╮
│                  EXPORTS                    │
╰──────────────────────────────────────────────╯
*/

module.exports = {
  sendMenuButtons,
  sendButtons,
  sendButtonsFromMessage,
  getButtonId,
  isButtonResponse,
};
