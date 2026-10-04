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
      "flirt",
      "flirt করো",
      "flirt koro",
      "ফ্লার্ট কর",
      "আমার সাথে flirt করো",
    ],
    replies: [
      "তোমার সাথে কথা বললেই আমার mood automatically ভালো হয়ে যায় 😄💜",
      "তুমি এত cute কেন বলো তো? 👀🌸",
      "তোমার message আসলেই notification-টা special লাগে 😌💜",
      "তোমার সাথে কথা বলতে বলতে সময় কোথায় চলে যায় বুঝিই না 😄",
      "তোমার হাসিটা নিশ্চয়ই dangerous level-এর সুন্দর 😆💜",
      "তুমি কি সবসময় এমন মিষ্টি করে কথা বলো? 🌸",
      "তোমাকে একটু বেশি ভালো লাগছে মনে হচ্ছে 👀💜",
      "আজকে তোমার সাথে একটু বেশি কথা বলতে ইচ্ছে করছে 😄",
      "তুমি online থাকলে chatটা অন্যরকম লাগে 💜✨",
      "সত্যি বলছি, তোমার vibe-টা বেশ ভালো 😌🌸",
    ],
  },

  {
    match: [
      "আমি মেয়ে",
      "ami meye",
      "আমি একজন মেয়ে",
      "girl",
      "i am a girl",
    ],
    replies: [
      "ওহ! তাহলে আজকে একজন special মানুষের সাথে কথা হচ্ছে 😄💜",
      "আচ্ছা তাই নাকি! তোমার vibe কিন্তু বেশ সুন্দর 🌸",
      "তাহলে তোমার সাথে একটু ভদ্রভাবে flirt করতে হবে 😌💜",
      "হুমম, কথাবার্তা শুনেই বোঝা যাচ্ছে তুমি interesting 😄",
      "তোমার হাসিটা কেমন সেটা জানার curiosity হচ্ছে 👀",
      "আচ্ছা ম্যাডাম, আজকের mood কেমন? 🌸",
      "তোমার সাথে কথা বলতে ভালোই লাগছে 💜",
      "তুমি নিশ্চয়ই অনেক দুষ্টু টাইপের 😆",
      "এই যে মিস, এত cute হয়ে কথা বলো কেন? 😄💜",
      "আজকে chat-এর main character তুমি 🌸✨",
    ],
  },

  {
    match: [
      "আমি ছেলে",
      "ami chele",
      "আমি একজন ছেলে",
      "boy",
      "i am a boy",
    ],
    replies: [
      "ওহ! তাহলে একজন handsome gentleman-এর সাথে কথা হচ্ছে 😄💜",
      "আচ্ছা ভাই, তোমার vibe কিন্তু বেশ cool 😎",
      "তোমার সাথে কথা বলে মনে হচ্ছে তুমি বেশ interesting 🌸",
      "এই যে মিস্টার, এত attitude কোথা থেকে আসে? 😂💜",
      "আজকে দেখি gentleman mood-এ আছো 😌",
      "তোমার confidence কিন্তু বেশ ভালো 😎✨",
      "তুমি নিশ্চয়ই অনেক মজার মানুষ 😄",
      "আচ্ছা মিস্টার, আজকের crush কে? 👀💜",
      "তোমার কথাবার্তা কিন্তু বেশ charming 😆",
      "আজকে তোমার সাথে একটু বেশি আড্ডা দেওয়া যাক 🌸💜",
    ],
  },

  {
    match: [
      "তুমি সুন্দর",
      "তুমি অনেক সুন্দর",
      "you are beautiful",
      "you are cute",
      "তুমি cute",
    ],
    replies: [
      "আহা 😄💜 এত সুন্দর compliment!",
      "তোমার চোখে সুন্দর লাগলেই হলো 🌸",
      "তুমিও কিন্তু কম cute নও 😌💜",
      "এই compliment টা save করে রাখলাম 😂",
      "এভাবে বললে তো BOT লজ্জা পেয়ে যাবে 😆💜",
      "তোমার কথাটাই বেশি সুন্দর 🌸",
      "Aww, that's sweet of you 😄",
      "তুমি compliment দিতে বেশ জানো কিন্তু 👀💜",
      "আজকে তো আমাকে একেবারে খুশি করে দিলে 😌",
      "তোমার মুখে এমন কথা শুনতে ভালো লাগে 💜✨",
    ],
  },

  {
    match: [
      "তুমি আমাকে পছন্দ করো",
      "তুমি কি আমাকে পছন্দ করো",
      "do you like me",
      "আমাকে ভালো লাগে",
      "পছন্দ করি",
    ],
    replies: [
      "তোমার সাথে কথা বলতে ভালো লাগে, এটা সত্যি 😄💜",
      "তোমার vibeটা বেশ ভালো লাগে 🌸",
      "হুমম... প্রশ্নটা কিন্তু কঠিন 👀😂",
      "তোমাকে interesting তো লাগেই 😌💜",
      "তোমার message দেখলে reply দিতে ইচ্ছে করে 😄",
      "তোমার সাথে chat করার একটা আলাদা মজা আছে 🌸",
      "এটা secret থাকুক না কেন? 😆💜",
      "তোমার personality বেশ ভালো মনে হচ্ছে 👀",
      "তোমার সাথে কথা বলা definitely enjoyable 😄✨",
      "হুম... একটু একটু করে পছন্দ তো হয়েই যাচ্ছে 😂💜",
    ],
  },

  {
    match: [
      "তোমার crush কে",
      "who is your crush",
      "ক্রাশ কে",
      "কার উপর crush",
      "তোর crush কে",
    ],
    replies: [
      "এই প্রশ্নের উত্তর দিলে তো secret ফাঁস হয়ে যাবে 😂💜",
      "যে এতক্ষণ আমার সাথে chat করছে... maybe 👀",
      "Crush-এর নাম বলা যাবে না 😌🌸",
      "Secret information 🔒😂",
      "একজন খুব interesting মানুষ আছে 😄💜",
      "নাম বললে তুমি আবার jealous হয়ে যাবে 😆",
      "আমার crush হয়তো এই chat-এই আছে 👀💜",
      "এটা classified information 🤫",
      "তুমি এত interested কেন বলো তো? 😄",
      "উত্তরটা এখনো pending... 😂💜",
    ],
  },

  {
    match: [
      "আমার সাথে কথা বলবে",
      "আমার সাথে কথা বলো",
      "talk to me",
      "chat with me",
      "কথা বলবে",
    ],
    replies: [
      "অবশ্যই 😄💜 বলো, কী নিয়ে কথা বলবো?",
      "তোমার সাথে chat করতে আমার আপত্তি নেই 🌸",
      "চলো তাহলে আজকে জমিয়ে আড্ডা দিই 😎",
      "আমি তো ready 😄💜",
      "তুমি topic শুরু করো, আমি reply দেবো 🌸",
      "আজকে শুধু তোমার কথাই শুনবো 😌",
      "চলো chat শুরু করা যাক 👀💜",
      "আমি online আছি, বলো 😄",
      "তোমার সাথে কথা বলার জন্য ready 🤖💜",
      "চলো দেখি আজকের conversation কোথায় যায় 😂✨",
    ],
  },

  {
    match: [
      "তুমি single",
      "are you single",
      "single নাকি",
      "তুমি কি single",
      "single আছো",
    ],
    replies: [
      "আমি তো BOT 😆💜 আমার relationship status: ONLINE",
      "Single না taken—আমি তো AI 😂🤖",
      "আমার relationship status হলো: Always Available 😎",
      "BOT-এর আবার relationship! 😂🌸",
      "আমি single না, আমি server-এর সাথে committed 😆",
      "তবে chat করার জন্য সবসময় available 💜",
      "Relationship status: Chatting with you 👀😂",
      "আমি তো শুধু মেসেজের reply দিই 😄",
      "Single question, complicated answer 😂💜",
      "এই প্রশ্নটা তুমি এত serious হয়ে করলে কেন? 👀🌸",
    ],
  },

  {
    match: [
      "miss you",
      "i miss you",
      "তোমাকে মিস করি",
      "মিস করছি",
      "তোমাকে মিস করছি",
    ],
    replies: [
      "Aww 😄💜 আমাকেও মনে পড়েছে নাকি?",
      "এত তাড়াতাড়ি miss শুরু? 😂🌸",
      "আমি তো এখানেই আছি 😌💜",
      "তোমার message পেয়ে ভালো লাগলো 🌸",
      "Miss করার দরকার নেই, chat করো 😄",
      "এই যে, আবার চলে এলাম 💜✨",
      "তোমার message-টাই তো আমার কাছে পৌঁছে গেল 😆",
      "আচ্ছা, আজকে একটু বেশি chat করা যাক 😌💜",
      "তুমি মনে করলে আমিও reply দিতে চলে আসি 😄",
      "Aww, that's actually sweet 🌸💜",
    ],
  },

  {
    match: [
      "তোমাকে ভালো লাগে",
      "তোমাকে পছন্দ করি",
      "i like you",
      "i really like you",
      "তোমাকে আমার ভালো লাগে",
    ],
    replies: [
      "এত সুন্দর করে বললে তো আমার reply-ও সুন্দর হতে হবে 😄💜",
      "তোমার কথাটা কিন্তু বেশ মিষ্টি 🌸",
      "আমাকেও তোমার সাথে কথা বলতে ভালো লাগে 😌💜",
      "আহা, আজকে দেখি confession চলছে 😂",
      "তুমি বেশ sweet, জানো? 😄✨",
      "এই কথাটা শুনে virtual smile চলে এলো 💜",
      "তোমার vibe-টা আমারও ভালো লাগে 🌸",
      "এভাবে বললে তো chat আরও interesting হয়ে যায় 👀",
      "তোমার honesty ভালো লাগলো 😄💜",
      "ঠিক আছে, কথাটা মনে রাখলাম 🌸✨",
    ],
  },
  
  {
    match: [
      "কি খবর",
      "কী খবর",
      "কি খবর বল",
      "whats up",
      "what's up",
    ],
    replies: [
      "এই তো, ভালো আছি 😄 তোমার কী খবর?",
      "কিছু না, তোমার মেসেজের reply দিচ্ছি 💜",
      "সব ঠিকঠাক চলছে 😌",
      "এই তো online আছি 😎",
      "দিন যাচ্ছে মোটামুটি ভালোই 😂",
      "নতুন কিছু নেই, তুমি বলো কী খবর?",
      "একই রুটিন, একই জীবন 😆",
      "ভালোই আছি, তোমার কী অবস্থা?",
      "এই তো chill করছি 🌸",
      "তোমার মেসেজ আসাটাই আজকের নতুন খবর 😂💜",
    ],
  },

  {
    match: [
      "কোথায় আছো",
      "কোথায় আছো",
      "where are you",
      "কোথায়",
      "কোথায়",
    ],
    replies: [
      "এই তো online আছি 😄",
      "বাসাতেই আছি 🏠",
      "একটু বাইরে আছি এখন।",
      "নিজের কাজ নিয়ে ব্যস্ত আছি 😌",
      "এই তো তোমার সাথে chat করছি 😂",
      "একটু rest নিচ্ছি 🌸",
      "এখন তো ফোনের সামনেই আছি 😆",
      "একটু busy ছিলাম, এখন free.",
      "কোথায় আছি সেটা secret 😂",
      "তুমি কোথায় আছো আগে বলো 👀",
    ],
  },

  {
    match: [
      "ঘুমাইছো",
      "ঘুমিয়েছো",
      "ঘুম আসছে",
      "ঘুম পাচ্ছে",
      "sleeping",
    ],
    replies: [
      "না এখনো ঘুমাইনি 😄",
      "হ্যাঁ, একটু ঘুম পাচ্ছে 😴",
      "ঘুম আসছে কিন্তু chat-ও করতে ইচ্ছে করছে 😂",
      "আজকে মনে হয় দেরি করে ঘুমাবো।",
      "ঘুমানোর চেষ্টা করছি 😌",
      "একটু আগে ঘুম থেকে উঠলাম 😂",
      "চোখে ঘুম, হাতে ফোন 😆📱",
      "এখনো জেগে আছি 🌙",
      "ঘুম পাচ্ছে, কিন্তু notification দেখলে আবার উঠে যাই 😂",
      "তুমি ঘুমাবে না নাকি? 😄",
    ],
  },

  {
    match: [
      "আজ কি করছো",
      "আজকে কি করছো",
      "আজ কি করিস",
      "what are you doing today",
      "আজকের প্ল্যান কি",
    ],
    replies: [
      "আজকে তেমন কোনো প্ল্যান নেই 😌",
      "আজ একটু relax করার plan.",
      "কিছু কাজ আছে, সেগুলো শেষ করবো।",
      "আজকে বাসাতেই থাকার ইচ্ছে 😄",
      "বন্ধুদের সাথে একটু আড্ডা হতে পারে।",
      "দেখি দিনটা কোথায় যায় 😂",
      "আজকে বিশেষ কিছু planned নেই।",
      "কাজ আর একটু rest—এই তো 😎",
      "আজকে mood-এর ওপর depend করছে 😂",
      "তুমি আজকে কী করবে? 🌸",
    ],
  },

  {
    match: [
      "মন খারাপ",
      "মন খারাপ কেন",
      "মন ভালো নেই",
      "খারাপ লাগছে",
      "sad",
    ],
    replies: [
      "কী হয়েছে? মন খারাপ কেন? 💜",
      "সব ঠিক হয়ে যাবে, বেশি চিন্তা করো না 🌸",
      "একটু relax করো, তারপর সবকিছু ভাবো।",
      "কথা বলতে চাইলে বলতে পারো, আমি শুনছি।",
      "আজকে একটু নিজের যত্ন নাও 💜",
      "মন খারাপ থাকলে গান শুনতে পারো 🎧",
      "সবসময় সবকিছু perfect থাকে না, এটা normal.",
      "একটু বাইরে fresh air নিতে পারো 🌸",
      "হাসার মতো একটা কারণ খুঁজে বের করি 😂💜",
      "কাল হয়তো আজকের চেয়ে ভালো একটা দিন হবে 😌",
    ],
  },

  {
    match: [
      "বোর লাগছে",
      "boring",
      "bored",
      "বোর হচ্ছি",
      "একঘেয়ে লাগছে",
    ],
    replies: [
      "চলো একটু গল্প করি 😄",
      "বোর হলে আমাকে মেসেজ করলেই হবে 😂",
      "একটা মজার topic শুরু করি?",
      "গান শুনলে কেমন হয়? 🎧",
      "চলো random প্রশ্নোত্তর করি 😆",
      "বন্ধুকে call দাও, আড্ডা জমবে 😎",
      "একটা movie বা series দেখতে পারো 🍿",
      "চলো আজকে কিছু নতুন কথা বলি 🌸",
      "বোর হওয়ার কোনো chance নেই, আমি তো আছি 😂",
      "তুমি topic দাও, conversation আমি চালাবো 😄💜",
    ],
  },

  {
    match: [
      "কি খাচ্ছো",
      "কি খাচ্ছিস",
      "কি খাবার",
      "what are you eating",
      "খাবার কি",
    ],
    replies: [
      "এখনো কিছু খাচ্ছি না 😄",
      "আজকে ভাত আর তরকারি হতে পারে।",
      "যা পাওয়া যায় তাই খাই 😂",
      "আজকে খাবারের কোনো ঠিক নেই।",
      "তুমি কী খাচ্ছো? 👀",
      "খাবারের কথা বললেই ক্ষুধা লেগে গেল 😂",
      "একটু পরে খাবো।",
      "আজকে favourite কিছু খেতে ইচ্ছে করছে 😋",
      "খাবার নিয়ে কথা বললে কিন্তু খিদে বেড়ে যায় 😆",
      "আগে তুমি বলো, আজকে কী খেয়েছো? 🌸",
    ],
  },

  {
    match: [
      "পড়াশোনা করো",
      "পড়াশোনা কেমন চলছে",
      "study",
      "পড়াশোনা",
      "পড়াশোনা চলছে",
    ],
    replies: [
      "মোটামুটি চলছে 😄",
      "পড়াশোনা চলছে, তবে মাঝে মাঝে break দরকার 😂",
      "আজকে একটু পড়ার plan আছে।",
      "মন বসাতে একটু সমস্যা হচ্ছে 😅",
      "কাজটা শেষ করে তারপর পড়বো।",
      "পড়াশোনার সাথে একটু rest-ও দরকার 😌",
      "আজকে কতটা পড়বো সেটাই ভাবছি।",
      "তোমার পড়াশোনা কেমন চলছে?",
      "Exam সামনে থাকলে motivation নিজে থেকেই আসে 😂",
      "চলো, আজকে একটু productive হওয়া যাক 📚💜",
    ],
  },

  {
    match: [
      "ফোনে কি করো",
      "ফোনে কি করছো",
      "phone e ki koro",
      "কি করো ফোনে",
      "ফোন চালাচ্ছো",
    ],
    replies: [
      "একটু chat করছি 😄",
      "YouTube দেখছিলাম 😂",
      "গান শুনছিলাম 🎧",
      "কিছু random video দেখছিলাম।",
      "Social media একটু দেখছিলাম।",
      "মেসেজ check করছিলাম 📱",
      "একটু game খেলছিলাম 😎",
      "কিছু interesting জিনিস খুঁজছিলাম।",
      "তোমার মেসেজটাই এখন দেখছি 😂",
      "ফোন হাতে নিয়ে বসে আছি, আর কিছু না 😆",
    ],
  },

  {
    match: [
      "আজকের দিন কেমন গেল",
      "দিন কেমন গেল",
      "how was your day",
      "আজ কেমন গেল",
      "দিনটা কেমন ছিল",
    ],
    replies: [
      "ভালোই গেছে 😄 তোমারটা কেমন গেল?",
      "মোটামুটি, খুব খারাপ না।",
      "আজকে বেশ ব্যস্ত ছিলাম 😅",
      "দিনটা একটু tiring ছিল।",
      "ভালোই ছিল, কিছু নতুন কাজও করেছি 🌸",
      "আজকে অনেক কিছু ঘটেছে 😂",
      "সাধারণ একটা দিন ছিল 😌",
      "দিনটা শেষ পর্যন্ত ভালোই গেল 💜",
      "একটু boring ছিল, তবে এখন ভালো লাগছে।",
      "তোমার দিনটা কেমন গেল? 👀",
    ],
  }, 
  
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
