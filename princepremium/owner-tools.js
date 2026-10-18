const os = require('os');

function getUptime(seconds) {
    let d = Math.floor(seconds / (3600 * 24));
    let h = Math.floor((seconds % (3600 * 24)) / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);
    return `${d}j ${h}h ${m}m ${s}s`;
}

module.exports = {
    name: "owner-tools",
    category: 7,
    description: "Commandes utilitaires et infos du bot",
    commands: ["ping", "runtime", "uptime", "owner", "ownercontact", "botinfo", "sysinfo", "jid", "mybio", "prince"],

    handler: async ({ sock, msg, reply, sender, command, botNumber, senderNumber }) => {
        const start = Date.now();

        switch (command) {
            case "ping": {
                const sent = await reply("🏓 *Pong...*");
                const ms = Date.now() - start;
                try {
                    await sock.sendMessage(msg.key.remoteJid, { text: `🏓 *Pong!* ${ms}ms`, edit: sent.key });
                } catch (e) {
                    await reply(`🏓 *Pong!* ${ms}ms`);
                }
                return;
            }

            case "runtime":
            case "uptime": {
                return reply(`⏱️ *Le bot tourne depuis:* ${getUptime(process.uptime())}`);
            }

            case "owner":
            case "ownercontact": {
                const ownerNumber = (process.env.OWNER_NUMBER || '').replace(/[^0-9]/g, '');
                if (!ownerNumber) return reply("ℹ️ *Numéro du propriétaire non configuré.*");
                const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:Propriétaire du Bot\nTEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}\nEND:VCARD`;
                return sock.sendMessage(msg.key.remoteJid, {
                    contacts: { displayName: "𝐉𝐱𝐒𝐓 𝚸R!NC𝚵🏌🏻‍♂️⭐", contacts: [{ vcard }] }
                }, { quoted: msg });
            }

            case "botinfo": {
                const text =
                    `🤖 *PRINCE-MD*\n\n` +
                    `▸ *Node.js:* ${process.version}\n` +
                    `▸ *Plateforme:* ${os.platform()}\n` +
                    `▸ *Uptime:* ${getUptime(process.uptime())}\n\n` +
                    `> *BY PRINCE PREMIUM*`;
                return reply(text);
            }

            case "sysinfo": {
                const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
                const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
                const text =
                    `🖥️ *INFOS SYSTÈME*\n\n` +
                    `▸ *CPU:* ${os.cpus()[0]?.model || 'inconnu'}\n` +
                    `▸ *Cœurs:* ${os.cpus().length}\n` +
                    `▸ *RAM totale:* ${totalMem} GB\n` +
                    `▸ *RAM libre:* ${freeMem} GB\n` +
                    `▸ *Uptime système:* ${getUptime(os.uptime())}`;
                return reply(text);
            }

            case "jid": {
                return reply(`🆔 *Ton JID:*\n${sender}`);
            }

            case "mybio": {
                return reply(`📱 *Ton numéro:* +${senderNumber}`);
            }

            case "prince": {
                return reply(`*𝐏𝐑𝐈𝐍𝐂𝐄 𝐄𝐒𝐓 𝐋𝐄 𝐂𝐑𝐄́𝐀𝐓𝐄𝐔𝐑 𝐃𝐔 𝐁𝐎𝐓🤖⭐*`);
            }
        }
    }
};
