const store = require("../lib/lightweight_store");
const isOwnerOrSudo = require("../lib/isOwner");
const isAdmin = require("../lib/isAdmin");

// ═══════════════════════════════════════
// 💜 PUTTUS-BOT VCard
// ═══════════════════════════════════════

const vcard =
'BEGIN:VCARD\n' +
'VERSION:3.0\n' +
'FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n' +
'ORG:PUTTUS BOT;\n' +
'TEL;type=CELL;type=VOICE;waid=918967360566:+91 8967360566\n' +
'END:VCARD';

const vcardReply = {
key: {
fromMe: false,
participant: '918967360566@s.whatsapp.net',
remoteJid: 'status@broadcast'
},
message: {
contactMessage: {
displayName: '⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜',
vcard
}
}
};

// ═══════════════════════════════════════
// 🔗 ANTILINK SETTINGS
// ═══════════════════════════════════════

async function setAntilink(chatId, type, action) {
try {
await store.saveSetting(chatId, "antilink", {
enabled: true,
action: action,
type: type,
});
return true;
} catch (error) {
console.error("Error setting antilink:", error);
return false;
}
}

async function getAntilink(chatId, type) {
try {
const settings = await store.getSetting(chatId, "antilink");
return settings || null;
} catch (error) {
console.error("Error getting antilink:", error);
return null;
}
}

async function removeAntilink(chatId, type) {
try {
await store.saveSetting(chatId, "antilink", {
enabled: false,
action: null,
type: null,
});
return true;
} catch (error) {
console.error("Error removing antilink:", error);
return false;
}
}

// ═══════════════════════════════════════
// 🔍 LINK DETECTION
// ═══════════════════════════════════════

async function handleLinkDetection(
sock,
chatId,
message,
userMessage,
senderId,
) {
try {
const config = await getAntilink(chatId, "on");
if (!config?.enabled) return;

// 👑 Owner / Sudo Exempt
const isOwnerSudo = await isOwnerOrSudo(senderId, sock, chatId);
if (isOwnerSudo) return;

// 🛡️ Admin Exempt
try {
  const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
  if (isSenderAdmin) return;
} catch (e) {}

const action = config.action || "delete";

let shouldAct = false;
let linkType = "";

const linkPatterns = {
  whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i,
  whatsappChannel: /wa\.me\/channel\/[A-Za-z0-9]{20,}/i,
  telegram: /t\.me\/[A-Za-z0-9_]+/i,
  allLinks:
    /https?:\/\/\S+|www\.\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i,
};

if (linkPatterns.whatsappGroup.test(userMessage)) {
  shouldAct = true;
  linkType = "WhatsApp Group";
} else if (linkPatterns.whatsappChannel.test(userMessage)) {
  shouldAct = true;
  linkType = "WhatsApp Channel";
} else if (linkPatterns.telegram.test(userMessage)) {
  shouldAct = true;
  linkType = "Telegram";
} else if (linkPatterns.allLinks.test(userMessage)) {
  shouldAct = true;
  linkType = "Link";
}

if (!shouldAct) return;

const messageId = message.key.id;
const participant = message.key.participant || senderId;

// ═══════════════════════════════════════
// 🗑️ DELETE MESSAGE
// ═══════════════════════════════════════

if (action === "delete" || action === "kick") {
  try {
    await sock.sendMessage(chatId, {
      delete: {
        remoteJid: chatId,
        fromMe: false,
        id: messageId,
        participant: participant,
      },
    });
  } catch (error) {
    console.error("Failed to delete message:", error);
  }
}

// ═══════════════════════════════════════
// ⚠️ WARNING + VCARD
// ═══════════════════════════════════════

if (action === "warn" || action === "delete") {
  await sock.sendMessage(
    chatId,
    {
      text:
        `╭─〔 🔗 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕─╮\n` +
        `│\n` +
        `│ ⚠️ 𝐀ɴᴛɪʟɪɴᴋ 𝐖ᴀʀɴɪɴɢ\n` +
        `│\n` +
        `│ 👤 @${senderId.split("@")[0]}\n` +
        `│ 🚫 𝐋ɪɴᴋ 𝐓ʏᴘᴇ : ${linkType}\n` +
        `│\n` +
        `│ ❌ 𝐋ɪɴᴋs ᴀʀᴇ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ!\n` +
        `│\n` +
        `╰─〔 💜 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕─╯`,
      mentions: [senderId],
    },
    { quoted: vcardReply },
  );
}

// ═══════════════════════════════════════
// 🚫 KICK USER
// ═══════════════════════════════════════

if (action === "kick") {
  try {
    await sock.groupParticipantsUpdate(
      chatId,
      [senderId],
      "remove",
    );

    await sock.sendMessage(
      chatId,
      {
        text:
          `╭─〔 🚫 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕─╮\n` +
          `│\n` +
          `│ 👤 @${senderId.split("@")[0]}\n` +
          `│ ⚠️ 𝐋ɪɴᴋ 𝐏ᴏsᴛɪɴɢ 𝐃ᴇᴛᴇᴄᴛᴇᴅ\n` +
          `│ 🚫 𝐀ᴄᴛɪᴏɴ : 𝐑ᴇᴍᴏᴠᴇᴅ\n` +
          `│ 🔗 ${linkType}\n` +
          `│\n` +
          `╰─〔 💜 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕─╯`,
        mentions: [senderId],
      },
      { quoted: vcardReply },
    );
  } catch (error) {
    console.error("Failed to kick user:", error);

    await sock.sendMessage(
      chatId,
      {
        text:
          `╭─〔 ⚠️ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕─╮\n` +
          `│\n` +
          `│ ❌ 𝐅ᴀɪʟᴇᴅ ᴛᴏ ʀᴇᴍᴏᴠᴇ ᴜsᴇʀ.\n` +
          `│\n` +
          `│ 🛡️ 𝐌ᴀᴋᴇ sᴜʀᴇ 𝐈'ᴍ ᴀɴ ᴀᴅᴍɪɴ.\n` +
          `│\n` +
          `╰─〔 💜 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕─╯`,
      },
      { quoted: vcardReply },
    );
  }
}

} catch (error) {
console.error("Error in link detection:", error);
}
}

// ═══════════════════════════════════════
// 🔗 ANTILINK COMMAND
// ═══════════════════════════════════════

module.exports = {
command: "antilink",
aliases: ["alink", "linkblock"],
category: "admin",
description: "Prevent users from sending links in the group",
usage: ".antilink <on|off|set>",
groupOnly: true,
adminOnly: true,

async handler(sock, message, args, context = {}) {
const chatId =
context.chatId || message.key.remoteJid;

const action = args[0]?.toLowerCase();

// ═══════════════════════════════════════
// 📖 HELP
// ═══════════════════════════════════════

if (!action) {
  const config = await getAntilink(chatId, "on");

  await sock.sendMessage(
    chatId,
    {
      text:
        `╭─〔 🔗 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕─╮\n` +
        `│\n` +
        `│       𝐀ɴᴛɪʟɪɴᴋ 𝐒ᴇᴛᴜᴘ\n` +
        `│\n` +
        `│ 𝐒ᴛᴀᴛᴜs : ${config?.enabled ? "✅ 𝐄ɴᴀʙʟᴇᴅ" : "❌ 𝐃ɪsᴀʙʟᴇᴅ"}\n` +
        `│ 𝐀ᴄᴛɪᴏɴ : ${config?.action || "𝐍ᴏᴛ sᴇᴛ"}\n` +
        `│\n` +
        `│ ✦ .antilink on\n` +
        `│ ✦ .antilink off\n` +
        `│ ✦ .antilink set delete\n` +
        `│ ✦ .antilink set kick\n` +
        `│ ✦ .antilink set warn\n` +
        `│ ✦ .antilink status\n` +
        `│\n` +
        `│ 🔗 𝐏ʀᴏᴛᴇᴄᴛᴇᴅ 𝐋ɪɴᴋs\n` +
        `│ • WhatsApp Groups\n` +
        `│ • WhatsApp Channels\n` +
        `│ • Telegram\n` +
        `│ • All other links\n` +
        `│\n` +
        `│ 🛡️ 𝐄xᴇᴍᴘᴛ : Admins\n` +
        `│ 👑 Owner / Sudo\n` +
        `│\n` +
        `╰─〔 💜 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕─╯`,
    },
    { quoted: vcardReply },
  );

  return;
}

// ═══════════════════════════════════════
// ✅ ON
// ═══════════════════════════════════════

switch (action) {
  case "on": {
    const existingConfig =
      await getAntilink(chatId, "on");

    if (existingConfig?.enabled) {
      await sock.sendMessage(
        chatId,
        {
          text:
            `⚠️ *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*\n\n` +
            `𝐀ɴᴛɪʟɪɴᴋ ɪs ᴀʟʀᴇᴀᴅʏ 𝐄ɴᴀʙʟᴇᴅ.`,
        },
        { quoted: vcardReply },
      );
      return;
    }

    const result =
      await setAntilink(chatId, "on", "delete");

    await sock.sendMessage(
      chatId,
      {
        text: result
          ? `╭─〔 💜 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕─╮\n` +
            `│\n` +
            `│ ✅ 𝐀ɴᴛɪʟɪɴᴋ 𝐄ɴᴀʙʟᴇᴅ\n` +
            `│\n` +
            `│ 🗑️ 𝐃ᴇғᴀᴜʟᴛ : 𝐃ᴇʟᴇᴛᴇ\n` +
            `│ 🛡️ 𝐄xᴇᴍᴘᴛ : Admins\n` +
            `│ 👑 Owner / Sudo\n` +
            `│\n` +
            `╰─〔 🔗 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕─╯`
          : `❌ 𝐅ᴀɪʟᴇᴅ ᴛᴏ ᴇɴᴀʙʟᴇ 𝐀ɴᴛɪʟɪɴᴋ.`,
      },
      { quoted: vcardReply },
    );

    break;
  }

  // ═══════════════════════════════════════
  // ❌ OFF
  // ═══════════════════════════════════════

  case "off": {
    await removeAntilink(chatId, "on");

    await sock.sendMessage(
      chatId,
      {
        text:
          `╭─〔 💜 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕─╮\n` +
          `│\n` +
          `│ ❌ 𝐀ɴᴛɪʟɪɴᴋ 𝐃ɪsᴀʙʟᴇᴅ\n` +
          `│\n` +
          `│ 🔗 Users can now send links.\n` +
          `│\n` +
          `╰─〔 🔗 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕─╯`,
      },
      { quoted: vcardReply },
    );

    break;
  }

  // ═══════════════════════════════════════
  // ⚙️ SET ACTION
  // ═══════════════════════════════════════

  case "set": {
    if (args.length < 2) {
      await sock.sendMessage(
        chatId,
        {
          text:
            `❌ 𝐀ᴄᴛɪᴏɴ ᴍɪssɪɴɢ\n\n` +
            `✦ .antilink set delete\n` +
            `✦ .antilink set kick\n` +
            `✦ .antilink set warn`,
        },
        { quoted: vcardReply },
      );
      return;
    }

    const setAction =
      args[1].toLowerCase();

    if (
      !["delete", "kick", "warn"].includes(
        setAction,
      )
    ) {
      await sock.sendMessage(
        chatId,
        {
          text:
            `❌ 𝐈ɴᴠᴀʟɪᴅ 𝐀ᴄᴛɪᴏɴ\n\n` +
            `𝐂ʜᴏᴏsᴇ : delete | kick | warn`,
        },
        { quoted: vcardReply },
      );
      return;
    }

    const setResult =
      await setAntilink(
        chatId,
        "on",
        setAction,
      );

    const actionDescriptions = {
      delete:
        "𝐃ᴇʟᴇᴛᴇ ʟɪɴᴋ ᴍᴇssᴀɢᴇs + 𝐖ᴀʀɴ",
      kick:
        "𝐃ᴇʟᴇᴛᴇ ᴍᴇssᴀɢᴇs + 𝐑ᴇᴍᴏᴠᴇ ᴜsᴇʀ",
      warn:
        "𝐎ɴʟʏ sᴇɴᴅ 𝐖ᴀʀɴɪɴɢ",
    };

    await sock.sendMessage(
      chatId,
      {
        text: setResult
          ? `╭─〔 ⚙️ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕─╮\n` +
            `│\n` +
            `│ ✅ 𝐀ᴄᴛɪᴏɴ 𝐔ᴩᴅᴀᴛᴇᴅ\n` +
            `│\n` +
            `│ 🔧 𝐀ᴄᴛɪᴏɴ : ${setAction}\n` +
            `│ 📌 ${actionDescriptions[setAction]}\n` +
            `│\n` +
            `╰─〔 💜 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕─╯`
          : `❌ 𝐅ᴀɪʟᴇᴅ ᴛᴏ sᴇᴛ 𝐀ᴄᴛɪᴏɴ.`,
      },
      { quoted: vcardReply },
    );

    break;
  }

  // ═══════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════

  case "status":
  case "get": {
    const status =
      await getAntilink(chatId, "on");

    let actionInfo = "• 𝐍ᴏ ᴀᴄᴛɪᴏɴ sᴇᴛ";

    if (status?.action === "delete") {
      actionInfo =
        "• 𝐌ᴇssᴀɢᴇ ᴅᴇʟᴇᴛᴇᴅ\n" +
        "• 𝐔sᴇʀ ᴡᴀʀɴᴇᴅ";
    } else if (status?.action === "kick") {
      actionInfo =
        "• 𝐌ᴇssᴀɢᴇ ᴅᴇʟᴇᴛᴇᴅ\n" +
        "• 𝐔sᴇʀ ʀᴇᴍᴏᴠᴇᴅ";
    } else if (status?.action === "warn") {
      actionInfo =
        "• 𝐔sᴇʀ ᴡᴀʀɴᴇᴅ\n" +
        "• 𝐌ᴇssᴀɢᴇ sᴛᴀʏs";
    }

    await sock.sendMessage(
      chatId,
      {
        text:
          `╭─〔 🔗 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕─╮\n` +
          `│\n` +
          `│       𝐀ɴᴛɪʟɪɴᴋ 𝐒ᴛᴀᴛᴜs\n` +
          `│\n` +
          `│ 𝐒ᴛᴀᴛᴜs : ${status?.enabled ? "✅ 𝐄ɴᴀʙʟᴇᴅ" : "❌ 𝐃ɪsᴀʙʟᴇᴅ"}\n` +
          `│ 𝐀ᴄᴛɪᴏɴ : ${status?.action || "𝐍ᴏᴛ sᴇᴛ"}\n` +
          `│\n` +
          `│ 𝐖ʜᴇɴ ʟɪɴᴋ ɪs ᴅᴇᴛᴇᴄᴛᴇᴅ :\n` +
          `│ ${actionInfo.replace(/\n/g, "\n│ ")}\n` +
          `│\n` +
          `│ 🛡️ 𝐄xᴇᴍᴘᴛ : Admins\n` +
          `│ 👑 Owner / Sudo\n` +
          `│\n` +
          `╰─〔 💜 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ 〕─╯`,
      },
      { quoted: vcardReply },
    );

    break;
  }

  // ═══════════════════════════════════════
  // ❌ INVALID
  // ═══════════════════════════════════════

  default: {
    await sock.sendMessage(
      chatId,
      {
        text:
          `❌ 𝐈ɴᴠᴀʟɪᴅ 𝐂ᴏᴍᴍᴀɴᴅ\n\n` +
          `✦ 𝐔sᴇ : .antilink\n` +
          `✦ 𝐄xᴀᴍᴘʟᴇ : .antilink on`,
      },
      { quoted: vcardReply },
    );
  }
}

},

handleLinkDetection,
setAntilink,
getAntilink,
removeAntilink,
};
