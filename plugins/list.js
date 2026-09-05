/*****************************************************************************
 *                                                                           *
 *                     Developed By Puttus Das                              *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/puttus-das                         *
 *  ▶️  WhatsApp  : https://chat.whatsapp.com/FVLqJnjKPywKZiiMqi1XWH                       *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029Vb8RL4F1HspsNlYYOE3e     *
 *                                                                           *
 *    © 2026 puttus-das. All rights reserved.                            *
 *                                                                           *
 *    Description: This file is part of the PUTTUS-AI Project.                 *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/

const settings = require("../settings");
const commandHandler = require("../lib/commandHandler");
const path = require("path");
const fs = require("fs");
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

const menuStyles = [
  {
    render({ title, info, categories, prefix }) {
      let t = `╭━━✰ *[]꯭꯭𝐀꯭ᴘ꯭ᴜ꯭ʀ꯭ʙ꯭ᴏ꯭-𝐀꯭𝐈꯭-𝐁꯭ᴏ꯭ᴛ꯭ * ━✰\n`;
      t += `┃ ✨ *Bot: ${info.bot}*\n`;
      t += `┃ 🔧 *Prefix: ${info.prefix}*\n`;
      t += `┃ 📦 *Plugin: ${info.total}*\n`;
      t += `┃ 💎 *Version: ${info.version}*\n`;
      t += `┃ ⏰ *Time: ${info.time}*\n`;

      for (const [cat, cmds] of categories) {
        t += `┃━━━ *${cat.toUpperCase()}* ━✦\n`;
        for (const c of cmds) t += `┃ ➤ ${prefix}${c}\n`;
      }
      t += `╰━━━━━━━━━━━━━⬣`;
      return t;
    },
  },

  {
    render({ title, info, categories, prefix }) {
      let t = `◈╭─❍「 *[]꯭꯭𝐀꯭ᴘ꯭ᴜ꯭ʀ꯭ʙ꯭ᴏ꯭-𝐀꯭𝐈꯭-𝐁꯭ᴏ꯭ᴛ꯭ * 」❍\n`;
      t += `◈├• 🌟 *Bot: ${info.bot}*\n`;
      t += `◈├• ⚙️ *Prefix: ${info.prefix}*\n`;
      t += `◈├• 🍫 *Plugins: ${info.total}*\n`;
      t += `◈├• 💎 *Version: ${info.version}*\n`;
      t += `◈├• ⏰ *Time: ${info.time}*\n`;

      for (const [cat, cmds] of categories) {
        t += `◈├─❍「 *${cat.toUpperCase()}* 」❍\n`;
        for (const c of cmds) t += `◈├• ${prefix}${c}\n`;
      }
      t += `◈╰──★─☆──♪♪─❍`;
      return t;
    },
  },

  {
    render({ title, info, categories, prefix }) {
      let t = `┏━━━━ *[]꯭꯭𝐀꯭ᴘ꯭ᴜ꯭ʀ꯭ʙ꯭ᴏ꯭-𝐀꯭𝐈꯭-𝐁꯭ᴏ꯭ᴛ꯭ * ━━━┓\n`;
      t += `┃• *Bot : ${info.bot}*\n`;
      t += `┃• *Prefixes : ${info.prefix}*\n`;
      t += `┃• *Plugins : ${info.total}*\n`;
      t += `┃• *Version : ${info.version}*\n`;
      t += `┃• *Time : ${info.time}*\n`;

      for (const [cat, cmds] of categories) {
        t += `┃━━━━ *${cat.toUpperCase()}* ━━◆\n`;
        for (const c of cmds) t += `┃ ▸ ${prefix}${c}\n`;
      }
      t += `┗━━━━━━━━━━━━━━━┛`;
      return t;
    },
  },

  {
    render({ title, info, categories, prefix }) {
      let t = `✦═══ *PUTTUS-AI MENU* ═══✦\n`;
      t += `║➩ *Bot: ${info.bot}*\n`;
      t += `║➩ *Prefixes: ${info.prefix}*\n`;
      t += `║➩ *Plugins: ${info.total}*\n`;
      t += `║➩ *Version: ${info.version}*\n`;
      t += `║➩ *Time: ${info.time}*\n`;

      for (const [cat, cmds] of categories) {
        t += `║══ *${cat.toUpperCase()}* ══✧\n`;
        for (const c of cmds) t += `║ ✦ ${prefix}${c}\n`;
      }
      t += `✦══════════════✦`;
      return t;
    },
  },

  {
    render({ title, info, categories, prefix }) {
      let t = `❀ *━[ 𝐏ᴜᴛᴛᴜꜱ - 𝐃ᴀꜱ]━* ❀\n`;
      t += `┃☞ *Bot: ${info.bot}*\n`;
      t += `┃☞ *Prefixes: ${info.prefix}*\n`;
      t += `┃☞ *Plugins: ${info.total}*\n`;
      t += `┃☞ *Version: ${info.version}*\n`;
      t += `┃☞ *Time: ${info.time}*\n`;

      for (const [cat, cmds] of categories) {
        t += `┃━━━〔 *${cat.toUpperCase()}* 〕━❀\n`;
        for (const c of cmds) t += `┃☞ ${prefix}${c}\n`;
      }
      t += `❀━━━━━━━━━━━━━━❀`;
      return t;
    },
  },

  {
    render({ title, info, categories, prefix }) {
      let t = `◆━━━ *━[ 𝐏ᴜᴛᴛᴜꜱ - 𝐃ᴀꜱ]━* ━━━◆\n`;
      t += `┃ ¤ *Bot: ${info.bot}*\n`;
      t += `┃ ¤ *Prefixes: ${info.prefix}*\n`;
      t += `┃ ¤ *Plugins: ${info.total}*\n`;
      t += `┃ ¤ *Version: ${info.version}*\n`;
      t += `┃ ¤ *Time: ${info.time}*\n`;
      for (const [cat, cmds] of categories) {
        t += `┃━━ *${cat.toUpperCase()}* ━━◆◆\n`;
        for (const c of cmds) t += `┃ ¤ ${prefix}${c}\n`;
      }
      t += `◆━━━━━━━━━━━━━━━━◆`;
      return t;
    },
  },

  {
    render({ title, info, categories, prefix }) {
      let t = `╭───⬣ *━[ 𝐏ᴜᴛᴛᴜꜱ - 𝐃ᴀꜱ]━* ──⬣\n`;
      t += ` | ● *Bot: ${info.bot}*\n`;
      t += ` | ● *Prefixes: ${info.prefix}*\n`;
      t += ` | ● *Plugins: ${info.total}*\n`;
      t += ` | ● *Version: ${info.version}*\n`;
      t += ` | ● *Time: ${info.time}*\n`;
      for (const [cat, cmds] of categories) {
        t += ` |───⬣ *${cat.toUpperCase()}* ──⬣\n`;
        for (const c of cmds) t += ` | ● ${prefix}${c}\n`;
      }
      t += `╰──────────⬣`;
      return t;
    },
  },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

module.exports = {
  command: "menu",
  aliases: ["help", "commands", "h", "list"],
  category: "general",
  description: "Show all commands",
  usage: ".menu [command]",

  async handler(sock, message, args, context) {
    const { chatId, channelInfo } = context;
    const prefix = settings.prefixes[0];
    const imagePath = path.join(__dirname, "../assets/bot_image.jpg");

    if (args.length) {
      const searchTerm = args[0].toLowerCase();

      let cmd = commandHandler.commands.get(searchTerm);

      if (!cmd && commandHandler.aliases.has(searchTerm)) {
        const mainCommand = commandHandler.aliases.get(searchTerm);
        cmd = commandHandler.commands.get(mainCommand);
      }

      if (!cmd) {
        return sock.sendMessage(
          chatId,
          {
            text: `❌ Command "${args[0]}" not found.\n\nUse ${prefix}menu to see all commands.`,
            ...channelInfo,
          },
          { quoted: message },
        );
      }

      const text = `╭━━━━━━━━━━━━━━⬣
┃ 📌 *COMMAND INFO*
┃
┃ ⚡ *Command:* ${prefix}${cmd.command}
┃ 📝 *Desc:* ${cmd.description || "No description"}
┃ 📖 *Usage:* ${cmd.usage || `${prefix}${cmd.command}`}
┃ 🏷️ *Category:* ${cmd.category || "misc"}
┃ 🔖 *Aliases:* ${cmd.aliases?.length ? cmd.aliases.map((a) => prefix + a).join(", ") : "None"}
┃
╰━━━━━━━━━━━━━━⬣`;

      if (fs.existsSync(imagePath)) {
        return sock.sendMessage(
          chatId,
          {
            image: { url: imagePath },
            caption: text,
            ...channelInfo,
          },
          { quoted: message },
        );
      }

      return sock.sendMessage(
        chatId,
        { text, ...channelInfo },
        { quoted: message },
      );
    }

    const style = pick(menuStyles);

    const text = style.render({
      title: settings.botName,
      prefix,
      info: {
        bot: settings.botName,
        prefix: settings.prefixes.join(", "),
        total: commandHandler.commands.size,
        version: settings.version || "5.0.0",
        time: formatTime(),
      },
      categories: commandHandler.categories,
    });

    if (fs.existsSync(imagePath)) {
      await sock.sendMessage(
        chatId,
        {
          image: { url: imagePath },
          caption: text,
          ...channelInfo,
        },
        { quoted: message },
      );
    } else {
      await sock.sendMessage(
        chatId,
        { text, ...channelInfo },
        { quoted: message },
      );
    }
  },
};

/*****************************************************************************
 *                                                                           *
 *                     Developed By Puttus Das                              *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/puttus-das                         *
 *  ▶️  WhatsApp  : https://chat.whatsapp.com/FVLqJnjKPywKZiiMqi1XWH                       *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029Vb8RL4F1HspsNlYYOE3e     *
 *                                                                           *
 *    © 2026 puttus-das. All rights reserved.                            *
 *                                                                           *
 *    Description: This file is part of the PUTTUS-AI Project.                 *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/
