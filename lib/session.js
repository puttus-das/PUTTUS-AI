const fs = require("fs");
const path = require("path");

const GITHUB_USERNAME = "stormfiber";

/*
 * Optional old SESSION_ID loader.
 * Telegram /pair flow-এর জন্য SESSION_ID দরকার নেই।
 * Node.js 20-এর built-in fetch ব্যবহার করা হয়েছে।
 */
async function SaveCreds(value) {
  const sessionId = String(value || "").trim();

  if (!sessionId) {
    throw new Error("SESSION_ID is empty");
  }

  const gistId = sessionId.replace(
    "puttus-das/PUTTUS-AI_",
    "",
  );

  const gistUrl =
    `https://gist.githubusercontent.com/` +
    `${GITHUB_USERNAME}/${gistId}/raw/creds.json`;

  const response = await fetch(gistUrl);

  if (!response.ok) {
    throw new Error(
      `Session download failed with HTTP ${response.status}`,
    );
  }

  const responseText = await response.text();

  let credentials = responseText;

  try {
    credentials = JSON.stringify(
      JSON.parse(responseText),
    );
  } catch {
    // Keep original response if it is not JSON.
  }

  const sessionDirectory = path.join(
    __dirname,
    "..",
    "session",
  );

  if (!fs.existsSync(sessionDirectory)) {
    fs.mkdirSync(sessionDirectory, {
      recursive: true,
    });
  }

  const credentialsPath = path.join(
    sessionDirectory,
    "creds.json",
  );

  fs.writeFileSync(
    credentialsPath,
    credentials,
    "utf8",
  );

  return credentialsPath;
}

module.exports = SaveCreds;
