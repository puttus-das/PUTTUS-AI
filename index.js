const fs = require("fs");
const path = require("path");
const NodeCache = require("node-cache");
const PhoneNumber = require("awesome-phonenumber");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore,
  jidDecode,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");

require("./config");

const settings = require("./settings");
const store = require("./lib/lightweight_store");
const SaveCreds = require("./lib/session");
const pairStore = require("./lib/pairStore");
const { app, server, PORT } = require("./lib/server");
const { printLog } = require("./lib/print");
const { smsg } = require("./lib/myfunc");
const libIndex = require("./lib/index");

// Silent logger for Baileys
const silentLogger = {
  level: "silent",

  child() {
    return this;
  },

  trace() {},
  debug() {},
  info() {},
  warn() {},
  error() {},
  fatal() {},
};
