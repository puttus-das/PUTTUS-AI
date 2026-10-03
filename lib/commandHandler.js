const fs = require("fs");
const path = require("path");

/* =========================================================
   PUTTUS VCARD
========================================================= */

function getPuttusVCardQuote() {
  const botJid = "919641092392@s.whatsapp.net";

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


/* =========================================================
   COMMAND HANDLER
========================================================= */

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


  /* =======================================================
     AUTO VCARD SEND WRAPPER
  ======================================================= */

  createAutoVCardSock(sock) {
    return new Proxy(sock, {
      get(target, property) {
        if (property === "sendMessage") {
          return async function (
            chatId,
            content,
            options = {}
          ) {
            const newOptions = {
              ...options,
            };

            /*
             * Plugin নিজে quoted দিলে
             * সেটা পরিবর্তন হবে না।
             *
             * quoted না দিলে PUTTUS VCard
             * automatically quoted হবে।
             */

            if (!newOptions.quoted) {
              newOptions.quoted =
                getPuttusVCardQuote();
            }

            return await target.sendMessage(
              chatId,
              content,
              newOptions
            );
          };
        }

        return Reflect.get(
          target,
          property
        );
      },
    });
  }


  /* =======================================================
     WATCH PLUGINS
  ======================================================= */

  watchPlugins() {
    const pluginsDir = path.join(
      __dirname,
      "..",
      "plugins"
    );

    if (!fs.existsSync(pluginsDir)) {
      console.log(
        "⚠️ Plugins directory not found:",
        pluginsDir
      );

      return;
    }

    this.loadCommands();

    try {
      fs.watch(
        pluginsDir,
        { recursive: false },
        (eventType, filename) => {
          if (
            !filename ||
            !filename.endsWith(".js")
          ) {
            return;
          }

          console.log(
            `🔄 Plugin ${eventType}: ${filename}`
          );

          setTimeout(() => {
            this.reloadCommands();
          }, 500);
        }
      );
    } catch (error) {
      console.log(
        "⚠️ Plugin watcher error:",
        error.message
      );
    }
  }


  /* =======================================================
     LOAD COMMANDS
  ======================================================= */

  loadCommands() {
    const pluginsDir = path.join(
      __dirname,
      "..",
      "plugins"
    );

    if (!fs.existsSync(pluginsDir)) {
      return;
    }

    const files = fs
      .readdirSync(pluginsDir)
      .filter(
        (file) =>
          file.endsWith(".js")
      );

    for (const file of files) {
      try {
        const pluginPath =
          path.join(
            pluginsDir,
            file
          );

        delete require.cache[
          require.resolve(pluginPath)
        ];

        const plugin =
          require(pluginPath);

        if (plugin) {
          this.registerCommand(
            plugin
          );
        }
      } catch (error) {
        console.log(
          `❌ Failed loading ${file}:`,
          error.message
        );
      }
    }

    console.log(
      `✅ Loaded ${this.commands.size} commands`
    );
  }


  /* =======================================================
     REGISTER COMMAND
  ======================================================= */

  registerCommand(plugin) {
    if (!plugin) {
      return;
    }

    const command =
      plugin.command ||
      plugin.name;

    if (!command) {
      return;
    }

    const commandNames =
      Array.isArray(command)
        ? command
        : [command];

    for (const name of commandNames) {
      if (!name) {
        continue;
      }

      const commandName =
        String(name)
          .toLowerCase()
          .trim();

      this.commands.set(
        commandName,
        plugin
      );


      /* ---------------- ALIAS ---------------- */

      if (
        Array.isArray(
          plugin.alias
        )
      ) {
        for (
          const alias of plugin.alias
        ) {
          this.aliases.set(
            String(alias)
              .toLowerCase()
              .trim(),
            commandName
          );
        }
      }

      if (
        Array.isArray(
          plugin.aliases
        )
      ) {
        for (
          const alias of plugin.aliases
        ) {
          this.aliases.set(
            String(alias)
              .toLowerCase()
              .trim(),
            commandName
          );
        }
      }


      /* ---------------- CATEGORY ---------------- */

      const category =
        plugin.category ||
        "misc";

      if (
        !this.categories.has(
          category
        )
      ) {
        this.categories.set(
          category,
          new Set()
        );
      }

      this.categories
        .get(category)
        .add(commandName);


      /* ---------------- STATS ---------------- */

      this.stats.set(
        commandName,
        this.stats.get(
          commandName
        ) || {
          uses: 0,
          errors: 0,
        }
      );


      /* ---------------- PREFIXLESS ---------------- */

      if (
        plugin.isPrefixless === true
      ) {
        this.prefixlessCommands.set(
          commandName,
          plugin
        );
      }
    }
  }


  /* =======================================================
     TOGGLE COMMAND
  ======================================================= */

  toggleCommand(name) {
    const commandName =
      String(name)
        .toLowerCase()
        .trim();

    if (
      this.disabledCommands.has(
        commandName
      )
    ) {
      this.disabledCommands.delete(
        commandName
      );

      return true;
    }

    this.disabledCommands.add(
      commandName
    );

    return false;
  }


  /* =======================================================
     LEVENSHTEIN
  ======================================================= */

  _levenshtein(a, b) {
    a = String(a);
    b = String(b);

    const matrix = [];

    for (
      let i = 0;
      i <= b.length;
      i++
    ) {
      matrix[i] = [i];
    }

    for (
      let j = 0;
      j <= a.length;
      j++
    ) {
      matrix[0][j] = j;
    }

    for (
      let i = 1;
      i <= b.length;
      i++
    ) {
      for (
        let j = 1;
        j <= a.length;
        j++
      ) {
        if (
          b.charAt(i - 1) ===
          a.charAt(j - 1)
        ) {
          matrix[i][j] =
            matrix[i - 1][j - 1];
        } else {
          matrix[i][j] =
            Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
        }
      }
    }

    return matrix[b.length][a.length];
  }


  /* =======================================================
     FIND SUGGESTION
  ======================================================= */

  findSuggestion(cmd) {
    if (!cmd) {
      return null;
    }

    const input =
      String(cmd)
        .toLowerCase()
        .trim();

    let bestMatch = null;
    let bestDistance = Infinity;

    const allCommands = [
      ...this.commands.keys(),
      ...this.aliases.keys(),
    ];

    for (
      const command of allCommands
    ) {
      const distance =
        this._levenshtein(
          input,
          command
        );

      const maxLength =
        Math.max(
          input.length,
          command.length
        );

      const threshold =
        maxLength <= 4
          ? 1
          : maxLength <= 7
            ? 2
            : 3;

      if (
        distance <= threshold &&
        distance < bestDistance
      ) {
        bestDistance =
          distance;

        bestMatch =
          command;
      }
    }

    if (!bestMatch) {
      return null;
    }

    return (
      this.aliases.get(
        bestMatch
      ) ||
      bestMatch
    );
  }


  /* =======================================================
     GET COMMAND
  ======================================================= */

  getCommand(
    text,
    prefixes = [".", "/", "!"]
  ) {
    if (!text) {
      return null;
    }

    let input =
      String(text).trim();

    let usedPrefix = "";


    /* ---------------- PREFIX ---------------- */

    for (
      const prefix of prefixes
    ) {
      if (
        input.startsWith(prefix)
      ) {
        usedPrefix =
          prefix;

        input =
          input
            .slice(
              prefix.length
            )
            .trim();

        break;
      }
    }


    /*
     * Prefix ছাড়া normal text
     * command হবে না।
     */

    if (!usedPrefix) {
      return null;
    }


    const parts =
      input.split(/\s+/);

    const fullCommand = (
      parts.shift() || ""
    ).toLowerCase();


    if (!fullCommand) {
      return null;
    }


    /* =====================================================
       ALIAS
    ===================================================== */

    let commandName =
      fullCommand;

    if (
      this.aliases.has(
        commandName
      )
    ) {
      commandName =
        this.aliases.get(
          commandName
        );
    }


    /* =====================================================
       NORMAL COMMAND
    ===================================================== */

    if (
      this.commands.has(
        commandName
      )
    ) {
      if (
        this.disabledCommands.has(
          commandName
        )
      ) {
        return null;
      }

      const plugin =
        this.commands.get(
          commandName
        );

      return {
        ...plugin,
        command:
          commandName,
        args: parts,
      };
    }


    /* =====================================================
       PREFIXLESS COMMAND
    ===================================================== */

    if (
      this.prefixlessCommands.has(
        fullCommand
      )
    ) {
      const plugin =
        this.prefixlessCommands.get(
          fullCommand
        );

      return {
        ...plugin,
        command:
          fullCommand,
        args: parts,
      };
    }


    /* =====================================================
       DID YOU MEAN
       ALL USERS + OWNER
    ===================================================== */

    const suggestion =
      this.findSuggestion(
        fullCommand
      );

    const suggestionText =
      suggestion
        ? `Did you mean *${usedPrefix}${suggestion}*?`
        : `Did you mean *${usedPrefix}menu*?`;


    return {
      command:
        "__did_you_mean__",

      args: [],

      isSuggestion:
        true,

      handler: async (
        sock,
        message
      ) => {
        const chatId =
          message?.key?.remoteJid;

        if (!chatId) {
          return;
        }

        const senderJid =
          message.key?.participant ||
          message.key?.remoteJid;

        if (!senderJid) {
          return;
        }

        const number =
          senderJid.split("@")[0];


        await sock.sendMessage(
          chatId,
          {
            text:
              `❓ @${number} ${suggestionText}`,

            mentions: [
              senderJid,
            ],
          },
          {
            quoted:
              getPuttusVCardQuote(),
          }
        );
      },
    };
  }


  /* =======================================================
     GET COMMANDS BY CATEGORY
  ======================================================= */

  getCommandsByCategory(category) {
    if (!category) {
      return [];
    }

    const set =
      this.categories.get(
        String(category)
          .toLowerCase()
      );

    if (!set) {
      return [];
    }

    return [
      ...set,
    ];
  }


  /* =======================================================
     DIAGNOSTICS
  ======================================================= */

  getDiagnostics() {
    return {
      commands:
        this.commands.size,

      aliases:
        this.aliases.size,

      categories:
        this.categories.size,

      prefixless:
        this.prefixlessCommands.size,

      disabled:
        this.disabledCommands.size,
    };
  }


  /* =======================================================
     RESET STATS
  ======================================================= */

  resetStats() {
    for (
      const [command] of
      this.stats
    ) {
      this.stats.set(
        command,
        {
          uses: 0,
          errors: 0,
        }
      );
    }

    return true;
  }


  /* =======================================================
     RELOAD COMMANDS
  ======================================================= */

  reloadCommands() {
    this.commands.clear();
    this.aliases.clear();
    this.categories.clear();
    this.prefixlessCommands.clear();

    this.loadCommands();

    return true;
  }
}


/* =========================================================
   EXPORT
========================================================= */

module.exports =
  new CommandHandler();
