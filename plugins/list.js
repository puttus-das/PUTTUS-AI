/*****************************************************************************
 *                                                                           *
 *                     Developed By Puttus Das                              *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/puttus-das                             *
 *  ▶️  WhatsApp : https://chat.whatsapp.com/FVLqJnjKPywKZiiMqi1XWH         *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029Vb8RL4F1HspsNlYYOE3e    *
 *                                                                           *
 *    © 2026 puttus-das. All rights reserved.                               *
 *                                                                           *
 *    Description: This file is part of the PUTTUS-AI Project.              *
 *                                                                           *
 *****************************************************************************/

const settings = require("../settings");
const commandHandler = require("../lib/commandHandler");
const path = require("path");
const fs = require("fs");

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function formatTime() {
  const now = new Date();

  const options = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: settings.timeZone || "UTC",
  };

  return now.toLocaleTimeString("en-US", options);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SMALL COMMAND FONT
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
    .map((char) => {
      return map[char.toLowerCase()] || char;
    })
    .join("");
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MENU IMAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/*
 * GitHub:
 *
 * assets/puttus_bot_image_png.png
 *
 * IMPORTANT:
 * The old bot_image.jpg path was incorrect.
 */

const imagePath = path.join(
  __dirname,
  "../assets/puttus_bot_image_png.png",
);

function getMenuImage() {
  try {
    if (!fs.existsSync(imagePath)) {
      console.log(
        `[MENU] Image not found: ${imagePath}`,
      );

      return null;
    }

    return fs.readFileSync(imagePath);
  } catch (error) {
    console.error(
      "[MENU] Image read error:",
      error.message,
    );

    return null;
  }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MENU STYLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const menuStyles = [
  {
    render({
      title,
      info,
      categories,
      prefix,
    }) {
      let t =
        `╭━━✰ *[]꯭꯭𝐀꯭ᴘ꯭ᴜ꯭ʀ꯭ʙ꯭ᴏ꯭-𝐀꯭𝐈꯭-𝐁꯭ᴏ꯭ᴛ꯭ * ━✰\n`;

      t += `┃ ✨ *Bot: ${info.bot}*\n`;
      t += `┃ 🔧 *Prefix: ${info.prefix}*\n`;
      t += `┃ 📦 *Plugin: ${info.total}*\n`;
      t += `┃ 💎 *Version: ${info.version}*\n`;
      t += `┃ ⏰ *Time: ${info.time}*\n`;

      for (const [cat, cmds] of categories) {
        t +=
          `┃━━━ *${cat.toUpperCase()}* ━✦\n`;

        for (const c of cmds) {
          t +=
            `┃ ➤ ${prefix}${smallFont(c)}\n`;
        }
      }

      t += `╰━━━━━━━━━━━━━⬣`;

      return t;
    },
  },

  {
    render({
      title,
      info,
      categories,
      prefix,
    }) {
      let t =
        `◈╭─❍「 *[]꯭꯭𝐀꯭ᴘ꯭ᴜ꯭ʀ꯭ʙ꯭ᴏ꯭-𝐀꯭𝐈꯭-𝐁꯭ᴏ꯭ᴛ꯭ * 」❍\n`;

      t += `◈├• 🌟 *Bot: ${info.bot}*\n`;
      t += `◈├• ⚙️ *Prefix: ${info.prefix}*\n`;
      t += `◈├• 🍫 *Plugins: ${info.total}*\n`;
      t += `◈├• 💎 *Version: ${info.version}*\n`;
      t += `◈├• ⏰ *Time: ${info.time}*\n`;

      for (const [cat, cmds] of categories) {
        t +=
          `◈├─❍「 *${cat.toUpperCase()}* 」❍\n`;

        for (const c of cmds) {
          t +=
            `◈├• ${prefix}${smallFont(c)}\n`;
        }
      }

      t += `◈╰──★─☆──♪♪─❍`;

      return t;
    },
  },

  {
    render({
      title,
      info,
      categories,
      prefix,
    }) {
      let t =
        `┏━━━━ *[]꯭꯭𝐀꯭ᴘ꯭ᴜ꯭ʀ꯭ʙ꯭ᴏ꯭-𝐀꯭𝐈꯭-𝐁꯭ᴏ꯭ᴛ꯭ * ━━━┓\n`;

      t += `┃• *Bot : ${info.bot}*\n`;
      t += `┃• *Prefixes : ${info.prefix}*\n`;
      t += `┃• *Plugins : ${info.total}*\n`;
      t += `┃• *Version : ${info.version}*\n`;
      t += `┃• *Time : ${info.time}*\n`;

      for (const [cat, cmds] of categories) {
        t +=
          `┃━━━━ *${cat.toUpperCase()}* ━━◆\n`;

        for (const c of cmds) {
          t +=
            `┃ ▸ ${prefix}${smallFont(c)}\n`;
        }
      }

      t += `┗━━━━━━━━━━━━━━━┛`;

      return t;
    },
  },

  {
    render({
      title,
      info,
      categories,
      prefix,
    }) {
      let t =
        `✦═══ *PUTTUS-AI MENU* ═══✦\n`;

      t += `║➩ *Bot: ${info.bot}*\n`;
      t += `║➩ *Prefixes: ${info.prefix}*\n`;
      t += `║➩ *Plugins: ${info.total}*\n`;
      t += `║➩ *Version: ${info.version}*\n`;
      t += `║➩ *Time: ${info.time}*\n`;

      for (const [cat, cmds] of categories) {
        t +=
          `║══ *${cat.toUpperCase()}* ══✧\n`;

        for (const c of cmds) {
          t +=
            `║ ✦ ${prefix}${smallFont(c)}\n`;
        }
      }

      t += `✦══════════════✦`;

      return t;
    },
  },

  {
    render({
      title,
      info,
      categories,
      prefix,
    }) {
      let t =
        `❀ *━[ 𝐏ᴜᴛᴛᴜꜱ - 𝐃ᴀꜱ]━* ❀\n`;

      t += `┃☞ *Bot: ${info.bot}*\n`;
      t += `┃☞ *Prefixes: ${info.prefix}*\n`;
      t += `┃☞ *Plugins: ${info.total}*\n`;
      t += `┃☞ *Version: ${info.version}*\n`;
      t += `┃☞ *Time: ${info.time}*\n`;

      for (const [cat, cmds] of categories) {
        t +=
          `┃━━━〔 *${cat.toUpperCase()}* 〕━❀\n`;

        for (const c of cmds) {
          t +=
            `┃☞ ${prefix}${smallFont(c)}\n`;
        }
      }

      t += `❀━━━━━━━━━━━━━━❀`;

      return t;
    },
  },

  {
    render({
      title,
      info,
      categories,
      prefix,
    }) {
      let t =
        `◆━━━ *━[ 𝐏ᴜᴛᴛᴜꜱ - 𝐃ᴀꜱ]━* ━━━◆\n`;

      t += `┃ ¤ *Bot: ${info.bot}*\n`;
      t += `┃ ¤ *Prefixes: ${info.prefix}*\n`;
      t += `┃ ¤ *Plugins: ${info.total}*\n`;
      t += `┃ ¤ *Version: ${info.version}*\n`;
      t += `┃ ¤ *Time: ${info.time}*\n`;

      for (const [cat, cmds] of categories) {
        t +=
          `┃━━ *${cat.toUpperCase()}* ━━◆◆\n`;

        for (const c of cmds) {
          t +=
            `┃ ¤ ${prefix}${smallFont(c)}\n`;
        }
      }

      t += `◆━━━━━━━━━━━━━━━━◆`;

      return t;
    },
  },

  {
    render({
      title,
      info,
      categories,
      prefix,
    }) {
      let t =
        `╭───⬣ *━[ 𝐏ᴜᴛᴛᴜꜱ - 𝐃ᴀꜱ]━* ──⬣\n`;

      t += ` | ● *Bot: ${info.bot}*\n`;
      t += ` | ● *Prefixes: ${info.prefix}*\n`;
      t += ` | ● *Plugins: ${info.total}*\n`;
      t += ` | ● *Version: ${info.version}*\n`;
      t += ` | ● *Time: ${info.time}*\n`;

      for (const [cat, cmds] of categories) {
        t +=
          ` |───⬣ *${cat.toUpperCase()}* ──⬣\n`;

        for (const c of cmds) {
          t +=
            ` | ● ${prefix}${smallFont(c)}\n`;
        }
      }

      t += `╰──────────⬣`;

      return t;
    },
  },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   RANDOM STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const pick = (arr) =>
  arr[
    Math.floor(
      Math.random() * arr.length,
    )
  ];

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
      channelInfo = {},
    } = context;

    const prefix =
      settings.prefixes?.[0] || ".";

    /*
     * Load menu image.
     * Buffer is used instead of { url: localPath }.
     */

    const menuImage =
      getMenuImage();

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       SINGLE COMMAND INFO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    if (args.length) {
      const searchTerm =
        String(args[0]).toLowerCase();

      let cmd =
        commandHandler.commands.get(
          searchTerm,
        );

      if (
        !cmd &&
        commandHandler.aliases.has(
          searchTerm,
        )
      ) {
        const mainCommand =
          commandHandler.aliases.get(
            searchTerm,
          );

        cmd =
          commandHandler.commands.get(
            mainCommand,
          );
      }

      if (!cmd) {
        return sock.sendMessage(
          chatId,
          {
            text:
              `❌ Command "${args[0]}" not found.\n\n` +
              `Use ${prefix}menu to see all commands.`,
            ...channelInfo,
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
          cmd.command,
        )}\n` +
        `┃ 📝 *Desc:* ${
          cmd.description ||
          "No description"
        }\n` +
        `┃ 📖 *Usage:* ${
          cmd.usage ||
          `${prefix}${cmd.command}`
        }\n` +
        `┃ 🏷️ *Category:* ${
          cmd.category ||
          "misc"
        }\n` +
        `┃ 🔖 *Aliases:* ${
          cmd.aliases?.length
            ? cmd.aliases
                .map(
                  (a) =>
                    prefix +
                    smallFont(a),
                )
                .join(", ")
            : "None"
        }\n` +
        `┃\n` +
        `╰━━━━━━━━━━━━━━⬣`;

      /* Image + command info */

      if (menuImage) {
        try {
          return await sock.sendMessage(
            chatId,
            {
              image: menuImage,
              caption: text,
              ...channelInfo,
            },
            {
              quoted: message,
            },
          );
        } catch (error) {
          console.error(
            "[MENU] Command image send failed:",
            error.message,
          );
        }
      }

      /* Text fallback */

      return sock.sendMessage(
        chatId,
        {
          text,
          ...channelInfo,
        },
        {
          quoted: message,
        },
      );
    }

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       FULL MENU
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const style =
      pick(menuStyles);

    const text =
      style.render({
        title:
          settings.botName,

        prefix,

        info: {
          bot:
            settings.botName ||
            "PUTTUS-XD",

          prefix:
            settings.prefixes?.join(
              ", ",
            ) || prefix,

          total:
            commandHandler
              .commands.size,

          version:
            settings.version ||
            "5.0.0",

          time:
            formatTime(),
        },

        categories:
          commandHandler.categories,
      });

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       IMAGE MENU
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    if (menuImage) {
      try {
        await sock.sendMessage(
          chatId,
          {
            image: menuImage,
            caption: text,
            ...channelInfo,
          },
          {
            quoted: message,
          },
        );

        return;
      } catch (error) {
        console.error(
          "[MENU] Image menu send failed:",
          error.message,
        );
      }
    }

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       TEXT FALLBACK
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    await sock.sendMessage(
      chatId,
      {
        text,
        ...channelInfo,
      },
      {
        quoted: message,
      },
    );
  },
};

/*****************************************************************************
 *                                                                           *
 *                     Developed By Puttus Das                              *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/puttus-das                             *
 *  ▶️  WhatsApp : https://chat.whatsapp.com/FVLqJnjKPywKZiiMqi1XWH         *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029Vb8RL4F1HspsNlYYOE3e    *
 *                                                                           *
 *    © 2026 puttus-das. All rights reserved.                               *
 *                                                                           *
 *****************************************************************************/
