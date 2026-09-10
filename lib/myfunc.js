const {
  proto,
  delay,
  getContentType,
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const Crypto = require("crypto");
const moment = require("moment-timezone");
const util = require("util");
const Jimp = require("jimp");

function unixTimestampSeconds(date = new Date()) {
  return Math.floor(date.getTime() / 1000);
}

exports.unixTimestampSeconds = unixTimestampSeconds;

exports.generateMessageTag = (epoch) => {
  let tag = unixTimestampSeconds().toString();

  if (epoch) {
    tag += ".--" + epoch;
  }

  return tag;
};

exports.processTime = (timestamp, now) => {
  return moment
    .duration(now - moment(timestamp * 1000))
    .asSeconds();
};

exports.getRandom = (extension = "") => {
  return `${Math.floor(Math.random() * 10000)}${extension}`;
};

async function requestData(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 Chrome/120 Safari/537.36",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(
      `Request failed with HTTP ${response.status}`,
    );
  }

  return response;
}

exports.getBuffer = async (url, options = {}) => {
  try {
    const response = await requestData(url, options);
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    return error;
  }
};

exports.getImg = async (url, options = {}) => {
  try {
    const response = await requestData(url, options);
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    return error;
  }
};

exports.fetchJson = async (url, options = {}) => {
  try {
    const response = await requestData(url, options);
    return await response.json();
  } catch (error) {
    return error;
  }
};

exports.runtime = (seconds) => {
  seconds = Number(seconds);

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(
    (seconds % 86400) / 3600,
  );
  const minutes = Math.floor(
    (seconds % 3600) / 60,
  );
  const remainingSeconds = Math.floor(seconds % 60);

  const result = [];

  if (days > 0) {
    result.push(`${days} day${days === 1 ? "" : "s"}`);
  }

  if (hours > 0) {
    result.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  }

  if (minutes > 0) {
    result.push(
      `${minutes} minute${minutes === 1 ? "" : "s"}`,
    );
  }

  if (remainingSeconds > 0 || result.length === 0) {
    result.push(
      `${remainingSeconds} second${
        remainingSeconds === 1 ? "" : "s"
      }`,
    );
  }

  return result.join(", ");
};

exports.clockString = (milliseconds) => {
  if (isNaN(milliseconds)) {
    return "--:--:--";
  }

  const hours = Math.floor(milliseconds / 3600000);
  const minutes =
    Math.floor(milliseconds / 60000) % 60;
  const seconds =
    Math.floor(milliseconds / 1000) % 60;

  return [hours, minutes, seconds]
    .map((value) =>
      String(value).padStart(2, "0"),
    )
    .join(":");
};

exports.sleep = (milliseconds) => {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

exports.isUrl = (url = "") => {
  return /https?:\/\/[^\s]+/i.test(String(url));
};

exports.getTime = (
  format = "HH:mm:ss",
  date = new Date(),
) => {
  return moment(date)
    .tz("Asia/Kolkata")
    .locale("en")
    .format(format);
};

exports.formatDate = (
  value,
  locale = "en",
) => {
  return new Date(value).toLocaleString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
};

exports.tanggal = (value) => {
  return new Date(value).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
};

exports.jam = (
  value = new Date(),
  options = {},
) => {
  const format = options.format || "HH:mm";
  const timeZone =
    options.timeZone || "Asia/Kolkata";

  return moment(value)
    .tz(timeZone)
    .format(format);
};

exports.formatp = (bytes) => {
  if (!bytes || bytes < 1024) {
    return `${bytes || 0} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes;
  let unit = "B";

  for (const nextUnit of units) {
    size /= 1024;

    if (size < 1024) {
      unit = nextUnit;
      break;
    }
  }

  return `${size.toFixed(2)} ${unit}`;
};

exports.json = (value) => {
  return JSON.stringify(value, null, 2);
};

exports.logic = (check, inputs, outputs) => {
  if (inputs.length !== outputs.length) {
    throw new Error(
      "Input and Output must have same length",
    );
  }

  for (let index = 0; index < inputs.length; index++) {
    if (
      util.isDeepStrictEqual(
        check,
        inputs[index],
      )
    ) {
      return outputs[index];
    }
  }

  return null;
};

exports.generateProfilePicture = async (
  buffer,
) => {
  const image = await Jimp.read(buffer);

  const width = image.getWidth();
  const height = image.getHeight();
  const size = Math.min(width, height);

  const cropped = image.crop({
    x: Math.floor((width - size) / 2),
    y: Math.floor((height - size) / 2),
    w: size,
    h: size,
  });

  const output = await cropped
    .resize({
      w: 720,
      h: 720,
    })
    .getBuffer("image/jpeg");

  return {
    img: output,
    preview: output,
  };
};

exports.bytesToSize = (
  bytes,
  decimals = 2,
) => {
  if (!bytes || bytes === 0) {
    return "0 Bytes";
  }

  const base = 1024;
  const places = decimals < 0 ? 0 : decimals;
  const units = [
    "Bytes",
    "KB",
    "MB",
    "GB",
    "TB",
    "PB",
    "EB",
    "ZB",
    "YB",
  ];

  const index = Math.floor(
    Math.log(bytes) / Math.log(base),
  );

  return (
    parseFloat(
      (bytes / Math.pow(base, index)).toFixed(
        places,
      ),
    ) +
    " " +
    units[index]
  );
};

exports.getSizeMedia = async (value) => {
  if (typeof value === "string" && /^https?:\/\//i.test(value)) {
    const response = await requestData(value);
    const length = Number(
      response.headers.get("content-length") || 0,
    );

    return exports.bytesToSize(length, 3);
  }

  if (Buffer.isBuffer(value)) {
    return exports.bytesToSize(value.length, 3);
  }

  throw new Error("Invalid media value");
};

exports.parseMention = (text = "") => {
  return [
    ...String(text).matchAll(
      /@([0-9]{5,16}|0)/g,
    ),
  ].map((match) => {
    return `${match[1]}@s.whatsapp.net`;
  });
};

exports.getGroupAdmins = (participants = []) => {
  return participants
    .filter(
      (participant) =>
        participant.admin === "admin" ||
        participant.admin === "superadmin",
    )
    .map((participant) => participant.id);
};

exports.smsg = (client, message, store) => {
  if (!message) {
    return message;
  }

  const messageInfo = proto.WebMessageInfo;
  const m = message;

  if (m.key) {
    m.id = m.key.id;
    m.isBaileys =
      m.id?.startsWith("BAE5") &&
      m.id?.length === 16;

    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.isGroup = Boolean(
      m.chat?.endsWith("@g.us"),
    );

    m.sender = client.decodeJid(
      (m.fromMe && client.user?.id) ||
        m.participant ||
        m.key.participant ||
        m.chat ||
        "",
    );

    if (m.isGroup) {
      m.participant =
        client.decodeJid(m.key.participant) || "";
    }
  }

  if (m.message) {
    m.mtype = getContentType(m.message);

    m.msg =
      m.mtype === "viewOnceMessage"
        ? m.message[m.mtype]?.message?.[
            getContentType(
              m.message[m.mtype]?.message,
            )
          ]
        : m.message[m.mtype];

    m.msg = m.msg || {};

    m.body =
      m.message.conversation ||
      m.msg.caption ||
      m.msg.text ||
      m.msg.contentText ||
      m.msg.selectedDisplayText ||
      m.msg.title ||
      "";

    const context = m.msg.contextInfo || {};
    const quotedMessage = context.quotedMessage;

    m.mentionedJid = context.mentionedJid || [];

    if (quotedMessage) {
      const quotedType =
        getContentType(quotedMessage);

      const quoted = quotedMessage[quotedType];

      m.quoted =
        typeof quoted === "string"
          ? { text: quoted }
          : quoted || {};

      m.quoted.mtype = quotedType;
      m.quoted.id = context.stanzaId;
      m.quoted.chat =
        context.remoteJid || m.chat;
      m.quoted.sender = client.decodeJid(
        context.participant,
      );
      m.quoted.fromMe =
        m.quoted.sender === client.user?.id;

      m.quoted.text =
        m.quoted.text ||
        m.quoted.caption ||
        m.quoted.conversation ||
        m.quoted.contentText ||
        m.quoted.selectedDisplayText ||
        m.quoted.title ||
        "";

      m.quoted.mentionedJid =
        context.mentionedJid || [];

      m.quoted.fakeObj =
        messageInfo.fromObject({
          key: {
            remoteJid: m.quoted.chat,
            fromMe: m.quoted.fromMe,
            id: m.quoted.id,
          },
          message: quotedMessage,
          ...(m.isGroup
            ? {
                participant: m.quoted.sender,
              }
            : {}),
        });

      m.quoted.delete = () => {
        return client.sendMessage(
          m.quoted.chat,
          {
            delete: m.quoted.fakeObj.key,
          },
        );
      };

      m.quoted.copyNForward = (
        jid,
        forceForward = false,
        options = {},
      ) => {
        return client.copyNForward(
          jid,
          m.quoted.fakeObj,
          forceForward,
          options,
        );
      };

      m.quoted.download = () => {
        return client.downloadMediaMessage(
          m.quoted,
        );
      };

      m.getQuotedMessage = async () => {
        if (!m.quoted.id) {
          return false;
        }

        const quotedMessageFromStore =
          await store.loadMessage(
            m.chat,
            m.quoted.id,
            client,
          );

        return exports.smsg(
          client,
          quotedMessageFromStore,
          store,
        );
      };
    }
  }

  m.text =
    m.body ||
    m.msg?.text ||
    m.msg?.caption ||
    m.message?.conversation ||
    "";

  if (m.msg?.url) {
    m.download = () => {
      return client.downloadMediaMessage(m.msg);
    };
  }

  m.reply = (
    text,
    chatId = m.chat,
    options = {},
  ) => {
    if (Buffer.isBuffer(text)) {
      return client.sendMessage(
        chatId,
        {
          document: text,
        },
        {
          quoted: m,
          ...options,
        },
      );
    }

    return client.sendMessage(
      chatId,
      {
        text: String(text),
        ...options,
      },
      {
        quoted: m,
      },
    );
  };

  m.copy = () => {
    return exports.smsg(
      client,
      messageInfo.fromObject(
        messageInfo.toObject(m),
      ),
      store,
    );
  };

  m.copyNForward = (
    jid = m.chat,
    forceForward = false,
    options = {},
  ) => {
    return client.copyNForward(
      jid,
      m,
      forceForward,
      options,
    );
  };

  return m;
};

exports.reSize = async (
  buffer,
  width,
  height,
) => {
  const image = await Jimp.read(buffer);

  return image
    .resize({
      w: width,
      h: height,
    })
    .getBuffer("image/jpeg");
};

const currentFile = require.resolve(
  __filename,
);

fs.watchFile(currentFile, () => {
  fs.unwatchFile(currentFile);
  delete require.cache[currentFile];
  require(currentFile);
});
