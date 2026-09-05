/*
 * lib/telegramBot.js
 *
 * [ TELEGRAM PAIRING INTEGRATION ]
 *
 * Pairing Logic & Session Integration
 * Developer: @nightx_rebel
 */


const TelegramBot = require('node-telegram-bot-api');
const pairStore = require('./pairStore');

const TELEGRAM_TOKEN = global.TELEGRAM_BOT_TOKEN || "8943139126:AAF9Id2dqLw90ELyp7UAdTq7vDaXTaFphHE"

let bot = null;
let startPairingCallback = null;
let logoutCallback = null;

function initTelegramBot({ onPairRequest, onLogoutRequest }) {
    if (!TELEGRAM_TOKEN) {
        console.log('⚠️ TELEGRAM_BOT_TOKEN is not set, skipping Telegram bot init');
        return null;
    }

    startPairingCallback = onPairRequest;
    logoutCallback = onLogoutRequest;

    bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id,
            '👋 WhatsApp Pairing Bot\n\n' +
            '/pair <number> - Pair a WhatsApp number (e.g. /pair 915790976679)\n' +
            '/status - Check current pairing status\n' +
            '/logout - Log out the current session'
        );
    });

    bot.onText(/\/pair(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const raw = match[1];

        if (!raw) {
            return bot.sendMessage(chatId, '❌ Please provide a number. Example: /pair 915790976679');
        }

        const phoneNumber = raw.replace(/[^0-9]/g, '');
        if (phoneNumber.length < 8) {
            return bot.sendMessage(chatId, '❌ Please provide a valid number. Example: /pair 915790976679');
        }

        const current = pairStore.getActiveSession();

        if (current && current.status === 'connected') {
            return bot.sendMessage(
                chatId,
                `⚠️ Bot is already paired with +${current.number} (Telegram ID: ${current.telegramId}).\n\n` +
                `Please /logout first, then /pair again.`
            );
        }

        if (current && current.status === 'pairing') {
            return bot.sendMessage(
                chatId,
                `⏳ A pairing is already in progress (+${current.number}). Please wait, or /logout to cancel it.`
            );
        }

        pairStore.setSession({ telegramId: chatId, number: phoneNumber, status: 'pairing' });
        bot.sendMessage(chatId, `⏳ Starting pairing for +${phoneNumber}, please wait...`);

        try {
            const code = await startPairingCallback(phoneNumber, chatId);
            bot.sendMessage(
                chatId,
                `🔑 Your Pairing Code: \`${code}\`\n\n` +
                `Go to WhatsApp > Linked Devices > Link with phone number and enter this code.`,
                { parse_mode: 'Markdown' }
            );
        } catch (err) {
            pairStore.clearSession();
            bot.sendMessage(chatId, `❌ Failed to start pairing: ${err.message}`);
        }
    });

    bot.onText(/\/logout/, async (msg) => {
        const chatId = msg.chat.id;
        const current = pairStore.getActiveSession();

        if (!current) {
            return bot.sendMessage(chatId, 'ℹ️ No bot is currently paired.');
        }

        try {
            await logoutCallback();
            pairStore.clearSession();
            bot.sendMessage(chatId, '✅ Logout successful. You can /pair again now.');
        } catch (err) {
            bot.sendMessage(chatId, `❌ Failed to logout: ${err.message}`);
        }
    });

    bot.onText(/\/status/, (msg) => {
        const chatId = msg.chat.id;
        const current = pairStore.getActiveSession();
        if (!current) {
            return bot.sendMessage(chatId, 'ℹ️ No bot is currently paired. Use /pair <number> to start.');
        }
        bot.sendMessage(
            chatId,
            `📊 Status: ${current.status}\n📱 Number: +${current.number}\n🆔 Telegram ID: ${current.telegramId}`
        );
    });

    console.log('✅ Telegram bot started');
    return bot;
}

/**
 * Sends a message to whichever Telegram ID currently owns the active
 * pairing session. Silently no-ops if there's no bot or no active session.
 */
function notify(text, opts = {}) {
    const current = pairStore.getActiveSession();
    if (!bot || !current || !current.telegramId) return;
    bot.sendMessage(current.telegramId, text, opts).catch((err) => {
        console.error('Telegram notify error:', err.message);
    });
}

module.exports = { initTelegramBot, notify };
