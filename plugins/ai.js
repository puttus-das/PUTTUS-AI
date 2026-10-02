/*****************************************************************************
 *                                                                           *
 *                     Developed By Puttus Das                              *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/puttus-das                             *
 *  ▶️  WhatsApp : https://chat.whatsapp.com/FVLqJnjKPywKZiiMqi1XWH          *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029Vb7pmbEEwEjzdGSM4G3B    *
 *                                                                           *
 *    © 2026 puttus-das. All rights reserved.                               *
 *                                                                           *
 *****************************************************************************/

const axios = require("axios");
const fetch = require("node-fetch");

/* =========================================================
   PUTTUS VCARD
========================================================= */

function getPuttusVCardQuote() {
  const botJid = "919641092392@s.whatsapp.net";

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
   POWERED TEXT
========================================================= */

const poweredBy =
  "*ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*";

/* =========================================================
   AI PLUGIN
========================================================= */

module.exports = {
  command: "gpt",

  aliases: [
    "gemini",
    "ai",
    "chat",
  ],

  category: "ai",

  description:
    "Ask a question to AI (GPT or Gemini)",

  usage:
    ".gpt <question> or .gemini <question>",

  async handler(
    sock,
    message,
    args,
    context = {}
  ) {
    const chatId =
      context.chatId ||
      message.key.remoteJid;

    const command =
      (args[0] || "").toLowerCase();

    const query =
      args.join(" ").trim();

    /* =====================================================
       NO QUERY
    ===================================================== */

    if (!query) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ǫᴜᴇʀʏ ᴀғᴛᴇʀ .ɢᴘᴛ ᴏʀ .ɢᴇᴍɪɴɪ.*\n\n" +
            "╭─〔 *ᴇxᴀᴍᴘʟᴇ* 〕\n" +
            "╰❯ *.ɢᴘᴛ ᴡʀɪᴛᴇ ᴀ ʙᴀsɪᴄ ʜᴛᴍʟ ᴄᴏᴅᴇ*",
        },
        {
          quoted: message,
        }
      );

      return;
    }

    try {
      /* ===================================================
         REACTION
      =================================================== */

      await sock.sendMessage(
        chatId,
        {
          react: {
            text: "🤖",
            key: message.key,
          },
        }
      );

      /* ===================================================
         GPT
      =================================================== */

      if (command.startsWith("gpt")) {
        const response =
          await axios.get(
            `https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(
              query
            )}`
          );

        if (
          response.data &&
          response.data.status &&
          response.data.result
        ) {
          const answer =
            response.data.result;

          await sock.sendMessage(
            chatId,
            {
              text:
                answer +
                "\n\n" +
                poweredBy,
            },
            {
              quoted:
                getPuttusVCardQuote(),
            }
          );
        } else {
          throw new Error(
            "Invalid response from GPT API"
          );
        }

      /* ===================================================
         GEMINI
      =================================================== */

      } else if (
        command.startsWith("gemini")
      ) {
        const apis = [
          `https://vapis.my.id/api/gemini?q=${encodeURIComponent(query)}`,

          `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`,

          `https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(query)}`,

          `https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(query)}`,

          `https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${encodeURIComponent(query)}`,

          `https://api.giftedtech.my.id/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(query)}`,
        ];

        let answered = false;

        for (const api of apis) {
          try {
            const res =
              await fetch(api);

            const data =
              await res.json();

            const answer =
              data.message ||
              data.data ||
              data.answer ||
              data.result;

            if (answer) {
              await sock.sendMessage(
                chatId,
                {
                  text:
                    answer +
                    "\n\n" +
                    poweredBy,
                },
                {
                  quoted:
                    getPuttusVCardQuote(),
                }
              );

              answered = true;

              break;
            }
          } catch (e) {
            continue;
          }
        }

        if (!answered) {
          throw new Error(
            "All Gemini APIs failed"
          );
        }
      }

    } catch (error) {
      console.error(
        "AI Command Error:",
        error
      );

      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *ғᴀɪʟᴇᴅ ᴛᴏ ɢᴇᴛ ᴀɪ ʀᴇsᴘᴏɴsᴇ.*\n\n" +
            "*ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.*\n\n" +
            poweredBy,
        },
        {
          quoted:
            message,
        }
      );
    }
  },
};

/*****************************************************************************
 *                                                                           *
 *                     Developed By Puttus Das                              *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/puttus-das                             *
 *  ▶️  WhatsApp : https://chat.whatsapp.com/FVLqJnjKPywKZiiMqi1XWH          *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029Vb7pmbEEwEjzdGSM4G3B    *
 *                                                                           *
 *    © 2026 puttus-das. All rights reserved.                               *
 *                                                                           *
 *****************************************************************************/
