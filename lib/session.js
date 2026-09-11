const fs = require("fs");
const path = require("path");

const GITHUB_USERNAME =
  process.env.SESSION_GITHUB_USERNAME ||
  "stormfiber";

/*
 * -------------------------------------------------------
 * SESSION LOADER
 * -------------------------------------------------------
 *
 * This loader is ONLY for the old SESSION_ID system.
 *
 * Telegram /pair does NOT require SESSION_ID.
 *
 * IMPORTANT:
 * A single creds.json is not a complete Baileys
 * multi-file auth backup.
 * -------------------------------------------------------
 */

async function SaveCreds(value) {
  const sessionId =
    String(value || "").trim();

  if (!sessionId) {
    throw new Error(
      "SESSION_ID is empty",
    );
  }

  /*
   * Support:
   *
   * puttus-das/PUTTUS-AI_<gist-id>
   *
   * and plain gist ID.
   */
  let gistId =
    sessionId.replace(
      "puttus-das/PUTTUS-AI_",
      "",
    );

  /*
   * If someone provides a full GitHub Gist URL.
   */
  gistId =
    gistId
      .replace(
        /^https?:\/\/gist\.githubusercontent\.com\/[^/]+\//i,
        "",
      )
      .replace(
        /\/raw\/.*$/i,
        "",
      )
      .trim();

  if (!gistId) {
    throw new Error(
      "Invalid SESSION_ID / Gist ID.",
    );
  }

  const gistUrl =
    `https://gist.githubusercontent.com/` +
    `${GITHUB_USERNAME}/` +
    `${gistId}/raw/creds.json`;

  const response =
    await fetch(
      gistUrl,
    );

  if (!response.ok) {
    throw new Error(
      `Session download failed with HTTP ${response.status}`,
    );
  }

  const responseText =
    await response.text();

  if (
    !responseText.trim()
  ) {
    throw new Error(
      "Downloaded session is empty.",
    );
  }

  let credentials;

  try {
    const parsed =
      JSON.parse(
        responseText,
      );

    if (
      !parsed ||
      typeof parsed !==
        "object"
    ) {
      throw new Error(
        "Invalid credentials JSON.",
      );
    }

    credentials =
      JSON.stringify(
        parsed,
        null,
        2,
      );
  } catch (error) {
    throw new Error(
      "Downloaded creds.json is not valid JSON.",
    );
  }

  const sessionDirectory =
    path.join(
      __dirname,
      "..",
      "session",
    );

  if (
    !fs.existsSync(
      sessionDirectory,
    )
  ) {
    fs.mkdirSync(
      sessionDirectory,
      {
        recursive: true,
      },
    );
  }

  const credentialsPath =
    path.join(
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

module.exports =
  SaveCreds;
