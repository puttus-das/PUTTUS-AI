const settings = require("../settings");
const commandHandler = require("../lib/commandHandler");
const path = require("path");
const fs = require("fs");
const os = require("os");

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DATE & TIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function getDateTime() {
  const now = new Date();
  const timeZone = settings.timeZone || "Asia/Kolkata";

  return {
    date: now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone,
    }),

    time: now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone,
    }),
  };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   UPTIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function formatUptime() {
  const totalSeconds = Math.floor(process.uptime());

  const days = Math.floor(totalSeconds / 86400);

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600,
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60,
  );

  const seconds = totalSeconds % 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SERVER MEMORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function getServerMemory() {
  try {
    const totalGB =
      os.totalmem() / 1024 / 1024 / 1024;

    return `${totalGB.toFixed(1)} GB`;
  } catch {
    return "Unknown";
  }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SMALL FONT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function smallFont(text) {
  const map = {
    a: "ᴀ",
    b: "ʙ",
    c: "ᴄ",
    d: "ᴅ",
    e: "ᴇ",
    f: "ғ",
    g: "ɢ",
    h: "ʜ",
    i: "ɪ",
    j: "ᴊ",
    k: "ᴋ",
    l: "ʟ",
    m: "ᴍ",
    n: "ɴ",
    o: "ᴏ",
    p: "ᴘ",
    q: "ǫ",
    r: "ʀ",
    s: "s",
    t: "ᴛ",
    u: "ᴜ",
    v: "ᴠ",
    w: "ᴡ",
    x: "x",
    y: "ʏ",
    z: "ᴢ",
  };

  return String(text)
    .split("")
    .map(
      (char) =>
        map[char.toLowerCase()] || char,
    )
    .join("");
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MENU IMAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const imagePath = path.join(
  __dirname,
  "../assets/puttus_bot_image_png.png",
);

function getMenuImage() {
  try {
    if (!fs.existsSync(imagePath)) {
      return null;
    }

    return fs.readFileSync(imagePath);
  } catch (error) {
    console.error(
      "[MENU] Image error:",
      error.message,
    );

    return null;
  }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BOT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function createBotInfo({
  pushName,
  prefix,
  pluginCount,
}) {
  const { date, time } = getDateTime();

  return `
╭━━〔 愛 ᴘᴜᴛᴛᴜs 〕━━╮
│
│  𖤐 ɴᴀᴍᴇ     ➜ ${smallFont(
    settings.botName || "PUTTUS-XD",
  )}
│  𖤐 ᴍᴏᴅᴇ     ➜ ${
    settings.mode || "public"
  }
│  𖤐 ᴘʀᴇꜰɪx    ➜ ${prefix}
│  𖤐 ᴜꜱᴇʀ      ➜ ${smallFont(
    pushName || "ᴘᴜᴛᴛᴜs",
  )}
│  𖤐 ᴅᴇᴠ       ➜ ᴘᴜᴛᴛᴜs ᴅᴀs
│  𖤐 ᴏᴡɴᴇʀ     ➜ ᴘᴜᴛᴛᴜs ᴅᴀs
│  𖤐 ᴅᴀᴛᴇ     ➜ ${date}
│  𖤐 ᴛɪᴍᴇ     ➜ ${time}
│  𖤐 ᴜᴘᴛɪᴍᴇ   ➜ ${formatUptime()}
│  𖤐 ᴘʟᴜɢɪɴꜱ  ➜ ${pluginCount}
│  𖤐 ᴠᴇʀꜱɪᴏɴ  ➜ ${
    settings.version || "1.0.0"
  }
│  𖤐 ᴛᴢ       ➜ ${
    settings.timeZone || "Asia/Kolkata"
  }
│  𖤐 ꜱᴛᴀᴛᴜꜱ   ➜ ᴏɴʟɪɴᴇ
│  𖤐 ʟɪʙʀᴀʀʏ ➜ ʙᴀɪʟᴇʏs
│  𖤐 ᴘʟᴀᴛғᴏʀᴍ ➜ ɴᴏᴅᴇ.ᴊs
│  𖤐 ꜱᴇʀᴠᴇʀ  ➜ ${getServerMemory()}
│
╰━━〔 愛 ᴘᴜᴛᴛᴜs 〕━━╯
`;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MENU STYLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const menuStyles = [
  {
    render({ categories, prefix, botInfo }) {
      let text = `${botInfo}\n\n`;

      text +=
        `╭━━✰ *愛 ᴘᴜᴛᴛᴜs ᴍᴇɴᴜ* ✰━━╮\n`;

      for (const [category, commands] of categories) {
        text +=
          `┃━━━ *${category.toUpperCase()}* ━✦\n`;

        for (const command of commands) {
          text +=
            `┃ ➤ ${prefix}${smallFont(command)}\n`;
        }
      }

      text += `╰━━━━━━━━━━━━━⬣`;

      return text;
    },
  },

  {
    render({ categories, prefix, botInfo }) {
      let text = `${botInfo}\n\n`;

      text +=
        `◈╭─❍「 *愛 ᴘᴜᴛᴛᴜs ᴍᴇɴᴜ* 」❍\n`;

      for (const [category, commands] of categories) {
        text +=
          `◈├─❍「 *${category.toUpperCase()}* 」❍\n`;

        for (const command of commands) {
          text +=
            `◈├• ${prefix}${smallFont(command)}\n`;
        }
      }

      text += `◈╰──★─☆──♪♪─❍`;

      return text;
    },
  },

  {
    render({ categories, prefix, botInfo }) {
      let text = `${botInfo}\n\n`;

      text +=
        `┏━━━━ *愛 ᴘᴜᴛᴛᴜs ᴍᴇɴᴜ* ━━━┓\n`;

      for (const [category, commands] of categories) {
        text +=
          `┃━━━━ *${category.toUpperCase()}* ━━◆\n`;

        for (const command of commands) {
          text +=
            `┃ ▸ ${prefix}${smallFont(command)}\n`;
        }
      }

      text += `┗━━━━━━━━━━━━━━━┛`;

      return text;
    },
  },

  {
    render({ categories, prefix, botInfo }) {
      let text = `${botInfo}\n\n`;

      text +=
        `✦═══ *愛 ᴘᴜᴛᴛᴜs ᴍᴇɴᴜ* ═══✦\n`;

      for (const [category, commands] of categories) {
        text +=
          `║══ *${category.toUpperCase()}* ══✧\n`;

        for (const command of commands) {
          text +=
            `║ ✦ ${prefix}${smallFont(command)}\n`;
        }
      }

      text += `✦══════════════✦`;

      return text;
    },
  },

  {
    render({ categories, prefix, botInfo }) {
      let text = `${botInfo}\n\n`;

      text +=
        `❀ *━[ 愛 ᴘᴜᴛᴛᴜs - ᴅᴀs ]━* ❀\n`;

      for (const [category, commands] of categories) {
        text +=
          `┃━━━〔 *${category.toUpperCase()}* 〕━❀\n`;

        for (const command of commands) {
          text +=
            `┃☞ ${prefix}${smallFont(command)}\n`;
        }
      }

      text += `❀━━━━━━━━━━━━━━❀`;

      return text;
    },
  },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   RANDOM STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function pick(array) {
  return array[
    Math.floor(Math.random() * array.length)
  ];
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BAILEYS 7 NATIVE FLOW BUTTONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function getMenuButtons(prefix) {
  return [
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "👑 OWNER",
        id: `${prefix}owner`,
      }),
    },

    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "⚡ PING",
        id: `${prefix}ping`,
      }),
    },
  ];
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MENU COMMAND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

module.exports = {
  command: "menu",

  aliases: [
    "help",
    "commands",
    "h",
    "list",
  ],

  category: "general",

  description: "Show all commands",

  usage: ".menu [command]",

  async handler(
    sock,
    message,
    args,
    context = {},
  ) {
    const {
      chatId,
      pushName,
    } = context;

    const prefix =
      settings.prefixes?.[0] || ".";

    const menuImage = getMenuImage();

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       SINGLE COMMAND
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    if (args.length) {
      const searchTerm =
        String(args[0]).toLowerCase();

      let command =
        commandHandler.commands.get(
          searchTerm,
        );

      if (
        !command &&
        commandHandler.aliases.has(
          searchTerm,
        )
      ) {
        const mainCommand =
          commandHandler.aliases.get(
            searchTerm,
          );

        command =
          commandHandler.commands.get(
            mainCommand,
          );
      }

      if (!command) {
        return sock.sendMessage(
          chatId,
          {
            text:
              `❌ Command "${args[0]}" not found.\n\n` +
              `Use ${prefix}menu to see all commands.`,
          },
          {
            quoted: message,
          },
        );
      }

      const text =
        `╭━━━━━━━━━━━━━━⬣\n` +
        `┃ 📌 *COMMAND INFO*\n` +
        `┃\n` +
        `┃ ⚡ *Command:* ${prefix}${smallFont(
          command.command,
        )}\n` +
        `┃ 📝 *Description:* ${
          command.description ||
          "No description"
        }\n` +
        `┃ 📖 *Usage:* ${
          command.usage ||
          `${prefix}${command.command}`
        }\n` +
        `┃ 🏷️ *Category:* ${
          command.category ||
          "misc"
        }\n` +
        `┃ 🔖 *Aliases:* ${
          command.aliases?.length
            ? command.aliases
                .map(
                  (alias) =>
                    prefix +
                    smallFont(alias),
                )
                .join(", ")
            : "None"
        }\n` +
        `┃\n` +
        `╰━━━━━━━━━━━━━━⬣`;

      if (menuImage) {
        try {
          return await sock.sendMessage(
            chatId,
            {
              image: menuImage,
              caption: text,
            },
            {
              quoted: message,
            },
          );
        } catch (error) {
          console.error(
            "[MENU] Image send failed:",
            error.message,
          );
        }
      }

      return sock.sendMessage(
        chatId,
        {
          text,
        },
        {
          quoted: message,
        },
      );
    }

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       CREATE MENU
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const botInfo = createBotInfo({
      pushName,
      prefix,
      pluginCount:
        commandHandler.commands.size,
    });

    const style = pick(menuStyles);

    const text = style.render({
      prefix,
      botInfo,
      categories:
        commandHandler.categories,
    });

    const buttons =
      getMenuButtons(prefix);

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       INTERACTIVE MENU
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    try {
      await sock.sendMessage(
        chatId,
        {
          interactiveMessage: {
            body: {
              text,
            },

            footer: {
              text: "PUTTUS-AI",
            },

            nativeFlowMessage: {
              buttons,
              messageParamsJson: "",
            },
          },
        },
        {
          quoted: message,
        },
      );

      return;
    } catch (error) {
      console.error(
        "[MENU] Interactive menu failed:",
        error.message,
      );
    }

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       FALLBACK MENU
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    if (menuImage) {
      try {
        await sock.sendMessage(
          chatId,
          {
            image: menuImage,
            caption: text,
          },
          {
            quoted: message,
          },
        );

        return;
      } catch (error) {
        console.error(
          "[MENU] Image fallback failed:",
          error.message,
        );
      }
    }

    await sock.sendMessage(
      chatId,
      {
        text,
      },
      {
        quoted: message,
      },
    );
  },
};
