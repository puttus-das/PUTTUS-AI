/*
 * lib/telegramBot.js
 * PUTTUS-XD Telegram → WhatsApp Pairing
 */

const TelegramBot = require('node-telegram-bot-api')
const pairStore = require('./pairStore')

const TELEGRAM_TOKEN =
    global.TELEGRAM_BOT_TOKEN || "8943139126:AAFBkBfuekQutSFFRDvNxGEgKbxuZMkG9C4";
    process.env.TELEGRAM_BOT_TOKEN

let bot = null
let startPairingCallback = null
let logoutCallback = null

function initTelegramBot({
    onPairRequest,
    onLogoutRequest
}) {
    if (!TELEGRAM_TOKEN) {
        console.log(
            '⚠️ TELEGRAM_BOT_TOKEN is not configured'
        )
        return null
    }

    if (typeof onPairRequest !== 'function') {
        console.error(
            '❌ onPairRequest callback is missing'
        )
        return null
    }

    if (typeof onLogoutRequest !== 'function') {
        console.error(
            '❌ onLogoutRequest callback is missing'
        )
        return null
    }

    startPairingCallback = onPairRequest
    logoutCallback = onLogoutRequest

    try {
        bot = new TelegramBot(TELEGRAM_TOKEN, {
            polling: true
        })
    } catch (err) {
        console.error(
            '❌ Telegram startup failed:',
            err.message
        )
        return null
    }

    // =========================
    // START
    // =========================

    bot.onText(/^\/start(?:@\w+)?$/i, async (msg) => {
        const chatId = msg.chat.id

        const text =
            '╭─〔 ⚡ 𝐏𝐔𝐓𝐓𝐔𝐒-𝐗𝐃 〕─╮\n' +
            '│\n' +
            '│ 👋 Welcome!\n' +
            '│\n' +
            '│ 📱 WhatsApp Pairing Bot\n' +
            '│\n' +
            '│ /pair <number>\n' +
            '│ /status\n' +
            '│ /logout\n' +
            '│\n' +
            '│ Example:\n' +
            '│ /pair 917679218662\n' +
            '│\n' +
            '╰────────────────────╯'

        try {
            await bot.sendMessage(chatId, text)
        } catch (err) {
            console.error(
                '[START ERROR]:',
                err.message
            )
        }
    })

    // =========================
    // PAIR
    // =========================

    bot.onText(
        /^\/pair(?:@\w+)?(?:\s+(.+))?$/i,
        async (msg, match) => {
            const chatId = msg.chat.id
            const rawNumber = match?.[1]

            if (!rawNumber) {
                return bot.sendMessage(
                    chatId,
                    '❌ WhatsApp number required.\n\n' +
                    'Example:\n' +
                    '/pair 917679218662'
                )
            }

            const phoneNumber =
                rawNumber.replace(/\D/g, '')

            if (
                phoneNumber.length < 8 ||
                phoneNumber.length > 15
            ) {
                return bot.sendMessage(
                    chatId,
                    '❌ Invalid WhatsApp number.\n\n' +
                    'Use country code without +.\n\n' +
                    'Example:\n' +
                    '/pair 917679218662'
                )
            }

            const current =
                pairStore.getActiveSession()

            // =========================
            // ALREADY CONNECTED
            // =========================

            if (
                current &&
                current.status === 'connected'
            ) {
                return bot.sendMessage(
                    chatId,
                    `⚠️ Already Connected\n\n` +
                    `📱 Number: +${current.number}\n\n` +
                    `Use /logout first.`
                )
            }

            // =========================
            // PAIRING RUNNING
            // =========================

            if (
                current &&
                current.status === 'pairing'
            ) {
                return bot.sendMessage(
                    chatId,
                    `⏳ Pairing already running.\n\n` +
                    `📱 Number: +${current.number}\n\n` +
                    `Please wait...`
                )
            }

            // =========================
            // SAVE SESSION
            // =========================

            pairStore.setSession({
                telegramId: chatId,
                number: phoneNumber,
                status: 'pairing'
            })

            let waitMessage

            try {
                waitMessage =
                    await bot.sendMessage(
                        chatId,
                        `⏳ Starting pairing...\n\n` +
                        `📱 Number: +${phoneNumber}\n\n` +
                        `Please wait...`
                    )

                console.log(
                    `[TELEGRAM] Pair request: +${phoneNumber}`
                )

                // =========================
                // START WHATSAPP PAIRING
                // =========================

                const code =
                    await startPairingCallback(
                        phoneNumber,
                        chatId
                    )

                if (!code) {
                    throw new Error(
                        'Pairing code was not returned'
                    )
                }

                // =========================
                // SEND CODE
                // =========================

                await bot.sendMessage(
                    chatId,
                    `╭─〔 🔐 𝐏𝐀𝐈𝐑𝐈𝐍𝐆 〕─╮\n` +
                    `│\n` +
                    `│ 📱 +${phoneNumber}\n` +
                    `│\n` +
                    `│ 🔑 Code:\n` +
                    `│\n` +
                    `│ ${code}\n` +
                    `│\n` +
                    `│ WhatsApp → Linked Devices\n` +
                    `│ → Link with phone number\n` +
                    `│\n` +
                    `╰────────────────────╯`
                )

                console.log(
                    `[TELEGRAM] Pairing code sent: +${phoneNumber}`
                )

            } catch (err) {
                console.error(
                    `[PAIR ERROR] +${phoneNumber}:`,
                    err
                )

                pairStore.clearSession()

                let error =
                    err?.message ||
                    'Unknown error'

                if (
                    error
                        .toLowerCase()
                        .includes('connection closed')
                ) {
                    error =
                        'WhatsApp connection closed.\n' +
                        'Please try again in a few seconds.'
                }

                await bot.sendMessage(
                    chatId,
                    `❌ Pairing Failed\n\n` +
                    `📱 +${phoneNumber}\n\n` +
                    `⚠️ ${error}`
                )
            }
        }
    )

    // =========================
    // STATUS
    // =========================

    bot.onText(/^\/status(?:@\w+)?$/i, async (msg) => {
        const chatId = msg.chat.id
        const current =
            pairStore.getActiveSession()

        if (!current) {
            return bot.sendMessage(
                chatId,
                'ℹ️ No active WhatsApp session.\n\n' +
                'Use /pair <number>.'
            )
        }

        let status = '⚪ ' + current.status

        if (current.status === 'connected') {
            status = '🟢 Connected'
        }

        if (current.status === 'pairing') {
            status = '🟡 Pairing'
        }

        await bot.sendMessage(
            chatId,
            `📊 PUTTUS-XD Status\n\n` +
            `${status}\n\n` +
            `📱 +${current.number}\n` +
            `🆔 Telegram: ${current.telegramId}`
        )
    })

    // =========================
    // LOGOUT
    // =========================

    bot.onText(/^\/logout(?:@\w+)?$/i, async (msg) => {
        const chatId = msg.chat.id

        const current =
            pairStore.getActiveSession()

        if (!current) {
            return bot.sendMessage(
                chatId,
                'ℹ️ No active WhatsApp session.'
            )
        }

        try {
            await bot.sendMessage(
                chatId,
                '⏳ Logging out...'
            )

            await logoutCallback()

            pairStore.clearSession()

            await bot.sendMessage(
                chatId,
                '✅ WhatsApp logout successful.\n\n' +
                'You can use /pair again.'
            )

        } catch (err) {
            console.error(
                '[LOGOUT ERROR]:',
                err
            )

            await bot.sendMessage(
                chatId,
                `❌ Logout failed:\n\n` +
                `${err?.message || 'Unknown error'}`
            )
        }
    })

    // =========================
    // TELEGRAM ERRORS
    // =========================

    bot.on('polling_error', (err) => {
        console.error(
            '[TELEGRAM POLLING ERROR]:',
            err.message
        )
    })

    bot.on('error', (err) => {
        console.error(
            '[TELEGRAM ERROR]:',
            err.message
        )
    })

    console.log(
        '✅ PUTTUS-XD Telegram pairing bot started'
    )

    return bot
}

// =========================
// NOTIFY
// =========================

function notify(text, opts = {}) {
    const current =
        pairStore.getActiveSession()

    if (
        !bot ||
        !current?.telegramId
    ) {
        return
    }

    bot.sendMessage(
        current.telegramId,
        text,
        opts
    ).catch((err) => {
        console.error(
            '[TELEGRAM NOTIFY ERROR]:',
            err.message
        )
    })
}

module.exports = {
    initTelegramBot,
    notify
    }
