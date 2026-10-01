const { exec, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const settings = require("../settings");

/* =========================================================
   HELPERS
========================================================= */

function run(cmd, options = {}) {
  return new Promise((resolve, reject) => {
    exec(
      cmd,
      {
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
        ...options,
      },
      (err, stdout, stderr) => {
        if (err) {
          return reject(
            new Error(
              String(stderr || stdout || err.message || "").trim()
            )
          );
        }

        resolve(String(stdout || "").trim());
      }
    );
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* =========================================================
   PUTTUS VCARD
========================================================= */

function getPuttusVCard() {
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
      id: "PUTTUS-UPDATE-" + Date.now(),
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
   CHECK GIT
========================================================= */

async function hasGitRepo() {
  const gitDir = path.join(process.cwd(), ".git");

  if (!fs.existsSync(gitDir)) {
    return false;
  }

  try {
    await run("git --version");
    await run("git rev-parse --is-inside-work-tree");
    return true;
  } catch {
    return false;
  }
}

/* =========================================================
   GITHUB UPDATE
========================================================= */

async function updateViaGit() {
  const oldRev = await run("git rev-parse HEAD").catch(
    () => "unknown"
  );

  await run("git fetch origin main --prune");

  const newRev = await run(
    "git rev-parse origin/main"
  );

  const alreadyUpToDate =
    oldRev.trim() === newRev.trim();

  let commits = "";
  let files = "";

  if (!alreadyUpToDate && oldRev !== "unknown") {
    commits = await run(
      `git log --pretty=format:"%h %s (%an)" ${oldRev}..${newRev}`
    ).catch(() => "");

    files = await run(
      `git diff --name-status ${oldRev} ${newRev}`
    ).catch(() => "");
  }

  /* =======================================================
     PRESERVE OWNER SETTINGS
  ======================================================= */

  let preservedOwner = null;
  let preservedBotOwner = null;

  try {
    const currentSettings = require("../settings");

    if (currentSettings?.ownerNumber) {
      preservedOwner = String(
        currentSettings.ownerNumber
      );
    }

    if (currentSettings?.botOwner) {
      preservedBotOwner = String(
        currentSettings.botOwner
      );
    }
  } catch {}

  /* =======================================================
     RESET TO GITHUB VERSION
  ======================================================= */

  await run(`git reset --hard ${newRev}`);

  /*
   * Clean untracked files but protect important folders.
   */
  await run(
    "git clean -fd " +
      "-e session " +
      "-e session/ " +
      "-e data " +
      "-e data/ " +
      "-e tmp " +
      "-e tmp/ " +
      "-e temp " +
      "-e temp/"
  );

  /* =======================================================
     RESTORE OWNER SETTINGS
  ======================================================= */

  if (preservedOwner) {
    try {
      const settingsPath = path.join(
        process.cwd(),
        "settings.js"
      );

      if (fs.existsSync(settingsPath)) {
        let text = fs.readFileSync(
          settingsPath,
          "utf8"
        );

        text = text.replace(
          /ownerNumber\s*:\s*['"][^'"]*['"]/,
          `ownerNumber: '${preservedOwner}'`
        );

        if (preservedBotOwner) {
          text = text.replace(
            /botOwner\s*:\s*['"][^'"]*['"]/,
            `botOwner: '${preservedBotOwner}'`
          );
        }

        fs.writeFileSync(
          settingsPath,
          text
        );
      }
    } catch (err) {
      console.log(
        "[UPDATE] Owner settings preserve failed:",
        err.message
      );
    }
  }

  return {
    oldRev: oldRev.trim(),
    newRev: newRev.trim(),
    alreadyUpToDate,
    commits,
    files,
  };
}

/* =========================================================
   NPM INSTALL
========================================================= */

async function installDependencies() {
  try {
    const npmPath = await run("which npm");

    console.log(
      "[UPDATE] Using npm:",
      npmPath
    );

    await run(
      "npm install --no-audit --no-fund"
    );

    return true;
  } catch (err) {
    console.error(
      "[UPDATE] npm install failed:",
      err.message
    );

    throw new Error(
      `npm install failed:\n${err.message}`
    );
  }
}

/* =========================================================
   BUILD UPDATE MESSAGE
========================================================= */

function buildUpdateMessage({
  oldRev,
  newRev,
  alreadyUpToDate,
  commits,
  files,
}) {
  if (alreadyUpToDate) {
    return (
      `*✅ ᴀʟʀᴇᴀᴅʏ ᴜᴘ ᴛᴏ ᴅᴀᴛᴇ!*\n\n` +
      `📌 *ᴄᴜʀʀᴇɴᴛ:* \`${newRev.substring(0, 7)}\``
    );
  }

  let text =
    `*✅ ᴜᴘᴅᴀᴛᴇᴅ sᴜᴄᴄᴇssғᴜʟʟʏ!*\n\n` +
    `📌 *ᴏʟᴅ:* \`${oldRev.substring(0, 7)}\`\n` +
    `📌 *ɴᴇᴡ:* \`${newRev.substring(0, 7)}\`\n`;

  /* =======================================================
     COMMITS
  ======================================================= */

  if (commits) {
    const commitLines = commits
      .split("\n")
      .filter(Boolean)
      .slice(0, 5);

    text +=
      `\n📝 *ʀᴇᴄᴇɴᴛ ᴄᴏᴍᴍɪᴛs:*\n`;

    for (const commit of commitLines) {
      const match = commit.match(
        /^([a-f0-9]+)\s+(.*?)(?:\s+\((.*?)\))?$/
      );

      if (match) {
        const hash = match[1];
        const subject = match[2];
        const author = match[3];

        text +=
          `• *${hash}* — *${subject}*`;

        if (author) {
          text += ` *(${author})*`;
        }

        text += `\n`;
      } else {
        text += `• *${commit}*\n`;
      }
    }
  }

  /* =======================================================
     CHANGED FILES
  ======================================================= */

  if (files) {
    const fileLines = files
      .split("\n")
      .filter(Boolean);

    text +=
      `\n📁 *ᴄʜᴀɴɢᴇᴅ ғɪʟᴇs:*\n`;

    for (const file of fileLines.slice(0, 10)) {
      const parts = file.split(/\s+/);

      if (parts.length >= 2) {
        text +=
          `• *${parts[0]}* — *${parts
            .slice(1)
            .join(" ")}*\n`;
      } else {
        text += `• *${file}*\n`;
      }
    }

    if (fileLines.length > 10) {
      text +=
        `• ... ᴀɴᴅ ${
          fileLines.length - 10
        } ᴍᴏʀᴇ\n`;
    }
  }

  return text;
}

/* =========================================================
   RESTART BOT
========================================================= */

async function restartProcess() {
  /*
   * Try PM2 first.
   */
  try {
    await run("command -v pm2");
    await run("pm2 restart all");

    console.log(
      "[UPDATE] Bot restarted using PM2."
    );

    return;
  } catch {}

  /*
   * PM2 not available.
   * Start index.js directly.
   */

  const indexPath = path.join(
    process.cwd(),
    "index.js"
  );

  if (!fs.existsSync(indexPath)) {
    throw new Error(
      "index.js not found. Cannot restart bot."
    );
  }

  console.log(
    "[UPDATE] PM2 not found. Restarting index.js..."
  );

  const child = spawn(
    process.execPath,
    [indexPath],
    {
      cwd: process.cwd(),

      env: {
        ...process.env,
      },

      detached: true,

      stdio: "ignore",
    }
  );

  child.unref();

  setTimeout(() => {
    process.exit(0);
  }, 1500);
}

/* =========================================================
   UPDATE COMMAND
========================================================= */

module.exports = {
  command: "update",

  aliases: [
    "upgrade",
    "restart",
  ],

  category: "owner",

  description:
    "Update bot from GitHub and restart automatically",

  usage:
    ".update",

  ownerOnly: true,

  async handler(
    sock,
    message,
    args,
    context = {}
  ) {
    const {
      chatId,
      channelInfo,
    } = context;

    try {
      /* =====================================================
         START MESSAGE
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          text:
            `🔄 *ᴘᴜᴛᴛᴜs-ʙᴏᴛ ᴜᴘᴅᴀᴛᴇ*\n\n` +
            `⏳ *ᴄʜᴇᴄᴋɪɴɢ ɢɪᴛʜᴜʙ...*\n` +
            `*ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ...*`,
          ...channelInfo,
        },
        {
          quoted: message,
        }
      );

      /* =====================================================
         CHECK GIT REPOSITORY
      ===================================================== */

      const gitAvailable =
        await hasGitRepo();

      if (!gitAvailable) {
        throw new Error(
          "Git repository not found.\n" +
          "PUTTUS-AI must be cloned from GitHub."
        );
      }

      /* =====================================================
         UPDATE
      ===================================================== */

      const update =
        await updateViaGit();

      /* =====================================================
         NPM INSTALL
      ===================================================== */

      await installDependencies();

      /* =====================================================
         VERSION
      ===================================================== */

      let version = "unknown";

      try {
        delete require.cache[
          require.resolve("../settings")
        ];

        const newSettings =
          require("../settings");

        version =
          newSettings?.version ||
          "unknown";
      } catch {}

      /* =====================================================
         REPORT
      ===================================================== */

      let report =
        buildUpdateMessage(update);

      report +=
        `\n\n🔖 *ᴠᴇʀsɪᴏɴ:* *${version}*` +
        `\n\n♻️ *ʀᴇsᴛᴀʀᴛɪɴɢ ʙᴏᴛ...*`;

      /* =====================================================
         PUTTUS VCARD
      ===================================================== */

      const statusQuote =
        getPuttusVCard();

      /* =====================================================
         SEND UPDATE REPORT
      ===================================================== */

      await sock.sendMessage(
        chatId,
        {
          text: report,
          ...channelInfo,
        },
        {
          quoted: statusQuote,
        }
      );

      /* =====================================================
         WAIT BEFORE RESTART
      ===================================================== */

      await sleep(2000);

      /* =====================================================
         RESTART
      ===================================================== */

      await restartProcess();

    } catch (err) {
      console.error(
        "[UPDATE] Update failed:",
        err
      );

      try {
        await sock.sendMessage(
          chatId,
          {
            text:
              `❌ *ᴜᴘᴅᴀᴛᴇ ғᴀɪʟᴇᴅ*\n\n` +
              `└─ ${String(
                err?.message || err
              )}`,
            ...channelInfo,
          },
          {
            quoted: message,
          }
        );
      } catch (sendError) {
        console.error(
          "[UPDATE] Error message failed:",
          sendError
        );
      }
    }
  },
};
