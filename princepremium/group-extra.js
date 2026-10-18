const fs = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'warns.json');
fs.ensureFileSync(DATA_FILE);

function loadWarns() {
    try {
        const content = fs.readFileSync(DATA_FILE, 'utf-8').trim();
        return content ? JSON.parse(content) : {};
    } catch (e) {
        return {};
    }
}

function saveWarns(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getTargetJid({ msg, args }) {
    const mentioned = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (mentioned && mentioned.length > 0) return mentioned[0];
    const quotedParticipant = msg?.message?.extendedTextMessage?.contextInfo?.participant;
    if (quotedParticipant) return quotedParticipant;
    if (args && args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num.length >= 6) return `${num}@s.whatsapp.net`;
    }
    return null;
}

module.exports = {
    name: "group-extra",
    category: "group",
    description: "Avertissements, sondages, et extras pour groupes",
    commands: ["warn", "warnings", "unwarn", "resetwarn", "kickme", "poll", "sondage"],

    handler: async ({ sock, msg, reply, args, command, isGroup, isAdmin, isBotAdmin, isOwner, sender }) => {
        const groupJid = msg.key.remoteJid;

        switch (command) {
            case "warn": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent avertir.*");
                const target = getTargetJid({ msg, args });
                if (!target) return reply("❗ *Mentionne ou réponds à la personne à avertir.*");
                const warns = loadWarns();
                warns[groupJid] = warns[groupJid] || {};
                warns[groupJid][target] = (warns[groupJid][target] || 0) + 1;
                saveWarns(warns);
                const count = warns[groupJid][target];
                let text = `⚠️ *@${target.split('@')[0]} a reçu un avertissement (${count}/3).*`;
                if (count >= 3) {
                    if (isBotAdmin) {
                        try {
                            await sock.groupParticipantsUpdate(groupJid, [target], "remove");
                            text += `\n🚫 *3 avertissements atteints — membre retiré.*`;
                            delete warns[groupJid][target];
                            saveWarns(warns);
                        } catch (e) {
                            text += `\n❌ *Impossible de retirer:* ${e.message}`;
                        }
                    } else {
                        text += `\n⚠️ *3 avertissements atteints, mais je ne suis pas admin pour retirer le membre.*`;
                    }
                }
                return reply(text, { mentions: [target] });
            }

            case "unwarn": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent gérer les avertissements.*");
                const target = getTargetJid({ msg, args });
                if (!target) return reply("❗ *Mentionne ou réponds à la personne.*");
                const warns = loadWarns();
                if (warns[groupJid] && warns[groupJid][target]) {
                    warns[groupJid][target] = Math.max(0, warns[groupJid][target] - 1);
                    saveWarns(warns);
                }
                return reply(`✅ *Un avertissement retiré pour @${target.split('@')[0]}.*`, { mentions: [target] });
            }

            case "resetwarn": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent gérer les avertissements.*");
                const target = getTargetJid({ msg, args });
                if (!target) return reply("❗ *Mentionne ou réponds à la personne.*");
                const warns = loadWarns();
                if (warns[groupJid]) delete warns[groupJid][target];
                saveWarns(warns);
                return reply(`✅ *Avertissements réinitialisés pour @${target.split('@')[0]}.*`, { mentions: [target] });
            }

            case "warnings": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                const target = getTargetJid({ msg, args }) || sender;
                const warns = loadWarns();
                const count = warns[groupJid]?.[target] || 0;
                return reply(`⚠️ *@${target.split('@')[0]} a ${count}/3 avertissement(s).*`, { mentions: [target] });
            }

            case "kickme": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isBotAdmin) return reply("❌ *Je dois être admin pour faire ça.*");
                await reply("👋 *Au revoir !*");
                return sock.groupParticipantsUpdate(groupJid, [sender], "remove");
            }

            case "poll":
            case "sondage": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                const parts = args.join(' ').split('|').map(p => p.trim()).filter(Boolean);
                if (parts.length < 3) {
                    return reply("❗ *Format:* .poll Question | Option1 | Option2 | Option3\nMinimum 2 options.");
                }
                const [question, ...options] = parts;
                try {
                    return sock.sendMessage(groupJid, {
                        poll: {
                            name: question,
                            values: options,
                            selectableCount: 1
                        }
                    });
                } catch (e) {
                    return reply(`❌ *Échec de création du sondage:* ${e.message}`);
                }
            }
        }
    }
};
