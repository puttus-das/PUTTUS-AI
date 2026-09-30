const store = require("../lib/lightweight_store");

/**
 * Advanced bot mode system
 *
 * Modes:
 * - public  : Everyone can use
 * - private : Owner/sudo only
 * - groups  : Groups only
 * - inbox   : Private chats only
 * - self    : Owner/sudo only
 */

async function modeCommand(sock, message, args, context) {
  const { chatId, channelInfo } = context;

  // ━━━━━ PUTTUS VCARD ━━━━━
  const botJid = "919641092392@s.whatsapp.net";

  const vcard =
    "BEGIN:VCARD\n" +
    "VERSION:3.0\n" +
    "N:PUTTUS;BOT;;;\n" +
    "FN:🌸•𝐏ᴜᴛᴜᴛᴜꜱ•⌲\n" +
    "ORG:PUTTUS BOT\n" +
    "TEL;TYPE=CELL;TYPE=VOICE;waid=919641092392:+919641092392\n" +
    "END:VCARD";

  // ━━━━━ STATUS-STYLE CONTACT PREVIEW ━━━━━
  const statusQuote = {
    key: {
      remoteJid: "status@broadcast",
      fromMe: false,
      id: "PUTTUS-" + Date.now(),
      participant: botJid,
    },

    message: {
      contactMessage: {
        displayName:
          "⎯꯭̽ꪹ𝐏ᴜᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
        vcard: vcard,
      },
    },
  };

  // ━━━━━ OWNER / SUDO CHECK ━━━━━
  const isOwnerOrSudoCheck =
    message.key.fromMe ||
    context.senderIsOwnerOrSudo ||
    context.isOwnerOrSudoCheck;

  if (!isOwnerOrSudoCheck) {
    return await sock.sendMessage(
      chatId,
      {
        text:
          "❌ ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴏʀ sᴜᴅᴏ ᴜsᴇʀs ᴄᴀɴ ᴄʜᴀɴɢᴇ Pᴜᴛᴜs-Bᴏᴛ ᴍᴏᴅᴇ!",
        ...channelInfo,
      },
      {
        quoted: statusQuote,
      },
    );
  }

  const subCommand =
    args[0]?.toLowerCase();

  const currentMode =
    (await store.getBotMode()) || "public";

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODE STATUS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (
    !subCommand ||
    subCommand === "status" ||
    subCommand === "check"
  ) {
    const modeEmojis = {
      public: "🌍",
      private: "🔒",
      groups: "👥",
      inbox: "💬",
      self: "👤",
    };

    const currentEmoji =
      modeEmojis[currentMode] || "🌍";

    const statusText =
      `📊 *ᴍᴏᴅᴇ sᴛᴀᴛᴜs*\n\n` +
      `*ᴄᴜʀʀᴇɴᴛ:* ${currentEmoji} *${currentMode}*\n\n` +
      `⟢ *ᴍᴏᴅᴇs*\n` +
      `› 🌍 *ᴘᴜʙʟɪᴄ* — ᴇᴠᴇʀʏᴏɴᴇ\n` +
      `› 🔒 *ᴘʀɪᴠᴀᴛᴇ* — ᴏᴡɴᴇʀ + sᴜᴅᴏ\n` +
      `› 👥 *ɢʀᴏᴜᴘs* — ɢʀᴏᴜᴘs\n` +
      `› 💬 *ɪɴʙᴏx* — ᴅᴍs\n` +
      `› 👤 *sᴇʟғ* — ᴏᴡɴᴇʀ + sᴜᴅᴏ\n\n` +
      `⌁ *ᴜsᴀɢᴇ:* *.ᴍᴏᴅᴇ <ᴍᴏᴅᴇ>*`;

    return await sock.sendMessage(
      chatId,
      {
        text: statusText,
        ...channelInfo,
      },
      {
        quoted: statusQuote,
      },
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VALID MODES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const validModes = [
    "public",
    "private",
    "groups",
    "inbox",
    "self",
  ];

  if (!validModes.includes(subCommand)) {
    return await sock.sendMessage(
      chatId,
      {
        text:
          `❌ *ɪɴᴠᴀʟɪᴅ ᴍᴏᴅᴇ*\n\n` +
          `⟢ *ᴠᴀʟɪᴅ ᴍᴏᴅᴇs*\n` +
          `› 🌍 *ᴘᴜʙʟɪᴄ*\n` +
          `› 🔒 *ᴘʀɪᴠᴀᴛᴇ*\n` +
          `› 👥 *ɢʀᴏᴜᴘs*\n` +
          `› 💬 *ɪɴʙᴏx*\n` +
          `› 👤 *sᴇʟғ*\n\n` +
          `⌁ *ᴜsᴀɢᴇ:* *.ᴍᴏᴅᴇ <ᴍᴏᴅᴇ>*`,
        ...channelInfo,
      },
      {
        quoted: statusQuote,
      },
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SAVE MODE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  await store.setBotMode(subCommand);

  const modeEmojis = {
    public: "🌍",
    private: "🔒",
    groups: "👥",
    inbox: "💬",
    self: "👤",
  };

  const modeNames = {
    public: "ᴘᴜʙʟɪᴄ",
    private: "ᴘʀɪᴠᴀᴛᴇ",
    groups: "ɢʀᴏᴜᴘs",
    inbox: "ɪɴʙᴏx",
    self: "sᴇʟғ",
  };

  const modeDescriptions = {
    public:
      "ᴇᴠᴇʀʏᴏɴᴇ ᴄᴀɴ ᴜsᴇ",

    private:
      "ᴏᴡɴᴇʀ + sᴜᴅᴏ ᴏɴʟʏ",

    groups:
      "ɢʀᴏᴜᴘs ᴏɴʟʏ",

    inbox:
      "ᴅᴍs ᴏɴʟʏ",

    self:
      "ᴏᴡɴᴇʀ + sᴜᴅᴏ ᴏɴʟʏ",
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODE CHANGED RESPONSE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const changedText =
    `${modeEmojis[subCommand]} *ᴍᴏᴅᴇ ᴄʜᴀɴɢᴇᴅ*\n\n` +
    `*ᴄᴜʀʀᴇɴᴛ:* ${modeEmojis[subCommand]} *${modeNames[subCommand]}*\n` +
    `⟢ *${modeDescriptions[subCommand]}*\n\n` +
    `⌁ *ᴜsᴇ:* *.ᴍᴏᴅᴇ sᴛᴀᴛᴜs*`;

  return await sock.sendMessage(
    chatId,
    {
      text: changedText,
      ...channelInfo,
    },
    {
      quoted: statusQuote,
    },
  );
}

module.exports = {
  command: "mode",

  aliases: [
    "botmode",
    "setmode",
  ],

  category: "owner",

  description:
    "Advanced bot access control - Set who can use the bot and where",

  usage:
    ".mode [public|private|groups|inbox|self|status]",

  ownerOnly: true,

  handler: modeCommand,
};
