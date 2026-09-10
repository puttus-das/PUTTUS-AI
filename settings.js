require("dotenv").config();

const settings = {
  prefixes: String(process.env.BOT_PREFIX || ".").split(",").map((x) => x.trim()).filter(Boolean),
  packname: process.env.PACKNAME || "PUTTUS-XD",
  author: process.env.AUTHOR || "puttus-das",
  timeZone: process.env.TIMEZONE || "Asia/Kolkata",
  botName: process.env.BOT_NAME || "PUTTUS-XD",
  botOwner: process.env.BOT_OWNER || "Puttus Das",
  ownerNumber: process.env.OWNER_NUMBER || "918967360566",
  menuImageUrl: process.env.MENU_IMAGE_URL || "",
  giphyApiKey: process.env.GIPHY_API_KEY || "",
  commandMode: process.env.COMMAND_MODE || "public",
  maxStoreMessages: Number(process.env.MAX_STORE_MESSAGES || 20),
  storeWriteInterval: Number(process.env.STORE_WRITE_INTERVAL || 10000),
  tempCleanupInterval: Number(process.env.TEMP_CLEANUP_INTERVAL || 3600000),
  description: process.env.BOT_DESCRIPTION || "Public multi-device WhatsApp bot.",
  version: process.env.BOT_VERSION || "6.0.0",
  channelLink: process.env.CHANNEL_LINK || "https://whatsapp.com/channel/0029Vb8RL4F1HspsNlYYOE3e",
  ownerContact: process.env.OWNER_CONTACT || "https://wa.me/918967360566",
  repositoryUrl: process.env.REPOSITORY_URL || "https://github.com/puttus-das/PUTTUS-AI",
  ytch: process.env.YOUTUBE_CHANNEL || "puttus-das",
  updateZipUrl: process.env.UPDATE_ZIP_URL || "https://github.com/puttus-das/PUTTUS-AI/archive/refs/heads/main.zip",
  mongoUrl: process.env.MONGO_URL || "",
  mongoDatabase: process.env.MONGO_DATABASE || "puttus_xd",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || process.env.TG_TOKEN || "",
  pairCooldownMs: Number(process.env.PAIR_COOLDOWN_MS || 60000),
};

module.exports = settings;
