module.exports = {
  command: 'ping',
  aliases: ['p', 'pong'],
  category: 'general',
  description: 'Check bot response time',
  usage: '.ping',
  isPrefixless: true,
  
// Newsletter info for forwarding
      const newsletterInfo = {
        forwardingScore: 999,
        isForwarded: false,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363423958562123@newsletter',
          newsletterName: ' *•𝐏ᴜᴛᴛᴜꜱ•* ',
          serverMessageId: Date.now() // Using2 timestamp as serverMessageId
  async handler(sock, message, args) {
    const start = Date.now();
    const chatId = message.key.remoteJid;
    
    const sent = await sock.sendMessage(chatId, { 
      text: ' *•𝐏ᴜᴛᴛᴜꜱ•* ' 
    });
    
    const end = Date.now();
    
    await sock.sendMessage(chatId, {
      text: `/n *sᴘᴇᴇᴅ →* : ${end - start} ᴍs`,
    });
  }
};
