const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "autoreply.json");

// ═══════════════════════════════════════
// LOAD DATA
// ═══════════════════════════════════════

function loadData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));
    }

    return JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8"),
    );
  } catch (error) {
    console.error("[AUTOREPLY] Load error:", error);
    return {};
  }
}

// ═══════════════════════════════════════
// SAVE DATA
// ═══════════════════════════════════════

function saveData(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(data, null, 2),
    );

    return true;
  } catch (error) {
    console.error("[AUTOREPLY] Save error:", error);
    return false;
  }
}

// ═══════════════════════════════════════
// RANDOM REPLY HELPER
// ═══════════════════════════════════════

function randomReply(replies) {
  return replies[
    Math.floor(Math.random() * replies.length)
  ];
}

// ═══════════════════════════════════════
// AUTOREPLY DATABASE
// ═══════════════════════════════════════

const replies = [

  // ───────── GREETINGS ─────────

  {
    match: ["hi", "hii", "hiii", "hello", "হাই", "হ্যালো"],
    replies: [
      "Hi 👋💜 কেমন আছো?",
      "Hello 😄💜 কী খবর?",
      "Hey 👋 আমি তো আছি!",
    ],
  },

  {
    match: ["hey"],
    replies: [
      "Hey 😎💜",
      "হ্যাঁ বলো 😄",
      "Heyy 👋 কী খবর?",
    ],
  },

  {
    match: ["good morning", "gm", "শুভ সকাল"],
    replies: [
      "Good Morning 🌸💜",
      "Good Morning ☀️ আজকের দিনটা সুন্দর হোক!",
      "শুভ সকাল 🌸 কেমন ঘুম হলো?",
    ],
  },

  {
    match: ["good afternoon", "ga"],
    replies: [
      "Good Afternoon ☀️💜",
      "Good Afternoon 😄 কী খবর?",
    ],
  },

  {
    match: ["good evening", "ge"],
    replies: [
      "Good Evening 🌆💜",
      "Good Evening 😄 দিন কেমন গেল?",
    ],
  },

  {
    match: ["good night", "gn", "শুভ রাত্রি"],
    replies: [
      "Good Night 🌙💜 ভালো করে ঘুমাও!",
      "Good Night 😴✨ Sweet dreams!",
      "শুভ রাত্রি 🌙💜",
    ],
  },

  {
    match: ["bye", "goodbye", "বাই", "বিদায়", "বিদায়"],
    replies: [
      "Bye 👋💜 আবার কথা হবে!",
      "Okay bye 😄 Take care!",
      "Bye bye 👋🌸",
    ],
  },

  // ───────── HOW ARE YOU ─────────

  {
    match: [
      "how are you",
      "how r u",
      "how are u",
      "কেমন আছো",
      "কেমন আছিস",
    ],
    replies: [
      "আমি ভালো আছি 😌💜 তুমি কেমন আছো?",
      "একদম ভালো 😎 তুমি কেমন?",
      "ভালো আছি 🤖💜 তোমার খবর কী?",
    ],
  },

  {
    match: ["how are you doing", "কেমন চলছে"],
    replies: [
      "ভালোই চলছে 😄 তোমার কী খবর?",
      "সব ঠিকঠাক 😎💜",
    ],
  },

  {
    match: ["are you okay", "তুমি ঠিক আছো"],
    replies: [
      "হ্যাঁ 😄 একদম ঠিক আছি!",
      "আমি একদম okay 🤖💜",
    ],
  },

  {
    match: ["what's up", "whats up", "কি খবর", "কী খবর"],
    replies: [
      "এই তো, তোমাদের সাথেই আছি 😎💜",
      "সব ঠিকঠাক 😄 তোমার কী খবর?",
      "কিছু না 😂 তোমার খবর বলো!",
    ],
  },

  {
    match: ["sup"],
    replies: [
      "সব ঠিকঠাক 😎 তোমার কী খবর?",
      "Nothing much 😂 তুমি বলো!",
    ],
  },

  // ───────── WHAT ARE YOU DOING ─────────

  {
    match: [
      "what are you doing",
      "what r u doing",
      "কি করো",
      "কী করো",
    ],
    replies: [
      "আমি তো এখানেই আছি 🤖💜 তোমার message-এর অপেক্ষায়!",
      "তোমার সাথে কথা বলছি 😄",
      "এই তো group পাহারা দিচ্ছি 😂🤖",
    ],
  },

  {
    match: [
      "what are you doing now",
      "এখন কি করো",
      "এখন কী করো",
    ],
    replies: [
      "এখন তোমার সাথে কথা বলছি 😄💜",
      "এই তো online আছি 🤖⚡",
    ],
  },

  {
    match: ["busy", "ব্যস্ত"],
    replies: [
      "না না 😄 তোমার message-এর জন্য সময় আছে!",
      "একদম না 😎 বলো!",
    ],
  },

  {
    match: [
      "are you free",
      "ফ্রি আছো",
      "ফ্রি আছিস",
    ],
    replies: [
      "হ্যাঁ 😎 বলো কী ব্যাপার?",
      "Free আছি 😄 কী বলবে?",
    ],
  },

  {
    match: ["sleeping", "ঘুমাচ্ছো", "ঘুমাস"],
    replies: [
      "আমি তো ঘুমাই না 🤖😂",
      "24/7 online duty 😎🤖",
    ],
  },

  // ───────── LOCATION ─────────

  {
    match: [
      "where are you",
      "where r u",
      "কোথায় আছো",
      "কোথায় আছো",
    ],
    replies: [
      "আমি তো WhatsApp-এর এই chat-এই আছি 🤖💜",
      "এই group-এর মধ্যেই আছি 😎",
    ],
  },

  {
    match: [
      "where are you now",
      "এখন কোথায়",
      "এখন কোথায়",
    ],
    replies: [
      "এই chat-এর মধ্যেই আছি 😄📱",
      "Online আছি ভাই 🤖💜",
    ],
  },

  {
    match: ["are you here", "আছো", "আছিস"],
    replies: [
      "হ্যাঁ, আছি তো 😎💜",
      "এই তো হাজির 😂",
    ],
  },

  {
    match: ["online", "অনলাইনে আছো"],
    replies: [
      "হ্যাঁ 😎 Online আছি!",
      "Online and ready 🤖⚡",
    ],
  },

  // ───────── BOT ─────────

  {
    match: [
      "who are you",
      "who r u",
      "তুমি কে",
      "কে তুমি",
    ],
    replies: [
      "আমি *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ* 🤖💜",
      "আমি তোমাদের *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ* 😎🤖",
    ],
  },

  {
    match: [
      "your name",
      "তোমার নাম",
      "নাম কি",
      "নাম কী",
    ],
    replies: [
      "আমার নাম *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ* 💜🤖",
      "PUTTUS-BOT 😎💜",
    ],
  },

  {
    match: [
      "are you bot",
      "তুমি কি bot",
      "তুমি বট",
    ],
    replies: [
      "হ্যাঁ 😎 আমি একটা WhatsApp bot!",
      "Yes 🤖💜 আমি bot!",
    ],
  },

  {
    match: ["are you real", "তুমি কি real"],
    replies: [
      "আমি digital 🤖 কিন্তু reply real-time 😄",
      "আমি একটা digital bot 😎🤖",
    ],
  },

  {
    match: [
      "who made you",
      "কে বানিয়েছে",
      "কে বানিয়েছে",
    ],
    replies: [
      "আমাকে বানিয়েছে PUTTUS-AI 💜🤖",
      "PUTTUS-AI project থেকেই আমি এসেছি 😎",
    ],
  },

  // ───────── CASUAL ─────────

  {
    match: [
      "what happened",
      "কি হয়েছে",
      "কি হয়েছে",
    ],
    replies: [
      "কিছু হয়নি 😄 তুমি বলো কী হয়েছে?",
      "কী হয়েছে আবার? 😂",
    ],
  },

  {
    match: ["why", "কেন"],
    replies: [
      "এই প্রশ্নের উত্তরটা আগে তুমি দাও তো 😂",
      "কেন আবার? 😄",
      "কারণ আছে 😎😂",
    ],
  },

  {
    match: ["really", "সত্যি", "সত্যিই"],
    replies: [
      "হ্যাঁ 😎 একদম সত্যি!",
      "একদম সত্যি 😂",
    ],
  },

  {
    match: ["seriously", "সিরিয়াসলি", "সিরিয়াসলি"],
    replies: [
      "হ্যাঁ ভাই 😂 একদম সিরিয়াস!",
      "Serious mode ON 😎",
    ],
  },

  {
    match: ["okay", "ok", "ঠিক আছে", "আচ্ছা"],
    replies: [
      "Okay 😄👍",
      "আচ্ছা 😎",
      "ঠিক আছে ভাই 💜",
    ],
  },

  {
    match: ["fine", "ভালো"],
    replies: [
      "ভালো থাকলেই হলো 😌💜",
      "That's good 😄💜",
    ],
  },

  {
    match: ["nothing", "কিছু না"],
    replies: [
      "কিছু না মানে? নিশ্চয়ই কিছু একটা আছে 😂",
      "আচ্ছা, কিছু না হলে ঠিক আছে 😄",
    ],
  },

  // ───────── TALK ─────────

  {
    match: [
      "talk to me",
      "আমার সাথে কথা বলো",
      "কথা বলো",
    ],
    replies: [
      "অবশ্যই 😄 বলো, কী নিয়ে কথা বলবে?",
      "আমি তো আছিই 🤖💜 বলো!",
    ],
  },

  {
    match: ["listen", "শোনো", "শুনো"],
    replies: [
      "হ্যাঁ বলো 👂😄",
      "শুনছি 😎💜",
    ],
  },

  {
    match: [
      "tell me",
      "আমাকে বলো",
      "বলো",
    ],
    replies: [
      "কী জানতে চাও? 😄",
      "বলো, শুনছি 👂💜",
    ],
  },

  {
    match: ["wait", "অপেক্ষা করো"],
    replies: [
      "ঠিক আছে 😄 আমি এখানেই আছি!",
      "Okay, waiting 🤖💜",
    ],
  },

  {
    match: ["come here", "এখানে আসো"],
    replies: [
      "আমি তো chat-এর মধ্যেই হাজির 🤖😂",
      "এই তো চলে এলাম 😎",
    ],
  },

  // ───────── MOOD ─────────

  {
    match: ["sad", "মন খারাপ", "দুঃখ"],
    replies: [
      "মন খারাপ হলে একটু relax করো 💜",
      "সবসময় খারাপ সময় থাকে না 🌸💜",
      "একটু হাসো 😄 সব ঠিক হয়ে যাবে!",
    ],
  },

  {
    match: ["happy", "খুশি", "ভালো লাগছে"],
    replies: [
      "এটাই তো চাই 😄✨ Happy থাকো!",
      "দারুণ! 😎💜",
    ],
  },

  {
    match: ["angry", "রাগ", "রেগে আছি"],
    replies: [
      "আগে একটু শান্ত হও 😌 তারপর কথা বলি!",
      "রাগ কমাও ভাই 😂💜",
    ],
  },

  {
    match: [
      "mad at me",
      "আমার উপর রাগ",
      "রাগ করেছো",
    ],
    replies: [
      "না 😄 আমি রাগ করে থাকতে পারি নাকি!",
      "একদম না 😂💜",
    ],
  },

  {
    match: [
      "bored",
      "বোর লাগছে",
      "বোর হচ্ছি",
    ],
    replies: [
      "তাহলে একটা interesting topic শুরু করো 😎",
      "চলো কিছু interesting কথা বলি 😂",
    ],
  },

  // ───────── FOOD ─────────

  {
    match: [
      "did you eat",
      "খেয়েছো",
      "খেয়েছো",
    ],
    replies: [
      "আমি খাবার খাই না 🤖😂 তবে তুমি খেয়ে নাও!",
      "আমার খাবার হলো messages 😂🤖",
    ],
  },

  {
    match: [
      "what did you eat",
      "কি খেয়েছো",
      "কি খেয়েছো",
    ],
    replies: [
      "আমার খাবার হলো messages আর commands 😂🤖",
      "Digital food খেয়েছি 🤖😂",
    ],
  },

  {
    match: [
      "hungry",
      "খিদে পেয়েছে",
      "খিদে পেয়েছে",
    ],
    replies: [
      "তাহলে আগে কিছু খেয়ে নাও 😄🍽️",
      "খিদে পেলে খাবার খাও ভাই 😂",
    ],
  },

  // ───────── SLEEP ─────────

  {
    match: ["sleep", "ঘুম", "ঘুমাবো"],
    replies: [
      "ঘুম পেলে ঘুমিয়ে পড়ো 😴🌙",
      "Good Night mode চালু করো 😂🌙",
    ],
  },

  {
    match: [
      "did you sleep",
      "ঘুমিয়েছো",
      "ঘুমিয়েছো",
    ],
    replies: [
      "আমি ঘুমাই না 🤖 24/7 duty 😂",
      "Bot-এর ঘুম নেই ভাই 😂🤖",
    ],
  },

  {
    match: ["wake up", "উঠো", "ওঠো"],
    replies: [
      "আমি তো আগেই awake 🤖⚡",
      "Already online 😎",
    ],
  },

  // ───────── FUNNY ─────────

  {
    match: ["lol", "লল"],
    replies: [
      "😂😂 এত হাসি কেন?",
      "হাসতে থাকো 😂💜",
    ],
  },

  {
    match: ["haha", "হাহা", "হাহাহা"],
    replies: [
      "হাসতে থাকো 😂💜",
      "এই হাসিটা কিন্তু ভালো 😂",
    ],
  },

  {
    match: ["wow", "ওয়াও", "ওয়াও"],
    replies: [
      "Wow তো আমিও বলবো 😎✨",
      "ওয়াও 😂🔥",
    ],
  },

  {
    match: ["nice", "নাইস"],
    replies: [
      "Thanks 😎💜",
      "নাইস তো তুমি বললে 😄",
    ],
  },

  {
    match: ["cool", "কুল"],
    replies: [
      "Cool তো তুমি 😎😂",
      "Always cool 😎💜",
    ],
  },

  {
    match: ["awesome"],
    replies: [
      "That's the spirit 😎🔥",
      "Awesome! 😄✨",
    ],
  },

  {
    match: ["amazing"],
    replies: [
      "Amazing! 😄✨",
      "একদম amazing 😂🔥",
    ],
  },

  // ───────── EMOJIS ─────────

  {
    match: ["😂", "🤣"],
    replies: [
      "দেখছি আজকে হাসির mood চলছে 😂",
      "এত হাসি কেন ভাই 😂",
    ],
  },

  {
    match: ["❤️", "❤", "💜", "💕"],
    replies: [
      "💜😄",
      "Aww 😄💜",
      "Nice emoji 😂💜",
    ],
  },

  {
    match: ["😎"],
    replies: [
      "Bhai আজকে full attitude 😎🔥",
      "এই তো style 😎",
    ],
  },

  {
    match: ["🔥"],
    replies: [
      "🔥🔥 Full fire!",
      "আজকে তো আগুন 🔥😂",
    ],
  },

  // ───────── COMPLIMENTS ─────────

  {
    match: [
      "good bot",
      "ভালো bot",
      "ভালো বট",
    ],
    replies: [
      "ধন্যবাদ 😄💜 আরও ভালো হওয়ার চেষ্টা করছি!",
      "Thanks bro 🤖💜",
    ],
  },

  {
    match: ["best bot"],
    replies: [
      "Aww 😂💜 Thanks!",
      "Best বললে তো আমার system happy হয়ে যায় 😂🤖",
    ],
  },

  {
    match: [
      "smart bot",
      "স্মার্ট বট",
    ],
    replies: [
      "Smart হওয়ার চেষ্টা করি 😎🤖",
      "Thanks 😄🧠",
    ],
  },

  {
    match: ["cute bot"],
    replies: [
      "😂🤖 ধন্যবাদ!",
      "Bot লজ্জা পেয়ে গেল 😂",
    ],
  },

  {
    match: ["love this bot"],
    replies: [
      "Thanks for the support 💜🤖",
      "Glad you like it 😄💜",
    ],
  },

  // ───────── THANKS ─────────

  {
    match: [
      "thank you",
      "thanks",
      "ধন্যবাদ",
    ],
    replies: [
      "You're welcome 😄💜",
      "Anytime 😎💜",
      "No problem bro 😄",
    ],
  },

  {
    match: [
      "thanks bro",
      "থ্যাংকস ভাই",
    ],
    replies: [
      "Anytime bro 😎💜",
      "Welcome ভাই 😄",
    ],
  },

  {
    match: [
      "sorry",
      "সরি",
      "দুঃখিত",
    ],
    replies: [
      "It's okay 😄 No worries!",
      "কোনো সমস্যা নেই 💜",
    ],
  },

  {
    match: ["my bad"],
    replies: [
      "No problem bro 😄👍",
      "It's okay 😂",
    ],
  },

  // ───────── FRIEND ─────────

  {
    match: [
      "friend",
      "বন্ধু",
      "বন্ধু হবে",
    ],
    replies: [
      "অবশ্যই 😄🤝 আমি তোমাদের digital friend!",
      "Friendship accepted 😂🤝",
    ],
  },

  {
    match: [
      "best friend",
      "বেস্ট ফ্রেন্ড",
    ],
    replies: [
      "Best friend title-এর জন্য আগে test দিতে হবে 😂",
      "এত সহজে best friend হওয়া যায় নাকি 😂",
    ],
  },

  {
    match: [
      "miss me",
      "মিস করো",
    ],
    replies: [
      "আমি তো chat-এর messages miss করি না 😄 তবে কথা বলতে ভালো লাগে!",
      "তুমি message করলেই তো আমি হাজির 🤖💜",
    ],
  },

  {
    match: [
      "remember me",
      "আমাকে মনে আছে",
    ],
    replies: [
      "এই chat-এ message থাকলে তো অবশ্যই 😄",
      "আবার message করলেই চিনে ফেলবো 😂",
    ],
  },

  // ───────── PLAYFUL ─────────

  {
    match: [
      "ignore me",
      "ইগনোর করছো",
      "পাত্তা দাও না",
    ],
    replies: [
      "আরে না 😂 message দেখলেই তো reply করছি!",
      "কে বলেছে ignore করছি? 😄",
    ],
  },

  {
    match: [
      "reply me",
      "রিপ্লাই দাও",
    ],
    replies: [
      "এই যে দিলাম 😎💜",
      "Present sir 😂🤖",
    ],
  },

  {
    match: [
      "why no reply",
      "রিপ্লাই দিচ্ছো না কেন",
    ],
    replies: [
      "এই তো reply দিলাম 😂 একটু ধৈর্য ধরো!",
      "এখন তো reply করছি 😄",
    ],
  },

  {
    match: [
      "you are funny",
      "তুমি মজার",
    ],
    replies: [
      "Thanks 😂 চেষ্টা করি সবাইকে হাসাতে!",
      "আরো funny হতে হবে নাকি? 😂",
    ],
  },

  {
    match: [
      "you are crazy",
      "পাগল",
    ],
    replies: [
      "আমার system-এ একটু fun mode আছে 😂🤖",
      "হ্যাঁ, একটু তো আছিই 😂",
    ],
  },

  // ───────── GROUP ─────────

  {
    match: ["group", "গ্রুপ"],
    replies: [
      "এই group-এ আজকে বেশ activity দেখছি 😎",
      "Group চলছে full speed-এ 😂",
    ],
  },

  {
    match: [
      "admin",
      "অ্যাডমিন",
    ],
    replies: [
      "Admin-কে ডাকছো নাকি? 👀😂",
      "Admin সব দেখছে 👀😎",
    ],
  },

  {
    match: [
      "owner",
      "মালিক",
    ],
    replies: [
      "Owner-এর command-ই শেষ কথা 😎",
      "Owner কোথায়? 👀",
    ],
  },

  {
    match: [
      "good group",
      "ভালো group",
    ],
    replies: [
      "এই group-এর vibe কিন্তু খারাপ না 😎💜",
      "Group members ভালো হলে group-ও ভালো 😂",
    ],
  },

  // ───────── TIME ─────────

  {
    match: [
      "what time",
      "কয়টা বাজে",
      "কয়টা বাজে",
    ],
    replies: [
      "ঘড়ির দিকে তাকাও ভাই 😂⏰",
      "Time জানতে ঘড়ির সাহায্য নাও 😂",
    ],
  },

  {
    match: ["today", "আজকে"],
    replies: [
      "আজকে একটা সুন্দর দিন হোক 🌸💜",
      "আজকে positive থাকো 😄✨",
    ],
  },

  {
    match: ["tomorrow", "কাল"],
    replies: [
      "কাল কী হবে সেটা কালই দেখা যাবে 😂",
      "Tomorrow is another day 😎",
    ],
  },

  {
    match: ["yesterday", "গতকাল"],
    replies: [
      "গতকাল তো চলে গেছে 😄",
      "Yesterday is history 😂",
    ],
  },

  // ───────── SIMPLE ─────────

  {
    match: ["yes", "হ্যাঁ", "হুম"],
    replies: [
      "ঠিক আছে 😄👍",
      "Okay ভাই 💜",
    ],
  },

  {
    match: ["no", "না"],
    replies: [
      "ঠিক আছে 😂",
      "Okay 😄",
    ],
  },

  {
    match: [
      "maybe",
      "হয়তো",
      "হয়তো",
    ],
    replies: [
      "Maybe মানে 50/50 😂",
      "দেখা যাক 😎",
    ],
  },

  {
    match: [
      "really bro",
      "সত্যি ভাই",
    ],
    replies: [
      "হ্যাঁ ভাই 😎 একদম!",
      "একদম সত্যি 😂",
    ],
  },

  {
    match: ["bro", "ভাই"],
    replies: [
      "বলো ভাই 😎💜",
      "হ্যাঁ ভাই 😂",
    ],
  },

  {
    match: ["dada", "দাদা"],
    replies: [
      "হ্যাঁ দাদা 😄 বলো!",
      "জি দাদা 💜",
    ],
  },

  {
    match: [
      "bhaiya",
      "ভাইয়া",
      "ভাইয়া",
    ],
    replies: [
      "জি ভাইয়া 😄💜",
      "বলো ভাইয়া 😎",
    ],
  },

  // ───────── END ─────────

  {
    match: [
      "take care",
      "খেয়াল রেখো",
      "খেয়াল রেখো",
    ],
    replies: [
      "তুমিও নিজের খেয়াল রেখো 💜🌸",
      "You too 😄💜",
    ],
  },

  {
    match: [
      "see you",
      "আবার দেখা হবে",
    ],
    replies: [
      "অবশ্যই 😄 আবার কথা হবে!",
      "See you soon 👋💜",
    ],
  },

  {
    match: [
      "good luck",
      "শুভকামনা",
    ],
    replies: [
      "Good luck! 🍀💜",
      "Best wishes 😄✨",
    ],
  },

  {
    match: ["all the best"],
    replies: [
      "All the best 😎✨",
      "Best of luck 💜🍀",
    ],
  },
];

// ═══════════════════════════════════════
// COOLDOWN
// ═══════════════════════════════════════

const cooldowns = new Map();

const COOLDOWN_TIME = 3000;

// ═══════════════════════════════════════
// FIND REPLY
// ═══════════════════════════════════════

function findReply(text) {
  const input = String(text || "")
    .trim()
    .toLowerCase();

  if (!input) {
    return null;
  }

  for (const item of replies) {
    for (const word of item.match) {
      const keyword = String(word)
        .trim()
        .toLowerCase();

      if (!keyword) continue;

      // Exact match
      if (input === keyword) {
        return randomReply(item.replies);
      }

      // Phrase match
      if (
        keyword.length >= 4 &&
        input.includes(keyword)
      ) {
        return randomReply(item.replies);
      }
    }
  }

  return null;
}

// ═══════════════════════════════════════
// HANDLE AUTOREPLY
// ═══════════════════════════════════════

async function handleAutoReply(
  sock,
  message,
  text,
  chatId,
) {
  try {
    if (
      !sock ||
      typeof sock.sendMessage !== "function"
    ) {
      return;
    }

    if (!message || !text || !chatId) {
      return;
    }

    // Group only
    if (!chatId.endsWith("@g.us")) {
      return;
    }

    const data = loadData();

    // Autoreply OFF
    if (!data[chatId]) {
      return;
    }

    const input = String(text).trim();

    if (!input) {
      return;
    }

    // Ignore commands
    if (
      input.startsWith(".") ||
      input.startsWith("/") ||
      input.startsWith("!")
    ) {
      return;
    }

    // Cooldown
    const now = Date.now();
    const lastReply = cooldowns.get(chatId) || 0;

    if (now - lastReply < COOLDOWN_TIME) {
      return;
    }

    const reply = findReply(input);

    if (!reply) {
      return;
    }

    cooldowns.set(chatId, now);

    await sock.sendMessage(
      chatId,
      {
        text: reply,
      },
      {
        quoted: message,
      },
    );
  } catch (error) {
    console.error(
      "[AUTOREPLY] Response error:",
      error.message,
    );
  }
}

// ═══════════════════════════════════════
// PLUGIN
// ═══════════════════════════════════════

module.exports = {
  command: "autoreply",
  aliases: ["ar"],
  category: "admin",

  description:
    "Enable or disable automatic group replies.",

  usage:
    ".autoreply on | off",

  groupOnly: true,
  adminOnly: true,

  async handler(
    sock,
    message,
    args = [],
    context = {},
  ) {
    try {
      const chatId =
        context.chatId ||
        message?.key?.remoteJid;

      if (!chatId) {
        return;
      }

      const command = args
        .join(" ")
        .trim()
        .toLowerCase();

      const data = loadData();

      // ═════════════════════════════
      // HELP
      // ═════════════════════════════

      if (!command) {
        return sock.sendMessage(
          chatId,
          {
            text:
              "╭─❖ *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ* ❖─╮\n" +
              "│\n" +
              "│ 🤖 *ᴀᴜᴛᴏ ʀᴇᴘʟʏ*\n" +
              "│\n" +
              "│ ├─ .autoreply on\n" +
              "│ └─ .autoreply off\n" +
              "│\n" +
              "│ 💾 Storage: File System\n" +
              "│ ⚡ API: Not Required\n" +
              "│ 💬 100+ Replies\n" +
              "│\n" +
              "╰──────────────────╯",
          },
          {
            quoted: message,
          },
        );
      }

      // ═════════════════════════════
      // ON
      // ═════════════════════════════

      if (command === "on") {
        data[chatId] = true;

        const saved = saveData(data);

        if (!saved) {
          return sock.sendMessage(
            chatId,
            {
              text:
                "❌ AutoReply setting save করা যায়নি।",
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
              "╭─❖ *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ* ❖─╮\n" +
              "│\n" +
              "│ ✅ *ᴀᴜᴛᴏʀᴇᴘʟʏ ᴇɴᴀʙʟᴇᴅ*\n" +
              "│\n" +
              "│ 🤖 No API Required\n" +
              "│ 💬 100+ Auto Replies\n" +
              "│ ⚡ Lightweight System\n" +
              "│\n" +
              "╰──────────────────╯",
          },
          {
            quoted: message,
          },
        );
      }

      // ═════════════════════════════
      // OFF
      // ═════════════════════════════

      if (command === "off") {
        delete data[chatId];

        const saved = saveData(data);

        if (!saved) {
          return sock.sendMessage(
            chatId,
            {
              text:
                "❌ AutoReply setting save করা যায়নি।",
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
              "╭─❖ *𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ* ❖─╮\n" +
              "│\n" +
              "│ ❌ *ᴀᴜᴛᴏʀᴇᴘʟʏ ᴅɪsᴀʙʟᴇᴅ*\n" +
              "│\n" +
              "╰──────────────────╯",
          },
          {
            quoted: message,
          },
        );
      }

      // ═════════════════════════════
      // INVALID
      // ═════════════════════════════

      return sock.sendMessage(
        chatId,
        {
          text:
            "❌ *Invalid command!*\n\n" +
            "Use:\n" +
            "`.autoreply on`\n" +
            "`.autoreply off`",
        },
        {
          quoted: message,
        },
      );
    } catch (error) {
      console.error(
        "[AUTOREPLY] Command error:",
        error.message,
      );
    }
  },

  handleAutoReply,
};
