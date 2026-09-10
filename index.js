const fs = require("fs");
const path = require("path");
const pino = require("pino");
const NodeCache = require("node-cache");
const PhoneNumber = require("awesome-phonenumber");
const { Boom } = require("@hapi/boom");
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
const { app, server } = require("./lib/server");
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
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
process.env.TMPDIR = TEMP_DIR;
process.env.TEMP = TEMP_DIR;
process.env.TMP = TEMP_DIR;
global.botname = settings.botName;
global.themeemoji = "•";
global.conns = global.conns || [];

const manager = new MultiSessionManager({
  mongoUrl: settings.mongoUrl,
  database: settings.mongoDatabase,
});
const sessions = new Map();
const starting = new Set();
let telegramBot = null;

async function isSudo(userId) {
  try { return require("./lib/isOwner")(userId); } catch { return false; }
}
module.exports.isSudo = isSudo;

function statusCode(error) {
  return error?.output?.statusCode || error?.data?.statusCode || error?.statusCode || null;
}
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function cleanNumber(value) { return String(value || "").replace(/\D/g, "").replace(/^00/, ""); }

function setupSocketHelpers(client) {
  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:(\d+)@/gi.test(jid)) {
      const decoded = jidDecode(jid) || {};
      return decoded.user && decoded.server ? `${decoded.user}@${decoded.server}` : jid;
    }
    return jid;
  };
  client.getName = (jid, withoutContact = false) => {
    const id = client.decodeJid(jid);
    const contact = id === jidNormalizedUser(client.user?.id) ? client.user : store.contacts?.[id] || {};
    return (withoutContact ? "" : contact.name) || contact.subject || contact.verifiedName || id;
  };
  client.public = true;
  client.serializeM = (message) => smsg(client, message, store);
  client.msgRetryCounterCache = new NodeCache();
}

async function createSocket(userId, numberForPairing = "") {
  const uid = String(userId);
  if (sessions.has(uid)) return sessions.get(uid).sock;
  if (starting.has(uid)) {
    while (starting.has(uid)) await sleep(250);
    return sessions.get(uid)?.sock || null;
  }
  starting.add(uid);
  try {
    const { state, saveCreds } = await manager.authState(uid);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      browser: Browsers.macOS("Chrome"),
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })) },
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      msgRetryCounterCache: new NodeCache(),
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,
      getMessage: async (key) => {
        const message = await store.loadMessage(jidNormalizedUser(key.remoteJid), key.id);
        return message?.message || undefined;
      },
    });
    setupSocketHelpers(sock);
    sock.authState = state;
    sessions.set(uid, { sock, saveCreds, number: numberForPairing });
    manager.sessions.set(uid, sock);
    store.bind(sock.ev);
    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("messages.upsert", async (update) => {
      try {
        const message = update?.messages?.[0];
        if (!message?.message) return;
        if (message.key?.remoteJid === "status@broadcast") return handleStatus(sock, update);
        if (message.key?.id?.startsWith("BAE5") && message.key.id.length === 16) return;
        await handleMessages(sock, update);
      } catch (e) { printLog("error", `user ${uid} message error: ${e.message}`); }
    });
    sock.ev.on("group-participants.update", (u) => handleGroupParticipantUpdate(sock, u).catch(() => {}));
    sock.ev.on("status.update", (u) => handleStatus(sock, u).catch(() => {}));
    sock.ev.on("messages.reaction", (u) => handleStatus(sock, u).catch(() => {}));
    sock.ev.on("call", (u) => handleCall(sock, u).catch(() => {}));
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update || {};
      if (connection === "open") {
        const number = sock.user?.id?.split(":")[0]?.split("@")[0] || numberForPairing;
        await manager.setMeta(uid, { status: "connected", number });
        printLog("success", `WhatsApp connected for Telegram user ${uid}`);
      }
      if (connection === "close") {
        const code = statusCode(lastDisconnect?.error);
        sessions.delete(uid); manager.sessions.delete(uid);
        if (code !== DisconnectReason.loggedOut && code !== 401) {
          setTimeout(() => createSocket(uid).catch((e) => printLog("error", e.message)), 5000);
        } else {
          await manager.setMeta(uid, { status: "logged_out" });
        }
      }
    });
    await manager.setMeta(uid, { status: "pairing", number: numberForPairing });
    return sock;
  } finally { starting.delete(uid); }
}

async function pairUser(userId, phone) {
  const uid = String(userId);
  const existing = await manager.getMeta(uid);
  if (existing?.status === "connected") throw new Error("Your WhatsApp is already connected. Use /logout first.");
  const sock = await createSocket(uid, phone);
  await sleep(2500);
  if (sock.authState.creds.registered) throw new Error("Your WhatsApp is already registered. Use /logout first.");
  const code = await sock.requestPairingCode(cleanNumber(phone));
  return code;
}

async function logoutUser(userId) {
  const uid = String(userId);
  const item = sessions.get(uid);
  try { if (item?.sock) await item.sock.logout(); } catch {}
  sessions.delete(uid); manager.sessions.delete(uid);
  await manager.clear(uid);
}

async function getStatus(userId) {
  const uid = String(userId);
  const item = sessions.get(uid);
  const meta = await manager.getMeta(uid);
  return { connected: Boolean(item?.sock?.user), number: item?.sock?.user?.id?.split(":")[0] || meta?.number || "" };
}

async function startTelegram() {
  const { startTelegramPairing } = require("./lib/telegramBot");
  telegramBot = startTelegramPairing({ pair: pairUser, logout: logoutUser, status: getStatus });
}

async function main() {
  if (!settings.mongoUrl) throw new Error("MONGO_URL is required for multi-device mode");
  await manager.connect();
  store.readFromFile();
  commandHandler.loadCommands();
  await startTelegram();
  printLog("success", `Loaded ${commandHandler.commands.size} commands for multi-device mode`);
}

server.listen(PORT, "0.0.0.0", () => printLog("success", `HTTP server listening on ${PORT}`));
process.on("SIGINT", async () => { try { await manager.close(); } finally { process.exit(0); } });
process.on("uncaughtException", (e) => printLog("error", `Uncaught Exception: ${e.message}`));
process.on("unhandledRejection", (e) => printLog("error", `Unhandled Rejection: ${e?.message || e}`));
main().catch((e) => { printLog("error", `Fatal startup error: ${e.message}`); process.exit(1); });
module.exports.getSocket = (userId) => sessions.get(String(userId))?.sock || null;
            
