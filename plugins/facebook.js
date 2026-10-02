const axios = require("axios");

const API_URL = "https://fdown.isuru.eu.org/download";

const axiosConfig = {
  timeout: 120000,
  maxContentLength: 100 * 1024 * 1024,
  maxBodyLength: 100 * 1024 * 1024,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
  },
};

function isFacebookUrl(url) {
  return /^(https?:\/\/)?(www\.|m\.|mbasic\.)?(facebook\.com|fb\.watch)\//i.test(
    url.trim(),
  );
}

function cleanFacebookUrl(url) {
  return url
    .trim()
    .replace(/[<>]/g, "")
    .split("\n")[0]
    .trim();
}

function extractVideoUrl(data) {
  if (!data) return null;

  const possible = [
    data.download_url,
    data.downloadUrl,
    data.video_url,
    data.videoUrl,
    data.url,
    data.data?.download_url,
    data.data?.downloadUrl,
    data.data?.video_url,
    data.data?.videoUrl,
    data.data?.url,
    data.result?.download_url,
    data.result?.downloadUrl,
    data.result?.video_url,
    data.result?.videoUrl,
    data.result?.url,
    data.video_info?.download_url,
    data.video_info?.url,
    data.videoInfo?.download_url,
    data.videoInfo?.url,
  ];

  for (const item of possible) {
    if (
      typeof item === "string" &&
      /^https?:\/\//i.test(item)
    ) {
      return item;
    }
  }

  const found = [];

  function scan(value, depth = 0) {
    if (!value || depth > 8) return;

    if (typeof value === "string") {
      if (
        /^https?:\/\//i.test(value) &&
        (
          /\.mp4/i.test(value) ||
          /fbcdn/i.test(value) ||
          /video/i.test(value)
        )
      ) {
        found.push(value);
      }
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        scan(item, depth + 1);
      }
      return;
    }

    if (typeof value === "object") {
      for (const [key, val] of Object.entries(value)) {
        const lowerKey = key.toLowerCase();

        if (
          typeof val === "string" &&
          /^https?:\/\//i.test(val) &&
          (
            lowerKey.includes("url") ||
            lowerKey.includes("video") ||
            lowerKey.includes("download") ||
            lowerKey.includes("stream")
          )
        ) {
          found.push(val);
        }

        scan(val, depth + 1);
      }
    }
  }

  scan(data);

  return found[0] || null;
}

function getTitle(data) {
  return (
    data?.video_info?.title ||
    data?.videoInfo?.title ||
    data?.data?.video_info?.title ||
    data?.data?.title ||
    data?.title ||
    "Facebook Video"
  );
}

function getQuality(data) {
  return (
    data?.video_info?.quality ||
    data?.videoInfo?.quality ||
    data?.quality ||
    data?.data?.quality ||
    "Best"
  );
}

module.exports = {
  command: "facebook",
  aliases: ["fb", "fbdl"],
  category: "download",
  description: "Download Facebook videos",
  usage: ".fb <facebook video link>",

  async handler(sock, message, args = [], context = {}) {
    const chatId =
      context?.chatId ||
      message?.key?.remoteJid;

    try {
      let url = Array.isArray(args)
        ? args.join(" ").trim()
        : "";

      if (!url) {
        url =
          message?.message?.conversation ||
          message?.message?.extendedTextMessage?.text ||
          "";
      }

      url = cleanFacebookUrl(url);

      url = url
        .replace(
          /^\.?(facebook|fb|fbdl)\s*/i,
          "",
        )
        .trim();

      if (!url) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "📘 *Facebook Downloader*\n\n" +
              "❯ *.fb <Facebook video link>*",
          },
          {
            quoted: message,
          },
        );
      }

      if (!isFacebookUrl(url)) {
        return await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *Invalid Facebook link!*\n\n" +
              "Send a public Facebook video, Reel or fb.watch link.",
          },
          {
            quoted: message,
          },
        );
      }

      await sock.sendMessage(chatId, {
        react: {
          text: "🔄",
          key: message.key,
        },
      });

      await sock.sendMessage(
        chatId,
        {
          text:
            "⏳ *Downloading...*\n\n" +
            "𝙋𝙐𝙏𝙏𝙐𝙎-𝘼𝙄\n" +
            "Please wait...",
        },
        {
          quoted: message,
        },
      );

      console.log("[PUTTUS FB] Processing:", url);

      let response;

      try {
        response = await axios.post(
          API_URL,
          {
            url,
            quality: "best",
          },
          axiosConfig,
        );
      } catch (apiError) {
        console.error(
          "[PUTTUS FB] API ERROR:",
          apiError?.response?.data ||
            apiError?.message,
        );

        if (apiError?.response?.status === 429) {
          throw new Error(
            "Facebook downloader rate limit reached",
          );
        }

        throw new Error(
          "Facebook downloader API failed",
        );
      }

      const data = response?.data;

      console.log(
        "[PUTTUS FB] API RESPONSE:",
        JSON.stringify(data, null, 2),
      );

      if (!data) {
        throw new Error("Empty API response");
      }

      if (
        data.status === "error" ||
        data.success === false
      ) {
        throw new Error(
          data.message ||
            data.error ||
            "Facebook video could not be processed",
        );
      }

      const videoUrl = extractVideoUrl(data);

      if (
        !videoUrl ||
        !/^https?:\/\//i.test(videoUrl)
      ) {
        throw new Error(
          "API returned no video URL",
        );
      }

      const title = getTitle(data);
      const quality = getQuality(data);

      const caption =
        "📘 *Facebook Downloader*\n\n" +
        `🎞 *Quality:* ${quality}\n` +
        `📝 *Title:* ${title}\n\n` +
        "🤖 *𝙋𝙐𝙏𝙏𝙐𝙎-𝘼𝙄*";

      await sock.sendMessage(
        chatId,
        {
          video: {
            url: videoUrl,
          },
          mimetype: "video/mp4",
          caption,
          fileName: "PUTTUS-Facebook.mp4",
        },
        {
          quoted: message,
        },
      );

      await sock.sendMessage(chatId, {
        react: {
          text: "✅",
          key: message.key,
        },
      });

      console.log(
        "[PUTTUS FB] Download sent successfully",
      );
    } catch (error) {
      console.error(
        "[PUTTUS FB ERROR]",
        error?.message || error,
      );

      try {
        await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *Facebook Download Failed!*\n\n" +
              "Possible reasons:\n" +
              "❯ Video is private\n" +
              "❯ Facebook link is invalid\n" +
              "❯ Downloader service is busy\n" +
              "❯ Video is not accessible publicly\n\n" +
              "💡 Try a public Facebook video/Reel link.",
          },
          {
            quoted: message,
          },
        );

        await sock.sendMessage(chatId, {
          react: {
            text: "❌",
            key: message.key,
          },
        });
      } catch (sendError) {
        console.error(
          "[PUTTUS FB] Error message failed:",
          sendError?.message,
        );
      }
    }
  },
};
