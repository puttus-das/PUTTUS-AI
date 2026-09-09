require("dotenv").config();

global.SESSION_ID = process.env.SESSION_ID || "";
global.PAIRING_NUMBER = process.env.PAIRING_NUMBER || "";

// Keep the Telegram token in Heroku Config Vars,
// not directly inside this file.
global.TG_TOKEN = process.env.TG_TOKEN || "";

global.APIs = {
  xteam: "https://api.xteam.xyz",
  dzx: "https://api.dhamzxploit.my.id",
  lol: "https://api.lolhuman.xyz",
  violetics: "https://violetics.pw",
  neoxr: "https://api.neoxr.my.id",
  zenzapis: "https://zenzapis.xyz",
  akuari: "https://api.akuari.my.id",
  akuari2: "https://apimu.my.id",
  nrtm: "https://fg-nrtm.ddns.net",
  bg: "http://bochil.ddns.net",
  fgmods: "https://api-fgmods.ddns.net"
};

// Do not place real API keys directly in this file.
// Add them through Heroku Config Vars if required.
global.APIKeys = {
  "https://api.xteam.xyz": "",
  "https://api.lolhuman.xyz": "",
  "https://api.neoxr.my.id": "",
  "https://violetics.pw": "",
  "https://zenzapis.xyz": "",
  "https://api-fgmods.ddns.net": ""
};

module.exports = {
  WARN_COUNT: 3,
  APIs: global.APIs,
  APIKeys: global.APIKeys
};
  
