const settings = {
  prefixes: [process.env.BOT_PREFIX || "."],
  botName: process.env.BOT_NAME || "PUTTUS-XD",
  menuImageUrl: process.env.MENU_IMAGE_URL || "",
  botOwner: process.env.BOT_OWNER || "Puttus Das",
  ownerNumber: process.env.OWNER_NUMBER || "",
  timeZone: "Asia/Kolkata",
  commandMode: "public",
  maxStoreMessages: 20,
  storeWriteInterval: 10000,
  version: "6.0.0",
  channelLink:
    process.env.CHANNEL_LINK ||
    "https://whatsapp.com/channel/0029Vb7pmbEEwEjzdGSM4G3B",
};

module.exports = settings;
