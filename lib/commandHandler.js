const fs = require("fs");
const path = require("path");

class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
    this.categories = new Map();
    this.stats = new Map();
    this.cooldowns = new Map();
    this.disabledCommands = new Set();
    this.prefixlessCommands = new Map();

    this.watchPlugins();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function getPuttusVCardQuote() {
  const botJid =
    "919641092392@s.whatsapp.net";

  const vcard =
    "BEGIN:VCARD\n" +
    "VERSION:3.0\n" +
    "N:PUTTUS;BOT;;;\n" +
    "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
    "ORG:PUTTUS BOT\n" +
    "TEL;TYPE=CELL;TYPE=VOICE;waid=919641092392:+919641092392\n" +
    "END:VCARD";

  return {
    key: {
      remoteJid: "status@broadcast",
      fromMe: false,
      id: "PUTTUS-" + Date.now(),
      participant: botJid,
    },

    message: {
      contactMessage: {
        displayName:
          "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
        vcard,
      },
    },
  };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // AUTO VCARD SEND WRAPPER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  createAutoVCardSock(sock) {
    const handler = this;

    return new Proxy(sock, {
      get(target, property) {
        if (property === "sendMessage") {
          return async function (chatId, content, options = {}) {
            const newOptions = {
              ...options,
            };

            // Plugin explicitly gives quoted → keep it
            // Otherwise → automatically use PUTTUS VCard
            if (!newOptions.quoted) {
              newOptions.quoted = handler.createVCardQuote();
            }

            return await target.sendMessage(
              chatId,
              content,
              newOptions,
            );
          };
        }

        return Reflect.get(target, property);
      },
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // WATCH PLUGINS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  watchPlugins() {
    const pluginsPath = path.join(__dirname, "../plugins");

    if (!fs.existsSync(pluginsPath)) return;

    fs.watch(pluginsPath, (eventType, filename) => {
      if (filename && filename.endsWith(".js")) {
        const filePath = path.join(pluginsPath, filename);

        try {
          if (fs.existsSync(filePath)) {
            delete require.cache[require.resolve(filePath)];

            const plugin = require(filePath);

            if (plugin.command) {
              this.registerCommand(plugin);

              if (plugin.isPrefixless === true) {
                const cmdKey = plugin.command.toLowerCase();

                this.prefixlessCommands.set(
                  cmdKey,
                  cmdKey,
                );

                if (
                  plugin.aliases &&
                  Array.isArray(plugin.aliases)
                ) {
                  plugin.aliases.forEach((alias) => {
                    this.prefixlessCommands.set(
                      alias.toLowerCase(),
                      cmdKey,
                    );
                  });
                }
              }

              console.log(
                `[WATCHER] Hot-reloaded: ${filename}`,
              );
            }
          }
        } catch (error) {
          console.error(
            `[WATCHER] Error reloading ${filename}:`,
            error.message,
          );
        }
      }
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LOAD COMMANDS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  loadCommands() {
    const pluginsPath = path.join(__dirname, "../plugins");

    const files = fs
      .readdirSync(pluginsPath)
      .filter((f) => f.endsWith(".js"));

    for (const file of files) {
      try {
        const filePath = path.join(pluginsPath, file);

        delete require.cache[require.resolve(filePath)];

        const plugin = require(filePath);

        if (plugin.command) {
          this.registerCommand(plugin);

          if (plugin.isPrefixless === true) {
            const cmdKey = plugin.command.toLowerCase();

            this.prefixlessCommands.set(
              cmdKey,
              cmdKey,
            );

            if (
              plugin.aliases &&
              Array.isArray(plugin.aliases)
            ) {
              plugin.aliases.forEach((alias) => {
                this.prefixlessCommands.set(
                  alias.toLowerCase(),
                  cmdKey,
                );
              });
            }
          }
        }
      } catch (error) {
        console.error(
          `Error loading ${file}:`,
          error.message,
        );
      }
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // REGISTER COMMAND
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  registerCommand(plugin) {
    const {
      command,
      aliases = [],
      category = "misc",
      handler,
    } = plugin;

    // INTEGRITY CHECK
    if (!command || typeof handler !== "function") {
      console.error(
        `[SKIP] Plugin at ${
          command || "unknown"
        } is missing a valid command name or handler function.`,
      );

      return;
    }

    const cmdKey = command.toLowerCase();

    // DUPLICATE CHECK
    if (this.commands.has(cmdKey)) {
      console.warn(
        `[REPLACED] Command "${cmdKey}" was already registered and has been overwritten.`,
      );
    }

    this.stats.set(cmdKey, {
      calls: 0,
      errors: 0,
      totalTime: 0n,
      avgMs: 0,
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MONITORED HANDLER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const monitoredHandler = async (
      sock,
      message,
      ...args
    ) => {
      const s = this.stats.get(cmdKey);

      // COMMAND DISABLED
      if (this.disabledCommands.has(cmdKey)) {
        const autoSock = this.createAutoVCardSock(sock);

        return await autoSock.sendMessage(
          message.key.remoteJid,
          {
            text: `🚫 The command *${cmdKey}* is currently disabled.`,
          },
        );
      }

      const userId =
        message.key.participant ||
        message.key.remoteJid;

      const now = Date.now();

      const cooldownKey = `${userId}_${cmdKey}`;

      // COOLDOWN
      if (this.cooldowns.has(cooldownKey)) {
        const expirationTime =
          this.cooldowns.get(cooldownKey) +
          (plugin.cooldown || 3000);

        if (now < expirationTime) return;
      }

      this.cooldowns.set(
        cooldownKey,
        now,
      );

      const start =
        process.hrtime.bigint();

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // AUTO VCARD SOCK
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const autoSock =
        this.createAutoVCardSock(sock);

      try {
        s.calls++;

        return await handler(
          autoSock,
          message,
          ...args,
        );
      } catch (err) {
        s.errors++;
        throw err;
      } finally {
        const end =
          process.hrtime.bigint();

        s.totalTime +=
          end - start;

        s.avgMs =
          Number(
            s.totalTime /
              BigInt(s.calls || 1),
          ) / 1_000_000;
      }
    };

    this.commands.set(cmdKey, {
      ...plugin,
      command,
      handler: monitoredHandler,
      category:
        category.toLowerCase(),
      aliases,
    });

    // ALIASES
    for (const alias of aliases) {
      this.aliases.set(
        alias.toLowerCase(),
        cmdKey,
      );
    }

    // CATEGORY
    if (
      !this.categories.has(
        category.toLowerCase(),
      )
    ) {
      this.categories.set(
        category.toLowerCase(),
        [],
      );
    }

    if (
      !this.categories
        .get(category.toLowerCase())
        .includes(command)
    ) {
      this.categories
        .get(category.toLowerCase())
        .push(command);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TOGGLE COMMAND
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  toggleCommand(name) {
    const cmd = name.toLowerCase();

    if (this.disabledCommands.has(cmd)) {
      this.disabledCommands.delete(cmd);
      return "enabled";
    } else {
      this.disabledCommands.add(cmd);
      return "disabled";
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LEVENSHTEIN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  _levenshtein(a, b) {
    const tmp = [];

    for (let i = 0; i <= a.length; i++) {
      tmp[i] = [i];
    }

    for (let j = 0; j <= b.length; j++) {
      tmp[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        tmp[i][j] = Math.min(
          tmp[i - 1][j] + 1,
          tmp[i][j - 1] + 1,
          tmp[i - 1][j - 1] +
            (a[i - 1] === b[j - 1]
              ? 0
              : 1),
        );
      }
    }

    return tmp[a.length][b.length];
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FIND SUGGESTION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  findSuggestion(cmd) {
    const allNames = [
      ...this.commands.keys(),
      ...this.aliases.keys(),
    ];

    let bestMatch = null;
    let minDistance = 3;

    for (const name of allNames) {
      const distance =
        this._levenshtein(cmd, name);

      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = name;
      }
    }

    return bestMatch;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DIAGNOSTICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getDiagnostics() {
    return Array.from(
      this.stats.entries(),
    )
      .map(([name, data]) => ({
        command: name,
        usage: data.calls,
        errors: data.errors,
        average_speed:
          `${data.avgMs.toFixed(3)}ms`,
        status:
          this.disabledCommands.has(name)
            ? "OFF"
            : "ON",
      }))
      .sort(
        (a, b) =>
          b.usage - a.usage,
      );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RESET STATS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  resetStats() {
    this.stats.clear();
    this.cooldowns.clear();

    for (const cmd of this.commands.keys()) {
      this.stats.set(cmd, {
        calls: 0,
        errors: 0,
        totalTime: 0n,
        avgMs: 0,
      });
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RELOAD COMMANDS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  reloadCommands() {
    this.commands.clear();
    this.aliases.clear();
    this.categories.clear();
    this.stats.clear();
    this.cooldowns.clear();
    this.disabledCommands.clear();
    this.prefixlessCommands.clear();

    this.loadCommands();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GET COMMAND
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getCommand(text, prefixes) {
    const usedPrefix =
      prefixes.find((p) =>
        text.startsWith(p),
      );

    const firstWord = text
      .trim()
      .split(" ")[0]
      .toLowerCase();

    // PREFIXLESS
    if (!usedPrefix) {
      if (
        this.prefixlessCommands.has(
          firstWord,
        )
      ) {
        const targetCmd =
          this.prefixlessCommands.get(
            firstWord,
          );

        return this.commands.get(
          targetCmd,
        );
      }

      return null;
    }

    const fullCommand = text
      .slice(usedPrefix.length)
      .trim()
      .split(" ")[0]
      .toLowerCase();

    if (
      this.commands.has(fullCommand)
    ) {
      return this.commands.get(
        fullCommand,
      );
    }

    if (
      this.aliases.has(fullCommand)
    ) {
      const mainCommand =
        this.aliases.get(
          fullCommand,
        );

      return this.commands.get(
        mainCommand,
      );
    }

    const suggestion =
      this.findSuggestion(
        fullCommand,
      );

    if (suggestion) {
      return {
        command: suggestion,

        handler: async (
          sock,
          message,
        ) => {
          const chatId =
            message.key.remoteJid;

          await sock.sendMessage(
            chatId,
            {
              text: `❓ Did you mean *${usedPrefix}${suggestion}*?`,
            },
            {
              quoted: getPuttusVCardQuote(),
            },
          );
        },
      };
    }

    return null;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GET COMMANDS BY CATEGORY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getCommandsByCategory(category) {
    return (
      this.categories.get(
        category.toLowerCase(),
      ) || []
    );
  }
}

module.exports = new CommandHandler();
