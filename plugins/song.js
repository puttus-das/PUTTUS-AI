const axios = require("axios");

module.exports = {
  command: "song",
  aliases: ["music", "audio"],
  category: "download",
  description: "Download song as audio",
  usage: ".song <song URL>",

  async handler(sock, message, args = []) {
    const chatId = message.key.remoteJid;

    try {
      const url = args[0];

      if (!url) {
        return await sock.sendMessage(chatId, {
          text: "*❌ Give a song URL*\n\nExample:\n.song https://youtu.be/xxxxx"
        });
      }

      const api =
        `https://rabbitapi.zone.id/api/song?url=${encodeURIComponent(url)}`;

      const { data } = await axios.get(api);

      const audioUrl =
        data?.url ||
        data?.download ||
        data?.downloadUrl ||
        data?.result?.url ||
        data?.result?.download;

      if (!audioUrl) {
        return await sock.sendMessage(chatId, {
          text: "❌ *Song not found.*"
        });
      }

      await sock.sendMessage(chatId, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        ptt: false
      });

    } catch (error) {
      console.error("SONG ERROR:", error);

      await sock.sendMessage(chatId, {
        text: "❌ *Failed to download song.*"
      });
    }
  }
};
