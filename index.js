/* process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; */

/**
 * Telegram Pairing Logic
 * Added & integrated by @nightx_rebel
 */
require("./config");
require("./settings");

const { Boom } = require("@hapi/boom");
const fs = require("fs");
const chalk = require("chalk");
const FileType = require("file-type");
const syntaxerror = require("syntax-error");
const path = require("path");
const axios = require("axios");
const PhoneNumber = require("awesome-phonenumber");
const {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid,
} = require("./lib/exif");
const {
  smsg,
  isUrl,
  generateMessageTag,
  getBuffer,
  getSizeMedia,
  fetch,
  await,
  sleep,
  reSize,
} = require("./lib/myfunc");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  generateForwardMessageContent,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateMessageID,
  downloadContentFromMessage,
  Browsers,
  jidDecode,
  proto,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  delay,
} = require("@whiskeysockets/baileys");
const NodeCache = require("node-cache");
const pino = require("pino");
const readline = require("readline");
const { parsePhoneNumber } = require("libphonenumber-js");
const {
  PHONENUMBER_MCC,
} = require("@whiskeysockets/baileys/lib/Utils/generics");
const { rmSync, existsSync, mkdirSync } = require("fs");
const { join } = require("path");

const store = require("./lib/lightweight_store");
const SaveCreds = require("./lib/session");
const { app, server, PORT } = require("./lib/server");
const { printLog } = require("./lib/print");
const {
  handleMessages,
  handleGroupParticipantUpdate,
  handleStatus,
  handleCall,
} = require("./lib/messageHandler");

const settings = require("./settings");
const commandHandler = require("./lib/commandHandler");

// Telegram control panel: /pair, /logout, /status
const { initTelegramBot, notify } = require("./lib/telegramBot");
const pairStore = require("./lib/pairStore");

store.readFromFile();
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000);

commandHandler.loadCommands();
// console.log(chalk.greenBright(`✅ Loaded ${commandHandler.commands.size} Plugins`));

setInterval(() => {
  if (global.gc) {
    global.gc();
    console.log("🧹 Garbage collection completed");
  }
}, 60_000);

setInterval(() => {
  const used = process.memoryUsage().rss / 1024 / 1024;
  if (used > 700) {
    console.log(chalk.yellow("⚠️ RAM too high (>700MB), restarting bot..."));
    process.exit(1);
  }
}, 30_000);

let owner = JSON.parse(fs.readFileSync("./data/owner.json"));

global.botname = process.env.BOT_NAME || "PUTTUS-AI";
global.themeemoji = "•";

server.listen(PORT, () => {
  printLog("success", `Server listening on port ${PORT}`);
});

// ---- Connection notification helpers ----

// Track reconnect attempts across the whole process lifetime
let reconnectAttempts = 0;

// Simple throttle so Telegram doesn't get spammed by rapid repeated events
const notifyThrottle = {};
function notifyOnce(key, text, cooldownMs = 15000) {
  const now = Date.now();
  if (notifyThrottle[key] && now - notifyThrottle[key] < cooldownMs) {
    return;
  }
  notifyThrottle[key] = now;
  notify(text);
}

function getDisconnectReasonText(statusCode) {
  const reasons = {
    [DisconnectReason.badSession]: "Bad Session (please re-pair)",
    [DisconnectReason.connectionClosed]: "Connection Closed",
    [DisconnectReason.connectionLost]: "Connection Lost (network issue)",
    [DisconnectReason.connectionReplaced]:
      "Connection Replaced (logged in on another device/session)",
    [DisconnectReason.loggedOut]: "Logged Out",
    [DisconnectReason.restartRequired]: "Restart Required",
    [DisconnectReason.timedOut]: "Connection Timed Out",
    [DisconnectReason.multideviceMismatch]: "Multi-device Mismatch",
    401: "Unauthorized (401) - Logged Out",
    440: "Session Conflict (opened elsewhere)",
  };
  return (
    reasons[statusCode] || `Unknown reason (code: ${statusCode ?? "none"})`
  );
}

async function startTohidDev() {
  try {
    let { version, isLatest } = await fetchLatestBaileysVersion();
    await delay(1000);

    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    const msgRetryCounterCache = new NodeCache();

    const hasRegisteredCreds =
      state.creds && state.creds.registered !== undefined;
    const isRegistered = state.creds?.registered === true;
    printLog("info", `Credentials loaded. Registered: ${isRegistered}`);

    const ghostMode = await store.getSetting("global", "stealthMode");
    const isGhostActive = ghostMode && ghostMode.enabled;

    // Mutable reference to the socket - assigned right after makeWASocket() below.
    // telegramCallbacks captures this variable by closure, so it always sees the
    // current socket even though it's defined before the socket itself exists.
    let TohidDevRef = null;

    // telegramCallbacks must be defined BEFORE initTelegramBot() uses it
    const telegramCallbacks = {
      onPairRequest: async (phoneNumber) => {
        let code = await TohidDevRef.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(
          chalk.black(chalk.bgGreen(`Your Pairing Code : `)),
          chalk.black(chalk.white(code)),
        );
        printLog("success", `Pairing code generated: ${code}`);

        return code;
      },
      onLogoutRequest: async () => {
        try {
          await TohidDevRef.logout();
        } catch (err) {
          printLog(
            "warning",
            `logout() call failed, forcing session wipe: ${err.message}`,
          );
        }
        rmSync("./session", { recursive: true, force: true });
      },
    };

    initTelegramBot(telegramCallbacks);
    if (isGhostActive) {
      printLog("info", "👻 STEALTH MODE IS ACTIVE - Starting in stealth mode");
    }

    const TohidDev = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: Browsers.macOS("Chrome"),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(
          state.keys,
          pino({ level: "fatal" }).child({ level: "fatal" }),
        ),
      },
      markOnlineOnConnect: !isGhostActive,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      getMessage: async (key) => {
        let jid = jidNormalizedUser(key.remoteJid);
        let msg = await store.loadMessage(jid, key.id);
        return msg?.message || "";
      },
      msgRetryCounterCache,
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,
    });
    TohidDevRef = TohidDev;

    const originalSendPresenceUpdate = TohidDev.sendPresenceUpdate;
    const originalReadMessages = TohidDev.readMessages;
    const originalSendReceipt = TohidDev.sendReceipt;
    const originalSendReadReceipt = TohidDev.sendReadReceipt;

    TohidDev.sendPresenceUpdate = async function (...args) {
      const ghostMode = await store.getSetting("global", "stealthMode");
      if (ghostMode && ghostMode.enabled) {
        printLog("info", "👻 Blocked presence update (stealth mode)");
        return;
      }
      return originalSendPresenceUpdate.apply(this, args);
    };

    TohidDev.readMessages = async function (...args) {
      const ghostMode = await store.getSetting("global", "stealthMode");
      if (ghostMode && ghostMode.enabled) {
        return;
      }
      return originalReadMessages.apply(this, args);
    };

    if (originalSendReceipt) {
      TohidDev.sendReceipt = async function (...args) {
        const ghostMode = await store.getSetting("global", "stealthMode");
        if (ghostMode && ghostMode.enabled) {
          return;
        }
        return originalSendReceipt.apply(this, args);
      };
    }

    if (originalSendReadReceipt) {
      TohidDev.sendReadReceipt = async function (...args) {
        const ghostMode = await store.getSetting("global", "stealthMode");
        if (ghostMode && ghostMode.enabled) {
          return;
        }
        return originalSendReadReceipt.apply(this, args);
      };
    }

    const originalQuery = TohidDev.query;
    TohidDev.query = async function (node, ...args) {
      const ghostMode = await store.getSetting("global", "stealthMode");
      if (ghostMode && ghostMode.enabled) {
        if (node && node.tag === "receipt") {
          return;
        }
        if (
          node &&
          node.attrs &&
          (node.attrs.type === "read" || node.attrs.type === "read-self")
        ) {
          return;
        }
      }
      return originalQuery.apply(this, [node, ...args]);
    };

    TohidDev.isGhostMode = async () => {
      const ghostMode = await store.getSetting("global", "stealthMode");
      return ghostMode && ghostMode.enabled;
    };

    TohidDev.ev.on("creds.update", saveCreds);
    store.bind(TohidDev.ev);

    TohidDev.ev.on("messages.upsert", async (chatUpdate) => {
      try {
        const mek = chatUpdate.messages[0];
        if (!mek.message) return;

        mek.message =
          Object.keys(mek.message)[0] === "ephemeralMessage"
            ? mek.message.ephemeralMessage.message
            : mek.message;

        if (mek.key && mek.key.remoteJid === "status@broadcast") {
          await handleStatus(TohidDev, chatUpdate);
          return;
        }

        if (
          !TohidDev.public &&
          !mek.key.fromMe &&
          chatUpdate.type === "notify"
        ) {
          const isGroup = mek.key?.remoteJid?.endsWith("@g.us");
          if (!isGroup) return;
        }

        if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return;

        if (TohidDev?.msgRetryCounterCache) {
          TohidDev.msgRetryCounterCache.clear();
        }

        try {
          await handleMessages(TohidDev, chatUpdate);
        } catch (err) {
          printLog("error", `Error in handleMessages: ${err.message}`);
          if (mek.key && mek.key.remoteJid) {
            await TohidDev.sendMessage(mek.key.remoteJid, {
              text: "❌ An error occurred while processing your message.",
              contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: "120363423958562123@newsletter",
                  newsletterName: "PUTTUS-AI",
                  serverMessageId: -1,
                },
              },
            }).catch(console.error);
          }
        }
      } catch (err) {
        printLog("error", `Error in messages.upsert: ${err.message}`);
      }
    });

    TohidDev.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {};
        return (
          (decode.user && decode.server && decode.user + "@" + decode.server) ||
          jid
        );
      } else return jid;
    };

    TohidDev.ev.on("contacts.update", (update) => {
      for (let contact of update) {
        let id = TohidDev.decodeJid(contact.id);
        if (store && store.contacts)
          store.contacts[id] = { id, name: contact.notify };
      }
    });

    TohidDev.getName = (jid, withoutContact = false) => {
      let id = TohidDev.decodeJid(jid);
      withoutContact = TohidDev.withoutContact || withoutContact;
      let v;
      if (id.endsWith("@g.us"))
        return new Promise(async (resolve) => {
          v = store.contacts[id] || {};
          if (!(v.name || v.subject)) v = TohidDev.groupMetadata(id) || {};
          resolve(
            v.name ||
              v.subject ||
              PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber(
                "international",
              ),
          );
        });
      else
        v =
          id === "0@s.whatsapp.net"
            ? {
                id,
                name: "WhatsApp",
              }
            : id === TohidDev.decodeJid(TohidDev.user.id)
              ? TohidDev.user
              : store.contacts[id] || {};
      return (
        (withoutContact ? "" : v.name) ||
        v.subject ||
        v.verifiedName ||
        PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber(
          "international",
        )
      );
    };

    TohidDev.public = true;
    TohidDev.serializeM = (m) => smsg(TohidDev, m, store);

    TohidDev.ev.on("connection.update", async (s) => {
      const { connection, lastDisconnect, qr } = s;

      if (connection === "connecting") {
        printLog("connection", "Connecting to WhatsApp...");
        notifyOnce(
          "connecting",
          `🔄 *Connecting to WhatsApp...*\n⏰ Time: ${new Date().toLocaleString()}`,
        );
      }

      if (connection == "open") {
        reconnectAttempts = 0; // reset counter after a successful connection
        printLog("success", "Bot connected successfully!");

        // Mark the pairing session as connected and let the owner know
        pairStore.updateSession({ status: "connected" });
        notify(
          `✅ *Bot Connected Successfully!*\n📱 Number: ${TohidDev.user.id.split(":")[0]}\n⏰ Time: ${new Date().toLocaleString()}`,
        );

        const { startAutoBio } = require("./plugins/setbio");
        startAutoBio(TohidDev);
        const ghostMode = await store.getSetting("global", "stealthMode");
        if (ghostMode && ghostMode.enabled) {
          printLog("info", "👻 STEALTH MODE ACTIVE - Bot is in stealth mode");
          console.log(chalk.gray("• No online status"));
          console.log(chalk.gray("• No typing indicators"));
          notify(
            "👻 *Stealth Mode: ACTIVE*\nNo online status, no typing indicators, no read receipts.",
          );
        }

        console.log(
          chalk.yellow(
            `🌿Connected to => ` + JSON.stringify(TohidDev.user, null, 2),
          ),
        );

        try {
          const botNumber = TohidDev.user.id.split(":")[0] + "@s.whatsapp.net";
          const ghostStatus =
            ghostMode && ghostMode.enabled ? "\n👻 Stealth Mode: ACTIVE" : "";

          await TohidDev.sendMessage(botNumber, {
            text: `🤖 Bot Connected Successfully!\n\n⏰ Time: ${new Date().toLocaleString()}\n✅ Status: Online and Ready!${ghostStatus}\n\n✅Make sure to join below channel`,
            contextInfo: {
              forwardingScore: 1,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "120363423958562123@newsletter",
                newsletterName: "PUTTUS-AI",
                serverMessageId: -1,
              },
            },
          });
        } catch (error) {
          printLog(
            "error",
            `Failed to send connection message: ${error.message}`,
          );
        }

        await delay(1999);
        console.log(
          chalk.yellow(
            `\n\n                  ${chalk.bold.blue(`[ ${global.botname || "PUTTUS-AI"} ]`)}\n\n`,
          ),
        );
        console.log(
          chalk.cyan(`< ================================================== >`),
        );
        console.log(
          chalk.magenta(`\n${global.themeemoji || "•"} YT CHANNEL: PUTTUS-AI`),
        );
        console.log(
          chalk.magenta(`${global.themeemoji || "•"} GITHUB: puttus-das`),
        );
        console.log(
          chalk.magenta(`${global.themeemoji || "•"} WA NUMBER: ${owner}`),
        );
        console.log(
          chalk.magenta(`${global.themeemoji || "•"} CREDIT: Puttus Das`),
        );
        console.log(
          chalk.green(
            `${global.themeemoji || "•"} 🤖 Bot Connected Successfully! ✅`,
          ),
        );
        console.log(chalk.blue(`Bot Version: ${settings.version}`));
        console.log(
          chalk.cyan(`Loaded Commands: ${commandHandler.commands.size}`),
        );
        console.log(chalk.cyan(`Prefixes: ${settings.prefixes.join(", ")}`));
        console.log(chalk.gray(`Backend: ${store.getStats().backend}`));
        console.log();
      }

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const errorMsg = lastDisconnect?.error?.message || "Unknown error";
        const reasonText = getDisconnectReasonText(statusCode);
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut;

        printLog(
          "error",
          `Connection closed - Status: ${statusCode} | Reason: ${reasonText}`,
        );

        if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
          try {
            rmSync("./session", { recursive: true, force: true });
            printLog("warning", "Session logged out. Please re-authenticate");
          } catch (error) {
            printLog("error", `Error deleting session: ${error.message}`);
          }
          notify(
            `🔴 *Bot Logged Out*\n📄 Reason: ${reasonText}\n❗ Error: ${errorMsg}\n⏰ Time: ${new Date().toLocaleString()}\n\nUse /pair <number> on Telegram to pair again.`,
          );
          pairStore.clearSession();
        } else {
          reconnectAttempts++;
          notifyOnce(
            "close",
            `⚠️ *Connection Closed*\n📄 Reason: ${reasonText}\n❗ Error: ${errorMsg}\n🔁 Reconnect Attempt: #${reconnectAttempts}\n⏰ Time: ${new Date().toLocaleString()}\n\nReconnecting in 5 seconds...`,
            5000,
          );
        }

        if (shouldReconnect) {
          printLog("connection", "Reconnecting in 5 seconds...");
          await delay(5000);
          startTohidDev();
        }
      }
    });

    TohidDev.ev.on("call", async (calls) => {
      await handleCall(TohidDev, calls);
    });

    TohidDev.ev.on("group-participants.update", async (update) => {
      await handleGroupParticipantUpdate(TohidDev, update);
    });

    TohidDev.ev.on("status.update", async (status) => {
      await handleStatus(TohidDev, status);
    });

    TohidDev.ev.on("messages.reaction", async (reaction) => {
      await handleStatus(TohidDev, reaction);
    });

    return TohidDev;
  } catch (error) {
    printLog("error", `Error in startTohidDev: ${error.message}`);
    notifyOnce(
      "fatal-start-error",
      `🚨 *Bot Start Error*\n❗ Error: ${error.message}\n⏰ Time: ${new Date().toLocaleString()}\n\nRetrying in 5 seconds...`,
      5000,
    );
    await delay(5000);
    startTohidDev();
  }
}

async function main() {
  printLog("info", "Starting PUTTUS-AI BOT...");
  await delay(3000);

  startTohidDev().catch((error) => {
    printLog("error", `Fatal error: ${error.message}`);
    process.exit(1);
  });
}

main();

const customTemp = path.join(process.cwd(), "temp");
if (!fs.existsSync(customTemp)) fs.mkdirSync(customTemp, { recursive: true });
process.env.TMPDIR = customTemp;
process.env.TEMP = customTemp;
process.env.TMP = customTemp;

setInterval(
  () => {
    fs.readdir(customTemp, (err, files) => {
      if (err) return;
      for (const file of files) {
        const filePath = path.join(customTemp, file);
        fs.stat(filePath, (err, stats) => {
          if (!err && Date.now() - stats.mtimeMs > 3 * 60 * 60 * 1000) {
            fs.unlink(filePath, () => {});
          }
        });
      }
    });
    //  console.log('🧹 Temp folder auto-cleaned');
  },
  1 * 60 * 60 * 1000,
);

const folders = [
  path.join(__dirname, "./lib"),
  path.join(__dirname, "./plugins"),
];

let totalFiles = 0;
let okFiles = 0;
let errorFiles = 0;

folders.forEach((folder) => {
  if (!fs.existsSync(folder)) return;

  fs.readdirSync(folder)
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      totalFiles++;
      const filePath = path.join(folder, file);

      try {
        const code = fs.readFileSync(filePath, "utf-8");
        const err = syntaxerror(code, file, {
          sourceType: "script",
          allowAwaitOutsideFunction: true,
        });

        if (err) {
          console.error(chalk.red(`❌ Syntax error in ${filePath}:\n${err}`));
          errorFiles++;
        } else {
          okFiles++;
        }
      } catch (e) {
        console.error(chalk.yellow(`⚠️ Cannot read file ${filePath}:\n${e}`));
        errorFiles++;
      }
    });
});

/**
 * console.log(chalk.greenBright(`✅ OK files: ${okFiles}`));
 * console.log(chalk.redBright(`❌Files with errors: ${errorFiles}\n`));
 */

process.on("uncaughtException", (err) => {
  printLog("error", `Uncaught Exception: ${err.message}`);
  console.error(err.stack);
});

process.on("unhandledRejection", (err) => {
  printLog("error", `Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    printLog("error", `Address localhost:${PORT} in use`);
    server.close();
  } else {
    printLog("error", `Server error: ${error.message}`);
  }
});

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  printLog("info", "index.js updated, reloading...");
  delete require.cache[file];
  require(file);
});
