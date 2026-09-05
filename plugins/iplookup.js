/*****************************************************************************
 *                                                                           *
 *                     Developed By Puttus Das                              *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/puttus-das                         *
 *  ▶️  WhatsApp  : https://chat.whatsapp.com/FVLqJnjKPywKZiiMqi1XWH                       *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029Vb7pmbEEwEjzdGSM4G3B     *
 *                                                                           *
 *    © 2026 puttus-das. All rights reserved.                            *
 *                                                                           *
 *    Description: This file is part of the PUTTUS-AI Project.                 *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/

const axios = require("axios");

module.exports = {
  command: "whoisip",
  aliases: ["ip", "iplookup"],
  category: "search",
  description: "Get location info from an IP or Domain",
  usage: ".ip <address/domain>",

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args[0];

    if (!query)
      return await sock.sendMessage(chatId, {
        text: "Enter an IP or Domain (e.g., google.com).",
      });

    try {
      const res = await axios.get(
        `http://ip-api.com/json/${query}?fields=status,message,country,regionName,city,zip,isp,org,as,query`,
      );
      const data = res.data;

      if (data.status === "fail")
        return await sock.sendMessage(chatId, {
          text: `❌ Error: ${data.message}`,
        });

      const info = `
🌐 *IP/Domain Lookup*
---
📍 *Target:* ${data.query}
🌍 *Country:* ${data.country}
🏙️ *City/Region:* ${data.city}, ${data.regionName}
📮 *Zip:* ${data.zip}
📡 *ISP:* ${data.isp}
🏢 *Organization:* ${data.org}
      `.trim();

      await sock.sendMessage(chatId, { text: info }, { quoted: message });
    } catch (err) {
      await sock.sendMessage(chatId, { text: "❌ Network error." });
    }
  },
};

/*****************************************************************************
 *                                                                           *
 *                     Developed By Puttus Das                              *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/puttus-das                         *
 *  ▶️  WhatsApp  : https://chat.whatsapp.com/FVLqJnjKPywKZiiMqi1XWH                       *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029Vb7pmbEEwEjzdGSM4G3B     *
 *                                                                           *
 *    © 2026 puttus-das. All rights reserved.                            *
 *                                                                           *
 *    Description: This file is part of the PUTTUS-AI Project.                 *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/
