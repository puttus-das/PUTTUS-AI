// lib/pairStore.js
// Tracks the single active WhatsApp pairing session (which Telegram ID paired
// which number, and its current status) in a small JSON file on disk.

const fs = require("fs");
const path = require("path");

const STORE_PATH = path.join(__dirname, "../data/pairSession.json");

function ensureFile() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_PATH))
    fs.writeFileSync(STORE_PATH, JSON.stringify(null));
}

/**
 * Returns the active session object, or null if none.
 * Shape: { telegramId, number, status } where status is
 * 'pairing' | 'connected' | 'disconnected'
 */
function getActiveSession() {
  ensureFile();
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    const data = JSON.parse(raw);
    return data;
  } catch (err) {
    return null;
  }
}

function setSession(session) {
  ensureFile();
  fs.writeFileSync(STORE_PATH, JSON.stringify(session, null, 2));
}

function updateSession(patch) {
  const current = getActiveSession() || {};
  setSession({ ...current, ...patch });
}

function clearSession() {
  ensureFile();
  fs.writeFileSync(STORE_PATH, JSON.stringify(null));
}

module.exports = { getActiveSession, setSession, updateSession, clearSession };
