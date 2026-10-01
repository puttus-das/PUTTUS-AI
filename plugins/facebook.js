const axios = require("axios");

module.exports = {
command: "facebook",
aliases: ["fb", "fbdl"],
category: "download",
description: "Download Facebook videos",
usage: ".fb <facebook video link>",

async handler(sock, message, args = [], context = {}) {
const chatId = context.chatId || message.key.remoteJid;

try {  
  /* =========================================================  
     PUTTUS VCARD  
  ========================================================= */  

  const botJid = "919641092392@s.whatsapp.net";  

  const vcard =  
    "BEGIN:VCARD\n" +  
    "VERSION:3.0\n" +  
    "N:PUTTUS;BOT;;;\n" +  
    "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +  
    "ORG:PUTTUS BOT\n" +  
    "TEL;TYPE=CELL;TYPE=VOICE;waid=919641092392:+919641092392\n" +  
    "END:VCARD";  

  const statusQuote = {  
    key: {  
      remoteJid: "status@broadcast",  
      fromMe: false,  
      id: "PUTTUS-FB-" + Date.now(),  
      participant: botJid,  
    },  
    message: {  
      contactMessage: {  
        displayName: "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",  
        vcard: vcard,  
      },  
    },  
  };  

  /* =========================================================  
     GET RAW MESSAGE TEXT  
  ========================================================= */  

  function getMessageText(msg) {  
    const m = msg?.message;  

    if (!m) return "";  

    return (  
      m.conversation ||  
      m.extendedTextMessage?.text ||  
      m.imageMessage?.caption ||  
      m.videoMessage?.caption ||  
      m.documentMessage?.caption ||  
      m.buttonsResponseMessage?.selectedButtonId ||  
      m.listResponseMessage?.singleSelectReply?.selectedRowId ||  
      ""  
    );  
  }  

  /* =========================================================  
     FIND FACEBOOK URL  
  ========================================================= */  

  const rawText = getMessageText(message);  

  const argText = Array.isArray(args)  
    ? args.join(" ")  
    : String(args || "");  

  const combinedText = `${argText} ${rawText}`.trim();  

  const urlMatch = combinedText.match(  
    /https?:\/\/(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.watch)\/[^\s]+/i  
  );  

  const url = urlMatch  
    ? urlMatch[0].replace(/[)>.,]+$/, "")  
    : "";  

  console.log("[PUTTUS FB URL]", url);  

  /* =========================================================  
     NO URL  
  ========================================================= */  

  if (!url) {  
    return await sock.sendMessage(  
      chatId,  
      {  
        text:  
          "📘 *⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜*\n\n" +  
          "❯ *Usage:* .fb <Facebook video link>\n\n" +  
          "❯ *Example:*\n" +  
          "*.fb https://www.facebook.com/share/r/xxxx/*",  
      },  
      {  
        quoted: statusQuote,  
      }  
    );  
  }  

  /* =========================================================  
     FACEBOOK URL CHECK  
  ========================================================= */  

  if (!/(facebook\.com|fb\.watch)/i.test(url)) {  
    return await sock.sendMessage(  
      chatId,  
      {  
        text:  
          "❌ *Invalid Facebook Link*\n\n" +  
          "Please send a valid Facebook video or Reel URL.",  
      },  
      {  
        quoted: statusQuote,  
      }  
    );  
  }  

  /* =========================================================  
     REACTION  
  ========================================================= */  

  await sock.sendMessage(chatId, {  
    react: {  
      text: "🔄",  
      key: message.key,  
    },  
  });  

  /* =========================================================  
     RABBIT API  
  ========================================================= */  

  const apiUrl = "https://rabbitapi.zone.id/api/fb";  

  const response = await axios.get(apiUrl, {  
    params: {  
      url: url,  
    },  
    timeout: 60000,  
    headers: {  
      "User-Agent":  
        "Mozilla/5.0 (Linux; Android 10; Mobile) " +  
        "AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36",  
      Accept: "application/json",  
    },  
  });  

  const data = response?.data;  

  console.log(  
    "[PUTTUS FB API RESPONSE]",  
    JSON.stringify(data, null, 2)  
  );  

  /* =========================================================  
     API STATUS  
  ========================================================= */  

  if (!data || data.status !== true) {  
    throw new Error("Rabbit API returned status false");  
  }  

  /* =========================================================  
     HD / SD  
  ========================================================= */  

  const hdUrl =  
    typeof data.hd === "string" &&  
    /^https?:\/\//i.test(data.hd)  
      ? data.hd  
      : null;  

  const sdUrl =  
    typeof data.sd === "string" &&  
    /^https?:\/\//i.test(data.sd)  
      ? data.sd  
      : null;  

  const videoUrl = hdUrl || sdUrl;  

  const quality = hdUrl ? "HD" : "SD";  

  if (!videoUrl) {  
    throw new Error(  
      "Rabbit API returned no HD or SD video URL"  
    );  
  }  

  /* =========================================================  
     TITLE  
  ========================================================= */  

  let title =  
    typeof data.title === "string"  
      ? data.title.trim()  
      : "Facebook Video";  

  if (title.length > 500) {  
    title = title.substring(0, 500);  
  }  

  /* =========================================================  
     DOWNLOAD VIDEO  
  ========================================================= */  

  await sock.sendMessage(  
    chatId,  
    {  
      video: {  
        url: videoUrl,  
      },  
      mimetype: "video/mp4",  
      caption:  
        "📘 *⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜*\n\n" +  
        `🎬 *${title}*\n\n` +  
        `🎞 Quality: *${quality}*\n` +  
        `👤 Creator: *${data.creator || "Rabbit API"}*\n\n` +  
        "> *_Downloaded by PUTTUS-AI_*",  
    },  
    {  
      quoted: statusQuote,  
    }  
  );  

  /* =========================================================  
     SUCCESS  
  ========================================================= */  

  await sock.sendMessage(chatId, {  
    react: {  
      text: "✅",  
      key: message.key,  
    },  
  });  

} catch (error) {  
  console.error(  
    "[PUTTUS-AI FACEBOOK ERROR]",  
    error?.response?.data ||  
      error?.message ||  
      error  
  );  

  try {  
    await sock.sendMessage(chatId, {  
      react: {  
        text: "❌",  
        key: message.key,  
      },  
    });  

    await sock.sendMessage(  
      chatId,  
      {  
        text:  
          "❌ *Facebook Download Failed*\n\n" +  
          "The Facebook video could not be downloaded right now.\n\n" +  
          "💡 Try another Facebook/Reel link.",  
      },  
      {  
        quoted: message,  
      }  
    );  
  } catch (sendError) {  
    console.error(  
      "[PUTTUS-AI FACEBOOK SEND ERROR]",  
      sendError?.message || sendError  
    );  
  }  
}

},
};
