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


module.exports = {
  command: 'spoof',
  aliases: ['fakestatus', 'mockstatus'],
  category: 'tools',
  description: 'Send a message replying to a fake status',
  usage: '.spoof @user | StatusText | YourReply',

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const input = args.join(' ');
    
    if (!input.includes('|')) {
      return await sock.sendMessage(chatId, { 
        text: '*Usage:* .spoof @user | Status Content | Your Message' 
      }, { quoted: message });
    }

    const parts = input.split('|').map(t => t.trim());
    if (parts.length < 3) return await sock.sendMessage(chatId, { text: 'Missing parts. Use: User | Status | Reply' });

    const [user, statusText, replyText] = parts;
    const jid = user.replace('@', '') + '@s.whatsapp.net';

    try {
      await sock.sendMessage(chatId, { 
        text: replyText,
        contextInfo: {
          externalAdReply: {
            title: 'Status', 
            body: statusText,
            mediaType: 1,
            previewType: 0,
            showAdAttribution: false,
            thumbnail: Buffer.alloc(0), 
            sourceUrl: 'https://whatsapp.com' 
          },
          participant: jid,
          quotedMessage: {
            conversation: statusText
          }
        }
      });
    } catch (err) {
      console.error('Spoof Error:', err);
      await sock.sendMessage(chatId, { text: '❌ Failed to spoof. Protocol rejected.' });
    }
  }
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
