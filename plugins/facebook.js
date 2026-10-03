const axios = require("axios");

module.exports = {
  name: "facebook",
  alias: ["fb", "fbdl"],
  category: "download",
  description: "Download Facebook video",
  usage: ".facebook <Facebook URL>",

  async execute({ bot, message, args }) {
    try {
      const url = args?.[0];

      if (!url) {
        return await message.reply(
          "❌ *Facebook video URL দাও!*\n\nExample:\n.facebook https://www.facebook.com/..."
        );
      }

      const apiKey = process.env.SAVENOW_API_KEY;

      if (!apiKey) {
        return await message.reply(
          "❌ *SaveNow API key সেট করা নেই!*"
        );
      }

      await message.reply("⏳ *Facebook Video Downloading...*");

      const apiUrl =
        `https://p.savenow.to/api/v2/download` +
        `?format=mp4` +
        `&url=${encodeURIComponent(url)}` +
        `&apikey=${encodeURIComponent(apiKey)}`;

      const response = await axios.get(apiUrl);
      const data = response.data;

      console.log("SaveNow Facebook Response:", data);

      const downloadUrl =
        data?.downloadUrl ||
        data?.download_url ||
        data?.url ||
        data?.result?.downloadUrl ||
        data?.result?.download_url ||
        data?.result?.url;

      if (!downloadUrl) {
        return await message.reply(
          "❌ *Facebook video download link পাওয়া যায়নি.*"
        );
      }

      await bot.sendMessage(
        message.key.remoteJid,
        {
          video: {
            url: downloadUrl
          },
          mimetype: "video/mp4",
          caption:
            "╭─〔 *𝐏ᴜᴛᴛᴜs-Bᴏᴛ* 〕─╮\n" +
            "│ 📥 *Facebook Video*\n" +
            "│\n" +
            "│ ⚡ Downloaded Successfully\n" +
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
        error?.response?.data || error
      );

      await message.reply(
        "❌ *Failed to download Facebook video.*\n\nPlease try again later."
      );
    }
  }
};
