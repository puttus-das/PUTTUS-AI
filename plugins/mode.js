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
    "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
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
          "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
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
          "❌ ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴏʀ sᴜᴅᴏ ᴜsᴇʀs ᴄᴀɴ ᴄʜᴀɴɢᴇ Pᴜᴛᴛᴜs-Bᴏᴛ ᴍᴏᴅᴇ!",
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

    const modeDescriptions = {
      public:
        "ᴇᴠᴇʀʏᴏɴᴇ ᴄᴀɴ ᴜsᴇ Pᴜᴛᴛᴜs-Bᴏᴛ (ɢʀᴏᴜᴘs + ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛs)",

      private:
        "ᴏɴʟʏ ᴏᴡɴᴇʀ ᴀɴᴅ sᴜᴅᴏ ᴜsᴇʀs ᴄᴀɴ ᴜsᴇ Pᴜᴛᴛᴜs-Bᴏᴛ",

      groups:
        "ᴏɴʟʏ ᴡᴏʀᴋs ɪɴ ɢʀᴏᴜᴘ ᴄʜᴀᴛs (ᴇᴠᴇʀʏᴏɴᴇ ɪɴ ɢʀᴏᴜᴘs)",

      inbox:
        "ᴏɴʟʏ ᴡᴏʀᴋs ɪɴ ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛs (ᴇᴠᴇʀʏᴏɴᴇ ɪɴ Dᴍs)",

      self:
        "ᴏᴡɴᴇʀ ᴀɴᴅ sᴜᴅᴏ ᴏɴʟʏ (sᴀᴍᴇ ᴀs ᴘʀɪᴠᴀᴛᴇ)",
    };

    let statusText =
      `📊 ʙᴏᴛ ᴍᴏᴅᴇ sᴛᴀᴛᴜs\n\n`;

    statusText +=
      `ᴄᴜʀʀᴇɴᴛ ᴍᴏᴅᴇ: ${modeEmojis[currentMode]} ${currentMode.toUpperCase()}\n`;

    statusText +=
      `ᴅᴇsᴄʀɪᴘᴛɪᴏɴ: ${modeDescriptions[currentMode]}\n\n`;

    statusText +=
      `━━━━━━━━━━━━━━━━━━━━\n\n`;

    statusText +=
      `ᴀᴠᴀɪʟᴀʙʟᴇ ᴍᴏᴅᴇs:\n\n`;

    Object.entries(modeDescriptions).forEach(
      ([mode, desc]) => {
        const current =
          mode === currentMode
            ? "✓ "
            : "";

        statusText +=
          `${current}${modeEmojis[mode]} "${mode.toUpperCase()}"\n`;

        statusText +=
          `${desc}\n\n`;
      },
    );

    statusText += `ᴜsᴀɢᴇ:\n`;

    statusText +=
      `• ".ᴍᴏᴅᴇ <ᴍᴏᴅᴇ>" - ᴄʜᴀɴɢᴇ ᴍᴏᴅᴇ\n`;

    statusText +=
      `• ".ᴍᴏᴅᴇ sᴛᴀᴛᴜs" - sʜᴏᴡ ᴄᴜʀʀᴇɴᴛ ᴍᴏᴅᴇ\n\n`;

    statusText += `ᴇxᴀᴍᴘʟᴇs:\n`;

    statusText +=
      `• ".ᴍᴏᴅᴇ ᴘᴜʙʟɪᴄ" - ᴇɴᴀʙʟᴇ ғᴏʀ ᴇᴠᴇʀʏᴏɴᴇ\n`;

    statusText +=
      `• ".ᴍᴏᴅᴇ ɢʀᴏᴜᴘs" - ɢʀᴏᴜᴘs ᴏɴʟʏ\n`;

    statusText +=
      `• ".ᴍᴏᴅᴇ ɪɴʙᴏx" - ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛs ᴏɴʟʏ\n`;

    statusText +=
      `• ".ᴍᴏᴅᴇ ᴘʀɪᴠᴀᴛᴇ" - ᴏᴡɴᴇʀ + sᴜᴅᴏ ᴏɴʟʏ`;

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
          `❌ ɪɴᴠᴀʟɪᴅ ᴍᴏᴅᴇ: "${subCommand}"\n\n` +
          `ᴠᴀʟɪᴅ ᴍᴏᴅᴇs: ${validModes.join(", ")}\n\n` +
          `ᴜsᴇ ".ᴍᴏᴅᴇ" ᴛᴏ sᴇᴇ ᴀʟʟ ᴀᴠᴀɪʟᴀʙʟᴇ ᴍᴏᴅᴇs.`,
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

  const modeMessages = {
    public:
      "ʙᴏᴛ ɪs ɴᴏᴡ ᴀᴄᴄᴇssɪʙʟᴇ ᴛᴏ *ᴇᴠᴇʀʏᴏɴᴇ* ɪɴ ɢʀᴏᴜᴘs ᴀɴᴅ ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛs.",

    private:
      "ʙᴏᴛ ɪs ɴᴏᴡ ʀᴇsᴛʀɪᴄᴛᴇᴅ ᴛᴏ *ᴏᴡɴᴇʀ ᴀɴᴅ sᴜᴅᴏ ᴜsᴇʀs ᴏɴʟʏ*.",

    groups:
      "ʙᴏᴛ ɴᴏᴡ ᴡᴏʀᴋs *ᴏɴʟʏ ɪɴ ɢʀᴏᴜᴘ ᴄʜᴀᴛs* (ᴀʟʟ ɢʀᴏᴜᴘ ᴍᴇᴍʙᴇʀs ᴄᴀɴ ᴜsᴇ ɪᴛ).",

    inbox:
      "ʙᴏᴛ ɴᴏᴡ ᴡᴏʀᴋs *ᴏɴʟʏ ɪɴ ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛs* (ᴀʟʟ ᴜsᴇʀs ᴄᴀɴ DM ᴛʜᴇ ʙᴏᴛ).",

    self:
      "ʙᴏᴛ ɪs ɴᴏᴡ ʀᴇsᴛʀɪᴄᴛᴇᴅ ᴛᴏ *ᴏᴡɴᴇʀ ᴀɴᴅ sᴜᴅᴏ ᴜsᴇʀs ᴏɴʟʏ*.",
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODE CHANGED RESPONSE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  await sock.sendMessage(
    chatId,
    {
      text:
        `${modeEmojis[subCommand]} ᴍᴏᴅᴇ ᴄʜᴀɴɢᴇᴅ ᴛᴏ ${subCommand.toUpperCase()}\n\n` +
        `${modeMessages[subCommand]}\n\n` +
        `_ᴜsᴇ ".ᴍᴏᴅᴇ sᴛᴀᴛᴜs" ᴛᴏ ᴄʜᴇᴄᴋ ᴄᴜʀʀᴇɴᴛ ᴍᴏᴅᴇ._`,
      ...channelInfo,
    },
    {
      quoted: statusQuote,
    },
  );
}

module.exports = {
  command: "mode",
  aliases: ["botmode", "setmode"],
  category: "owner",

  description:
    "Advanced bot access control - Set who can use the bot and where",

  usage:
    ".mode [public|private|groups|inbox|self|status]",

  ownerOnly: true,

  handler: modeCommand,
};
