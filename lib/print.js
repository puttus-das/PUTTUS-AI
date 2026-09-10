const PhoneNumber = require("awesome-phonenumber");
const settings = require("../settings");

function extractPhoneNumber(jid) {
  if (!jid) {
    return null;
  }

  return String(jid)
    .replace("@s.whatsapp.net", "")
    .replace("@lid", "")
    .replace("@g.us", "")
    .split(":")[0];
}

function getInternationalNumber(number) {
  try {
    if (!number) {
      return "";
    }

    const phone = PhoneNumber(`+${number}`);

    if (phone.isValid()) {
      return phone.getNumber("international");
    }

    return number;
  } catch {
    return number || "";
  }
}

async function getNameWithFallback(
  jid,
  sock,
  pushName,
) {
  try {
    if (pushName && String(pushName).trim()) {
      return String(pushName).trim();
    }

    const contact = sock?.store?.contacts?.[jid];

    if (contact?.name || contact?.notify) {
      return contact.name || contact.notify;
    }

    const phone = extractPhoneNumber(jid);

    if (phone && phone.length >= 10) {
      return getInternationalNumber(phone);
    }

    return String(jid || "")
      .split("@")[0]
      .split(":")[0];
  } catch {
    return String(jid || "")
      .split("@")[0]
      .split(":")[0];
  }
}

function getMessageText(message, messageType) {
  if (!message) {
    return "";
  }

  if (messageType === "conversation") {
    return message.conversation || "";
  }

  if (messageType === "extendedTextMessage") {
    return message.extendedTextMessage?.text || "";
  }

  if (messageType === "imageMessage") {
    return message.imageMessage?.caption || "[Image]";
  }

  if (messageType === "videoMessage") {
    return message.videoMessage?.caption || "[Video]";
  }

  if (messageType === "audioMessage") {
    const seconds =
      message.audioMessage?.seconds || 0;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = String(
      seconds % 60,
    ).padStart(2, "0");

    return `[Audio ${minutes}:${remainingSeconds}]`;
  }

  if (messageType === "documentMessage") {
    const fileName =
      message.documentMessage?.fileName ||
      "Document";

    return `[Document: ${fileName}]`;
  }

  if (messageType === "stickerMessage") {
    return "[Sticker]";
  }

  if (messageType === "contactMessage") {
    return (
      `[Contact: ` +
      `${message.contactMessage?.displayName || "Contact"}]`
    );
  }

  if (messageType === "locationMessage") {
    return "[Location]";
  }

  return `[${String(messageType || "Message").replace(
    "Message",
    "",
  )}]`;
}

function getTimestamp(message) {
  try {
    const value = message?.messageTimestamp;

    if (!value) {
      return new Date();
    }

    const seconds =
      typeof value === "object"
        ? value.low || value.toNumber?.() || 0
        : value;

    return new Date(Number(seconds) * 1000);
  } catch {
    return new Date();
  }
}

async function printMessage(message, sock) {
  try {
    if (!message?.key) {
      return;
    }

    const chatId = message.key.remoteJid || "";
    const senderId =
      message.key.participant || chatId;

    const isGroup = chatId.endsWith("@g.us");
    const fromMe = Boolean(message.key.fromMe);

    let senderName = "";
    let senderPhone = "";

    if (fromMe) {
      senderName = sock?.user?.name || "Bot";

      const botNumber = extractPhoneNumber(
        sock?.user?.id || sock?.user?.jid,
      );

      senderPhone = getInternationalNumber(
        botNumber,
      );
    } else {
      senderName = await getNameWithFallback(
        senderId,
        sock,
        message.pushName,
      );

      const phone = extractPhoneNumber(senderId);

      senderPhone = getInternationalNumber(
        phone,
      );
    }

    let groupName = "";

    if (isGroup && sock?.groupMetadata) {
      try {
        const metadata =
          await sock.groupMetadata(chatId);

        groupName = metadata?.subject || "";
      } catch {
        groupName = "";
      }
    }

    const messageType = Object.keys(
      message.message || {},
    )[0];

    if (
      messageType === "senderKeyDistributionMessage" ||
      messageType === "protocolMessage" ||
      messageType === "reactionMessage"
    ) {
      return;
    }

    const messageText = getMessageText(
      message.message,
      messageType,
    );

    const timestamp = getTimestamp(message);

    const timeText = timestamp.toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone:
          settings.timeZone || "Asia/Kolkata",
      },
    );

    const senderText =
      senderName && senderPhone
        ? `${senderName} (${senderPhone})`
        : senderName || senderPhone || senderId;

    console.log("");
    console.log(
      "----------------------------------------",
    );
    console.log(
      `[${timeText}] ${fromMe ? "OUTGOING" : "INCOMING"}`,
    );
    console.log(`Type: ${messageType || "unknown"}`);
    console.log(`From: ${senderText}`);

    if (isGroup) {
      console.log(
        `Group: ${groupName || chatId}`,
      );
    } else {
      console.log("Chat: Private");
    }

    if (messageText) {
      const maxLength = 200;

      const text =
        messageText.length > maxLength
          ? `${messageText.slice(0, maxLength)}...`
          : messageText;

      console.log(`Message: ${text}`);
    }

    console.log(
      "----------------------------------------",
    );
    console.log("");
  } catch (error) {
    console.log(
      "Message logging error:",
      error.message,
    );
  }
}

function printLog(type, message) {
  const timestamp = new Date().toLocaleTimeString(
    "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone:
        settings.timeZone || "Asia/Kolkata",
    },
  );

  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
    connection: "🔌",
    store: "🗄️",
  };

  const icon = icons[type] || "•";

  console.log(
    `[${timestamp}] ${icon} ${message}`,
  );
}

module.exports = {
  printMessage,
  printLog,
};
      
