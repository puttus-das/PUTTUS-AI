const fs = require("fs");
const path = require("path");
const settings = require("../settings");
const store = require("./lightweight_store");
const commandHandler = require("./commandHandler");
const { printMessage, printLog } = require("./print");
const { isBanned } = require("./isBanned");
const { isSudo } = require("./index");
const isOwnerOrSudo = require("./isOwner");
const isAdmin = require("./isAdmin");

const { handleAutoread } = require("../plugins/autoread");

const {
  handleAutotypingForMessage,
  showTypingAfterCommand,
} = require("../plugins/autotyping");

const {
  storeMessage,
  handleMessageRevocation,
} = require("../plugins/antidelete");

const { handleBadwordDetection } = require("./antibadword");
const { handleLinkDetection } = require("../plugins/antilink");
const { handleTagDetection } = require("../plugins/antitag");
const { handleMentionDetection } = require("../plugins/mention");
const { handleChatbotResponse } = require("../plugins/chatbot");
const { handleTicTacToeMove } = require("../plugins/tictactoe");
const { addCommandReaction } = require("./reactions");

/* =========================================================
   PUTTUS SMALL FONT
========================================================= */

function smallFont(text) {
  const map = {
    a: "ᴀ",
    b: "ʙ",
    c: "ᴄ",
    d: "ᴅ",
    e: "ᴇ",
    f: "ғ",
    g: "ɢ",
    h: "ʜ",
    i: "ɪ",
    j: "ᴊ",
    k: "ᴋ",
    l: "ʟ",
    m: "ᴍ",
    n: "ɴ",
    o: "ᴏ",
    p: "ᴘ",
    q: "ǫ",
    r: "ʀ",
    s: "s",
    t: "ᴛ",
    u: "ᴜ",
    v: "ᴠ",
    w: "ᴡ",
    x: "x",
    y: "ʏ",
    z: "ᴢ",
  };

  return String(text)
    .split("")
    .map(
      (char) =>
        map[char.toLowerCase()] || char,
    )
    .join("");
}

/* =========================================================
   PUTTUS VCARD
========================================================= */

async function sendPuttusVCard(
  sock,
  chatId,
  quotedMessage = null,
) {
  const vcard =
    "BEGIN:VCARD\n" +
    "VERSION:3.0\n" +
    "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
    "ORG:PUTTUS BOT;\n" +
    "TEL;type=CELL;type=VOICE;waid=918967360566:+918967360566\n" +
    "END:VCARD";

  const contactMessage = {
    contacts: {
      displayName:
        "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
      contacts: [
        {
          vcard,
        },
      ],
    },
  };

  try {
    return await sock.sendMessage(
      chatId,
      contactMessage,
      quotedMessage
        ? {
            quoted: quotedMessage,
          }
        : undefined,
    );
  } catch (error) {
    printLog(
      "error",
      `VCard send error: ${error.message}`,
    );
    return null;
  }
}

/* =========================================================
   CHANNEL INFO
========================================================= */

const channelInfo = {
  contextInfo: {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid:
        "120363411471428911@newsletter",
      newsletterName:
        "━[ 𝐏ᴜᴛᴛᴜꜱ - 𝐃ᴀꜱ]━",
      serverMessageId: -1,
    },
  },
};

/* =========================================================
   DATABASE
========================================================= */

const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;

const HAS_DB = !!(
  MONGO_URL ||
  POSTGRES_URL ||
  MYSQL_URL ||
  SQLITE_URL
);

const STICKER_FILE = path.join(
  __dirname,
  "../data/sticker_commands.json",
);

/* =========================================================
   STICKER COMMANDS
========================================================= */

async function getStickerCommands() {
  if (HAS_DB) {
    try {
      const data = await store.getSetting(
        "global",
        "stickerCommands",
      );

      return data || {};
    } catch (error) {
      printLog(
        "warning",
        `Sticker DB error: ${error.message}`,
      );
      return {};
    }
  }

  try {
    if (!fs.existsSync(STICKER_FILE)) {
      return {};
    }

    return JSON.parse(
      fs.readFileSync(
        STICKER_FILE,
        "utf8",
      ),
    );
  } catch (error) {
    printLog(
      "warning",
      `Sticker file error: ${error.message}`,
    );
    return {};
  }
}

/* =========================================================
   MESSAGE HANDLER
========================================================= */

async function handleMessages(
  sock,
  messageUpdate,
) {
  try {
    if (!messageUpdate) return;

    const {
      messages,
      type,
    } = messageUpdate;

    if (type !== "notify") return;

    if (
      !Array.isArray(messages) ||
      !messages.length
    ) {
      return;
    }

    const message = messages[0];

    if (!message) return;

    if (!message.message) return;

    /* =====================================================
       PRINT MESSAGE
    ===================================================== */

    try {
      await printMessage(
        message,
        sock,
      );
    } catch (error) {
      printLog(
        "warning",
        `Print message skipped: ${error.message}`,
      );
    }

    /* =====================================================
       CHAT ID
    ===================================================== */

    const chatId =
      message.key?.remoteJid;

    if (
      !chatId ||
      typeof chatId !== "string"
    ) {
      printLog(
        "warning",
        "Message skipped: remoteJid missing",
      );
      return;
    }

    const isGroup =
      chatId.endsWith("@g.us");

    /* =====================================================
       AUTOREAD
       FIXED - NO DOUBLE CALL
    ===================================================== */

    try {
      const ghostMode =
        await store.getSetting(
          "global",
          "stealthMode",
        );

      if (
        !ghostMode ||
        !ghostMode.enabled
      ) {
        try {
          await handleAutoread(
            sock,
            message,
          );
        } catch (error) {
          printLog(
            "warning",
            `Autoread skipped: ${error.message}`,
          );
        }
      } else {
        printLog(
          "info",
          "👻 Stealth mode active",
        );
      }
    } catch (error) {
      printLog(
        "warning",
        `Stealth mode check skipped: ${error.message}`,
      );
    }

    /* =====================================================
       MESSAGE DELETION
    ===================================================== */

    if (
      message.message
        ?.protocolMessage
        ?.type === 0
    ) {
      printLog(
        "info",
        "Message deletion detected",
      );

      try {
        await handleMessageRevocation(
          sock,
          message,
        );
      } catch (error) {
        printLog(
          "error",
          `Message revocation error: ${error.message}`,
        );
      }

      return;
    }

    /* =====================================================
       STORE MESSAGE
    ===================================================== */

    try {
      await storeMessage(
        sock,
        message,
      );
    } catch (error) {
      printLog(
        "warning",
        `Store message skipped: ${error.message}`,
      );
    }

    const senderId =
      message.key?.participant ||
      message.key?.remoteJid;

    if (!senderId) return;

    /* =====================================================
       STICKER COMMAND
    ===================================================== */

    if (
      message.message?.stickerMessage
    ) {
      try {
        const fileSha256 =
          message.message
            .stickerMessage
            .fileSha256;

        if (fileSha256) {
          const hash =
            Buffer.from(
              fileSha256,
            ).toString("base64");

          const stickers =
            await getStickerCommands();

          if (stickers[hash]) {
            const commandText =
              stickers[hash].text;

            printLog(
              "info",
              `🎨 Sticker command detected: ${commandText}`,
            );

            const [
              cmdName,
              ...cmdArgs
            ] =
              commandText.split(/\s+/);

            let foundCommand = null;
            let usedPrefix = "";

            for (
              const prefix of settings.prefixes
            ) {
              const testCmd =
                (
                  prefix + cmdName
                ).toLowerCase();

              foundCommand =
                commandHandler.getCommand(
                  testCmd,
                  settings.prefixes,
                );

              if (foundCommand) {
                usedPrefix = prefix;
                break;
              }
            }

            if (foundCommand) {
              const senderIsSudo =
                await isSudo(
                  senderId,
                );

              const senderIsOwnerOrSudo =
                await isOwnerOrSudo(
                  senderId,
                  sock,
                  chatId,
                );

              const isOwnerOrSudoCheck =
                message.key.fromMe ||
                senderIsOwnerOrSudo;

              const botMode =
                await store.getBotMode();

              const isAllowed =
                (() => {
                  if (
                    isOwnerOrSudoCheck
                  ) {
                    return true;
                  }

                  switch (botMode) {
                    case "public":
                      return true;

                    case "private":
                    case "self":
                      return false;

                    case "groups":
                      return isGroup;

                    case "inbox":
                      return !isGroup;

                    default:
                      return true;
                  }
                })();

              if (!isAllowed) return;

              const userBanned =
                await isBanned(
                  senderId,
                );

              if (userBanned) return;

              /* ================= OWNER ================= */

              if (
                foundCommand.strictOwnerOnly
              ) {
                const {
                  isOwnerOnly,
                } =
                  require(
                    "./isOwner",
                  );

                if (
                  !message.key.fromMe &&
                  !isOwnerOnly(
                    senderId,
                  )
                ) {
                  return await sock.sendMessage(
                    chatId,
                    {
                      text:
                        "❌ This command is only available for the bot owner!",
                      ...channelInfo,
                    },
                    {
                      quoted: message,
                    },
                  );
                }
              }

              /* ================= OWNER/SUDO ================= */

              if (
                foundCommand.ownerOnly &&
                !message.key.fromMe &&
                !senderIsOwnerOrSudo
              ) {
                return await sock.sendMessage(
                  chatId,
                  {
                    text:
                      "❌ This command is only available for the owner or sudo users!",
                    ...channelInfo,
                  },
                  {
                    quoted: message,
                  },
                );
              }

              /* ================= GROUP ================= */

              if (
                foundCommand.groupOnly &&
                !isGroup
              ) {
                return await sock.sendMessage(
                  chatId,
                  {
                    text:
                      "This command can only be used in groups!",
                    ...channelInfo,
                  },
                  {
                    quoted: message,
                  },
                );
              }

              /* ================= ADMIN ================= */

              let isSenderAdmin =
                false;

              let isBotAdmin =
                false;

              if (
                foundCommand.adminOnly &&
                isGroup
              ) {
                const adminStatus =
                  await isAdmin(
                    sock,
                    chatId,
                    senderId,
                  );

                isSenderAdmin =
                  adminStatus.isSenderAdmin;

                isBotAdmin =
                  adminStatus.isBotAdmin;

                if (!isBotAdmin) {
                  return await sock.sendMessage(
                    chatId,
                    {
                      text:
                        "❌ Please make the bot an admin to use this command.",
                      ...channelInfo,
                    },
                    {
                      quoted:
                        message,
                    },
                  );
                }

                if (
                  !isSenderAdmin &&
                  !message.key.fromMe &&
                  !senderIsOwnerOrSudo
                ) {
                  return await sock.sendMessage(
                    chatId,
                    {
                      text:
                        "❌ Sorry, only group admins can use this command.",
                      ...channelInfo,
                    },
                    {
                      quoted:
                        message,
                    },
                  );
                }
              }

              /* ================= SYNTHETIC MESSAGE ================= */

              const syntheticMessage = {
                key: message.key,

                message: {
                  extendedTextMessage: {
                    text:
                      usedPrefix +
                      commandText,

                    contextInfo:
                      message.message
                        .stickerMessage
                        .contextInfo ||
                      {},
                  },
                },

                messageTimestamp:
                  message.messageTimestamp,

                pushName:
                  message.pushName,

                broadcast:
                  message.broadcast,
              };

              /* ================= CONTEXT ================= */

              const context = {
                chatId,
                senderId,
                isGroup,

                isSenderAdmin,
                isBotAdmin,

                senderIsOwnerOrSudo,
                isOwnerOrSudoCheck,

                channelInfo,

                rawText:
                  usedPrefix +
                  commandText,

                userMessage: (
                  usedPrefix +
                  commandText
                ).toLowerCase(),

                messageText:
                  usedPrefix +
                  commandText,

                smallFont,

                sendPuttusVCard:
                  async () => {
                    return await sendPuttusVCard(
                      sock,
                      chatId,
                      message,
                    );
                  },
              };

              /* ================= EXECUTE ================= */

              try {
                await foundCommand.handler(
                  sock,
                  syntheticMessage,
                  cmdArgs,
                  context,
                );

                try {
                  await addCommandReaction(
                    sock,
                    message,
                  );
                } catch (error) {
                  printLog(
                    "warning",
                    `Reaction skipped: ${error.message}`,
                  );
                }

                try {
                  await showTypingAfterCommand(
                    sock,
                    chatId,
                  );
                } catch (error) {
                  printLog(
                    "warning",
                    `Typing skipped: ${error.message}`,
                  );
                }

                printLog(
                  "success",
                  `✅ Sticker command executed: ${commandText}`,
                );
              } catch (error) {
                printLog(
                  "error",
                  `❌ Sticker command error [${commandText}]: ${error.message}`,
                );

                console.error(
                  error.stack,
                );

                await sock.sendMessage(
                  chatId,
                  {
                    text:
                      `❌ Error executing sticker command: ${error.message}`,
                    ...channelInfo,
                  },
                  {
                    quoted:
                      message,
                  },
                );
              }
            } else {
              printLog(
                "warning",
                `⚠️ Sticker command not found: ${commandText}`,
              );
            }

            return;
          }
        }
      } catch (error) {
        printLog(
          "error",
          `Sticker handler error: ${error.message}`,
        );
      }
    }

    /* =====================================================
       RAW TEXT
    ===================================================== */

    const rawText =
      message.message
        ?.conversation ||
      message.message
        ?.extendedTextMessage
        ?.text ||
      message.message
        ?.imageMessage
        ?.caption ||
      message.message
        ?.videoMessage
        ?.caption ||
      message.message
        ?.buttonsResponseMessage
        ?.selectedButtonId ||
      "";

    const messageText =
      String(rawText).trim();

    const userMessage =
      messageText.toLowerCase();

    /* =====================================================
       USER STATUS
    ===================================================== */

    let senderIsSudo = false;
    let senderIsOwnerOrSudo = false;

    try {
      senderIsSudo =
        await isSudo(
          senderId,
        );
    } catch (error) {
      printLog(
        "warning",
        `Sudo check failed: ${error.message}`,
      );
    }

    try {
      senderIsOwnerOrSudo =
        await isOwnerOrSudo(
          senderId,
          sock,
          chatId,
        );
    } catch (error) {
      printLog(
        "warning",
        `Owner check failed: ${error.message}`,
      );
    }

    const isOwnerOrSudoCheck =
      message.key.fromMe ||
      senderIsOwnerOrSudo;

    if (senderIsOwnerOrSudo) {
      printLog(
        "info",
        `Owner/Sudo detected: ${senderId.split("@")[0]}`,
      );
    }

    /* =====================================================
       BUTTON RESPONSE
    ===================================================== */

    if (
      message.message
        ?.buttonsResponseMessage
    ) {
      const buttonId =
        message.message
          .buttonsResponseMessage
          .selectedButtonId;

      printLog(
        "info",
        `Button response: ${buttonId}`,
      );

      if (
        buttonId === "channel"
      ) {
        await sock.sendMessage(
          chatId,
          {
            text:
              "*Join our Channel:*\nhttps://whatsapp.com/channel/0029Vb8RL4F1HspsNlYYOE3e",
          },
          {
            quoted: message,
          },
        );

        return;
      }

      if (
        buttonId === "owner"
      ) {
        try {
          const ownerCommand =
            require(
              "../plugins/owner",
            );

          await ownerCommand(
            sock,
            chatId,
          );
        } catch (error) {
          printLog(
            "error",
            `Owner button error: ${error.message}`,
          );
        }

        return;
      }

      if (
        buttonId === "support"
      ) {
        await sock.sendMessage(
          chatId,
          {
            text:
              "*Support*\n\nhttps://whatsapp.com/channel/0029Vb8RL4F1HspsNlYYOE3e",
          },
          {
            quoted: message,
          },
        );

        return;
      }
    }

    /* =====================================================
       BAN CHECK
    ===================================================== */

    let userBanned = false;

    try {
      userBanned =
        await isBanned(
          senderId,
        );
    } catch (error) {
      printLog(
        "warning",
        `Ban check failed: ${error.message}`,
      );
    }

    if (
      userBanned &&
      !userMessage.startsWith(
        ".unban",
      )
    ) {
      if (Math.random() < 0.1) {
        printLog(
          "warning",
          `Banned user attempted command: ${senderId.split("@")[0]}`,
        );

        try {
          await sock.sendMessage(
            chatId,
            {
              text:
                "You are banned from using the bot. Contact an admin to get unbanned.",
              ...channelInfo,
            },
          );
        } catch (error) {
          printLog(
            "error",
            `Ban message error: ${error.message}`,
          );
        }
      }

      return;
    }

    /* =====================================================
       TIC TAC TOE
    ===================================================== */

    if (
      /^[1-9]$/.test(
        userMessage,
      ) ||
      userMessage === "surrender"
    ) {
      await handleTicTacToeMove(
        sock,
        chatId,
        senderId,
        userMessage,
      );

      return;
    }

    /* =====================================================
       MESSAGE COUNT
    ===================================================== */

    if (!message.key.fromMe) {
      try {
        await store.incrementMessageCount(
          chatId,
          senderId,
        );
      } catch (error) {
        printLog(
          "warning",
          `Message count skipped: ${error.message}`,
        );
      }
    }
    
    /* =====================================================
       GROUP SECURITY
       ===================================================== */

    if (isGroup) {
      if (userMessage) {
        try {
          await handleBadwordDetection(
            sock,
            chatId,
            message,
            userMessage,
            senderId,
          );
        } catch (error) {
          printLog(
            "warning",
            `Badword handler error: ${error.message}`,
          );
        }
      }

      try {
        await handleLinkDetection(
          sock,
          chatId,
          message,
          userMessage,
          senderId,
        );
      } catch (error) {
        printLog(
          "warning",
          `Antilink handler error: ${error.message}`,
        );
      }
    }

    /* =====================================================
       PM BLOCKER
    ===================================================== */

    if (
      !isGroup &&
      !message.key.fromMe &&
      !senderIsSudo
    ) {
      try {
        const {
          readState:
            readPmBlockerState,
        } =
          require(
            "../plugins/pmblocker",
          );

        const pmState =
          await readPmBlockerState();

        if (pmState.enabled) {
          printLog(
            "warning",
            `PM blocked from: ${senderId.split("@")[0]}`,
          );

          await sock.sendMessage(
            chatId,
            {
              text:
                pmState.message ||
                "Private messages are blocked. Please contact the owner in groups only.",
            },
          );

          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                1500,
              ),
          );

          try {
            await sock.updateBlockStatus(
              chatId,
              "block",
            );

            printLog(
              "success",
              `Blocked user: ${senderId.split("@")[0]}`,
            );
          } catch (error) {
            printLog(
              "error",
              `Failed to block user: ${error.message}`,
            );
          }

          return;
        }
      } catch (error) {
        printLog(
          "error",
          `PM blocker error: ${error.message}`,
        );
      }
    }

    /* =====================================================
       COMMAND DETECTION
    ===================================================== */const usedPrefix =
      settings.prefixes.find(
        (prefix) =>
          userMessage.startsWith(
            prefix,
          ),
      );

    const command =
      commandHandler.getCommand(
        userMessage,
        settings.prefixes,
      );

    /* =====================================================
       NORMAL CHAT
    ===================================================== */

    if (
      !usedPrefix &&
      !command
    ) {
      try {
        await handleAutotypingForMessage(
          sock,
          chatId,
          userMessage,
        );
      } catch (error) {
        printLog(
          "warning",
          `Autotyping skipped: ${error.message}`,
        );
      }

      if (isGroup) {
        try {
          await handleTagDetection(
            sock,
            chatId,
            message,
            senderId,
          );
        } catch (error) {
          printLog(
            "warning",
            `Tag detection error: ${error.message}`,
          );
        }

        try {
          await handleMentionDetection(
            sock,
            chatId,
            message,
          );
        } catch (error) {
          printLog(
            "warning",
            `Mention detection error: ${error.message}`,
          );
        }

        let botMode = "public";

        try {
          botMode =
            await store.getBotMode();
        } catch (error) {
          printLog(
            "warning",
            `Bot mode error: ${error.message}`,
          );
        }

        const canUseChatbot =
          botMode === "public" ||
          (botMode === "groups" &&
            isGroup) ||
          (botMode === "inbox" &&
            !isGroup) ||
          isOwnerOrSudoCheck;

        if (canUseChatbot) {
          try {
            await handleChatbotResponse(
              sock,
              chatId,
              message,
              userMessage,
              senderId,
            );
          } catch (error) {
            printLog(
              "warning",
              `Chatbot error: ${error.message}`,
            );
          }
        }
      }

      return;
    }

    /* =====================================================
       COMMAND NOT FOUND
    ===================================================== */

    if (!command) {
      if (isGroup) {
        try {
          await handleTagDetection(
            sock,
            chatId,
            message,
            senderId,
          );
        } catch (error) {
          printLog(
            "warning",
            `Tag detection error: ${error.message}`,
          );
        }

        try {
          await handleMentionDetection(
            sock,
            chatId,
            message,
          );
        } catch (error) {
          printLog(
            "warning",
            `Mention detection error: ${error.message}`,
          );
        }

        let botMode = "public";

        try {
          botMode =
            await store.getBotMode();
        } catch (error) {
          printLog(
            "warning",
            `Bot mode error: ${error.message}`,
          );
        }

        const canUseChatbot =
          botMode === "public" ||
          (botMode === "groups" &&
            isGroup) ||
          (botMode === "inbox" &&
            !isGroup) ||
          isOwnerOrSudoCheck;

        if (canUseChatbot) {
          try {
            await handleChatbotResponse(
              sock,
              chatId,
              message,
              userMessage,
              senderId,
            );
          } catch (error) {
            printLog(
              "warning",
              `Chatbot error: ${error.message}`,
            );
          }
        }
      }

      return;
    }

    /* =====================================================
       BOT MODE
    ===================================================== */

    let botMode = "public";

    try {
      botMode =
        await store.getBotMode();
    } catch (error) {
      printLog(
        "warning",
        `Bot mode error: ${error.message}`,
      );
    }

    const isAllowed =
      (() => {
        if (
          isOwnerOrSudoCheck
        ) {
          return true;
        }

        switch (botMode) {
          case "public":
            return true;

          case "private":
          case "self":
            return false;

          case "groups":
            return isGroup;

          case "inbox":
            return !isGroup;

          default:
            return true;
        }
      })();

    if (!isAllowed) {
      return;
    }

    /* =====================================================
       ARGUMENTS
    ===================================================== */

    let args = [];

    if (usedPrefix) {
      const originalCommandText =
        messageText
          .slice(
            usedPrefix.length,
          )
          .trim();

      args =
        originalCommandText
          .split(/\s+/)
          .slice(1);
    } else {
      args =
        messageText
          .trim()
          .split(/\s+/)
          .slice(1);
    }

    /* =====================================================
       STRICT OWNER
    ===================================================== */

    if (
      command.strictOwnerOnly
    ) {
      const {
        isOwnerOnly,
      } =
        require(
          "./isOwner",
        );

      if (
        !message.key.fromMe &&
        !isOwnerOnly(
          senderId,
        )
      ) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ This command is only available for the bot owner!\n\n_Sudo users cannot manage other sudo users._",
            ...channelInfo,
          },
          {
            quoted: message,
          },
        );
      }
    }

    /* =====================================================
       OWNER / SUDO
    ===================================================== */

    if (
      command.ownerOnly &&
      !message.key.fromMe &&
      !senderIsOwnerOrSudo
    ) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            "❌ This command is only available for the owner or sudo users!",
          ...channelInfo,
        },
        {
          quoted: message,
        },
      );
    }

    /* =====================================================
       GROUP ONLY
    ===================================================== */

    if (
      command.groupOnly &&
      !isGroup
    ) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            "This command can only be used in groups!",
          ...channelInfo,
        },
        {
          quoted: message,
        },
      );
    }

    /* =====================================================
       ADMIN CHECK
    ===================================================== */

    let isSenderAdmin =
      false;

    let isBotAdmin =
      false;

    if (
      command.adminOnly &&
      isGroup
    ) {
      const adminStatus =
        await isAdmin(
          sock,
          chatId,
          senderId,
        );

      isSenderAdmin =
        adminStatus.isSenderAdmin;

      isBotAdmin =
        adminStatus.isBotAdmin;

      if (!isBotAdmin) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ Please make the bot an admin to use this command.",
            ...channelInfo,
          },
          {
            quoted: message,
          },
        );
      }

      if (
        !isSenderAdmin &&
        !message.key.fromMe &&
        !senderIsOwnerOrSudo
      ) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ Sorry, only group admins can use this command.",
            ...channelInfo,
          },
          {
            quoted: message,
          },
        );
      }
    }

    /* =====================================================
       COMMAND CONTEXT
    ===================================================== */

    const context = {
      chatId,
      senderId,
      isGroup,

      isSenderAdmin,
      isBotAdmin,

      senderIsOwnerOrSudo,
      isOwnerOrSudoCheck,

      channelInfo,

      rawText,
      userMessage,
      messageText,

      /* FONT */

      smallFont,

      /* VCARD */

      sendPuttusVCard:
        async () => {
          return await sendPuttusVCard(
            sock,
            chatId,
            message,
          );
        },
    };

    /* =====================================================
       EXECUTE COMMAND
    ===================================================== */

    try {
      await command.handler(
        sock,
        message,
        args,
        context,
      );

      /* Reaction should never break command */

      try {
        await addCommandReaction(
          sock,
          message,
        );
      } catch (error) {
        printLog(
          "warning",
          `Reaction skipped: ${error.message}`,
        );
      }

      /* Typing should never break command */

      try {
        await showTypingAfterCommand(
          sock,
          chatId,
        );
      } catch (error) {
        printLog(
          "warning",
          `Typing skipped: ${error.message}`,
        );
      }
    } catch (error) {
      /* ===================================================
         REAL COMMAND ERROR
      =================================================== */

      printLog(
        "error",
        `Command error [${command.command}]: ${error.message}`,
      );

      console.error(
        "========== PUTTUS COMMAND ERROR ==========",
      );

      console.error(error);

      console.error(
        "===========================================",
      );

      try {
        await sock.sendMessage(
          chatId,
          {
            text:
              `❌ Error executing command: ${error.message}`,
            ...channelInfo,
          },
          {
            quoted: message,
          },
        );
      } catch (sendError) {
        printLog(
          "error",
          `Failed to send command error: ${sendError.message}`,
        );
      }

      /* ================= ERROR LOG ================= */

      const errorLog = {
        command:
          command.command,
        error:
          error.message,
        stack:
          error.stack,
        timestamp:
          new Date().toISOString(),
        user:
          senderId,
        chat:
          chatId,
      };

      try {
        fs.appendFileSync(
          "./error.log",
          JSON.stringify(
            errorLog,
          ) + "\n",
        );

        printLog(
          "info",
          "Error logged to file",
        );
      } catch (logError) {
        printLog(
          "error",
          `Failed to write error log: ${logError.message}`,
        );
      }
    }
  } catch (error) {
    /* =====================================================
       GLOBAL ERROR
    ===================================================== */

    printLog(
      "error",
      `Message handler error: ${error.message}`,
    );

    console.error(
      "========== PUTTUS GLOBAL ERROR ==========",
    );

    console.error(error);

    console.error(
      "=========================================",
    );

    const chatId =
      messageUpdate
        ?.messages?.[0]
        ?.key?.remoteJid;

    if (
      chatId &&
      typeof chatId === "string"
    ) {
      try {
        await sock.sendMessage(
          chatId,
          {
            text:
              `❌ ${smallFont("Message Error")}\n\n` +
              `⚠️ ${error.message || "Unknown error"}`,
            ...channelInfo,
          },
        );
      } catch (sendError) {
        printLog(
          "error",
          `Failed to send error message: ${sendError.message}`,
        );
      }
    }
  }
}

/* =========================================================
   GROUP PARTICIPANT UPDATE
========================================================= */

async function handleGroupParticipantUpdate(
  sock,
  update,
) {
  try {
    const {
      id,
      participants,
      action,
      author,
    } = update;

    if (
      !id ||
      !id.endsWith("@g.us")
    ) {
      return;
    }

    printLog(
      "info",
      `Group update: ${action} in ${id.split("@")[0]}`,
    );

    const botMode =
      await store.getBotMode();

    const isPublicMode =
      botMode === "public" ||
      botMode === "groups";

    switch (action) {
      case "promote": {
        if (!isPublicMode) return;

        if (
          participants &&
          participants.length > 0
        ) {
          const participant =
            Array.isArray(
              participants,
            )
              ? participants[0]
              : participants;

          printLog(
            "success",
            `User promoted: ${
              typeof participant ===
              "string"
                ? participant.split(
                    "@",
                  )[0]
                : "unknown"
            }`,
          );
        }

        const {
          handlePromotionEvent,
        } =
          require(
            "../plugins/promote",
          );

        await handlePromotionEvent(
          sock,
          id,
          participants,
          author,
        );

        break;
      }

      case "demote": {
        if (!isPublicMode) return;

        if (
          participants &&
          participants.length > 0
        ) {
          const participant =
            Array.isArray(
              participants,
            )
              ? participants[0]
              : participants;

          printLog(
            "warning",
            `User demoted: ${
              typeof participant ===
              "string"
                ? participant.split(
                    "@",
                  )[0]
                : "unknown"
            }`,
          );
        }

        const {
          handleDemotionEvent,
        } =
          require(
            "../plugins/demote",
          );

        await handleDemotionEvent(
          sock,
          id,
          participants,
          author,
        );

        break;
      }

      case "add": {
        if (
          participants &&
          participants.length > 0
        ) {
          const participant =
            Array.isArray(
              participants,
            )
              ? participants[0]
              : participants;

          printLog(
            "success",
            `User joined: ${
              typeof participant ===
              "string"
                ? participant.split(
                    "@",
                  )[0]
                : "unknown"
            }`,
          );
        }

        const {
          handleJoinEvent,
        } =
          require(
            "../plugins/welcome",
          );

        await handleJoinEvent(
          sock,
          id,
          participants,
        );

        break;
      }

      case "remove": {
        if (
          participants &&
          participants.length > 0
        ) {
          const participant =
            Array.isArray(
              participants,
            )
              ? participants[0]
              : participants;

          printLog(
            "info",
            `User left: ${
              typeof participant ===
              "string"
                ? participant.split(
                    "@",
                  )[0]
                : "unknown"
            }`,
          );
        }

        const {
          handleLeaveEvent,
        } =
          require(
            "../plugins/goodbye",
          );

        await handleLeaveEvent(
          sock,
          id,
          participants,
        );

        break;
      }

      default:
        printLog(
          "warning",
          `Unhandled group action: ${action}`,
        );
    }
  } catch (error) {
    printLog(
      "error",
      `Group update error: ${error.message}`,
    );

    console.error(error.stack);
  }
}

/* =========================================================
   STATUS
========================================================= */

async function handleStatus(
  sock,
  status,
) {
  try {
    const {
      handleStatusUpdate,
    } =
      require(
        "../plugins/autostatus",
      );

    await handleStatusUpdate(
      sock,
      status,
    );
  } catch (error) {
    printLog(
      "error",
      `Status handler error: ${error.message}`,
    );

    console.error(error.stack);
  }
}

/* =========================================================
   CALL HANDLER
========================================================= */

async function handleCall(
  sock,
  calls,
) {
  try {
    const anticallPlugin =
      require(
        "../plugins/anticall",
      );

    const state =
      anticallPlugin.readState
        ? await anticallPlugin.readState()
        : {
            enabled: false,
          };

    if (!state.enabled) {
      return;
    }

    const antiCallNotified =
      new Set();

    for (const call of calls) {
      const callerJid =
        call.from ||
        call.peerJid ||
        call.chatId;

      if (!callerJid) continue;

      printLog(
        "warning",
        `Incoming call from: ${callerJid.split("@")[0]}`,
      );

      try {
        try {
          if (
            typeof sock.rejectCall ===
              "function" &&
            call.id
          ) {
            await sock.rejectCall(
              call.id,
              callerJid,
            );

            printLog(
              "success",
              `Call rejected: ${callerJid.split("@")[0]}`,
            );
          } else if (
            typeof sock.sendCallOfferAck ===
              "function" &&
            call.id
          ) {
            await sock.sendCallOfferAck(
              call.id,
              callerJid,
              "reject",
            );

            printLog(
              "success",
              `Call rejected: ${callerJid.split("@")[0]}`,
            );
          }
        } catch (error) {
          printLog(
            "error",
            `Error rejecting call: ${error.message}`,
          );
        }

        if (
          !antiCallNotified.has(
            callerJid,
          )
        ) {
          antiCallNotified.add(
            callerJid,
          );

          setTimeout(
            () =>
              antiCallNotified.delete(
                callerJid,
              ),
            60000,
          );

          try {
            await sock.sendMessage(
              callerJid,
              {
                text:
                  "📵 Anticall is enabled. Your call was rejected and you will be blocked.",
              },
            );

            printLog(
              "info",
              `Sent anticall warning to: ${callerJid.split("@")[0]}`,
            );
          } catch (error) {
            printLog(
              "error",
              `Anticall warning error: ${error.message}`,
            );
          }
        }

        setTimeout(
          async () => {
            try {
              await sock.updateBlockStatus(
                callerJid,
                "block",
              );

              printLog(
                "success",
                `Blocked caller: ${callerJid.split("@")[0]}`,
              );
            } catch (error) {
              printLog(
                "error",
                `Error blocking caller: ${error.message}`,
              );
            }
          },
          800,
        );
      } catch (error) {
        printLog(
          "error",
          `Error handling call from ${callerJid.split("@")[0]}: ${error.message}`,
        );
      }
    }
  } catch (error) {
    printLog(
      "error",
      `Call handler error: ${error.message}`,
    );

    console.error(error.stack);
  }
}

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  handleMessages,
  handleGroupParticipantUpdate,
  handleStatus,
  handleCall,

  smallFont,
  sendPuttusVCard,
};
    
