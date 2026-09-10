const fs = require("fs");
const path = require("path");

const STORE_PATH = path.join(
  __dirname,
  "../data/pairSession.json",
);

function ensureStoreFile() {
  const dataDirectory = path.dirname(STORE_PATH);

  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, {
      recursive: true,
    });
  }

  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(
      STORE_PATH,
      JSON.stringify(null, null, 2),
      "utf8",
    );
  }
}

function getActiveSession() {
  ensureStoreFile();

  try {
    const fileContent = fs.readFileSync(
      STORE_PATH,
      "utf8",
    );

    return JSON.parse(fileContent);
  } catch (error) {
    console.error(
      "Pair store read error:",
      error.message,
    );

    return null;
  }
}

function setSession(session) {
  ensureStoreFile();

  fs.writeFileSync(
    STORE_PATH,
    JSON.stringify(session, null, 2),
    "utf8",
  );
}

function updateSession(changes) {
  const currentSession = getActiveSession() || {};

  setSession({
    ...currentSession,
    ...changes,
  });
}

function clearSession() {
  ensureStoreFile();

  fs.writeFileSync(
    STORE_PATH,
    JSON.stringify(null, null, 2),
    "utf8",
  );
}

module.exports = {
  getActiveSession,
  setSession,
  updateSession,
  clearSession,
};
