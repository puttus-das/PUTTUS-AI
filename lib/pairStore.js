const fs = require("fs");
const path = require("path");

const STORE_PATH =
  path.join(
    __dirname,
    "../data/pairSession.json",
  );

/*
 * -------------------------------------------------------
 * ENSURE STORE
 * -------------------------------------------------------
 */

function ensureStoreFile() {
  const dataDirectory =
    path.dirname(
      STORE_PATH,
    );

  if (
    !fs.existsSync(
      dataDirectory,
    )
  ) {
    fs.mkdirSync(
      dataDirectory,
      {
        recursive: true,
      },
    );
  }

  if (
    !fs.existsSync(
      STORE_PATH,
    )
  ) {
    fs.writeFileSync(
      STORE_PATH,
      JSON.stringify(
        null,
        null,
        2,
      ),
      "utf8",
    );
  }
}

/*
 * -------------------------------------------------------
 * READ
 * -------------------------------------------------------
 */

function getActiveSession() {
  ensureStoreFile();

  try {
    const fileContent =
      fs.readFileSync(
        STORE_PATH,
        "utf8",
      );

    if (
      !fileContent.trim()
    ) {
      return null;
    }

    return JSON.parse(
      fileContent,
    );
  } catch (error) {
    console.error(
      "Pair store read error:",
      error.message,
    );

    return null;
  }
}

/*
 * -------------------------------------------------------
 * WRITE
 * -------------------------------------------------------
 */

function setSession(
  session,
) {
  ensureStoreFile();

  const tempPath =
    `${STORE_PATH}.tmp`;

  try {
    fs.writeFileSync(
      tempPath,
      JSON.stringify(
        session,
        null,
        2,
      ),
      "utf8",
    );

    fs.renameSync(
      tempPath,
      STORE_PATH,
    );
  } catch (error) {
    try {
      if (
        fs.existsSync(
          tempPath,
        )
      ) {
        fs.unlinkSync(
          tempPath,
        );
      }
    } catch {}

    throw error;
  }
}

/*
 * -------------------------------------------------------
 * UPDATE
 * -------------------------------------------------------
 */

function updateSession(
  changes,
) {
  const currentSession =
    getActiveSession() ||
    {};

  setSession({
    ...currentSession,
    ...changes,
  });
}

/*
 * -------------------------------------------------------
 * CLEAR
 * -------------------------------------------------------
 */

function clearSession() {
  ensureStoreFile();

  setSession(null);
}

/*
 * -------------------------------------------------------
 * EXPORT
 * -------------------------------------------------------
 */

module.exports = {
  getActiveSession,
  setSession,
  updateSession,
  clearSession,
};
