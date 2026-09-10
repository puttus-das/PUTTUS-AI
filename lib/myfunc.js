const {
  proto,
  getContentType,
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const util = require("util");

function unixTimestampSeconds(
  date = new Date(),
) {
  return Math.floor(date.getTime() / 1000);
}

exports.unixTimestampSeconds =
  unixTimestampSeconds;

exports.generateMessageTag = (epoch) => {
  let tag = unixTimestampSeconds().toString();

  if (epoch) {
    tag += `.--${epoch}`;
  }

  return tag;
};

exports.processTime = (timestamp, now) => {
  return Math.floor(
    Number(now) - Number(timestamp) * 1000,
  ) / 1000;
};

exports.getRandom = (extension = "") => {
  return `${Math.floor(Math.random() * 10000)}${extension}`;
};

async function fetchResponse(
  url,
  options = {},
) {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 Chrome/120 Safari/537.36",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response;
}

exports.getBuffer = async (url) => {
  try {
    const response = await fetchResponse(url);

    return Buffer.from(
      await response.arrayBuffer(),
    );
  } catch (error) {
    return error;
  }
};

exports.getImg = async (url) => {
  try {
    const response = await fetchResponse(url);

    return Buffer.from(
      await response.arrayBuffer(),
    );
  } catch (error) {
    return error;
  }
};

exports.fetchJson = async (url) => {
  try {
    const response = await fetchResponse(url);

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
  const remainingSeconds = Math.floor(
    seconds % 60,
  );

  const parts = [];

  if (days > 0) {
    parts.push(
      `${days} day${days === 1 ? "" : "s"}`,
    );
  }

  if (hours > 0) {
    parts.push(
      `${hours} hour${hours === 1 ? "" : "s"}`,
    );
  }

  if (minutes > 0) {
    parts.push(
      `${minutes} minute${
        minutes === 1 ? "" : "s"
      }`,
    );
  }

  if (
    remainingSeconds > 0 ||
    parts.length === 0
  ) {
    parts.push(
      `${remainingSeconds} second${
        remainingSeconds === 1 ? "" : "s"
      }`,
    );
  }

  return parts.join(", ");
};

exports.clockString = (milliseconds) => {
  if (isNaN(milliseconds)) {
    return "--:--:--";
  }

  const hours = Math.floor(
    milliseconds / 3600000,
  );

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
  return /^https?:\/\/\S+$/i.test(
    String(url).trim(),
  );
};

exports.getTime = (
  format = "HH:mm:ss",
) => {
  const now = new Date();

  const values = {
    YYYY: now.getFullYear(),
    MM: String(
      now.getMonth() + 1,
    ).padStart(2, "0"),
    DD: String(
      now.getDate(),
    ).padStart(2, "0"),
    HH: String(
      now.getHours(),
    ).padStart(2, "0"),
    mm: String(
      now.getMinutes(),
    ).padStart(2, "0"),
    ss: String(
      now.getSeconds(),
    ).padStart(2, "0"),
  };

  return format.replace(
    /YYYY|MM|DD|HH|mm|ss/g,
    (key) => values[key],
  );
};

exports.formatDate = (
  value,
  locale = "en-IN",
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
    "en-IN",
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
) => {
  return new Date(value).toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  );
};

exports.formatp = (bytes) => {
  bytes = Number(bytes || 0);

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = [
    "KB",
    "MB",
    "GB",
    "TB",
  ];

  let value = bytes;
  let unit = "B";

  for (const nextUnit of units) {
    value /= 1024;
    unit = nextUnit;

    if (value < 1024) {
      break;
    }
  }

  return `${value.toFixed(2)} ${unit}`;
};

exports.json = (value) => {
  return JSON.stringify(value, null, 2);
};

exports.logic = (
  check,
  inputs,
  outputs,
) => {
  if (inputs.length !== outputs.length) {
    throw new Error(
      "Input and Output must have same length",
    );
  }

  for (
    let index = 0;
    index < inputs.length;
    index++
  ) {
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

exports.generateProfilePicture = async () => {
  throw new Error(
    "Image processing is disabled in this lightweight version.",
  );
};

exports.reSize = async () => {
  throw new Error(
    "Image processing is disabled in this lightweight version.",
  );
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
  if (
    typeof value === "string" &&
    /^https?:\/\//i.test(value)
  ) {
    const response = await fetchResponse(value);

    const length = Number(
      response.headers.get(
        "content-length",
      ) || 0,
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

exports.getGroupAdmins = (
  participants = [],
) => {
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

  const MessageInfo = proto.WebMessageInfo;
  const m = message;

  if (m.key) {
    m.id = m.key.id;

    m.isBaileys =
      m.id?.startsWith("BAE5") &&
      m.id?.length === 16;

    m.chat = m.key.remoteJid;
    m.fromMe = Boolean(m.key.fromMe);

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

    const context =
      m.msg.contextInfo || {};

    m.body =
      m.message.conversation ||
      m.msg.caption ||
      m.msg.text ||
      m.msg.contentText ||
      m.msg.selectedDisplayText ||
      m.msg.title ||
      "";

    m.mentionedJid =
      context.mentionedJid || [];

    if (context.quotedMessage) {
      const quotedType = getContentType(
        context.quotedMessage,
      );

      const quotedData =
        context.quotedMessage[quotedType];

      m.quoted =
        typeof quotedData === "string"
          ? { text: quotedData }
          : quotedData || {};

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
        MessageInfo.fromObject({
          key: {
            remoteJid: m.quoted.chat,
            fromMe: m.quoted.fromMe,
            id: m.quoted.id,
          },
          message: context.quotedMessage,
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

        const quotedMessage =
          await store.loadMessage(
            m.chat,
            m.quoted.id,
            client,
          );

        return exports.smsg(
          client,
          quotedMessage,
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
      return client.downloadMediaMessage(
        m.msg,
      );
    };
  }

  m.reply = (
    text,
    chatId = m.chat,
    options = {},
  ) => {
    return client.sendMessage(
      chatId,
      {
        text: String(text),
      },
      {
        quoted: m,
        ...options,
      },
    );
  };

  m.copy = () => {
    return exports.smsg(
      client,
      MessageInfo.fromObject(
        MessageInfo.toObject(m),
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

const currentFile = require.resolve(
  __filename,
);

fs.watchFile(currentFile, () => {
  fs.unwatchFile(currentFile);
  delete require.cache[currentFile];
  require(currentFile);
});
      
