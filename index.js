const fs = require("fs");
const path = require("path");
const pino = require("pino");
const { Telegraf } = require("telegraf");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
} = require("@whiskeysockets/baileys");

const { Boom } = require("@hapi/boom");

// ===============================
// CONFIG
// ===============================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN is missing!");
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const SESSION_DIR = path.join(__dirname, "session");

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

let sock = null;
let reconnecting = false;
let pairingInProgress = false;
let connectionState = "close";

// ===============================
// SIMPLE HTTP SERVER FOR HEROKU
// ===============================

const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain",
  });

  res.end("PUTTUS Telegram Pairing Bot is running.");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// ===============================
// HELPERS
// ===============================

function cleanNumber(number) {
  return String(number || "")
    .replace(/[^\d]/g, "")
    .replace(/^00/, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStatusCode(error) {
  return (
    error?.output?.statusCode ||
    error?.data?.statusCode ||
    error?.statusCode ||
    null
  );
}

// ===============================
// TELEGRAM START
// ===============================

bot.start(async (ctx) => {
  await ctx.reply(
    `╭━━━〔 ⚡ PUTTUS PAIRING 〕━━━╮
┃
┃ 👋 Welcome!
┃
┃ 📱 WhatsApp connect করতে:
┃
┃ /pair 917XXXXXXXXX
┃
┃ Example:
┃ /pair 919876543210
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    `📚 Commands

/pair 917XXXXXXXXX
→ WhatsApp pairing code

/status
→ Connection status

/start
→ Start bot`
  );
});

// ===============================
// STATUS
// ===============================

bot.command("status", async (ctx) => {
  let text;

  if (connectionState === "open") {
    text = "🟢 WhatsApp: CONNECTED";
  } else if (connectionState === "connecting") {
    text = "🟡 WhatsApp: CONNECTING";
  } else {
    text = "🔴 WhatsApp: DISCONNECTED";
  }

  await ctx.reply(
    `╭━━〔 PUTTUS STATUS 〕━━╮
┃
┃ ${text}
┃
╰━━━━━━━━━━━━━━━━━━╯`
  );
});

// ===============================
// PAIR COMMAND
// ===============================

bot.command("pair", async (ctx) => {
  try {
    const args = ctx.message.text.split(" ").slice(1);

    if (!args.length) {
      return ctx.reply(
        `❌ Number missing!

Use:

/pair 917XXXXXXXXX
Example:

/pair 919876543210`
      );
    }

    if (pairingInProgress) {
      return ctx.reply(
        "⏳ একটি pairing request already চলছে.\n\nকিছুক্ষণ পরে আবার চেষ্টা করো."
      );
    }

    let phoneNumber = cleanNumber(args[0]);

    if (!phoneNumber) {
      return ctx.reply("❌ Invalid WhatsApp number.");
    }

    if (phoneNumber.length < 8 || phoneNumber.length > 15) {
      return ctx.reply(
        "❌ Invalid phone number.\n\nCountry code সহ number দাও।"
      );
    }

    pairingInProgress = true;

    await ctx.reply(
      `⏳ *Starting WhatsApp pairing...*

📱 Number: \`${phoneNumber}\`

Please wait...`,
      {
        parse_mode: "Markdown",
      }
    );

    // ===========================
    // MAKE SURE SOCKET EXISTS
    // ===========================

    if (!sock) {
      await startWhatsApp();
    }

    // Give socket time to initialize
    for (let i = 0; i < 20; i++) {
      if (connectionState === "open" || connectionState === "connecting") {
        break;
      }

      await sleep(1000);
    }

    if (!sock) {
      throw new Error("WhatsApp socket is not available.");
    }

    // ===========================
    // ALREADY CONNECTED
    // ===========================

    if (sock.authState?.creds?.registered === true) {
      pairingInProgress = false;

      return ctx.reply(
        `⚠️ This WhatsApp session is already registered.

Use /status to check connection.`
      );
    }

    // ===========================
    // WAIT BEFORE REQUEST
    // ===========================

    await sleep(3000);

    console.log(
      `📱 Requesting pairing code for ${phoneNumber}`
    );

    // ===========================
    // REQUEST CODE
    // ===========================

    let code = await sock.requestPairingCode(phoneNumber);

    if (!code) {
      throw new Error("WhatsApp did not return a pairing code.");
    }

    code = String(code)
      .replace(/[^A-Za-z0-9]/g, "")
      .match(/.{1,4}/g)
      ?.join("-") || code;

    await ctx.reply(
      `╭━━━〔 🔐 PAIRING CODE 〕━━━╮
┃
┃ 📱 Number:
┃ ${phoneNumber}
┃
┃ 🔑 Code:
┃
┃ *${code}*
┃
┃ 📌 WhatsApp →
┃ Linked Devices →
┃ Link a device →
┃ Link with phone number
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`,
      {
        parse_mode: "Markdown",
      }
    );

    await ctx.reply(
      "⚠️ Codeটি কাউকে share করো না। WhatsApp-এ code দেওয়ার পর connection complete হতে একটু সময় লাগতে পারে."
    );

  } catch (error) {
    console.error("PAIR ERROR:", error);

    await ctx.reply(
      `❌ *Pairing Failed*

${error?.message || "Unknown error"}

Try again after a few seconds.`,
      {
        parse_mode: "Markdown",
      }
    );
  } finally {
    pairingInProgress = false;
  }
});

// ===============================
// WHATSAPP CONNECTION
// ===============================

async function startWhatsApp() {
  if (reconnecting) {
    return;
  }

  reconnecting = true;

  try {
    console.log("🚀 Starting WhatsApp...");

    fs.mkdirSync(SESSION_DIR, {
      recursive: true,
    });

    const { state, saveCreds } =
      await useMultiFileAuthState(SESSION_DIR);

    const newSock = makeWASocket({
      auth: state,

      logger: pino({
        level: "silent",
      }),
      browser: Browsers.macOS("Chrome"),

      printQRInTerminal: false,

      markOnlineOnConnect: false,

      generateHighQualityLinkPreview: true,

      syncFullHistory: false,

      connectTimeoutMs: 60000,

      defaultQueryTimeoutMs: 60000,

      keepAliveIntervalMs: 10000,
    });

    sock = newSock;

    // Save credentials
    sock.ev.on("creds.update", saveCreds);

    // ===========================
    // CONNECTION UPDATE
    // ===========================

    sock.ev.on(
      "connection.update",
      async (update) => {
        const {
          connection,
          lastDisconnect,
        } = update;

        if (connection === "connecting") {
          connectionState = "connecting";

          console.log("🟡 WhatsApp connecting...");
        }

        if (connection === "open") {
          connectionState = "open";

          reconnecting = false;

          console.log(
            "✅ WhatsApp connected successfully!"
          );
        }

        if (connection === "close") {
          connectionState = "close";

          const statusCode =
            getStatusCode(lastDisconnect?.error);

          console.log(
            `❌ WhatsApp connection closed. Status: ${statusCode}`
          );

          sock = null;

          const loggedOut =
            statusCode === DisconnectReason.loggedOut ||
            statusCode === 401;

          if (loggedOut) {
            console.log(
              "🔴 WhatsApp session logged out."
            );

            try {
              fs.rmSync(SESSION_DIR, {
                recursive: true,
                force: true,
              });
            } catch {}

            reconnecting = false;

            return;
          }

          // Restart required / temporary disconnect
          if (
            statusCode ===
              DisconnectReason.restartRequired ||
            statusCode === 515 ||
            statusCode ===
              DisconnectReason.connectionClosed ||
            statusCode ===
              DisconnectReason.connectionLost
          ) {
            console.log(
              "🔄 Restarting WhatsApp socket..."
            );
          }

          reconnecting = false;

          await sleep(5000);

          startWhatsApp().catch((err) => {
            console.error(
              "Reconnect error:",
              err.message
            );
          });
        }
      }
    );
    // ===========================
    // BASIC MESSAGE HANDLER
    // ===========================

    sock.ev.on(
      "messages.upsert",
      async ({ messages }) => {
        try {
          const msg = messages?.[0];

          if (!msg) return;

          if (msg.key?.fromMe) return;

          const remoteJid = msg.key?.remoteJid;

          if (!remoteJid) return;

          const text =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            "";

          if (!text) return;

          console.log(
            `📩 WhatsApp message from ${remoteJid}: ${text}`
          );

          // Simple ping test
          if (
            text.toLowerCase() === ".ping"
          ) {
            await sock.sendMessage(remoteJid, {
              text: "🏓 PUTTUS BOT: pong!",
            });
          }
        } catch (error) {
          console.error(
            "Message error:",
            error.message
          );
        }
      }
    );

  } catch (error) {
    console.error(
      "WhatsApp start error:",
      error
    );

    sock = null;
    connectionState = "close";
    reconnecting = false;

    await sleep(5000);

    startWhatsApp().catch((err) => {
      console.error(
        "Retry error:",
        err.message
      );
    });
  }
}

// ===============================
// TELEGRAM ERROR HANDLER
// ===============================

bot.catch((error) => {
  console.error(
    "Telegram error:",
    error
  );
});

// ===============================
// START EVERYTHING
// ===============================

async function main() {
  try {
    console.log("");
    console.log("╭─────────────────────────╮");
    console.log("│     ⚡ PUTTUS BOT       │");
    console.log("│   Telegram Pair System  │");
    console.log("╰─────────────────────────╯");
    console.log("");

    // Start WhatsApp socket
    await startWhatsApp();

    // Start Telegram
    await bot.launch();

    console.log(
      "🤖 Telegram bot started successfully!"
    );

    console.log(
      "📱 Use /pair NUMBER in Telegram"
    );

  } catch (error) {
    console.error(
      "Fatal error:",
      error
    );

    process.exit(1);
  }
}

// ===============================
// GRACEFUL SHUTDOWN
// ===============================

process.once(
  "SIGINT",
  () => bot.stop("SIGINT")
);

process.once(
  "SIGTERM",
  () => bot.stop("SIGTERM")
);

main();
