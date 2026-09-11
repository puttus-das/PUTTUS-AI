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

function getDateTime() {
  const now = new Date();

  const timeZone =
    settings.timeZone || "Asia/Kolkata";

  const date = now.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone,
    },
  );

  const time = now.toLocaleTimeString(
    "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone,
    },
  );

  return {
    date,
    time,
  };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   UPTIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function formatUptime() {
  const totalSeconds =
    Math.floor(process.uptime());

  const days =
    Math.floor(totalSeconds / 86400);

  const hours =
    Math.floor(
      (totalSeconds % 86400) / 3600,
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60,
    );

  const seconds =
    totalSeconds % 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SERVER MEMORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function getServerMemory() {
  try {
    const totalGB =
      require("os").totalmem() /
      1024 /
      1024 /
      1024;

    return `${totalGB.toFixed(1)} GB`;
  } catch {
    return "Unknown";
  }
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
      return (
        map[char.toLowerCase()] ||
        char
      );
    })
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
   BOT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function createBotInfo({
  pushName,
  prefix,
  pluginCount,
}) {
  const {
    date,
    time,
  } = getDateTime();

  const uptime =
    formatUptime();

  const serverMemory =
    getServerMemory();

  return `
╭━━〔 愛 ᴘᴜᴛᴛᴜs 〕━━╮
│
│  𖤐 ɴᴀᴍᴇ     ➜ ${smallFont(
    settings.botName ||
      "PUTTUS-XD",
  )}
│  𖤐 ᴍᴏᴅᴇ     ➜ ${
    settings?.mode || "public"
  }
│  𖤐 ᴘʀᴇꜰɪx    ➜ ${prefix}
│  𖤐 ᴜꜱᴇʀ      ➜ ${smallFont(
    pushName || "ᴘᴜᴛᴛᴜs",
  )}
│  𖤐 ᴅᴇᴠ       ➜ ᴘᴜᴛᴛᴜs ᴅᴀs
│  𖤐 ᴏᴡɴᴇʀ     ➜ ᴘᴜᴛᴛᴜs ᴅᴀs
│  𖤐 ᴅᴀᴛᴇ     ➜ ${date}
│  𖤐 ᴛɪᴍᴇ     ➜ ${time}
│  𖤐 ᴜᴘᴛɪᴍᴇ   ➜ ${uptime}
│  𖤐 ᴘʟᴜɢɪɴꜱ  ➜ ${pluginCount}
│  𖤐 ᴠᴇʀꜱɪᴏɴ  ➜ ${
    settings?.version || "1.0.0"
  }
│  𖤐 ᴛᴢ       ➜ ${
    settings.timeZone ||
    "Asia/Kolkata"
  }
│  𖤐 ꜱᴛᴀᴛᴜꜱ   ➜ ᴏɴʟɪɴᴇ
│  𖤐 ʟɪʙʀᴀʀʏ ➜ ʙᴀɪʟᴇʏs
│  𖤐 ᴘʟᴀᴛғᴏʀᴍ ➜ ɴᴏᴅᴇ.ᴊs
│  𖤐 ꜱᴇʀᴠᴇʀ  ➜ ${serverMemory}
│
╰━━〔 愛 ᴘᴜᴛᴛᴜs 〕━━╯
`;
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
      botInfo,
    }) {
      let t =
        `${botInfo}\n\n`;

      t +=
        `╭━━✰ *愛 ᴘᴜᴛᴛᴜs ᴍᴇɴᴜ* ✰━━╮\n`;

      for (const [
        cat,
        cmds,
      ] of categories) {
        t +=
          `┃━━━ *${cat.toUpperCase()}* ━✦\n`;

        for (const c of cmds) {
          t +=
            `┃ ➤ ${prefix}${smallFont(c)}\n`;
        }
      }

      t +=
        `╰━━━━━━━━━━━━━⬣`;

      return t;
    },
  },

  {
    render({
      title,
      info,
      categories,
      prefix,
      botInfo,
    }) {
      let t =
        `${botInfo}\n\n`;

      t +=
        `◈╭─❍「 *愛 ᴘᴜᴛᴛᴜs ᴍᴇɴᴜ* 」❍\n`;

      for (const [
        cat,
        cmds,
      ] of categories) {
        t +=
          `◈├─❍「 *${cat.toUpperCase()}* 」❍\n`;

        for (const c of cmds) {
          t +=
            `◈├• ${prefix}${smallFont(c)}\n`;
        }
      }

      t +=
        `◈╰──★─☆──♪♪─❍`;

      return t;
    },
  },

  {
    render({
      title,
      info,
      categories,
      prefix,
      botInfo,
    }) {
      let t =
        `${botInfo}\n\n`;

      t +=
        `┏━━━━ *愛 ᴘᴜᴛᴛᴜs ᴍᴇɴᴜ* ━━━┓\n`;

      for (const [
        cat,
        cmds,
      ] of categories) {
        t +=
          `┃━━━━ *${cat.toUpperCase()}* ━━◆\n`;

        for (const c of cmds) {
          t +=
            `┃ ▸ ${prefix}${smallFont(c)}\n`;
        }
      }

      t +=
        `┗━━━━━━━━━━━━━━━┛`;

      return t;
    },
  },

  {
    render({
      title,
      info,
      categories,
      prefix,
      botInfo,
    }) {
      let t =
        `${botInfo}\n\n`;

      t +=
        `✦═══ *愛 ᴘᴜᴛᴛᴜs ᴍᴇɴᴜ* ═══✦\n`;

      for (const [
        cat,
        cmds,
      ] of categories) {
        t +=
          `║══ *${cat.toUpperCase()}* ══✧\n`;

        for (const c of cmds) {
          t +=
            `║ ✦ ${prefix}${smallFont(c)}\n`;
        }
      }

      t +=
        `✦══════════════✦`;

      return t;
    },
  },

  {
    render({
      title,
      info,
      categories,
      prefix,
      botInfo,
    }) {
      let t =
        `${botInfo}\n\n`;

      t +=
        `❀ *━[ 愛 ᴘᴜᴛᴛᴜs - ᴅᴀs ]━* ❀\n`;

      for (const [
        cat,
        cmds,
      ] of categories) {
        t +=
          `┃━━━〔 *${cat.toUpperCase()}* 〕━❀\n`;

        for (const c of cmds) {
          t +=
            `┃☞ ${prefix}${smallFont(c)}\n`;
        }
      }

      t +=
        `❀━━━━━━━━━━━━━━❀`;

      return t;
    },
  },

  {
    render({
      title,
      info,
      categories,
      prefix,
      botInfo,
    }) {
      let t =
        `${botInfo}\n\n`;

      t +=
        `◆━━━ *愛 ᴘᴜᴛᴛᴜs - ᴅᴀs* ━━━◆\n`;

      for (const [
        cat,
        cmds,
      ] of categories) {
        t +=
          `┃━━ *${cat.toUpperCase()}* ━━◆◆\n`;

        for (const c of cmds) {
          t +=
            `┃ ¤ ${prefix}${smallFont(c)}\n`;
        }
      }

      t +=
        `◆━━━━━━━━━━━━━━━━◆`;

      return t;
    },
  },

  {
    render({
      title,
      info,
      categories,
      prefix,
      botInfo,
    }) {
      let t =
        `${botInfo}\n\n`;

      t +=
        `╭───⬣ *愛 ᴘᴜᴛᴛᴜs - ᴅᴀs* ──⬣\n`;

      for (const [
        cat,
        cmds,
      ] of categories) {
        t +=
          ` |───⬣ *${cat.toUpperCase()}* ──⬣\n`;

        for (const c of cmds) {
          t +=
            ` | ● ${prefix}${smallFont(c)}\n`;
        }
      }

      t +=
        `╰──────────⬣`;

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

  description:
    "Show all commands",

  usage:
    ".menu [command]",

  async handler(
    sock,
    message,
    args,
    context = {},
  ) {
    const {
      chatId,
      channelInfo = {},
      pushName,
    } = context;

    const prefix =
      settings.prefixes?.[0] ||
      ".";

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       LOAD IMAGE
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

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
       BOT INFO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const botInfo =
      createBotInfo({
        pushName,
        prefix,
        pluginCount:
          commandHandler.commands.size,
      });

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

        botInfo,

        info: {
          bot:
            settings.botName ||
            "PUTTUS-XD",

          prefix:
            settings.prefixes?.join(
              ", ",
            ) || prefix,

          total:
            commandHandler.commands.size,

          version:
            settings.version ||
            "5.0.0",

          time:
            getDateTime().time,
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
