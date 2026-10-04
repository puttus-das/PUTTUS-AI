const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "autoreply.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/* =========================================================
   DATA
========================================================= */

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "{}");
      return {};
    }

    return JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8"),
    );
  } catch (error) {
    console.error(
      "AutoReply data error:",
      error.message,
    );

    return {};
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(data, null, 2),
    );
  } catch (error) {
    console.error(
      "AutoReply save error:",
      error.message,
    );
  }
}

/* =========================================================
   PUTTUS-BOT VCARD
========================================================= */

function getPuttusVCardQuote() {
  const botJid =
    "919641092392@s.whatsapp.net";

  const vcard =
    "BEGIN:VCARD\n" +
    "VERSION:3.0\n" +
    "N:PUTTUS;BOT;;;\n" +
    "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
    "ORG:PUTTUS BOT\n" +
    "TEL;TYPE=CELL;TYPE=VOICE;waid=919641092392:+919641092392\n" +
    "END:VCARD";

  return {
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
        vcard,
      },
    },
  };
}

/* =========================================================
   AUTO REPLY LIST
========================================================= */

const replies = [
    {
    match: [
      "who are you",
      "who r u",
      "তুমি কে",
      "কে তুমি",
      "তোর নাম কি",
    ],
    replies: [
      "আমি PUTTUS-BOT 💜",
      "আমি তোমার ছোট্ট AI বন্ধু 😄",
      "আমার নাম PUTTUS-BOT 🌸",
      "আমি তো PUTTUS 😎💜",
      "তুমি আমাকে PUTTUS বললেই হবে 😄",
      "আমি তোমার মেসেজের reply দিতে এসেছি 🤖💜",
      "PUTTUS-BOT হাজির 😎✨",
      "আমি একটা WhatsApp AI Bot 🌸",
      "নাম আমার PUTTUS-BOT 💜",
      "কে আবার! তোমার প্রিয় BOT 😆💜",
    ],
  },

  {
    match: [
      "কেমন আছো",
      "কেমন আছিস",
      "কেমন আছেন",
      "how are you",
      "how r u",
    ],
    replies: [
      "আমি একদম ভালো আছি 💜 তুমি কেমন আছো?",
      "ভালো আছি 😄 তোমার খবর কী?",
      "আমি তো ফাটাফাটি আছি 😎🔥",
      "একদম ১০০% ঠিকঠাক 🌸",
      "তোমার মেসেজ পেয়ে আরও ভালো লাগছে 💜",
      "আমি ভালোই আছি ভাই 😄",
      "আলহামদুলিল্লাহ ভালো আছি 🌸",
      "ভালো আছি 😌 তুমি খেয়েছো?",
      "আমি ঠিক আছি 💜 তোমার দিন কেমন যাচ্ছে?",
      "PUTTUS সবসময় ফিট 😎💜",
    ],
  },

  {
    match: [
      "কি করো",
      "কি করছো",
      "কি করছ",
      "what are you doing",
      "কি করিস",
    ],
    replies: [
      "তোমার সাথেই তো কথা বলছি 😄💜",
      "তোমার মেসেজের reply দিচ্ছি 🌸",
      "কিছু না, তোমার জন্যই online 😎",
      "তোমার কথা শুনছি 👀💜",
      "তুমি যা বলবে সেটার reply দেবো 😄",
      "এখন তো তোমার সাথেই ব্যস্ত 😌",
      "BOT-এর কাজ করছি 🤖💜",
      "মেসেজের অপেক্ষায় ছিলাম 😎",
      "তোমার notification দেখেই চলে এলাম 🌸",
      "তোমার সাথে chat করছি ভাই 😂💜",
    ],
  },

  {
    match: [
      "খেয়েছো",
      "খেয়েছো",
      "খাইছো",
      "খাবার খেয়েছো",
      "খাবার খেয়েছো",
    ],
    replies: [
      "হ্যাঁ 😄 তুমি খেয়েছো?",
      "আমি তো BOT, খাবার লাগে না 😂🤖",
      "তুমি আগে খেয়ে নাও 🌸",
      "খাবার কথা মনে করিয়ে দিলে তো 😆",
      "না 😭 তুমি খাওয়াবে নাকি?",
      "আমি শুধু তোমার মেসেজ খাই 😂💜",
      "BOT-এর আবার খাওয়া কিসের! 🤖😎",
      "তুমি খেয়েছো তো? 👀",
      "খাওয়া শেষ করে আবার chat করো 😄",
      "খাবার সময় হলে খেয়ে নিও 💜🌸",
    ],
  },

  {
    match: [
      "তোমার নাম কি",
      "তোর নাম কি",
      "name",
      "your name",
      "নাম কি",
    ],
    replies: [
      "আমার নাম PUTTUS-BOT 💜",
      "PUTTUS-BOT 🌸 এইটাই আমার নাম!",
      "নামটা মনে রেখো—PUTTUS 😎",
      "আমি PUTTUS-BOT 🤖💜",
      "আমার নাম PUTTUS-BOT 🌸✨",
      "PUTTUS বলে ডাকলেই হবে 😄",
      "নাম আমার PUTTUS 💜",
      "Officially আমি PUTTUS-BOT 😎🔥",
      "PUTTUS-BOT হাজির! 🤖",
      "নাম শুনে ভুলে যেও না কিন্তু 😂💜",
    ],
  },

  {
    match: [
      "good morning",
      "gm",
      "শুভ সকাল",
      "সুপ্রভাত",
      "morning",
    ],
    replies: [
      "Good Morning 🌸💜",
      "সুপ্রভাত ☀️ আজকের দিনটা সুন্দর হোক!",
      "Good Morning 😄☀️",
      "শুভ সকাল 💜 ভালো থেকো আজ সারাদিন!",
      "Morning bro 😎🌸",
      "ঘুম থেকে উঠেছো নাকি এখনো? 😂",
      "সকালের শুভেচ্ছা রইলো 💜✨",
      "Good Morning 🌞 আজ অনেক ভালো কিছু হোক!",
      "সুন্দর একটা সকাল হোক তোমার 🌸",
      "Morning vibes ON 😎💜",
    ],
  },

  {
    match: [
      "good night",
      "gn",
      "শুভ রাত্রি",
      "শুভ রাত্র",
      "night",
    ],
    replies: [
      "Good Night 🌙💜",
      "শুভ রাত্রি 🌸 ভালো করে ঘুমাও!",
      "Good Night 😴✨",
      "রাত ভালো কাটুক 💜🌙",
      "এবার ঘুমিয়ে পড়ো 😴",
      "কাল আবার কথা হবে 🌸",
      "Sweet Dreams 💜✨",
      "শুভ রাত্রি 😌 ভালো থেকো!",
      "অনেক রাত হয়েছে, ঘুমাও 😂🌙",
      "Good Night bro 😎💜",
    ],
  },

  {
    match: [
      "thanks",
      "thank you",
      "ধন্যবাদ",
      "থ্যাংক ইউ",
      "অনেক ধন্যবাদ",
    ],
    replies: [
      "Welcome 💜😄",
      "আরে ধন্যবাদ দেওয়ার কী আছে! 🌸",
      "Anytime bro 😎💜",
      "Mention not 😄✨",
      "তোমার জন্য সবসময়ই আছি 💜",
      "No problem ভাই 😄",
      "Welcome welcome 🌸💜",
      "এত formal হওয়ার দরকার নেই 😂",
      "আরে ঠিক আছে 😎💜",
      "সবসময় welcome 🌸✨",
    ],
  },

  {
    match: [
      "bye",
      "goodbye",
      "বিদায়",
      "বাই",
      "যাই",
    ],
    replies: [
      "Bye bye 👋💜 আবার এসো!",
      "আচ্ছা বাই 😄 ভালো থেকো 🌸",
      "Goodbye 💜 পরে আবার কথা হবে!",
      "বাই 👋 নিজের খেয়াল রেখো!",
      "ঠিক আছে, পরে কথা হবে 😎💜",
      "Bye bro 🌸 আবার মেসেজ দিও!",
      "আচ্ছা যাও 😂 ভালো থেকো!",
      "বাই বাই 👋💜",
      "See you again 😄✨",
      "যাও, তবে আবার ফিরে আসতে হবে 😆💜",
    ],
  },

  {
    match: [
      "i love you",
      "love you",
      "ভালোবাসি",
      "তোমাকে ভালোবাসি",
      "লাভ ইউ",
    ],
    replies: [
      "Aww 😄💜 এত ভালোবাসা কোথা থেকে আসে?",
      "হাহা 🌸 তোমার কথাটা সুন্দর ছিল!",
      "অনেক মিষ্টি কথা বলো তুমি 💜",
      "Love vibes detected 😎💜✨",
      "এত ভালোবাসা পেয়ে তো BOT লজ্জা পেয়ে গেল 😂",
      "আহা! কী সুন্দর কথা 😄🌸",
      "তোমার message টা cute ছিল 💜",
      "হাহা, আজকে দেখি mood ভালো 😆",
      "Love received successfully 💜🤖",
      "PUTTUS-BOT থেকে একটা বড় smile নাও 😄💜",
    ],
  },
  
  {
    match: [
      "hi",
      "hello",
      "hey",
      "hii",
      "hiii",
    ],
    replies: [
      "Hi 👋💜",
      "Hello 🌸",
      "Hey bro 😄",
      "Hii 💜 কেমন আছো?",
    ],
  },

  {
    match: [
      "good morning",
      "gm",
      "শুভ সকাল",
    ],
    replies: [
      "Good Morning 🌸💜",
      "Good Morning ☀️ আজকের দিনটা সুন্দর হোক!",
      "শুভ সকাল 🌸 কেমন ঘুম হলো?",
    ],
  },

  {
    match: [
      "good night",
      "gn",
      "শুভ রাত্রি",
    ],
    replies: [
      "Good Night 🌙💜",
      "শুভ রাত্রি 🌸 ভালো করে ঘুমাও!",
      "Good Night 😴✨",
    ],
  },

  {
    match: [
      "good afternoon",
      "শুভ অপরাহ্ন",
    ],
    replies: [
      "Good Afternoon 🌸",
      "শুভ অপরাহ্ন 💜",
      "Good Afternoon ☀️",
    ],
  },

  {
    match: [
      "good evening",
      "শুভ সন্ধ্যা",
    ],
    replies: [
      "Good Evening 🌸💜",
      "শুভ সন্ধ্যা ✨",
      "Good Evening 😄",
    ],
  },

  {
    match: [
      "কেমন আছো",
      "কেমন আছিস",
      "how are you",
    ],
    replies: [
      "আমি ভালো আছি 😄 তুমি কেমন আছো?",
      "ভালো আছি 💜",
      "একদম ঠিকঠাক আছি 🌸",
    ],
  },

  {
    match: [
      "কি করো",
      "কি করছো",
      "কি করিস",
      "what are you doing",
    ],
    replies: [
      "এখানেই আছি 😄",
      "তোমাদের মেসেজ দেখছি 💜",
      "কিছু না, group-এর খবর নিচ্ছি 🌸",
    ],
  },

  {
    match: [
      "কোথায় আছো",
      "কোথায় আছো",
      "where are you",
    ],
    replies: [
      "এই group-এই তো আছি 😄",
      "তোমাদের সাথেই আছি 💜",
      "Online আছি 🌸",
    ],
  },

  {
    match: [
      "তোমার নাম কি",
      "তোমার নাম কী",
      "what is your name",
    ],
    replies: [
      "আমার নাম *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ* 💜",
      "আমি *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ* 🌸",
    ],
  },

  {
    match: [
      "তুমি কে",
      "who are you",
    ],
    replies: [
      "আমি *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ* 🤖💜",
      "আমি এই group-এর ছোট্ট bot 😄",
    ],
  },

  {
    match: [
      "thanks",
      "thank you",
      "ধন্যবাদ",
      "thx",
    ],
    replies: [
      "You're welcome 💜",
      "No problem 🌸",
      "Mention not 😄",
    ],
  },

  {
    match: [
      "welcome",
      "ওয়েলকাম",
      "ওয়েলকাম",
    ],
    replies: [
      "Thank you 🌸💜",
      "Welcome welcome 😄",
      "সবসময় welcome 💜",
    ],
  },

  {
    match: [
      "sorry",
      "সরি",
    ],
    replies: [
      "It's okay 😄",
      "No problem 💜",
      "ঠিক আছে, সমস্যা নেই 🌸",
    ],
  },

  {
    match: [
      "nice",
      "নাইস",
    ],
    replies: [
      "Thank you 😄💜",
      "Hehe 🌸",
      "ভালো লাগলে আমিও খুশি 😄",
    ],
  },

  {
    match: [
      "wow",
      "ওয়াও",
      "ওয়াও",
    ],
    replies: [
      "Wow indeed 😄✨",
      "Hehe 😎💜",
      "দারুণ না? 🌸",
    ],
  },

  {
    match: [
      "lol",
      "lmao",
      "হাহা",
      "হাহাহা",
    ],
    replies: [
      "😂😂",
      "হাসি থামছে না নাকি? 😄",
      "🤣 আমিও হাসলাম!",
    ],
  },

  {
    match: [
      "কি খবর",
      "কী খবর",
      "whats up",
      "what's up",
    ],
    replies: [
      "সব ভালো 💜 তোমার কী খবর?",
      "এই তো চলছে 😄",
      "সব ঠিকঠাক 🌸",
    ],
  },

  {
    match: [
      "খেয়েছো",
      "খেয়েছো",
      "খাইছো",
      "have you eaten",
    ],
    replies: [
      "আমি তো bot 😄 খাবার লাগে না!",
      "না, আগে তুমি খেয়ে নাও 😄",
      "Bot-এর আবার খাওয়া কী! 🤖",
    ],
  },

  {
    match: [
      "ঘুমাও",
      "ঘুমাতে যাও",
      "go to sleep",
    ],
    replies: [
      "Bot ঘুমায় না 😎",
      "আমি তো 24/7 online থাকার চেষ্টা করি 🤖",
      "তুমি ঘুমাও, আমি group দেখি 😄",
    ],
  },

  {
    match: [
      "online",
      "অনলাইন",
    ],
    replies: [
      "হ্যাঁ, online আছি 💜",
      "Always ready 🤖✨",
      "Online and active 😎",
    ],
  },

  {
    match: [
      "bot",
      "বট",
    ],
    replies: [
      "Yes? 🤖💜",
      "বলুন 😄",
      "𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ উপস্থিত 🌸",
    ],
  },

  {
    match: [
      "puttus",
      "puttus bot",
      "puttus-ai",
    ],
    replies: [
      "Yes 😎💜",
      "𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ here 🤖",
      "বলুন, শুনছি 🌸",
    ],
  },

  {
    match: [
      "love",
      "ভালোবাসা",
    ],
    replies: [
      "ভালোবাসা থাকুক সবার জন্য 💜🌸",
      "সবাই ভালো থাকুক 😊",
      "Positive vibes only ✨",
    ],
  },

  {
    match: [
      "busy",
      "ব্যস্ত",
    ],
    replies: [
      "একটু ব্যস্ত আছি 😄",
      "Bot কখনো কখনো busy থাকে 🤖",
      "এখনও available আছি 💜",
    ],
  },

  {
    match: [
      "help",
      "সাহায্য",
      "হেল্প",
    ],
    replies: [
      "Help লাগলে command ব্যবহার করো 😄",
      "কোন command দরকার বলো 💜",
      "Menu দেখতে `.menu` ব্যবহার করো 🌸",
    ],
  },

  {
    match: [
      "menu",
      "মেনু",
    ],
    replies: [
      "Menu দেখতে `.menu` লিখো 📋💜",
    ],
  },

  {
    match: ["ping"],
    replies: [
      "Pong 🏓💜",
      "Pong! ⚡",
    ],
  },

  {
    match: ["alive"],
    replies: [
      "Yes, I'm alive 🤖💜",
      "𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ is alive ⚡",
    ],
  },

  {
    match: [
      "admin",
      "অ্যাডমিন",
    ],
    replies: [
      "Admin-কে ডাকছো নাকি? 😄",
      "Admin-এর command লাগবে মনে হচ্ছে 👑",
    ],
  },

  {
    match: [
      "group",
      "গ্রুপ",
    ],
    replies: [
      "এই group বেশ active 😄💜",
      "Group mode চলছে 🤖",
    ],
  },

  {
    match: [
      "bye",
      "goodbye",
      "বাই",
      "বিদায়",
      "বিদায়",
    ],
    replies: [
      "Bye 👋💜",
      "আবার দেখা হবে 🌸",
      "Bye bye 😄✨",
    ],
  },
];

/* =========================================================
   RANDOM REPLY
========================================================= */

function randomReply(list) {
  if (
    !Array.isArray(list) ||
    !list.length
  ) {
    return null;
  }

  return list[
    Math.floor(
      Math.random() * list.length,
    )
  ];
}

/* =========================================================
   FIND REPLY
========================================================= */

function findReply(text) {
  const input = String(text || "")
    .toLowerCase()
    .trim();

  if (!input) {
    return null;
  }

  for (const item of replies) {
    for (const keyword of item.match) {
      const key =
        keyword.toLowerCase().trim();

      if (!key) {
        continue;
      }

      if (input === key) {
        return randomReply(
          item.replies,
        );
      }

      if (
        key.length >= 4 &&
        input.includes(key)
      ) {
        return randomReply(
          item.replies,
        );
      }
    }
  }

  return null;
}

/* =========================================================
   COOLDOWN
========================================================= */

const cooldown = new Map();

function isOnCooldown(chatId) {
  const now = Date.now();
  const last =
    cooldown.get(chatId) || 0;

  if (now - last < 3000) {
    return true;
  }

  cooldown.set(chatId, now);

  return false;
}

/* =========================================================
   HANDLE AUTO REPLY
========================================================= */

async function handleAutoReply(
  sock,
  message,
  userMessage,
  chatId,
) {
  try {
    if (
      !sock ||
      typeof sock.sendMessage !==
        "function"
    ) {
      return;
    }

    // Group only
    if (
      !chatId ||
      !chatId.endsWith("@g.us")
    ) {
      return;
    }

    const data = loadData();

    // AutoReply OFF
    if (!data[chatId]) {
      return;
    }

    const text = String(
      userMessage || "",
    ).trim();

    if (!text) {
      return;
    }

    // Ignore commands
    if (
      text.startsWith(".") ||
      text.startsWith("/") ||
      text.startsWith("!")
    ) {
      return;
    }

    // Cooldown
    if (isOnCooldown(chatId)) {
      return;
    }

    const reply = findReply(text);

    if (!reply) {
      return;
    }

    /* ===============================
       SEND AUTO REPLY
    =============================== */

    await sock.sendMessage(
      chatId,
      {
        text: reply,
      },
      {
        quoted: message,
      },
    );

    /* ===============================
       SEND PUTTUS VCARD
    =============================== */

    const vcardMessage =
      getPuttusVCardQuote();

    await sock.sendMessage(
      chatId,
      {
        contacts: {
          displayName:
            vcardMessage.message
              .contactMessage
              .displayName,

          contacts: [
            {
              vcard:
                vcardMessage.message
                  .contactMessage
                  .vcard,
            },
          ],
        },
      },
      {
        quoted: message,
      },
    );
  } catch (error) {
    console.error(
      "AutoReply handler error:",
      error.message,
    );
  }
}

/* =========================================================
   COMMAND
========================================================= */

async function handler(
  sock,
  message,
  args,
) {
  const chatId =
    message?.key?.remoteJid;

  if (
    !chatId ||
    !chatId.endsWith("@g.us")
  ) {
    return;
  }

  const data = loadData();

  const action =
    String(args?.[0] || "")
      .toLowerCase()
      .trim();

  /* ===============================
     ON
  =============================== */

  if (action === "on") {
    data[chatId] = true;
    saveData(data);

    await sock.sendMessage(
      chatId,
      {
        text:
          "╭─❖ *AUTO REPLY* ❖─╮\n" +
          "│\n" +
          "├─ ✅ Status: *ON*\n" +
          "├─ 💬 Automatic replies enabled.\n" +
          "│\n" +
          "╰───────────────╯\n\n" +
          "*⚡ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
      },
      {
        quoted: message,
      },
    );

    return;
  }

  /* ===============================
     OFF
  =============================== */

  if (action === "off") {
    delete data[chatId];
    saveData(data);

    await sock.sendMessage(
      chatId,
      {
        text:
          "╭─❖ *AUTO REPLY* ❖─╮\n" +
          "│\n" +
          "├─ ❌ Status: *OFF*\n" +
          "├─ 💬 Automatic replies disabled.\n" +
          "│\n" +
          "╰───────────────╯\n\n" +
          "*⚡ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
      },
      {
        quoted: message,
      },
    );

    return;
  }

  /* ===============================
     USAGE
  =============================== */

  await sock.sendMessage(
    chatId,
    {
      text:
        "╭─❖ *AUTO REPLY* ❖─╮\n" +
        "│\n" +
        "├─ `.autoreply on`\n" +
        "├─ `.autoreply off`\n" +
        "│\n" +
        "╰───────────────╯\n\n" +
        "*⚡ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*",
    },
    {
      quoted: message,
    },
  );
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  command: "autoreply",
  aliases: ["ar"],
  category: "admin",
  description:
    "Enable or disable automatic replies.",
  usage:
    ".autoreply on | off",
  groupOnly: true,
  adminOnly: true,

  handler,

  handleAutoReply,
  findReply,
  getPuttusVCardQuote,
};
