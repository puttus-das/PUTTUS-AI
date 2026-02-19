module.exports = {
  command: 'ping',
  aliases: ['p', 'pong'],
  category: 'general',
  description: 'Check bot response time',
  usage: '.ping',
  isPrefixless: true,
  
  async handler(sock, message, args) {
    const start = Date.now();
    const chatId = message.key.remoteJid;
    
    const sent = await sock.sendMessage(chatId, { 
      text: ' *𝐏ᴜᴛᴛᴜꜱ 𝐏꯭ᴏ꯭ɴ꯭ɢ꯭*...'
    });
    
    const end = Date.now();
    
    await sock.sendMessage(chatId, {
      text: `/n> *sᴘᴇᴇᴅ →* : ${end - start}  *ᴍs* ,
    });
  }
};
