const axios = require("axios");

module.exports = {
  name: "facebook",
  alias: ["fb", "fbdl"],
  category: "download",
  description: "Download Facebook video",

  async execute({ bot, message, args }) {
    try {
      const url = args?.[0];

      if (!url) {
        return await message.reply(
          "❌ *Facebook video URL দাও!*\n\n" +
          "Example:\n" +
          ".facebook https://www.facebook.com/..."
        );
      }

      await message.reply("⏳ *Facebook Video Downloading...*");

      const apiUrl =
        `https://rabbitapi.zone.id/api/dwnall?url=${encodeURIComponent(url)}`;

      const { data } = await axios.get(apiUrl, {
        timeout: 60000
      });

      if (!data?.success || !data?.result) {
        return await message.reply(
          `❌ *Facebook video download failed.*\n\n` +
          `${data?.message || "Video পাওয়া যায়নি।"}`
        );
      }

      const { title, thumbnail, ss, hd } = data.result;

      // Prefer HD, fallback to SD
      const videoUrl = hd || ss;

      if (!videoUrl) {
        return await message.reply(
          "❌ *Video download link পাওয়া যায়নি.*"
        );
      }

      await bot.sendMessage(
        message.key.remoteJid,
        {
          video: {
            url: videoUrl
          },
          mimetype: "video/mp4",
          caption:
            "╭─〔 *𝐏ᴜᴛᴛᴜs-Bᴏᴛ* 〕─╮\n" +
            "│ 📥 *Facebook Video*\n" +
            "│\n" +
            `│ 🎬 ${title || "Facebook Video"}\n` +
            "│\n" +
            "│ ⚡ *Downloaded Successfully*\n" +
            "╰──────────────────╯\n\n" +
            "*Powered by ⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜*"
        },
        {
          quoted: message
        }
      );

    } catch (error) {
      console.error(
        "FACEBOOK ERROR:",
        error?.response?.data || error.message || error
      );

      await message.reply(
        "❌ *Failed to download Facebook video.*\n\n" +
        "Please try again later."
      );
    }
  }
};
