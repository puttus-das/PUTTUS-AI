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
const commandHandler = require("./lib/commandHandler");

const {
  handleMessages,
  handleGroupParticipantUpdate,
  handleStatus,
  handleCall,
} = require("./lib/messageHandler");

/*
 * -------------------------------------------------------
 * LOGGER
 * -------------------------------------------------------
 */

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

/*
 * -------------------------------------------------------
 * GLOBALS
 * -------------------------------------------------------
 */

async function isSudo(userId) {
  return libIndex.isSudo(userId);
}

module.exports.isSudo = isSudo;

const SESSION_DIR = path.join(__dirname, "session");
const TEMP_DIR = path.join(__dirname, "temp");

global.botname =
  process.env.BOT_NAME ||
  settings.botName ||
  "PUTTUS-XD";

global.themeemoji = "•";

global.conns = global.conns || [];

/*
 * -------------------------------------------------------
 * SOCKET STATE
 * -------------------------------------------------------
 */

let sock = null;
let starting = false;
let reconnectTimer = null;
let pairingRequestRunning = false;
let intentionalLogout = false;
let telegramStarted = false;

/*
 * -------------------------------------------------------
 * DIRECTORY SETUP
 * -------------------------------------------------------
 */

function ensureDirectory(directory) {
  try {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, {
        recursive: true,
      });
    }

    return true;
  } catch (error) {
    printLog(
      "error",
      `Directory creation failed: ${error.message}`,
    );

    return false;
  }
}

ensureDirectory(SESSION_DIR);
ensureDirectory(TEMP_DIR);

process.env.TMPDIR = TEMP_DIR;
process.env.TEMP = TEMP_DIR;
process.env.TMP = TEMP_DIR;

/*
 * -------------------------------------------------------
 * HELPERS
 * -------------------------------------------------------
 */

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

/*
 * -------------------------------------------------------
 * SESSION CHECK
 * -------------------------------------------------------
 */

function hasValidSession() {
  try {
    const credsPath = path.join(
      SESSION_DIR,
      "creds.json",
    );

    if (!fs.existsSync(credsPath)) {
      return false;
    }

    const raw = fs.readFileSync(
      credsPath,
      "utf8",
    );

    if (!raw.trim()) {
      return false;
    }

    const creds = JSON.parse(raw);

    /*
     * For a real registered Baileys session,
     * registered should be true.
     *
     * During pairing it can still be false.
     */
    return Boolean(
      creds &&
        creds.noiseKey &&
        creds.signedIdentityKey &&
        creds.signedPreKey &&
        creds.registered === true,
    );
  } catch (error) {
    return false;
  }
}

/*
 * -------------------------------------------------------
 * SESSION INITIALIZATION
 * -------------------------------------------------------
 */

async function initializeSession() {
  ensureDirectory(SESSION_DIR);

  /*
   * Existing local session.
   */
  if (hasValidSession()) {
    printLog(
      "info",
      "Existing WhatsApp session found.",
    );

    return true;
  }

  /*
   * Optional old SESSION_ID support.
   */
  const sessionId =
    global.SESSION_ID ||
    process.env.SESSION_ID ||
    "";

  if (!sessionId.trim()) {
    return false;
  }

  try {
    printLog(
      "info",
      "Trying to restore SESSION_ID credentials...",
    );

    await SaveCreds(sessionId);

    if (hasValidSession()) {
      printLog(
        "success",
        "SESSION_ID credentials restored.",
      );

      return true;
    }

    printLog(
      "warning",
      "SESSION_ID did not produce a valid registered session.",
    );

    return false;
  } catch (error) {
    printLog(
      "error",
      `Session restore failed: ${error.message}`,
    );

    return false;
  }
}

/*
 * -------------------------------------------------------
 * REMOVE SESSION
 * -------------------------------------------------------
 */

function removeSession() {
  try {
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, {
        recursive: true,
        force: true,
      });
    }
  } catch (error) {
    printLog(
      "error",
      `Could not remove session: ${error.message}`,
    );
  }

  ensureDirectory(SESSION_DIR);
}

/*
 * -------------------------------------------------------
 * SOCKET HELPERS
 * -------------------------------------------------------
 */

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

  client.getName = (
    jid,
    withoutContact = false,
  ) => {
    const id = client.decodeJid(jid);

    if (!id) {
      return "Unknown";
    }

    if (id.endsWith("@g.us")) {
      return (async () => {
        let contact =
          store.contacts?.[id] || {};

        if (
          !(contact.name || contact.subject)
        ) {
          try {
            contact =
              await client.groupMetadata(id);
          } catch {}
        }

        return (
          (withoutContact
            ? ""
            : contact.name) ||
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
        ? {
            name: "WhatsApp",
          }
        : id ===
          jidNormalizedUser(
            client.user?.id,
          )
          ? client.user
          : store.contacts?.[id] || {};

    return (
      (withoutContact
        ? ""
        : contact.name) ||
      contact.subject ||
      contact.verifiedName ||
      PhoneNumber(
        `+${id.replace(
          "@s.whatsapp.net",
          "",
        )}`,
      ).getNumber("international") ||
      id
    );
  };

  client.public = true;

  client.serializeM = (message) => {
    return smsg(
      client,
      message,
      store,
    );
  };

  client.msgRetryCounterCache =
    client.msgRetryCounterCache ||
    new NodeCache();
}

/*
 * -------------------------------------------------------
 * CREATE SOCKET
 * -------------------------------------------------------
 */

async function createSocket() {
  /*
   * Already connected/created.
   */
  if (sock) {
    return sock;
  }

  /*
   * Prevent duplicate socket creation.
   */
  if (starting) {
    while (starting) {
      await sleep(250);
    }

    return sock;
  }

  starting = true;

  try {
    ensureDirectory(SESSION_DIR);

    const {
      version,
    } = await fetchLatestBaileysVersion();

    const {
      state,
      saveCreds,
    } = await useMultiFileAuthState(
      SESSION_DIR,
    );

    const msgRetryCounterCache =
      new NodeCache();

    const client = makeWASocket({
      version,

      logger: silentLogger,

      browser:
        Browsers.macOS("Chrome"),

      auth: {
        creds: state.creds,

        keys:
          makeCacheableSignalKeyStore(
            state.keys,
            silentLogger,
          ),
      },

      markOnlineOnConnect: true,

      generateHighQualityLinkPreview:
        true,

      syncFullHistory: false,

      msgRetryCounterCache,

      defaultQueryTimeoutMs: 60000,

      connectTimeoutMs: 60000,

      keepAliveIntervalMs: 10000,

      getMessage: async (key) => {
        try {
          const jid =
            jidNormalizedUser(
              key.remoteJid,
            );

          const message =
            await store.loadMessage(
              jid,
              key.id,
            );

          return (
            message?.message ||
            undefined
          );
        } catch {
          return undefined;
        }
      },
    });

    sock = client;

    /*
     * Expose auth state for pairing code.
     */
    sock.authState = {
      creds: state.creds,
      keys: state.keys,
    };

    setupSocketHelpers(sock);

    /*
     * Bind lightweight store.
     */
    store.bind(sock.ev);

    /*
     * VERY IMPORTANT:
     * Save all Baileys credential updates.
     */
    sock.ev.on(
      "creds.update",
      async () => {
        try {
          await saveCreds();
        } catch (error) {
          printLog(
            "error",
            `Credentials save failed: ${error.message}`,
          );
        }
      },
    );

    /*
     * Contacts.
     */
    sock.ev.on(
      "contacts.update",
      (updates) => {
        for (const contact of updates || []) {
          const id =
            sock.decodeJid(
              contact.id,
            );

          if (
            id &&
            store.contacts
          ) {
            store.contacts[id] = {
              id,
              name: contact.notify,
            };
          }
        }
      },
    );

    /*
     * Messages.
     */
    sock.ev.on(
      "messages.upsert",
      async (update) => {
        try {
          const message =
            update?.messages?.[0];

          if (!message?.message) {
            return;
          }

          if (
            Object.keys(
              message.message,
            )[0] ===
            "ephemeralMessage"
          ) {
            message.message =
              message.message
                .ephemeralMessage
                ?.message ||
              message.message;
          }

          if (
            message.key
              ?.remoteJid ===
            "status@broadcast"
          ) {
            await handleStatus(
              sock,
              update,
            );

            return;
          }

          if (
            message.key?.id?.startsWith(
              "BAE5",
            ) &&
            message.key.id.length ===
              16
          ) {
            return;
          }

          await handleMessages(
            sock,
            update,
          );
        } catch (error) {
          printLog(
            "error",
            `messages.upsert: ${error.message}`,
          );
        }
      },
    );

    /*
     * Group participant updates.
     */
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

    /*
     * Status.
     */
    sock.ev.on(
      "status.update",
      async (update) => {
        try {
          await handleStatus(
            sock,
            update,
          );
        } catch (error) {
          printLog(
            "error",
            `status event: ${error.message}`,
          );
        }
      },
    );

    /*
     * Reactions.
     */
    sock.ev.on(
      "messages.reaction",
      async (update) => {
        try {
          await handleStatus(
            sock,
            update,
          );
        } catch (error) {
          printLog(
            "error",
            `reaction event: ${error.message}`,
          );
        }
      },
    );

    /*
     * Calls.
     */
    sock.ev.on(
      "call",
      async (calls) => {
        try {
          await handleCall(
            sock,
            calls,
          );
        } catch (error) {
          printLog(
            "error",
            `call event: ${error.message}`,
          );
        }
      },
    );

    /*
     * CONNECTION EVENTS
     */
    sock.ev.on(
      "connection.update",
      async (update) => {
        const {
          connection,
          lastDisconnect,
        } = update || {};

        /*
         * Connecting.
         */
        if (
          connection ===
          "connecting"
        ) {
          printLog(
            "connection",
            "Connecting to WhatsApp...",
          );
        }

        /*
         * Connected.
         */
        if (
          connection === "open"
        ) {
          printLog(
            "success",
            "PUTTUS-XD connected successfully!",
          );

          const connectedNumber =
            sock.user?.id
              ?.split(":")[0]
              ?.split("@")[0] ||
            null;

          pairStore.updateSession({
            status:
              "connected",

            number:
              connectedNumber,

            connectedAt:
              new Date().toISOString(),
          });

          /*
           * Force store write.
           */
          try {
            store.writeToFile();
          } catch {}

          /*
           * Auto bio.
           */
          try {
            const {
              startAutoBio,
            } = require(
              "./plugins/setbio",
            );

            if (
              typeof startAutoBio ===
              "function"
            ) {
              await startAutoBio(
                sock,
              );
            }
          } catch (error) {
            printLog(
              "warning",
              `AutoBio skipped: ${error.message}`,
            );
          }

          console.log(
            `\n■ ${global.botname}`,
          );

          console.log(
            `■ Loaded Commands: ${commandHandler.commands.size}`,
          );

          console.log(
            `■ Prefixes: ${settings.prefixes.join(
              ", ",
            )}`,
          );
        }

        /*
         * Connection closed.
         */
        if (
          connection === "close"
        ) {
          const code =
            statusCodeFrom(
              lastDisconnect?.error,
            );

          printLog(
            "error",
            `WhatsApp connection closed: ${
              code || "unknown"
            }`,
          );

          const loggedOut =
            code ===
              DisconnectReason.loggedOut ||
            code === 401;

          /*
           * Destroy old socket reference.
           */
          sock = null;

          starting = false;

          /*
           * Permanent logout.
           */
          if (
            loggedOut ||
            intentionalLogout
          ) {
            intentionalLogout =
              false;

            pairStore.clearSession();

            removeSession();

            printLog(
              "warning",
              "WhatsApp session removed.",
            );

            return;
          }

          /*
           * Temporary disconnect:
           * reconnect after 5 seconds.
           */
          if (
            !reconnectTimer
          ) {
            reconnectTimer =
              setTimeout(
                () => {
                  reconnectTimer =
                    null;

                  createSocket().catch(
                    (error) => {
                      printLog(
                        "error",
                        `Reconnect failed: ${error.message}`,
                      );
                    },
                  );
                },
                5000,
              );
          }
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

/*
 * -------------------------------------------------------
 * REQUEST PAIRING CODE
 * -------------------------------------------------------
 */

async function requestPairingCode(
  phoneNumber,
) {
  const number =
    cleanNumber(phoneNumber);

  if (
    !/^\d{8,15}$/.test(
      number,
    )
  ) {
    throw new Error(
      "Invalid WhatsApp number. Use country code without +.",
    );
  }

  if (pairingRequestRunning) {
    throw new Error(
      "Another pairing request is already running.",
    );
  }

  pairingRequestRunning = true;

  try {
    /*
     * Already connected.
     */
    if (sock?.user) {
      throw new Error(
        "WhatsApp is already connected. Use /logout first.",
      );
    }

    /*
     * Check local auth state.
     */
    const credsPath =
      path.join(
        SESSION_DIR,
        "creds.json",
      );

    if (
      fs.existsSync(
        credsPath,
      )
    ) {
      try {
        const creds =
          JSON.parse(
            fs.readFileSync(
              credsPath,
              "utf8",
            ),
          );

        if (
          creds?.registered ===
          true
        ) {
          throw new Error(
            "A WhatsApp session is already registered. Use /logout first.",
          );
        }
      } catch (error) {
        if (
          error.message.includes(
            "already registered",
          )
        ) {
          throw error;
        }
      }
    }

    /*
     * Create socket.
     */
    const client =
      await createSocket();

    if (!client) {
      throw new Error(
        "WhatsApp socket could not be created.",
      );
    }

    /*
     * Wait for Baileys.
     */
    await sleep(3000);

    if (
      client.authState?.creds
        ?.registered === true
    ) {
      throw new Error(
        "A WhatsApp session is already registered. Use /logout first.",
      );
    }

    /*
     * Request pairing code.
     */
    let code;

    try {
      code =
        await client.requestPairingCode(
          number,
        );
    } catch (error) {
      throw new Error(
        `Pairing code request failed: ${
          error?.message ||
          error
        }`,
      );
    }

    if (!code) {
      throw new Error(
        "WhatsApp did not return a pairing code.",
      );
    }

    /*
     * Format:
     * ABCD-EFGH
     */
    const formattedCode =
      String(code)
        .replace(
          /[^a-zA-Z0-9]/g,
          "",
        )
        .toUpperCase()
        .match(/.{1,4}/g)
        ?.join("-") ||
      String(code);

    /*
     * Pairing has started.
     */
    pairStore.updateSession({
      status:
        "pairing",
      number,
      pairingStartedAt:
        new Date().toISOString(),
    });

    return formattedCode;
  } finally {
    pairingRequestRunning = false;
  }
}

/*
 * -------------------------------------------------------
 * LOGOUT
 * -------------------------------------------------------
 */

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

    starting = false;

    pairStore.clearSession();

    removeSession();
  }
}

/*
  * -------------------------------------------------------
 * TELEGRAM
 * -------------------------------------------------------
 */

async function startTelegram() {
  if (telegramStarted) {
    return;
  }

  telegramStarted = true;

  try {
    const {
      startTelegramPairing,
    } = require(
      "./lib/telegramBot",
    );

    startTelegramPairing({
      onPairRequest:
        requestPairingCode,

      onLogoutRequest:
        logoutWhatsApp,

      getStatus: () => ({
        connected:
          Boolean(sock?.user),

        user:
          sock?.user ||
          null,

        session:
          pairStore.getActiveSession(),
      }),
    });

    printLog(
      "success",
      "Telegram pairing control started.",
    );
  } catch (error) {
    telegramStarted = false;

    printLog(
      "error",
      `Telegram startup failed: ${error.message}`,
    );
  }
}

/*
 * -------------------------------------------------------
 * MAIN
 * -------------------------------------------------------
 */

async function main() {
  printLog(
    "info",
    "Starting PUTTUS-XD...",
  );

  /*
   * Local message store.
   */
  try {
    store.readFromFile();
  } catch (error) {
    printLog(
      "warning",
      `Store read failed: ${error.message}`,
    );
  }

  /*
   * Periodic store write.
   */
  setInterval(() => {
    try {
      store.writeToFile();
    } catch (error) {
      printLog(
        "error",
        `Store write failed: ${error.message}`,
      );
    }
  }, settings.storeWriteInterval || 10000);

  /*
   * Load commands.
   */
  commandHandler.loadCommands();

  printLog(
    "success",
    `Loaded ${commandHandler.commands.size} commands`,
  );

  /*
   * Restore existing session.
   */
  let sessionReady = false;

  try {
    sessionReady =
      await initializeSession();
  } catch (error) {
    printLog(
      "warning",
      `Session initialization skipped: ${error.message}`,
    );
  }

  /*
   * Connect if session exists.
   */
  if (sessionReady) {
    try {
      await createSocket();
    } catch (error) {
      printLog(
        "error",
        `WhatsApp startup failed: ${error.message}`,
      );

      sock = null;
      starting = false;
    }
  } else {
    /*
     * First run.
     * This is NOT an error.
     */
    printLog(
      "info",
      "No WhatsApp session found. Use Telegram /pair <number> to connect.",
    );
  }

  /*
   * Telegram must always start.
   */
  await startTelegram();

  printLog(
    "success",
    "PUTTUS-XD startup completed.",
  );
}

/*
 * -------------------------------------------------------
 * HTTP SERVER
 * -------------------------------------------------------
 */

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    printLog(
      "success",
      `HTTP server listening on ${PORT}`,
    );
  },
);

/*
 * -------------------------------------------------------
 * TEMP CLEANER
 * -------------------------------------------------------
 */

setInterval(
  () => {
    try {
      if (
        !fs.existsSync(
          TEMP_DIR,
        )
      ) {
        return;
      }

      for (
        const file of fs.readdirSync(
          TEMP_DIR,
        )
      ) {
        try {
          const filePath =
            path.join(
              TEMP_DIR,
              file,
            );

          const stat =
            fs.statSync(
              filePath,
            );

          if (
            Date.now() -
              stat.mtimeMs >
            3 * 60 * 60 * 1000
          ) {
            fs.unlinkSync(
              filePath,
            );
          }
        } catch {}
      }
    } catch {}
  },
  60 * 60 * 1000,
);

/*
 * -------------------------------------------------------
 * PROCESS ERRORS
 * -------------------------------------------------------
 */

process.on(
  "uncaughtException",
  (error) => {
    printLog(
      "error",
      `Uncaught Exception: ${error.message}`,
    );

    console.error(
      error.stack,
    );
  },
);

process.on(
  "unhandledRejection",
  (error) => {
    printLog(
      "error",
      `Unhandled Rejection: ${
        error?.message ||
        error
      }`,
    );

    console.error(
      error?.stack ||
        error,
    );
  },
);

/*
 * -------------------------------------------------------
 * SHUTDOWN
 * -------------------------------------------------------
 */

process.on(
  "SIGINT",
  async () => {
    try {
      if (sock) {
        sock.end(
          undefined,
        );
      }
    } catch {}

    process.exit(0);
  },
);

process.on(
  "SIGTERM",
  async () => {
    try {
      if (sock) {
        sock.end(
          undefined,
        );
      }
    } catch {}

    process.exit(0);
  },
);

/*
 * -------------------------------------------------------
 * EXPORTS
 * -------------------------------------------------------
 */

module.exports.requestPairingCode =
  requestPairingCode;

module.exports.logoutWhatsApp =
  logoutWhatsApp;

module.exports.getSocket =
  () => sock;

/*
 * -------------------------------------------------------
 * START
 * -------------------------------------------------------
 */

main().catch(
  (error) => {
    printLog(
      "error",
      `Fatal startup error: ${error.message}`,
    );

    console.error(
      error.stack,
    );

    process.exit(1);
  },
);


