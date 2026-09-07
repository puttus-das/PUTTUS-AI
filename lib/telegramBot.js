/*
 * lib/telegramBot.js
 *
 * [ TELEGRAM PAIRING INTEGRATION ]
 * Pairing Logic & Session Integration
 */

const TelegramBot = require('node-telegram-bot-api');
const pairStore = require('./pairStore');

const TELEGRAM_TOKEN =
    global.TELEGRAM_BOT_TOKEN || "8943139126:AAF9Id2dqLw90ELyp7UAdTq7vDaXTaFphHE";
    process.env.TELEGRAM_BOT_TOKEN;

let bot = null;
let startPairingCallback = null;
let logoutCallback = null;

function initTelegramBot({ onPairRequest, onLogoutRequest }) {
    if (!TELEGRAM_TOKEN) {
        console.log(
            '⚠️ TELEGRAM_BOT_TOKEN is not set, skipping Telegram bot init'
        );
        return null;
    }

    if (typeof onPairRequest !== 'function') {
        console.error('❌ onPairRequest callback is missing');
        return null;
    }

    if (typeof onLogoutRequest !== 'function') {
        console.error('❌ onLogoutRequest callback is missing');
        return null;
    }

    startPairingCallback = onPairRequest;
    logoutCallback = onLogoutRequest;

    try {
        bot = new TelegramBot(TELEGRAM_TOKEN, {
            polling: true,
        });
    } catch (err) {
        console.error(
            '❌ Failed to start Telegram bot:',
            err.message
        );
        return null;
    }

    // =========================
    // START
    // =========================

    bot.onText(/^\/start(?:@\w+)?$/, async (msg) => {
        const chatId = msg.chat.id;

        const text =
            '👋 *PUTTUS WhatsApp Pairing Bot*\n\n' +
            '📱 Available Commands:\n\n' +
            '• `/pair <number>` — Pair WhatsApp\n' +
            '• `/status` — Check pairing status\n' +
            '• `/logout` — Logout current session\n\n' +
            'Example:\n' +
            '`/pair 917679218662`';

        try {
            await bot.sendMessage(chatId, text, {
                parse_mode: 'Markdown',
            });
        } catch (err) {
            console.error('Telegram /start error:', err.message);
        }
    });

    // =========================
    // PAIR
    // =========================

    bot.onText(/^\/pair(?:@\w+)?(?:\s+(.+))?$/i, async (msg, match) => {
        const chatId = msg.chat.id;
        const raw = match && match[1];

        if (!raw) {
            return bot.sendMessage(
                chatId,
                '❌ Please provide a WhatsApp number.\n\n' +
                'Example:\n' +
                '`/pair 917679218662`',
                {
                    parse_mode: 'Markdown',
                }
            );
        }

        const phoneNumber = raw.replace(/\D/g, '');

        if (phoneNumber.length < 8 || phoneNumber.length > 15) {
            return bot.sendMessage(
                chatId,
                '❌ Invalid WhatsApp number.\n\n' +
                'Use country code without `+`.\n' +
                'Example: `917679218662`',
                {
                    parse_mode: 'Markdown',
                }
            );
        }

        const current = pairStore.getActiveSession();

        // Already connected
        if (current && current.status === 'connected') {
            return bot.sendMessage(
                chatId,
                `⚠️ *Already Connected*\n\n` +
                `📱 Number: +${current.number}\n` +
                `🆔 Telegram ID: ${current.telegramId}\n\n` +
                `Use /logout before pairing another number.`,
                {
                    parse_mode: 'Markdown',
                }
            );
        }

        // Pairing already running
        if (current && current.status === 'pairing') {
            return bot.sendMessage(
                chatId,
                `⏳ *Pairing already in progress*\n\n` +
                `📱 Number: +${current.number}\n\n` +
                `Please wait for the current pairing to finish.`,
                {
                    parse_mode: 'Markdown',
                }
            );
        }

        // Save pairing session
        pairStore.setSession({
            telegramId: chatId,
            number: phoneNumber,
            status: 'pairing',
        });

        try {
            await bot.sendMessage(
                chatId,
                `⏳ *Starting pairing...*\n\n` +
                `📱 Number: +${phoneNumber}\n` +
                `Please wait...`,
                {
                    parse_mode: 'Markdown',
                }
            );

            if (!startPairingCallback) {
                throw new Error(
                    'WhatsApp pairing callback is not initialized'
                );
            }

            console.log(
                `[TELEGRAM] Pair request received for +${phoneNumber}`
            );

            const code = await startPairingCallback(
                phoneNumber,
                chatId
            );

            if (!code) {
                throw new Error(
                    'WhatsApp did not return a pairing code'
                );
            }

            await bot.sendMessage(
                chatId,
                `🔑 *Your Pairing Code*\n\n` +
                `\`${code}\`\n\n` +
                `📱 WhatsApp → Linked Devices → ` +
                `Link with phone number\n\n` +
                `Enter the code shown above.`,
                {
                    parse_mode: 'Markdown',
                }
            );

            console.log(
                `[TELEGRAM] Pairing code sent for +${phoneNumber}`
            );

        } catch (err) {
            console.error(
                `[PAIR ERROR] +${phoneNumber}:`,
                err
            );

            pairStore.clearSession();

            let errorMessage = err?.message || 'Unknown error';

            if (
                errorMessage.toLowerCase().includes(
                    'connection closed'
                )
            ) {
                errorMessage =
                    'WhatsApp connection closed while starting pairing.';
            }

            await bot.sendMessage(
                chatId,
                `❌ *Pairing Failed*\n\n` +
                `📱 Number: +${phoneNumber}\n` +
                `⚠️ Error: ${errorMessage}\n\n` +
                `Please try /pair again after a few seconds.`,
                {
                    parse_mode: 'Markdown',
                }
            );
        }
    });

    // =========================
    // STATUS
    // =========================

    bot.onText(/^\/status(?:@\w+)?$/i, async (msg) => {
        const chatId = msg.chat.id;
        const current = pairStore.getActiveSession();

        if (!current) {
            return bot.sendMessage(
                chatId,
                'ℹ️ No active WhatsApp session.\n\n' +
                'Use `/pair <number>` to start pairing.',
                {
                    parse_mode: 'Markdown',
                }
            );
        }

        const statusText =
            current.status === 'connected'
                ? '🟢 Connected'
                : current.status === 'pairing'
                ? '🟡 Pairing'
                : `⚪ ${current.status}`;

        await bot.sendMessage(
            chatId,
            `📊 *PUTTUS Status*\n\n` +
            `${statusText}\n` +
            `📱 Number: +${current.number}\n` +
            `🆔 Telegram ID: ${current.telegramId}`,
            {
                parse_mode: 'Markdown',
            }
        );
    });

    // =========================
    // LOGOUT
    // =========================

    bot.onText(/^\/logout(?:@\w+)?$/i, async (msg) => {
        const chatId = msg.chat.id;
        const current = pairStore.getActiveSession();

        if (!current) {
            return bot.sendMessage(
                chatId,
                'ℹ️ No active WhatsApp session.'
            );
        }

        try {
            await bot.sendMessage(
                chatId,
                '⏳ Logging out WhatsApp session...'
            );

            if (!logoutCallback) {
                throw new Error(
                    'WhatsApp logout callback is not initialized'
                );
            }

            await logoutCallback();

            pairStore.clearSession();

            await bot.sendMessage(
                chatId,
                '✅ Logout successful.\n\n' +
                'You can use /pair again.'
            );

        } catch (err) {
            console.error(
                '[LOGOUT ERROR]:',
                err
            );

            await bot.sendMessage(
                chatId,
                `❌ Logout failed: ${err?.message || 'Unknown error'}`
            );
        }
    });

    // =========================
    // TELEGRAM ERRORS
    // =========================

    bot.on('polling_error', (err) => {
        console.error(
            '[TELEGRAM POLLING ERROR]:',
            err.message
        );
    });

    bot.on('error', (err) => {
        console.error(
            '[TELEGRAM ERROR]:',
            err.message
        );
    });

    console.log('✅ PUTTUS Telegram bot started');

    return bot;
}

// =========================
// NOTIFY
// =========================

function notify(text, opts = {}) {
    const current = pairStore.getActiveSession();

    if (
        !bot ||
        !current ||
        !current.telegramId
    ) {
        return;
    }

    bot.sendMessage(
        current.telegramId,
        text,
        opts
    ).catch((err) => {
        console.error(
            '[Telegram notify error]:',
            err.message
        );
    });
}

module.exports = {
    initTelegramBot,
    notify,
};
