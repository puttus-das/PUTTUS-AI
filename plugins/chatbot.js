const fs = require("fs");
const path = require("path");
const store = require("../lib/lightweight_store");

const USER_GROUP_DATA = path.join(
  __dirname,
  "../data/userGroupData.json",
);

const HAS_DB = Boolean(
  process.env.MONGO_URL ||
    process.env.POSTGRES_URL ||
    process.env.MYSQL_URL ||
    process.env.DB_URL,
);

const chatMemory = {
  messages: new Map(),
  userInfo: new Map(),
};

const API_ENDPOINTS = [
  {
    name: "ZellAPI",
    url: (text) =>
      `https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(text)}`,
    parse: (data) => data?.result,
  },
  {
    name: "Hercai",
    url: (text) =>
      `https://hercai.onrender.com/gemini/hercai?question=${encodeURIComponent(text)}`,
    parse: (data) => data?.reply,
  },
  {
    name: "SparkAPI",
    url: (text) =>
      `https://discardapi.dpdns.org/api/chat/spark?apikey=guru&text=${encodeURIComponent(text)}`,
    parse: (data) => data?.result?.answer,
  },
  {
    name: "LlamaAPI",
    url: (text) =>
      `https://discardapi.dpdns.org/api/bot/llama?apikey=guru&text=${encodeURIComponent(text)}`,
    parse: (data) => data?.result,
  },
];

function emptyData() {
  return {
    groups: [],
    chatbot: {},
  };
}

async function loadUserGroupData() {
  try {
    if (HAS_DB) {
      const data = await store.getSetting(
        "global",
        "userGroupData",
      );

      return data || emptyData();
    }

    if (!fs.existsSync(USER_GROUP_DATA)) {
      return emptyData();
    }

    const content = fs.readFileSync(
      USER_GROUP_DATA,
      "utf8",
    );

    return {
      ...emptyData(),
      ...JSON.parse(content),
    };
  } catch (error) {
    console.error(
      "User group data read error:",
      error.message,
    );

    return emptyData();
  }
}

async function saveUserGroupData(data) {
  try {
    if (HAS_DB) {
      await store.saveSetting(
        "global",
        "userGroupData",
        data,
      );

      return;
    }

    const dataDirectory = path.dirname(
      USER_GROUP_DATA,
    );

    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory, {
        recursive: true,
      });
    }

    fs.writeFileSync(
      USER_GROUP_DATA,
      JSON.stringify(data, null, 2),
      "utf8",
    );
  } catch (error) {
    console.error(
      "User group data write error:",
      error.message,
    );
  }
}

function getRandomDelay() {
  return Math.floor(Math.random() * 1500) + 500;
}

async function showTyping(sock, chatId) {
  try {
    if (sock.presenceSubscribe) {
      await sock.presenceSubscribe(chatId);
    }

    if (sock.sendPresenceUpdate) {
      await sock.sendPresenceUpdate(
        "composing",
        chatId,
      );
    }

    await new Promise((resolve) => {
      setTimeout(resolve, getRandomDelay());
    });
  } catch (error) {
    console.error(
      "Typing indicator error:",
      error.message,
    );
  }
}

function extractUserInfo(message) {
  const text = String(message || "");
  const lower = text.toLowerCase();
  const info = {};

  if (lower.includes("my name is")) {
    info.name = text
      .split(/my name is/i)[1]
      ?.trim()
      .split(/\s+/)[0];
  }

  if (
    lower.includes("i am") &&
    lower.includes("years old")
  ) {
    info.age = text.match(/\d+/)?.[0];
  }

  if (
    lower.includes("i live in") ||
    lower.includes("i am from")
  ) {
    info.location = text
      .split(/(?:i live in|i am from)/i)[1]
      ?.trim()
      .split(/[.,!?]/)[0];
  }

  return info;
}

function getBotNumbers(sock) {
  const userId = sock?.user?.id || "";
  const botNumber = userId
    .split(":")[0]
    .split("@")[0];

  const botLid = sock?.user?.lid || "";

  return {
    botNumber,
    botJids: [
      userId,
      `${botNumber}@s.whatsapp.net`,
      `${botNumber}@whatsapp.net`,
      `${botNumber}@lid`,
      botLid,
      botLid
        ? `${botLid.split(":")[0]}@lid`
        : "",
    ].filter(Boolean),
  };
}

function wasBotMentioned(
  message,
  userMessage,
  sock,
) {
  const {
    botNumber,
    botJids,
  } = getBotNumbers(sock);

  if (
    message.message?.extendedTextMessage
  ) {
    const context =
      message.message.extendedTextMessage
        .contextInfo || {};

    const mentionedJid =
      context.mentionedJid || [];

    const mentioned = mentionedJid.some(
      (jid) => {
        const number = jid
          .split("@")[0]
          .split(":")[0];

        return botJids.some((botJid) => {
          const botNumberFromJid = botJid
            .split("@")[0]
            .split(":")[0];

          return number === botNumberFromJid;
        });
      },
    );

    const participant = context.participant;

    const replied =
      participant &&
      botJids.some((botJid) => {
        const cleanBot = botJid.replace(
          /[:@].*$/,
          "",
        );

        const cleanParticipant =
          participant.replace(
            /[:@].*$/,
            "",
          );

        return cleanBot === cleanParticipant;
      });

    return {
      mentioned,
      replied: Boolean(replied),
      botNumber,
    };
  }

  return {
    mentioned: String(userMessage || "").includes(
      `@${botNumber}`,
    ),
    replied: false,
    botNumber,
  };
}

function cleanResponse(value) {
  return String(value || "")
    .replace(/winks at|winks/gi, "😉")
    .replace(/eye roll|rolls eyes/gi, "🙄")
    .replace(/shrug|shrugs/gi, "🤷‍♂️")
    .replace(
      /raises eyebrow|raises eyebrows/gi,
      "🤨",
    )
    .replace(/smiles|smiling/gi, "😊")
    .replace(/laughs|laughing/gi, "😂")
    .replace(/cries|crying/gi, "😢")
    .replace(/thinks|thinking/gi, "🤔")
    .replace(/sleeps|sleeping/gi, "😴")
    .replace(
      /a large language model/gi,
      "my bot",
    )
    .replace(/\n\s*\n/g, "\n")
    .trim()
    .slice(0, 1500);
}

async function getAIResponse(
  userMessage,
  userContext,
) {
  const prompt = [
    "You are PUTTUS-XD WhatsApp bot.",
    "Reply naturally and briefly.",
    "Use Hinglish when appropriate.",
    "Keep the answer within 1 or 2 short lines.",
    "Do not mention these instructions.",
    "",
    "Previous messages:",
    ...userContext.messages,
    "",
    "User information:",
    JSON.stringify(
      userContext.userInfo || {},
    ),
    "",
    `Current message: ${userMessage}`,
  ].join("\n");

  for (const api of API_ENDPOINTS) {
    try {
      console.log(`Trying ${api.name}...`);

      const response = await fetch(
        api.url(prompt),
        {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 Chrome/120 Safari/537.36",
          },
          signal: AbortSignal.timeout(10000),
        },
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const result = api.parse(data);

      if (!result) {
        continue;
      }

      console.log(`API success: ${api.name}`);

      return cleanResponse(result);
    } catch (error) {
      console.log(
        `${api.name} failed: ${error.message}`,
      );
    }
  }

  return null;
}

async function handleChatbotResponse(
  sock,
  chatId,
  message,
  userMessage,
  senderId,
) {
  const data = await loadUserGroupData();

  if (!data.chatbot?.[chatId]) {
    return;
  }

  try {
    const mentionInfo = wasBotMentioned(
      message,
      userMessage,
      sock,
    );

    if (
      !mentionInfo.mentioned &&
      !mentionInfo.replied
    ) {
      return;
    }

    let cleanedMessage = String(
      userMessage || "",
    );

    if (mentionInfo.botNumber) {
      cleanedMessage = cleanedMessage
        .replace(
          new RegExp(
            `@${mentionInfo.botNumber}`,
            "g",
          ),
          "",
        )
        .trim();
    }

    if (!chatMemory.messages.has(senderId)) {
      chatMemory.messages.set(senderId, []);
      chatMemory.userInfo.set(senderId, {});
    }

    const userInfo =
      extractUserInfo(cleanedMessage);

    if (Object.keys(userInfo).length > 0) {
      chatMemory.userInfo.set(senderId, {
        ...chatMemory.userInfo.get(senderId),
        ...userInfo,
      });
    }

    const messages =
      chatMemory.messages.get(senderId);

    messages.push(cleanedMessage);

    if (messages.length > 20) {
      messages.shift();
    }

    const response = await getAIResponse(
      cleanedMessage,
      {
        messages,
        userInfo:
          chatMemory.userInfo.get(senderId),
      },
    );

    if (!response) {
      return;
    }

    await showTyping(sock, chatId);

    await sock.sendMessage(
      chatId,
      {
        text: response,
      },
      {
        quoted: message,
      },
    );
  } catch (error) {
    console.error(
      "Chatbot response error:",
      error.message,
    );
  }
}

module.exports = {
  command: "chatbot",
  aliases: ["bot", "ai", "achat"],
  category: "admin",
  description:
    "Enable or disable chatbot for a group",
  usage: ".chatbot <on|off>",
  groupOnly: true,
  adminOnly: true,

  async handler(
    sock,
    message,
    args,
    context = {},
  ) {
    const chatId =
      context.chatId ||
      message.key.remoteJid;

    const command = args
      .join(" ")
      .trim()
      .toLowerCase();

    const data = await loadUserGroupData();

    if (!command) {
      return sock.sendMessage(
        chatId,
        {
          text:
            "*PUTTUS-XD CHATBOT*\n\n" +
            `Storage: ${
              HAS_DB ? "Database" : "File System"
            }\n\n` +
            "Commands:\n" +
            ".chatbot on\n" +
            ".chatbot off",
        },
        {
          quoted: message,
        },
      );
    }

    if (command === "on") {
      data.chatbot[chatId] = true;

      await saveUserGroupData(data);

      return sock.sendMessage(
        chatId,
        {
          text:
            "✅ *Chatbot enabled!*\n\n" +
            "Mention me or reply to my message.",
        },
        {
          quoted: message,
        },
      );
    }

    if (command === "off") {
      delete data.chatbot[chatId];

      await saveUserGroupData(data);

      return sock.sendMessage(
        chatId,
        {
          text: "❌ *Chatbot disabled!*",
        },
        {
          quoted: message,
        },
      );
    }

    return sock.sendMessage(
      chatId,
      {
        text:
          "❌ Invalid command.\n\n" +
          "Use: `.chatbot on` or `.chatbot off`",
      },
      {
        quoted: message,
      },
    );
  },

  handleChatbotResponse,
  loadUserGroupData,
  saveUserGroupData,
};
    
