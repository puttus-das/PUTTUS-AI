require("dotenv").config();

const settings = {
  // =========================
  // Bot identity
  // =========================
  botName: process.env.BOT_NAME || "PUTTUS-XD",
  botOwner: process.env.BOT_OWNER || "Puttus Das",
  ownerNumber: process.env.OWNER_NUMBER || "918967360566",

  // =========================
  // Prefix configuration
  // =========================
  // Example Heroku Config Var:
  // BOT_PREFIX=.
  prefixes: String(process.env.BOT_PREFIX || ".")
    .split(",")
    .map((prefix) => prefix.trim())
    .filter(Boolean),

  // =========================
  // Bot appearance
  // =========================
  packname: process.env.PACKNAME || "PUTTUS-XD",
  author: process.env.AUTHOR || "puttus-das",
  menuImageUrl: process.env.MENU_IMAGE_URL || "",

  // =========================
  // Time and general settings
  // =========================
  timeZone: process.env.TIMEZONE || "Asia/Kolkata",
  commandMode: process.env.COMMAND_MODE || "public",
  description:
    process.env.BOT_DESCRIPTION ||
    "This is a bot for managing group commands and automating tasks.",
  version: process.env.BOT_VERSION || "6.0.0",

  // =========================
  // Storage settings
  // =========================
  maxStoreMessages: Number(process.env.MAX_STORE_MESSAGES || 20),
  storeWriteInterval: Number(process.env.STORE_WRITE_INTERVAL || 10000),
  tempCleanupInterval: Number(
    process.env.TEMP_CLEANUP_INTERVAL || 60 * 60 * 1000,
  ),

  // =========================
  // External API settings
  // =========================
  giphyApiKey: process.env.GIPHY_API_KEY || "",

  // =========================
  // Links
  // =========================
  channelLink:
    process.env.CHANNEL_LINK ||
    "https://whatsapp.com/channel/0029Vb8RL4F1HspsNlYYOE3e",

  ownerContact:
    process.env.OWNER_CONTACT || "https://wa.me/918967360566",

  repositoryUrl:
    process.env.REPOSITORY_URL ||
    "https://github.com/puttus-das/PUTTUS-AI",

  // =========================
  // YouTube channel
  // =========================
  ytch: process.env.YOUTUBE_CHANNEL || "puttus-das",

  // =========================
  // Bot update ZIP
  // =========================
  updateZipUrl:
    process.env.UPDATE_ZIP_URL ||
    "https://github.com/puttus-das/PUTTUS-AI/archive/refs/heads/main.zip",

  // =========================
  // Multi-device settings
  // =========================
  multiDevice: true,

  sessionStorage: "mongodb",

  maxSessionsPerUser: Number(process.env.MAX_SESSIONS_PER_USER || 1),

  pairCooldownMs: Number(process.env.PAIR_COOLDOWN_MS || 60000),

  // =========================
  // MongoDB
  // =========================
  mongoUrl: process.env.MONGO_URL || "",

  mongoDatabase:
    process.env.MONGO_DATABASE || "puttus_xd",

  // =========================
  // Telegram
  // =========================
  telegramBotToken:
    process.env.TELEGRAM_BOT_TOKEN || process.env.TG_TOKEN || "",

  // =========================
  // Heroku / HTTP server
  // =========================
  port: Number(process.env.PORT || 5000),
};

module.exports = settings;
