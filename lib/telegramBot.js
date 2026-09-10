/* PUTTUS-AI Telegram pairing controller.
 * Pairing is handled with WhatsApp's pairing-code flow only; no QR flow is used.
 */
'use strict';

require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const pairStore = require('./pairStore');

let bot = null;
let initialized = false;
const pendingNumberRequests = new Map();

function getToken() {
  return String(
    process.env.TG_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN ||
    global.TG_TOKEN ||
    ''
  ).trim();
}

function normalizeNumber(value) {
  let number = String(value || '').trim();
  number = number.replace(/^\+/, '').replace(/^00/, '');
  number = number.replace(/\D/g, '');
  return number;
}

function isValidNumber(number) {
  return /^\d{8,15}$/.test(number);
}

function mainKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📱 Pair WhatsApp', callback_data: 'wa_pair' },
        { text: '📊 Status', callback_data: 'wa_status' },
      ],
      [
        { text: '🚪 Logout / Unpair', callback_data: 'wa_logout' },
        { text: 'ℹ️ Help', callback_data: 'wa_help' },
      ],
    ],
  };
}

function pairingKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🔄 New Code', callback_data: 'wa_new_code' },
        { text: '📊 Status', callback_data: 'wa_status' },
      ],
      [
        { text: '🚪 Logout / Unpair', callback_data: 'wa_logout' },
        { text: '🏠 Main Menu', callback_data: 'wa_menu' },
      ],
    ],
  };
}

function helpKeyboard() {
  return {
    inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'wa_menu' }]],
  };
}

function sendMainMenu(chatId, extra = {}) {
  if (!bot) return Promise.resolve();
  return bot.sendMessage(
    chatId,
    'PUTTUS-AI\n\n' +
      'WhatsApp Pairing Controller\n\n' +
      'Use the buttons below to pair, check status, or logout.',
    { reply_markup: mainKeyboard(), ...extra }
  );
}

async function sendStatus(chatId) {
  const getStatus = bot._puttusGetStatus;
  const info = typeof getStatus === 'function' ? getStatus() : {};
  const session = info.session || pairStore.getActiveSession();

  let status = 'Disconnected';
  if (info.connected || session?.status === 'connected') status = 'Connected';
  else if (session?.status === 'pairing') status = 'Pairing';

  const number = session?.number ? `+${session.number}` : 'Not paired';

  return bot.sendMessage(
    chatId,
    `PUTTUS-AI Status\n\nStatus: ${status}\nNumber: ${number}`,
    { reply_markup: mainKeyboard() }
  );
}

async function sendHelp(chatId) {
  return bot.sendMessage(
    chatId,
    'PUTTUS-AI Help\n\n' +
      '📱 Pair WhatsApp — enter your WhatsApp number and receive a pairing code.\n\n' +
      '📊 Status — check the WhatsApp connection.\n\n' +
      '🚪 Logout / Unpair — remove the current WhatsApp session.\n\n' +
      'Pairing uses a code only. QR login is disabled.\n\n' +
      'Number format: country code + number, for example 2348012345678.',
    { reply_markup: helpKeyboard() }
  );
}

async function beginPairing(chatId, number) {
  const current = pairStore.getActiveSession();

  if (current?.status === 'connected') {
    return bot.sendMessage(
      chatId,
      'A WhatsApp session is already connected.\n\nUse Logout / Unpair first if you want to pair another number.',
      { reply_markup: mainKeyboard() }
    );
  }

  if (current?.status === 'pairing' && current.telegramId !== chatId) {
    return bot.sendMessage(
      chatId,
      'Another pairing request is already active. Please wait for it to finish.',
      { reply_markup: mainKeyboard() }
    );
  }

  pairStore.setSession({
    telegramId: chatId,
    number,
    status: 'pairing',
  });

  try {
    await bot.sendMessage(chatId, `Starting WhatsApp pairing for +${number}...\n\nPlease wait.`);

    const code = await bot._puttusOnPairRequest(number, chatId);

    await bot.sendMessage(
      chatId,
      '✅ WhatsApp pairing code\n\n' +
        `Number: +${number}\n` +
        `Code: ${code}\n\n` +
        'On the WhatsApp phone:\n' +
        '1. Open WhatsApp Settings\n' +
        '2. Tap Linked Devices\n' +
        '3. Tap Link a device\n' +
        '4. Choose Link with phone number instead\n' +
        '5. Enter the code shown above',
      { reply_markup: pairingKeyboard() }
    );
  } catch (error) {
    pairStore.clearSession();
    await bot.sendMessage(
      chatId,
      `❌ Pairing failed.\n\n${error?.message || 'Unknown error'}\n\nTry again from the main menu.`,
      { reply_markup: mainKeyboard() }
    ).catch(() => {});
  }
}

async function askForNumber(chatId) {
  const current = pairStore.getActiveSession();
  if (current?.status === 'connected') {
    return bot.sendMessage(
      chatId,
      'A WhatsApp session is already connected.\n\nLogout first before pairing another number.',
      { reply_markup: mainKeyboard() }
    );
  }

  pendingNumberRequests.set(String(chatId), Date.now());
  return bot.sendMessage(
    chatId,
    '📱 Send the WhatsApp number you want to pair.\n\n' +
      'Use country code and numbers only.\n' +
      'Example: 2348012345678\n\n' +
      'You can also send: /pair 2348012345678',
    { reply_markup: { force_reply: false } }
  );
}

async function handlePairCommand(msg, rawNumber) {
  const chatId = msg.chat.id;
  const number = normalizeNumber(rawNumber);

  if (!number) return askForNumber(chatId);
  if (!isValidNumber(number)) {
    return bot.sendMessage(
      chatId,
      '❌ Invalid WhatsApp number. Use the country code without + or spaces.\n\nExample: 2348012345678',
      { reply_markup: mainKeyboard() }
    );
  }

  pendingNumberRequests.delete(String(chatId));
  return beginPairing(chatId, number);
}

function initTelegram({ onPairRequest, onLogoutRequest, getStatus }) {
  if (initialized && bot) return bot;

  const token = getToken();
  if (!token) {
    console.error('[TELEGRAM] START FAILED: TG_TOKEN/TELEGRAM_BOT_TOKEN is not set.');
    console.error('[TELEGRAM] Add TG_TOKEN to the panel Environment Variables and restart the bot.');
    return null;
  }

  if (typeof onPairRequest !== 'function') throw new TypeError('onPairRequest is required');
  if (typeof onLogoutRequest !== 'function') throw new TypeError('onLogoutRequest is required');

  bot = new TelegramBot(token, {
    polling: {
      autoStart: true,
      params: { timeout: 30 },
    },
  });

  bot._puttusOnPairRequest = onPairRequest;
  bot._puttusOnLogoutRequest = onLogoutRequest;
  bot._puttusGetStatus = getStatus;

  bot.onText(/^\/?start(?:@\w+)?$/i, async (msg) => {
    pendingNumberRequests.delete(String(msg.chat.id));
    await sendMainMenu(msg.chat.id).catch((error) =>
      console.error('[TELEGRAM] /start send failed:', error.message)
    );
  });

  bot.onText(/^\/?help(?:@\w+)?$/i, async (msg) => {
    await sendHelp(msg.chat.id).catch((error) =>
      console.error('[TELEGRAM] /help send failed:', error.message)
    );
  });

  bot.onText(/^\/pair(?:@\w+)?(?:\s+(.+))?$/i, async (msg, match) => {
    await handlePairCommand(msg, match?.[1] || '');
  });

  bot.onText(/^\/status(?:@\w+)?$/i, async (msg) => {
    await sendStatus(msg.chat.id).catch((error) =>
      console.error('[TELEGRAM] /status failed:', error.message)
    );
  });

  bot.onText(/^\/logout(?:@\w+)?$/i, async (msg) => {
    const chatId = msg.chat.id;
    const session = pairStore.getActiveSession();

    if (!session) {
      return bot.sendMessage(chatId, 'No active WhatsApp session.', { reply_markup: mainKeyboard() });
    }

    try {
      pendingNumberRequests.delete(String(chatId));
      await bot.sendMessage(chatId, 'Logging out WhatsApp...');
      await onLogoutRequest();
      pairStore.clearSession();
      await bot.sendMessage(chatId, '✅ WhatsApp logout successful.\n\nYou can pair again.', {
        reply_markup: mainKeyboard(),
      });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Logout failed.\n\n${error?.message || 'Unknown error'}`, {
        reply_markup: mainKeyboard(),
      }).catch(() => {});
    }
  });

  bot.on('message', async (msg) => {
    const chatId = msg?.chat?.id;
    const text = typeof msg?.text === 'string' ? msg.text.trim() : '';
    if (chatId == null || !text || text.startsWith('/')) return;

    const pendingAt = pendingNumberRequests.get(String(chatId));
    if (!pendingAt) return;

    // Expire an unanswered number request after 10 minutes.
    if (Date.now() - pendingAt > 10 * 60 * 1000) {
      pendingNumberRequests.delete(String(chatId));
      return bot.sendMessage(chatId, 'The pairing request expired. Tap Pair WhatsApp to start again.', {
        reply_markup: mainKeyboard(),
      });
    }

    const number = normalizeNumber(text);
    if (!isValidNumber(number)) {
      return bot.sendMessage(chatId, '❌ Invalid number. Example: 2348012345678');
    }

    pendingNumberRequests.delete(String(chatId));
    await beginPairing(chatId, number);
  });

  bot.on('callback_query', async (query) => {
    const chatId = query?.message?.chat?.id;
    const data = query?.data;
    if (!chatId) return;

    await bot.answerCallbackQuery(query.id).catch(() => {});

    try {
      if (data === 'wa_pair') {
        return askForNumber(chatId);
      }

      if (data === 'wa_menu') {
        pendingNumberRequests.delete(String(chatId));
        return sendMainMenu(chatId);
      }

      if (data === 'wa_help') {
        return sendHelp(chatId);
      }

      if (data === 'wa_status') {
        return sendStatus(chatId);
      }

      if (data === 'wa_new_code') {
        const session = pairStore.getActiveSession();
        if (!session?.number) {
          return askForNumber(chatId);
        }
        if (session.telegramId !== chatId) {
          return bot.sendMessage(chatId, 'This pairing request belongs to another Telegram chat.', {
            reply_markup: mainKeyboard(),
          });
        }
        if (session.status === 'connected') {
          return sendStatus(chatId);
        }
        return beginPairing(chatId, session.number);
      }

      if (data === 'wa_logout') {
        const session = pairStore.getActiveSession();
        if (!session) {
          return bot.sendMessage(chatId, 'No active WhatsApp session.', { reply_markup: mainKeyboard() });
        }
        await bot.sendMessage(chatId, 'Logging out WhatsApp...');
        await onLogoutRequest();
        pairStore.clearSession();
        return bot.sendMessage(chatId, '✅ WhatsApp logout successful.\n\nYou can pair again.', {
          reply_markup: mainKeyboard(),
        });
      }
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Operation failed.\n\n${error?.message || 'Unknown error'}`, {
        reply_markup: mainKeyboard(),
      }).catch(() => {});
    }
  });

  bot.on('polling_error', (error) => {
    console.error('[TELEGRAM POLLING ERROR]', error?.message || error);
  });

  bot.on('error', (error) => {
    console.error('[TELEGRAM ERROR]', error?.message || error);
  });

  initialized = true;
  console.log('[TELEGRAM] PUTTUS-AI Telegram bot started successfully.');
  return bot;
}

function notify(text, options = {}) {
  const session = pairStore.getActiveSession();
  if (!bot || !session?.telegramId) return Promise.resolve();
  return bot.sendMessage(session.telegramId, text, options).catch(() => {});
}

module.exports = { initTelegram, notify };
    
