const settings = require("../settings");
const {
  addSudo,
  removeSudo,
  getSudoList,
} = require("../lib/index");

const isOwnerOrSudo = require("../lib/isOwner");
const { cleanJid } = require("../lib/isOwner");


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PUTTUS VCARD QUOTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function getPuttusVCardQuote() {
  const botJid =
    "919641092392@s.whatsapp.net";

  const vcard =
    "BEGIN:VCARD\n" +
    "VERSION:3.0\n" +
    "N:PUTTUS;BOT;;;\n" +
    "FN:🌸•𝐏ᴜᴛᴛᴜꜱ•⌲\n" +
    "ORG:PUTTUS BOT\n" +
    "TEL;TYPE=CELL;TYPE=VOICE;waid=919641092392:+919641092392\n" +
    "END:VCARD";

  return {
    key: {
      remoteJid: "status@broadcast",
      fromMe: false,
      id: "PUTTUS-" + Date.now(),
      participant: botJid,
    },

    message: {
      contactMessage: {
        displayName:
          "⎯꯭̽ꪹ𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ⎯꯭̽💜",
        vcard,
      },
    },
  };
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TARGET JID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function extractTargetJid(message, args) {
  if (
    message.message?.extendedTextMessage
      ?.contextInfo
      ?.mentionedJid?.[0]
  ) {
    return message.message
      .extendedTextMessage
      .contextInfo
      .mentionedJid[0];
  }

  if (
    message.message?.extendedTextMessage
      ?.contextInfo
      ?.quotedMessage
  ) {
    return message.message
      .extendedTextMessage
      .contextInfo
      .participant;
  }

  const text = args.join(" ");

  const match =
    text.match(/\b(\d{7,15})\b/);

  if (match) {
    return (
      match[1] +
      "@s.whatsapp.net"
    );
  }

  return null;
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SUDO COMMAND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

module.exports = {
  command: "sudo",
  aliases: [],
  category: "owner",
  description:
    "Add or remove sudo users or list them",
  usage:
    ".sudo add|del|list <@user|number>",
  strictOwnerOnly: true,


  async handler(
    sock,
    message,
    args,
    context = {}
  ) {
    const chatId =
      context.chatId ||
      message.key.remoteJid;

    const senderJid =
      message.key.participant ||
      message.key.remoteJid;

    const isGroup =
      chatId.endsWith("@g.us");

    const isOwner =
      message.key.fromMe ||
      isOwnerOrSudo.isOwnerOnly(
        senderJid
      );

    const sub =
      (args[0] || "")
        .toLowerCase();


    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       USAGE
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    if (
      !sub ||
      ![
        "add",
        "del",
        "remove",
        "list",
      ].includes(sub)
    ) {
      await sock.sendMessage(
        chatId,
        {
          text:
`〔 *👑 𝐏ᴜᴛᴛᴜs - sᴜᴅᴏ* 〕

│ *✦ 🟢 .sᴜᴅᴏ ᴀᴅᴅ <@ᴛᴀɢ/ʀᴇᴘʟʏ/ɴᴜᴍ>*
│ *✦ 🔴 .sᴜᴅᴏ ᴅᴇʟ <@ᴛᴀɢ/ʀᴇᴘʟʏ/ɴᴜᴍ>*
│ *✦ 📋 .sᴜᴅᴏ ʟɪsᴛ*`,
        },
        {
          quoted:
            getPuttusVCardQuote(),
        }
      );

      return;
    }


    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       LIST
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    if (sub === "list") {
      const list =
        await getSudoList();

      if (list.length === 0) {
        await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *ɴᴏ sᴜᴅᴏ ᴜsᴇʀs ғᴏᴜɴᴅ.*",
          },
          {
            quoted:
              getPuttusVCardQuote(),
          }
        );

        return;
      }

      const textList =
        list
          .map(
            (j, i) =>
              `│ *${i + 1}. @${cleanJid(j)}*`
          )
          .join("\n");

      await sock.sendMessage(
        chatId,
        {
          text:
`〔 *👑 𝐏ᴜᴛᴛᴜs - sᴜᴅᴏ* 〕

${textList}`,
          mentions: list,
        },
        {
          quoted:
            getPuttusVCardQuote(),
        }
      );

      return;
    }


    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       OWNER CHECK
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    if (!isOwner) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *ᴀᴄᴄᴇss ᴅᴇɴɪᴇᴅ:* ᴏɴʟʏ ᴛʜᴇ ᴍᴀɪɴ ᴏᴡɴᴇʀ ᴄᴀɴ ᴍᴀɴᴀɢᴇ sᴜᴅᴏ ᴘʀɪᴠɪʟᴇɢᴇs.",
        },
        {
          quoted:
            getPuttusVCardQuote(),
        }
      );

      return;
    }


    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       TARGET
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const targetJid =
      extractTargetJid(
        message,
        args.slice(1)
      );

    if (!targetJid) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *ᴘʟᴇᴀsᴇ ᴍᴇɴᴛɪᴏɴ ᴀ ᴜsᴇʀ, ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴍᴇssᴀɢᴇ, ᴏʀ ᴘʀᴏᴠɪᴅᴇ ᴀ ɴᴜᴍʙᴇʀ.*",
        },
        {
          quoted:
            getPuttusVCardQuote(),
        }
      );

      return;
    }


    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       DISPLAY JID
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    let displayId =
      cleanJid(targetJid);

    if (
      targetJid.includes("@lid") &&
      isGroup
    ) {
      try {
        const metadata =
          await sock.groupMetadata(
            chatId
          );

        const found =
          metadata.participants.find(
            (p) =>
              p.lid === targetJid ||
              p.id === targetJid
          );

        if (
          found &&
          found.id &&
          !found.id.includes("@lid")
        ) {
          displayId =
            cleanJid(found.id);
        }
      } catch (e) {}
    }


    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ADD SUDO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    if (sub === "add") {
      const ok =
        await addSudo(targetJid);

      await sock.sendMessage(
        chatId,
        {
          text: ok
            ? `✅ *sᴜᴄᴄᴇss:* *@⁨~${displayId}⁩ ʜᴀs ʙᴇᴇɴ ɢʀᴀɴᴛᴇᴅ sᴜᴅᴏ ᴘʀɪᴠɪʟᴇɢᴇs.*

*𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*`
            : "❌ *ᴇʀʀᴏʀ:* ғᴀɪʟᴇᴅ ᴛᴏ ᴀᴅᴅ sᴜᴅᴏ.",
          mentions: [
            targetJid,
          ],
        },
        {
          quoted:
            getPuttusVCardQuote(),
        }
      );

      return;
    }


    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       DELETE SUDO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    if (
      sub === "del" ||
      sub === "remove"
    ) {
      const ownerNumberClean =
        cleanJid(
          settings.ownerNumber
        );

      if (
        displayId ===
        ownerNumberClean
      ) {
        await sock.sendMessage(
          chatId,
          {
            text:
              "❌ *ᴀᴄᴛɪᴏɴ ᴅᴇɴɪᴇᴅ:* ᴄᴀɴɴᴏᴛ ʀᴇᴍᴏᴠᴇ ᴛʜᴇ ᴍᴀɪɴ ᴏᴡɴᴇʀ.",
          },
          {
            quoted:
              getPuttusVCardQuote(),
          }
        );

        return;
      }

      const ok =
        await removeSudo(
          targetJid
        );

      await sock.sendMessage(
        chatId,
        {
          text: ok
            ? `✅ *sᴜᴄᴄᴇss:* sᴜᴅᴏ ᴘʀɪᴠɪʟᴇɢᴇs ʀᴇᴠᴏᴋᴇᴅ ғʀᴏᴍ @${displayId}.*

*𝐏ᴜᴛᴛᴜs-𝐁ᴏᴛ*`
            : "❌ *ᴇʀʀᴏʀ:* ғᴀɪʟᴇᴅ ᴛᴏ ʀᴇᴍᴏᴠᴇ sᴜᴅᴏ.",
          mentions: [
            targetJid,
          ],
        },
        {
          quoted:
            getPuttusVCardQuote(),
        }
      );

      return;
    }
  },
};
