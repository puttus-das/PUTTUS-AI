const fs = require("fs");
const path = require("path");
const pino = require("pino");
const NodeCache = require("node-cache");
const {
  default: makeWASocket,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore,
  jidDecode,
  jidNormalizedUser,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

require("./config");

const settings = require("./settings");
const store = require("./lib/lightweight_store");
const MultiSessionManager = require("./lib/multiSessionManager");
const { server } = require("./lib/server");
const { printLog } = require("./lib/print");
const { smsg } = require("./lib/myfunc");
const commandHandler = require("./lib/commandHandler");

const {
  handleMessages,
  handleGroupParticipantUpdate,
  handleStatus,
  handleCall,
} = require("./lib/messageHandler");

const PORT = Number(process.env.PORT || 5000);
const TEMP_DIR = path.join(__dirname, "temp");

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

process.env.TMPDIR = TEMP_DIR;
process.env.TEMP = TEMP_DIR;
process.env.TMP = TEMP_DIR;

global.botname = settings.botName || "PUTTUS-XD";
global.themeemoji = "•";
global.conns = global.conns || [];

const manager = new MultiSessionManager({
  mongoUrl: settings.mongoUrl,
  database: settings.mongoDatabase || "puttus_xd",
});

const sessions = new Map();
const starting = new Set();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanNumber(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .replace(/^00/, "");
}

function getStatusCode(error) {
  return (
    error?.output?.statusCode ||
    error?.data?.statusCode ||
    error?.statusCode ||
    null
  );
}

function setupSocketHelpers(client) {
  client.decodeJid = (jid) => {
    if (!jid) return jid;

    if (/:(\d+)@/gi.test(jid)) {
      const decoded = jidDecode(jid) || {};

      if (decoded.user && decoded.server) {
        return `${decoded.user}@${decoded.server}`;
      }
    }

    return jid;
  };

  client.getName = (jid, withoutContact = false) => {
    const id = client.decodeJid(jid);

    if (!id) {
      return "Unknown";
    }

    const contact =
      id === jidNormalizedUser(client.user?.id)
        ? client.user
        : store.contacts?.[id] || {};

    return (
      (withoutContact ? "" : contact?.name) ||
      contact?.subject ||
      contact?.verifiedName ||
      id
    );
  };

  client.public = true;
  client.serializeM = (message) => smsg(client, message, store);
  client.msgRetryCounterCache = new NodeCache();
}

async function createSocket(userId, numberForPairing = "") {
  const uid = String(userId);

  if (sessions.has(uid)) {
    return sessions.get(uid).sock;
  }

  if (starting.has(uid)) {
    while (starting.has(uid)) {
      await sleep(250);
    }

    return sessions.get(uid)?.sock || null;
  }

  starting.add(uid);

  try {
    const { state, saveCreds } = await manager.authState(uid);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,

      logger: pino({
        level: "silent",
      }),

      browser: Browsers.macOS("Chrome"),

      auth: {
        creds: state.creds,

        keys: makeCacheableSignalKeyStore(
          state.keys,
          pino({
            level: "fatal",
          }),
        ),
      },

      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,

      msgRetryCounterCache: new NodeCache(),

      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,

      getMessage: async (key) => {
        const jid = jidNormalizedUser(key.remoteJid);
        const message = await store.loadMessage(jid, key.id);

        return message?.message || undefined;
      },
    });

    setupSocketHelpers(sock);

    sock.authState = state;

    sessions.set(uid, {
      sock,
      saveCreds,
      number: numberForPairing,
    });

    manager.sessions.set(uid, sock);

    store.bind(sock.ev);

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (update) => {
      try {
        const message = update?.messages?.[0];

        if (!message?.message) {
          return;
        }

        if (message.key?.remoteJid === "status@broadcast") {
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
          `Message error for Telegram user ${uid}: ${error.message}`,
        );
      }
    });

    sock.ev.on("group-participants.update", async (update) => {
      try {
        await handleGroupParticipantUpdate(sock, update);
      } catch (error) {
        printLog("error", `Group event error: ${error.message}`);
      }
    });

    sock.ev.on("status.update", async (update) => {
      try {
        await handleStatus(sock, update);
      } catch (error) {
        printLog("error", `Status event error: ${error.message}`);
      }
    });

    sock.ev.on("messages.reaction", async (update) => {
      try {
        await handleStatus(sock, update);
      } catch (error) {
        printLog("error", `Reaction event error: ${error.message}`);
      }
    });

    sock.ev.on("call", async (calls) => {
      try {
        await handleCall(sock, calls);
      } catch (error) {
        printLog("error", `Call event error: ${error.message}`);
      }
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update || {};

      if (connection === "connecting") {
        printLog(
          "info",
          `Connecting WhatsApp for Telegram user ${uid}...`,
        );
      }

      if (connection === "open") {
        const number =
          sock.user?.id?.split(":")[0]?.split("@")[0] ||
          numberForPairing;

        await manager.setMeta(uid, {
          status: "connected",
          number,
        });

        printLog(
          "success",
          `WhatsApp connected for Telegram user ${uid}`,
        );
      }

      if (connection === "close") {
        const code = getStatusCode(lastDisconnect?.error);

        sessions.delete(uid);
        manager.sessions.delete(uid);

        const loggedOut =
          code === DisconnectReason.loggedOut || code === 401;

        if (loggedOut) {
          await manager.setMeta(uid, {
            status: "logged_out",
          });

          return;
        }

        setTimeout(() => {
          createSocket(uid).catch((error) => {
            printLog(
              "error",
              `Reconnect failed for ${uid}: ${error.message}`,
            );
          });
        }, 5000);
      }
    });

    await manager.setMeta(uid, {
      status: "pairing",
      number: numberForPairing,
    });

    return sock;
  } finally {
    starting.delete(uid);
  }
}

async function pairUser(userId, phoneNumber) {
  const uid = String(userId);
  const phone = cleanNumber(phoneNumber);

  if (!/^\d{8,15}$/.test(phone)) {
    throw new Error("Invalid WhatsApp number");
  }

  const existing = await manager.getMeta(uid);

  if (existing?.status === "connected") {
    throw new Error(
      "Your WhatsApp is already connected. Use /logout first.",
    );
  }

  const sock = await createSocket(uid, phone);

  await sleep(2500);

  if (sock.authState?.creds?.registered === true) {
    throw new Error(
      "Your WhatsApp is already registered. Use /logout first.",
    );
  }

  const code = await sock.requestPairingCode(phone);

  return code;
}

async function logoutUser(userId) {
  const uid = String(userId);
  const session = sessions.get(uid);

  try {
    if (session?.sock) {
      await session.sock.logout();
    }
  } catch (error) {
    printLog("warning", `Logout warning for ${uid}: ${error.message}`);
  }

  sessions.delete(uid);
  manager.sessions.delete(uid);

  await manager.clear(uid);
}

async function getUserStatus(userId) {
  const uid = String(userId);
  const session = sessions.get(uid);
  const meta = await manager.getMeta(uid);

  return {
    connected: Boolean(session?.sock?.user),

    number:
      session?.sock?.user?.id?.split(":")[0] ||
      meta?.number ||
      "",

    status: meta?.status || "disconnected",
  };
}

async function startTelegram() {
  const { startTelegramPairing } = require("./lib/telegramBot");

  return startTelegramPairing({
    pair: pairUser,
    logout: logoutUser,
    status: getUserStatus,
  });
}

async function main() {
  if (!settings.mongoUrl) {
    throw new Error(
      "MONGO_URL is missing. Add MONGO_URL in Heroku Config Vars.",
    );
  }

  await manager.connect();

  store.readFromFile();

  commandHandler.loadCommands();

  await startTelegram();

  printLog(
    "success",
    `Loaded ${commandHandler.commands.size} commands for multi-device mode`,
  );
}

server.listen(PORT, "0.0.0.0", () => {
  printLog(
    "success",
    `HTTP server listening on port ${PORT}`,
  );
});

process.on("SIGINT", async () => {
  try {
    await manager.close();
  } catch (error) {
    printLog("error", `Shutdown error: ${error.message}`);
  } finally {
    process.exit(0);
  }
});

process.on("uncaughtException", (error) => {
  printLog("error", `Uncaught Exception: ${error.message}`);
  console.error(error.stack);
});

process.on("unhandledRejection", (error) => {
  printLog(
    "error",
    `Unhandled Rejection: ${error?.message || error}`,
  );

  console.error(error);
});

main().catch((error) => {
  printLog("error", `Fatal startup error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

module.exports.getSocket = (userId) => {
  return sessions.get(String(userId))?.sock || null;
};
      
