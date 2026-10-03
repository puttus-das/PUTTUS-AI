const settings = require("../settings");

const API =
  "https://rabbitapi.zone.id/api/insta";

module.exports = {
  command: "ig",
  aliases: ["instagram", "insta"],
  category: "downloader",
  description: "Download Instagram video",
  usage: ".ig <Instagram video/reel URL>",

  async handler(
    sock,
    message,
    args = [],
    context = {}
  ) {
    const chatId =
      context?.chatId ||
      message?.key?.remoteJid;

    if (!chatId) return;

    const url = args.join(" ").trim();

    const prefix =
      settings?.prefixes?.[0] || ".";

    if (!url) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            `❌ *Instagram URL dao!*\n\n` +
            `Example:\n` +
            `*${prefix}ig https://www.instagram.com/reel/...*`,
        },
        {
          quoted: message,
        }
      );
    }

    if (
      !/instagram\.com/i.test(url)
    ) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            `❌ *Invalid Instagram URL!*\n\n` +
            `Instagram video/reel link dao.`,
        },
        {
          quoted: message,
        }
      );
    }

    try {
      await sock.sendMessage(
        chatId,
        {
          react: {
            text: "📥",
            key: message.key,
          },
        }
      );

      const apiUrl =
        `${API}?url=${encodeURIComponent(url)}`;

      const response =
        await fetch(apiUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "PUTTUS-AI",
          },
        });

      if (!response.ok) {
        throw new Error(
          `Instagram API HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      if (
        data?.status !== true ||
        !data?.url
      ) {
        throw new Error(
          data?.message ||
          data?.response?.message ||
          "Instagram video URL পাওয়া যায়নি"
        );
      }

      await sock.sendMessage(
        chatId,
        {
          video: {
            url: data.url,
          },

          mimetype:
            "video/mp4",

          caption:
            `╭─〔 *𝐏ᴜᴛᴛᴜs-Bᴏᴛ* 〕─╮\n` +
            `│ 📥 *Instagram Video*\n` +
            `│\n` +
            `│ ⚡ Downloaded Successfully\n` +
            `╰──────────────────╯\n\n` +
            `*Powered by ⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜*`,
        }
      );

      await sock.sendMessage(
        chatId,
        {
          react: {
            text: "✅",
            key: message.key,
          },
        }
      );

    } catch (error) {
      console.error(
        "PUTTUS-AI IG ERROR:",
        error
      );

      try {
        await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *Instagram Download Failed!*\n\n` +
              `ভিডিওটি পাওয়া যায়নি অথবা API সমস্যা করছে।\n\n` +
              `আবার চেষ্টা করো।`,
          },
          {
            quoted: message,
          }
        );
      } catch (_) {}

      try {
        await sock.sendMessage(
          chatId,
          {
            react: {
              text: "❌",
              key: message.key,
            },
          }
        );
      } catch (_) {}
    }
  },
};
