const fs = require("fs");
const path = require("path");
const NodeCache = require("node-cache");
const PhoneNumber = require("awesome-phonenumber");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore,
  jidDecode,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");

require("./config");

const settings = require("./settings");
const store = require("./lib/lightweight_store");
const SaveCreds = require("./lib/session");
const pairStore = require("./lib/pairStore");
const { server, PORT } = require("./lib/server");
const { printLog } = require("./lib/print");
const { smsg } = require("./lib/myfunc");
const libIndex = require("./lib/index");

// Local silent logger.
// pino is not required, so the bot will not crash if pino is unavailable.
const silentLogger = {
  level: "silent",

  child() {
    return this;
  },

  trace() {},
  debug() {},
  info() {},
  warn() {},
  error() {},
  fatal() {},
};

async function isSudo(userId) {
  return libIndex.isSudo(userId);
}

module.exports.isSudo = isSudo;

const commandHandler = require("./lib/commandHandler");

const {
  handleMessages,
  handleGroupParticipantUpdate,
  handleStatus,
  handleCall,
} = require("./lib/messageHandler");

const SESSION_DIR = path.join(__dirname, "session");
const TEMP_DIR = path.join(__dirname, "temp");

if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, {
    recursive: true,
  });
}

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, {
    recursive: true,
  });
}

process.env.TMPDIR = TEMP_DIR;
process.env.TEMP = TEMP_DIR;
process.env.TMP = TEMP_DIR;

global.botname =
  process.env.BOT_NAME || settings.botName || "PUTTUS-XD";

global.themeemoji = "•";
global.conns = global.conns || [];

let sock = null;
let starting = false;
let reconnectTimer = null;
let pairingRequestRunning = false;
let intentionalLogout = false;
let telegramStarted = false;

function cleanNumber(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .replace(/^00/, "");
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function statusCodeFrom(error) {
  return (
    error?.output?.statusCode ||
    error?.data?.statusCode ||
    error?.statusCode ||
    null
  );
}

function ensureSessionDirectory() {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, {
      recursive: true,
    });
  }
}

function hasValidSession() {
  try {
    const credsPath = path.join(
      SESSION_DIR,
      "creds.json",
    );

    if (!fs.existsSync(credsPath)) {
      return false;
    }

    const creds = JSON.parse(
      fs.readFileSync(credsPath, "utf8"),
    );

    return Boolean(
      creds &&
        creds.noiseKey &&
        creds.signedIdentityKey &&
        creds.signedPreKey &&
        creds.registered !== false,
    );
  } catch {
    return false;
  }
}

async function initializeSession() {
  ensureSessionDirectory();

  if (hasValidSession()) {
    return true;
  }

  const sessionId =
    global.SESSION_ID || process.env.SESSION_ID;

  if (!sessionId) {
    return false;
  }

  try {
    printLog(
      "info",
      "Downloading SESSION_ID credentials...",
    );

    await SaveCreds(sessionId);

    return hasValidSession();
  } catch (error) {
    printLog(
      "error",
      `Session download failed: ${error.message}`,
    );

    return false;
  }
}

function removeSession() {
  try {
    fs.rmSync(SESSION_DIR, {
      recursive: true,
      force: true,
    });
  } catch (error) {
    printLog(
      "error",
      `Could not remove session: ${error.message}`,
    );
  }

  ensureSessionDirectory();
}

function setupSocketHelpers(client) {
  client.decodeJid = (jid) => {
    if (!jid) {
      return jid;
    }

    if (/:(\d+)@/gi.test(jid)) {
      const decoded = jidDecode(jid) || {};

      if (decoded.user && decoded.server) {
        return `${decoded.user}@${decoded.server}`;
      }

      return jid;
    }

    return jid;
  };

  client.getName = (jid, withoutContact = false) => {
    const id = client.decodeJid(jid);

    if (!id) {
      return "Unknown";
    }

    if (id.endsWith("@g.us")) {
      return (async () => {
        let contact = store.contacts?.[id] || {};

        if (!(contact.name || contact.subject)) {
          try {
            contact = await client.groupMetadata(id);
          } catch {}
        }

        return (
          (withoutContact ? "" : contact.name) ||
          contact.subject ||
          PhoneNumber(
            `+${id.replace("@g.us", "")}`,
          ).getNumber("international") ||
          id
        );
      })();
    }

    const contact =
      id === "0@s.whatsapp.net"
        ? { name: "WhatsApp" }
        : id === jidNormalizedUser(client.user?.id)
          ? client.user
          : store.contacts?.[id] || {};

    return (
      (withoutContact ? "" : contact.name) ||
      contact.subject ||
      contact.verifiedName ||
      PhoneNumber(
        `+${id.replace("@s.whatsapp.net", "")}`,
      ).getNumber("international") ||
      id
    );
  };

  client.public = true;

  client.serializeM = (message) => {
    return smsg(client, message, store);
  };

  client.msgRetryCounterCache =
    client.msgRetryCounterCache || new NodeCache();
}

async function createSocket() {
  if (sock) {
    return sock;
  }

  if (starting) {
    while (starting) {
      await sleep(250);
    }

    return sock;
  }

  starting = true;

  try {
    ensureSessionDirectory();

    const { version } =
      await fetchLatestBaileysVersion();

    const { state, saveCreds } =
      await useMultiFileAuthState(SESSION_DIR);

    const msgRetryCounterCache = new NodeCache();

    const client = makeWASocket({
      version,

      logger: silentLogger,

      browser: Browsers.macOS("Chrome"),

      auth: {
        creds: state.creds,

        keys: makeCacheableSignalKeyStore(
          state.keys,
          silentLogger.child({
            level: "fatal",
          }),
        ),
      },

      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      msgRetryCounterCache,
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,

      getMessage: async (key) => {
        const jid = jidNormalizedUser(
          key.remoteJid,
        );

        const message = await store.loadMessage(
          jid,
          key.id,
        );

        return message?.message || undefined;
      },
    });

    sock = client;

    sock.authState = {
      creds: state.creds,
      keys: state.keys,
    };

    setupSocketHelpers(sock);

    store.bind(sock.ev);

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("contacts.update", (updates) => {
      for (const contact of updates || []) {
        const id = sock.decodeJid(contact.id);

        if (id && store.contacts) {
          store.contacts[id] = {
            id,
            name: contact.notify,
          };
        }
      }
    });

    sock.ev.on("messages.upsert", async (update) => {
      try {
        const message = update?.messages?.[0];

        if (!message?.message) {
          return;
        }

        if (
          Object.keys(message.message)[0] ===
          "ephemeralMessage"
        ) {
          message.message =
            message.message.ephemeralMessage?.message ||
            message.message;
        }

        if (
          message.key?.remoteJid ===
          "status@broadcast"
        ) {
          await handleStatus(sock, update);
          return;
        }

        if (
          message.key?.id?.startsWith("BAE5") &&
          message.key.id.length === 16
        ) {
          return;
        }

        await handleMessages(sock, update);
      } catch (error) {
        printLog(
          "error",
          `messages.upsert: ${error.message}`,
        );
      }
    });

    sock.ev.on(
      "group-participants.update",
      async (update) => {
        try {
          await handleGroupParticipantUpdate(
            sock,
            update,
          );
        } catch (error) {
          printLog(
            "error",
            `group event: ${error.message}`,
          );
        }
      },
    );

    sock.ev.on("status.update", async (update) => {
      try {
        await handleStatus(sock, update);
      } catch (error) {
        printLog(
          "error",
          `status event: ${error.message}`,
        );
      }
    });

    sock.ev.on(
      "messages.reaction",
      async (update) => {
        try {
          await handleStatus(sock, update);
        } catch (error) {
          printLog(
            "error",
            `reaction event: ${error.message}`,
          );
        }
      },
    );

    sock.ev.on("call", async (calls) => {
      try {
        await handleCall(sock, calls);
      } catch (error) {
        printLog(
          "error",
          `call event: ${error.message}`,
        );
      }
    });

    sock.ev.on(
      "connection.update",
      async (update) => {
        const {
          connection,
          lastDisconnect,
        } = update || {};

        if (connection === "connecting") {
          printLog(
            "connection",
            "Connecting to WhatsApp...",
          );
        }

        if (connection === "open") {
          printLog(
            "success",
            "PUTTUS-XD connected successfully!",
          );

          pairStore.updateSession({
            status: "connected",
            number:
              sock.user?.id
                ?.split(":")[0]
                ?.split("@")[0] || undefined,
          });

          try {
            const {
              startAutoBio,
            } = require("./plugins/setbio");

            if (
              typeof startAutoBio ===
              "function"
            ) {
              await startAutoBio(sock);
            }
          } catch (error) {
            printLog(
              "warning",
              `AutoBio skipped: ${error.message}`,
            );
          }

          console.log(`\n■ ${global.botname}`);
          console.log(
            `■ Loaded Commands: ${commandHandler.commands.size}`,
          );
          console.log(
            `■ Prefixes: ${settings.prefixes.join(", ")}`,
          );
        }

        if (connection === "close") {
          const code = statusCodeFrom(
            lastDisconnect?.error,
          );

          printLog(
            "error",
            `WhatsApp connection closed: ${
              code || "unknown"
            }`,
          );

          const loggedOut =
            code === DisconnectReason.loggedOut ||
            code === 401;

          const oldSock = sock;

          sock = null;
          starting = false;

          if (loggedOut || intentionalLogout) {
            intentionalLogout = false;
            pairStore.clearSession();
            removeSession();
            return;
          }

          if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;

              createSocket().catch((error) => {
                printLog(
                  "error",
                  `Reconnect failed: ${error.message}`,
                );
              });
            }, 5000);
          }

          void oldSock;
        }
      },
    );

    starting = false;

    return sock;
  } catch (error) {
    sock = null;
    starting = false;
    throw error;
  }
}

async function requestPairingCode(phoneNumber) {
  const number = cleanNumber(phoneNumber);

  if (number.length < 8 || number.length > 15) {
    throw new Error("Invalid WhatsApp number");
  }

  if (pairingRequestRunning) {
    throw new Error(
      "Another pairing request is already running",
    );
  }

  pairingRequestRunning = true;

  try {
    if (hasValidSession()) {
      throw new Error(
        "A WhatsApp session is already registered. Use /logout first.",
      );
    }

    const client = await createSocket();

    await sleep(2500);

    if (client.authState?.creds?.registered === true) {
      throw new Error(
        "A WhatsApp session is already registered. Use /logout first.",
      );
    }

    let code = await client.requestPairingCode(
      number,
    );

    code =
      String(code || "")
        .match(/.{1,4}/g)
        ?.join("-") || String(code || "");

    if (!code) {
      throw new Error(
        "WhatsApp did not return a pairing code",
      );
    }

    return code;
  } finally {
    pairingRequestRunning = false;
  }
}

async function logoutWhatsApp() {
  intentionalLogout = true;

  try {
    if (sock) {
      try {
        await sock.logout();
      } catch {}
    }
  } finally {
    sock = null;
    pairStore.clearSession();
    removeSession();
  }
}

async function startTelegram() {
  if (telegramStarted) {
    return;
  }

  telegramStarted = true;

  try {
    const {
      startTelegramPairing,
    } = require("./lib/telegramBot");

    startTelegramPairing({
      onPairRequest: requestPairingCode,
      onLogoutRequest: logoutWhatsApp,

      getStatus: () => ({
        connected: Boolean(sock?.user),
        user: sock?.user || null,
        session: pairStore.getActiveSession(),
      }),
    });
  } catch (error) {
    telegramStarted = false;

    printLog(
      "error",
      `Telegram startup failed: ${error.message}`,
    );
  }
}

async function main() {
  printLog("info", "Starting PUTTUS-XD...");

  store.readFromFile();

  setInterval(() => {
    store.writeToFile();
  }, settings.storeWriteInterval || 10000);

  commandHandler.loadCommands();

  printLog(
    "success",
    `Loaded ${commandHandler.commands.size} commands`,
  );

  const sessionReady =
    await initializeSession();

  if (sessionReady) {
    await createSocket();
  } else {
    printLog(
      "warning",
      "No saved WhatsApp session. Use Telegram /pair <number>.",
    );
  }

  await startTelegram();
}

// Heroku, Railway, Render and VPS health server.
server.listen(PORT, "0.0.0.0", () => {
  printLog(
    "success",
    `HTTP server listening on ${PORT}`,
  );
});

setInterval(
  () => {
    try {
      for (const file of fs.readdirSync(TEMP_DIR)) {
        const filePath = path.join(
          TEMP_DIR,
          file,
        );

        const stat = fs.statSync(filePath);

        if (
          Date.now() - stat.mtimeMs >
          3 * 60 * 60 * 1000
        ) {
          fs.unlinkSync(filePath);
        }
      }
    } catch {}
  },
  60 * 60 * 1000,
);

process.on("uncaughtException", (error) => {
  printLog(
    "error",
    `Uncaught Exception: ${error.message}`,
  );

  console.error(error.stack);
});

process.on("unhandledRejection", (error) => {
  printLog(
    "error",
    `Unhandled Rejection: ${
      error?.message || error
    }`,
  );

  console.error(error.stack || error);
});

process.on("SIGINT", async () => {
  try {
    if (sock) {
      sock.end(undefined);
    }
  } catch {}

  process.exit(0);
});

module.exports.requestPairingCode =
  requestPairingCode;

module.exports.logoutWhatsApp =
  logoutWhatsApp;

module.exports.getSocket = () => sock;

main().catch((error) => {
  printLog(
    "error",
    `Fatal startup error: ${error.message}`,
  );

  console.error(error.stack);

  process.exit(1);
});
  
