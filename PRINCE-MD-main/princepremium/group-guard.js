const fs = require('fs-extra');
const path = require('path');
const { jidNormalizedUser } = require('baileys');
const Group = require('../Prince/group');

const DATA_PATH = path.join(__dirname, '..', 'data', 'groupguard.json');

function loadData() {
    try {
        fs.ensureFileSync(DATA_PATH);
        const raw = fs.readFileSync(DATA_PATH, 'utf8').trim();
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

if (!global.groupGuardData) global.groupGuardData = loadData();
// En mémoire uniquement (pas besoin de survivre à un redémarrage) : dernier
// horodatage de message par (groupe + expéditeur), pour le mode lent.
if (!global.groupGuardLastMsg) global.groupGuardLastMsg = new Map();

function saveData() {
    try {
        fs.ensureFileSync(DATA_PATH);
        fs.writeFileSync(DATA_PATH, JSON.stringify(global.groupGuardData, null, 2));
    } catch (e) {
        console.error('GroupGuard save error:', e.message);
    }
}

function getGroupConfig(groupId) {
    if (!global.groupGuardData[groupId]) {
        global.groupGuardData[groupId] = { badwordFilter: false, badwords: [], slowmode: 0 };
    }
    // Compatibilité si un ancien fichier de données existe déjà sans un des champs
    const conf = global.groupGuardData[groupId];
    if (!Array.isArray(conf.badwords)) conf.badwords = [];
    if (typeof conf.slowmode !== 'number') conf.slowmode = 0;
    return conf;
}

function containsBadword(text, badwords) {
    const lower = text.toLowerCase();
    return badwords.some(w => {
        const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|[^a-zà-ÿ0-9])${escaped}([^a-zà-ÿ0-9]|$)`, 'i').test(lower);
    });
}

function initGroupGuard(socket) {
    try {
        if (!socket || !socket.user || !socket.user.id) return;
        if (socket._groupGuardListenerAttached) return; // déjà attaché sur CETTE instance de socket
        socket._groupGuardListenerAttached = true;

        const sessionJid = jidNormalizedUser(socket.user.id);
        const socketId = sessionJid.split('@')[0];

        const listener = async ({ messages }) => {
            try {
                const msg = messages[0];
                if (!msg?.message || msg.key.fromMe) return;

                const remoteJid = msg.key.remoteJid;
                if (!remoteJid || !remoteJid.endsWith('@g.us')) return;

                const conf = getGroupConfig(remoteJid);
                if (!conf.badwordFilter && !conf.slowmode) return;

                const participantJid = msg.key.participant || msg.key.remoteJid;

                let groupMetadata;
                try {
                    groupMetadata = await Group.getGroupMetadata(socket, remoteJid);
                } catch (e) {
                    return;
                }

                const participants = groupMetadata.participants || [];
                const botJid = jidNormalizedUser(socket.user.id);
                const isBotAdmin = participants.some(p => (p.id === botJid || p.id.split('@')[0] === socketId) && p.admin);
                if (!isBotAdmin) return; // impossible de modérer sans être admin

                const isSenderAdmin = participants.some(p => p.id === participantJid && p.admin);
                if (isSenderAdmin) return; // les admins ne sont jamais filtrés

                const body =
                    msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    msg.message.imageMessage?.caption ||
                    msg.message.videoMessage?.caption ||
                    '';

                // Filtre anti-injures
                if (conf.badwordFilter && conf.badwords.length && body && containsBadword(body, conf.badwords)) {
                    try { await socket.sendMessage(remoteJid, { delete: msg.key }); } catch (e) {}
                    try {
                        await socket.sendMessage(remoteJid, {
                            text: `🚫 *Message supprimé* — @${participantJid.split('@')[0]}, ce mot n'est pas autorisé ici.`,
                            mentions: [participantJid]
                        });
                    } catch (e) {}
                    return;
                }

                // Mode lent : un seul message par personne toutes les N secondes
                if (conf.slowmode > 0) {
                    const key = `${remoteJid}:${participantJid}`;
                    const now = Date.now();
                    const last = global.groupGuardLastMsg.get(key) || 0;
                    const elapsed = (now - last) / 1000;

                    if (elapsed < conf.slowmode) {
                        try { await socket.sendMessage(remoteJid, { delete: msg.key }); } catch (e) {}
                        return;
                    }
                    global.groupGuardLastMsg.set(key, now);
                }
            } catch (e) {
                console.error('GroupGuard listener error:', e.message);
            }
        };

        socket.ev.on('messages.upsert', listener);
    } catch (e) {
        console.error('GroupGuard init error:', e.message);
    }
}

module.exports = {
    name: "group-guard",
    category: "group",
    description: "🛡️ Filtre anti-injures et mode lent pour les groupes",
    commands: ["antibadword", "addbadword", "delbadword", "badwordlist", "slowmode"],
    init: initGroupGuard,

    handler: async ({ socket, sender, args, reply, command, isGroup, isAdmin, isBotAdmin, isOwner }) => {
        if (!isGroup) return reply("❌ *Cette commande fonctionne uniquement dans un groupe !*");
        if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins du groupe peuvent configurer ça.*");

        const conf = getGroupConfig(sender);

        switch (command) {
            case "antibadword": {
                const option = (args[0] || '').toLowerCase();
                if (option === 'on') {
                    if (!isBotAdmin) return reply("❌ *Je dois être admin du groupe pour filtrer les messages.*");
                    conf.badwordFilter = true;
                    saveData();
                    return reply(`✅ *Filtre anti-injures activé.*\n🔸 ${conf.badwords.length} mot(s) filtré(s). Ajoute-en avec *.addbadword*.`);
                }
                if (option === 'off') {
                    conf.badwordFilter = false;
                    saveData();
                    return reply("✅ *Filtre anti-injures désactivé.*");
                }
                return reply(
                    `🛡️ *Filtre anti-injures*\n\n` +
                    `🔸 Statut: *${conf.badwordFilter ? 'ON' : 'OFF'}*\n` +
                    `🔸 Mots filtrés: *${conf.badwords.length}*\n\n` +
                    `*Usage:*\n• .antibadword on\n• .antibadword off\n• .addbadword <mot>\n• .delbadword <mot>\n• .badwordlist`
                );
            }

            case "addbadword": {
                const word = args.join(' ').trim().toLowerCase();
                if (!word) return reply("❗ *Donne un mot à filtrer.*\nEx: .addbadword motinterdit");
                if (conf.badwords.includes(word)) return reply("ℹ️ *Ce mot est déjà dans la liste.*");
                conf.badwords.push(word);
                saveData();
                return reply(`✅ *Mot ajouté au filtre.* (${conf.badwords.length} au total)`);
            }

            case "delbadword": {
                const word = args.join(' ').trim().toLowerCase();
                if (!word) return reply("❗ *Donne le mot à retirer.*\nEx: .delbadword motinterdit");
                const idx = conf.badwords.indexOf(word);
                if (idx === -1) return reply("❌ *Ce mot n'est pas dans la liste.*");
                conf.badwords.splice(idx, 1);
                saveData();
                return reply(`✅ *Mot retiré du filtre.* (${conf.badwords.length} restant(s))`);
            }

            case "badwordlist": {
                if (!conf.badwords.length) return reply("ℹ️ *Aucun mot filtré pour l'instant.*\nAjoute-en avec .addbadword <mot>");
                return reply(`📋 *Mots filtrés (${conf.badwords.length}):*\n${conf.badwords.map(w => `• ${w}`).join('\n')}`);
            }

            case "slowmode": {
                const arg = (args[0] || '').toLowerCase();
                if (arg === 'off' || arg === '0') {
                    conf.slowmode = 0;
                    saveData();
                    return reply("✅ *Mode lent désactivé.*");
                }
                const secs = parseInt(arg);
                if (!arg || isNaN(secs) || secs < 1 || secs > 3600) {
                    return reply(
                        `🐌 *Mode lent*\n\n` +
                        `🔸 Statut actuel: *${conf.slowmode > 0 ? conf.slowmode + 's entre chaque message' : 'OFF'}*\n\n` +
                        `*Usage:*\n• .slowmode 30  (30 secondes entre chaque message par membre)\n• .slowmode off`
                    );
                }
                if (!isBotAdmin) return reply("❌ *Je dois être admin du groupe pour appliquer le mode lent.*");
                conf.slowmode = secs;
                saveData();
                return reply(`✅ *Mode lent activé:* 1 message toutes les ${secs}s par membre (admins exemptés).`);
            }
        }
    }
};
