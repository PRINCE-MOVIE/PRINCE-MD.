/**
 * group-tools-3.js — 30 nouvelles commandes de groupe (PRINCE-MD)
 * Aucune ne fait doublon avec group-core.js, group-extra.js, group-guard.js,
 * group-manage-2.js, group-tools-2.js, kickall2.js, open.js, close.js,
 * welcome.js, antilink.js, antidelete.js, gcstatus.js.
 */

const fs = require('fs-extra');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
fs.ensureDirSync(DATA_DIR);

const NICK_FILE = path.join(DATA_DIR, 'nicknames.json');
const NOTE_FILE = path.join(DATA_DIR, 'group-notes.json');
const COUNTER_FILE = path.join(DATA_DIR, 'group-counters.json');
const VOTEKICK_FILE = path.join(DATA_DIR, 'votekick.json');
const LEVEL_FILE = path.join(DATA_DIR, 'group-activity.json');
[NICK_FILE, NOTE_FILE, COUNTER_FILE, VOTEKICK_FILE, LEVEL_FILE].forEach(f => fs.ensureFileSync(f));

function loadJson(file) {
    try {
        const content = fs.readFileSync(file, 'utf-8').trim();
        return content ? JSON.parse(content) : {};
    } catch (e) {
        return {};
    }
}
function saveJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
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

function fmt(jid) {
    return jid ? jid.split('@')[0] : 'inconnu';
}

module.exports = {
    name: "group-tools-3",
    category: "group",
    description: "30 commandes de gestion et d'animation de groupe",
    commands: [
        "setnick", "delnick", "nick", "nicklist",
        "setwelcometext", "setgoodbyetext",
        "note2", "notelist", "delnote2",
        "pin", "unpin",
        "groupcounter", "resetcounter",
        "votekick", "votekickstatus", "cancelvotekick",
        "mentionadmins", "silentmode", "unsilentmode",
        "groupvcf", "exportmembers",
        "groupactivity", "topactive",
        "lockmedia", "unlockmedia",
        "groupbadge", "grouptag",
        "quickpoll", "endpoll",
        "shoutout"
    ],

    handler: async ({ sock, msg, reply, args, command, isGroup, isAdmin, isBotAdmin, isOwner, groupMetadata, sender, senderNumber }) => {
        const groupJid = msg.key.remoteJid;
        const participants = groupMetadata?.participants || [];

        switch (command) {

            // ---------- SURNOMS ----------
            case "setnick": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                const target = getTargetJid({ msg, args }) || sender;
                const nickArgs = target === sender && !getTargetJid({ msg, args }) ? args : args.slice(1);
                const nickname = nickArgs.join(' ').trim();
                if (!nickname) return reply("❗ *Usage:* .setnick <@membre ou reply> <surnom>");
                const nicks = loadJson(NICK_FILE);
                nicks[groupJid] = nicks[groupJid] || {};
                nicks[groupJid][target] = nickname;
                saveJson(NICK_FILE, nicks);
                return reply(`✅ *Surnom défini pour @${fmt(target)} :* ${nickname}`, { mentions: [target] });
            }

            case "delnick": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                const target = getTargetJid({ msg, args }) || sender;
                const nicks = loadJson(NICK_FILE);
                if (nicks[groupJid]) delete nicks[groupJid][target];
                saveJson(NICK_FILE, nicks);
                return reply(`✅ *Surnom supprimé pour @${fmt(target)}.*`, { mentions: [target] });
            }

            case "nick": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                const target = getTargetJid({ msg, args }) || sender;
                const nicks = loadJson(NICK_FILE);
                const nickname = nicks[groupJid]?.[target];
                return reply(nickname
                    ? `🏷️ *@${fmt(target)} est surnommé(e) :* ${nickname}`
                    : `ℹ️ *@${fmt(target)} n'a pas de surnom.*`, { mentions: [target] });
            }

            case "nicklist": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                const nicks = loadJson(NICK_FILE)[groupJid] || {};
                const entries = Object.entries(nicks);
                if (!entries.length) return reply("ℹ️ *Aucun surnom enregistré dans ce groupe.*");
                const text = entries.map(([jid, n]) => `▸ @${fmt(jid)} : ${n}`).join('\n');
                return reply(`🏷️ *Surnoms du groupe :*\n\n${text}`, { mentions: entries.map(e => e[0]) });
            }

            // ---------- TEXTES DE BIENVENUE / DÉPART PERSONNALISÉS ----------
            case "setwelcometext": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent configurer ça.*");
                const text = args.join(' ').trim();
                if (!text) return reply("❗ *Usage:* .setwelcometext Bienvenue {user} dans {group} !\n(Utilise {user} et {group} comme variables)");
                const notes = loadJson(NOTE_FILE);
                notes[groupJid] = notes[groupJid] || {};
                notes[groupJid].welcomeText = text;
                saveJson(NOTE_FILE, notes);
                return reply("✅ *Message de bienvenue personnalisé enregistré.*");
            }

            case "setgoodbyetext": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent configurer ça.*");
                const text = args.join(' ').trim();
                if (!text) return reply("❗ *Usage:* .setgoodbyetext Au revoir {user} 👋\n(Utilise {user} et {group} comme variables)");
                const notes = loadJson(NOTE_FILE);
                notes[groupJid] = notes[groupJid] || {};
                notes[groupJid].goodbyeText = text;
                saveJson(NOTE_FILE, notes);
                return reply("✅ *Message de départ personnalisé enregistré.*");
            }

            // ---------- NOTES DE GROUPE (annonces épinglées, séparées de note/afk existant) ----------
            case "note2": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent ajouter une note.*");
                const text = args.join(' ').trim();
                if (!text) return reply("❗ *Usage:* .note2 <texte>");
                const notes = loadJson(NOTE_FILE);
                notes[groupJid] = notes[groupJid] || {};
                notes[groupJid].list = notes[groupJid].list || [];
                notes[groupJid].list.push({ text, by: sender, date: new Date().toISOString() });
                saveJson(NOTE_FILE, notes);
                return reply(`✅ *Note ajoutée (#${notes[groupJid].list.length}).*`);
            }

            case "notelist": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                const list = loadJson(NOTE_FILE)[groupJid]?.list || [];
                if (!list.length) return reply("ℹ️ *Aucune note enregistrée.*");
                const text = list.map((n, i) => `*${i + 1}.* ${n.text}`).join('\n');
                return reply(`📝 *Notes du groupe :*\n\n${text}`);
            }

            case "delnote2": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent supprimer une note.*");
                const index = parseInt(args[0], 10);
                const notes = loadJson(NOTE_FILE);
                const list = notes[groupJid]?.list || [];
                if (!index || index < 1 || index > list.length) return reply("❗ *Usage:* .delnote2 <numéro> (voir .notelist)");
                list.splice(index - 1, 1);
                notes[groupJid].list = list;
                saveJson(NOTE_FILE, notes);
                return reply(`✅ *Note #${index} supprimée.*`);
            }

            // ---------- ÉPINGLER / DÉSÉPINGLER UN MESSAGE ----------
            case "pin": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent épingler un message.*");
                const quotedId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
                const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
                if (!quotedId) return reply("❗ *Réponds au message à épingler avec .pin*");
                try {
                    await sock.sendMessage(groupJid, {
                        pin: {
                            type: 1,
                            time: 604800, // 7 jours, durée max supportée par WhatsApp
                            key: { remoteJid: groupJid, id: quotedId, participant: quotedParticipant, fromMe: false }
                        }
                    });
                    return reply("📌 *Message épinglé (7 jours).*");
                } catch (e) {
                    return reply(`❌ *Échec de l'épinglage:* ${e.message}`);
                }
            }

            case "unpin": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent désépingler un message.*");
                const quotedId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
                const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
                if (!quotedId) return reply("❗ *Réponds au message épinglé avec .unpin*");
                try {
                    await sock.sendMessage(groupJid, {
                        pin: {
                            type: 2,
                            key: { remoteJid: groupJid, id: quotedId, participant: quotedParticipant, fromMe: false }
                        }
                    });
                    return reply("✅ *Message désépinglé.*");
                } catch (e) {
                    return reply(`❌ *Échec:* ${e.message}`);
                }
            }

            // ---------- COMPTEUR DE GROUPE (ex: nombre d'événements, jours restants...) ----------
            case "groupcounter": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                const counters = loadJson(COUNTER_FILE);
                const label = args.join(' ').trim();
                if (!label) {
                    const list = counters[groupJid] || {};
                    const entries = Object.entries(list);
                    if (!entries.length) return reply("ℹ️ *Aucun compteur. Usage:* .groupcounter <nom> pour créer/incrémenter.");
                    return reply(entries.map(([k, v]) => `▸ ${k} : ${v}`).join('\n'));
                }
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent modifier les compteurs.*");
                counters[groupJid] = counters[groupJid] || {};
                counters[groupJid][label] = (counters[groupJid][label] || 0) + 1;
                saveJson(COUNTER_FILE, counters);
                return reply(`🔢 *${label} : ${counters[groupJid][label]}*`);
            }

            case "resetcounter": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent réinitialiser un compteur.*");
                const label = args.join(' ').trim();
                if (!label) return reply("❗ *Usage:* .resetcounter <nom>");
                const counters = loadJson(COUNTER_FILE);
                if (counters[groupJid]) delete counters[groupJid][label];
                saveJson(COUNTER_FILE, counters);
                return reply(`✅ *Compteur "${label}" réinitialisé.*`);
            }

            // ---------- VOTE POUR EXCLURE UN MEMBRE (sans passer par un admin) ----------
            case "votekick": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                const target = getTargetJid({ msg, args });
                if (!target) return reply("❗ *Mentionne ou réponds à la personne visée par le vote.*");
                if (target === sender) return reply("❌ *Tu ne peux pas te voter toi-même.*");
                const votes = loadJson(VOTEKICK_FILE);
                votes[groupJid] = votes[groupJid] || {};
                votes[groupJid][target] = votes[groupJid][target] || [];
                if (votes[groupJid][target].includes(sender)) return reply("ℹ️ *Tu as déjà voté contre cette personne.*");
                votes[groupJid][target].push(sender);
                saveJson(VOTEKICK_FILE, votes);

                const memberCount = participants.length || 1;
                const threshold = Math.max(3, Math.ceil(memberCount * 0.3));
                const current = votes[groupJid][target].length;

                if (current >= threshold) {
                    if (!isBotAdmin) {
                        return reply(`⚠️ *Seuil atteint (${current}/${threshold}) mais je ne suis pas admin pour exclure @${fmt(target)}.*`, { mentions: [target] });
                    }
                    try {
                        await sock.groupParticipantsUpdate(groupJid, [target], "remove");
                        delete votes[groupJid][target];
                        saveJson(VOTEKICK_FILE, votes);
                        return reply(`🚫 *@${fmt(target)} exclu(e) suite au vote (${current}/${threshold}).*`, { mentions: [target] });
                    } catch (e) {
                        return reply(`❌ *Échec de l'exclusion:* ${e.message}`);
                    }
                }
                return reply(`🗳️ *Vote enregistré contre @${fmt(target)} : ${current}/${threshold}.*`, { mentions: [target] });
            }

            case "votekickstatus": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                const target = getTargetJid({ msg, args });
                const votes = loadJson(VOTEKICK_FILE)[groupJid] || {};
                if (target) {
                    const count = votes[target]?.length || 0;
                    return reply(`🗳️ *@${fmt(target)} : ${count} vote(s) contre.*`, { mentions: [target] });
                }
                const entries = Object.entries(votes);
                if (!entries.length) return reply("ℹ️ *Aucun vote en cours.*");
                return reply(entries.map(([jid, v]) => `▸ @${fmt(jid)} : ${v.length} vote(s)`).join('\n'), { mentions: entries.map(e => e[0]) });
            }

            case "cancelvotekick": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent annuler un vote.*");
                const target = getTargetJid({ msg, args });
                if (!target) return reply("❗ *Mentionne ou réponds à la personne.*");
                const votes = loadJson(VOTEKICK_FILE);
                if (votes[groupJid]) delete votes[groupJid][target];
                saveJson(VOTEKICK_FILE, votes);
                return reply(`✅ *Vote annulé pour @${fmt(target)}.*`, { mentions: [target] });
            }

            // ---------- MENTIONNER SEULEMENT LES ADMINS (silencieux) ----------
            case "mentionadmins": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                const admins = participants.filter(p => p.admin).map(p => p.id);
                if (!admins.length) return reply("ℹ️ *Aucun admin trouvé.*");
                const text = args.join(' ').trim() || "📢 *Un membre a besoin des admins.*";
                return sock.sendMessage(groupJid, { text, mentions: admins }, { quoted: msg });
            }

            // ---------- MODE SILENCIEUX (le bot ne répond plus dans ce groupe, sauf admins) ----------
            case "silentmode": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent activer ce mode.*");
                const notes = loadJson(NOTE_FILE);
                notes[groupJid] = notes[groupJid] || {};
                notes[groupJid].silentMode = true;
                saveJson(NOTE_FILE, notes);
                return reply("🔇 *Mode silencieux activé (à combiner avec ta logique de filtrage des commandes).*");
            }

            case "unsilentmode": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent désactiver ce mode.*");
                const notes = loadJson(NOTE_FILE);
                if (notes[groupJid]) notes[groupJid].silentMode = false;
                saveJson(NOTE_FILE, notes);
                return reply("🔊 *Mode silencieux désactivé.*");
            }

            // ---------- EXPORT DES MEMBRES ----------
            case "groupvcf":
            case "exportmembers": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent exporter les membres.*");
                if (!participants.length) return reply("❌ *Impossible de récupérer les membres.*");
                const vcards = participants.map((p, i) => {
                    const num = fmt(p.id);
                    return `BEGIN:VCARD\nVERSION:3.0\nFN:Membre ${i + 1}\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD`;
                }).join('\n');
                try {
                    return sock.sendMessage(groupJid, {
                        contacts: {
                            displayName: `${participants.length} membres`,
                            contacts: participants.map((p, i) => ({ vcard: vcards.split('END:VCARD\n')[i] + (i < participants.length - 1 ? 'END:VCARD' : '') }))
                        }
                    });
                } catch (e) {
                    // Repli simple si l'envoi multi-contact échoue
                    const text = participants.map((p, i) => `${i + 1}. +${fmt(p.id)}`).join('\n');
                    return reply(`📇 *Membres du groupe :*\n\n${text}`);
                }
            }

            // ---------- ACTIVITÉ DU GROUPE (nombre de messages via .groupactivity count) ----------
            case "groupactivity": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                const levels = loadJson(LEVEL_FILE);
                levels[groupJid] = levels[groupJid] || {};
                levels[groupJid][sender] = (levels[groupJid][sender] || 0) + 1;
                saveJson(LEVEL_FILE, levels);
                return reply(`📊 *@${fmt(sender)} : ${levels[groupJid][sender]} message(s) comptabilisé(s) via .groupactivity.*`, { mentions: [sender] });
            }

            case "topactive": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                const levels = loadJson(LEVEL_FILE)[groupJid] || {};
                const top = Object.entries(levels).sort((a, b) => b[1] - a[1]).slice(0, 10);
                if (!top.length) return reply("ℹ️ *Aucune activité enregistrée pour le moment.*");
                const text = top.map(([jid, count], i) => `*${i + 1}.* @${fmt(jid)} — ${count}`).join('\n');
                return reply(`🏆 *Top membres actifs :*\n\n${text}`, { mentions: top.map(t => t[0]) });
            }

            // ---------- VERROUILLAGE DES MÉDIAS (texte uniquement) ----------
            case "lockmedia": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent verrouiller les médias.*");
                const notes = loadJson(NOTE_FILE);
                notes[groupJid] = notes[groupJid] || {};
                notes[groupJid].mediaLocked = true;
                saveJson(NOTE_FILE, notes);
                return reply("🔒 *Médias verrouillés (à combiner avec ta logique de suppression des médias entrants).*");
            }

            case "unlockmedia": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent déverrouiller les médias.*");
                const notes = loadJson(NOTE_FILE);
                if (notes[groupJid]) notes[groupJid].mediaLocked = false;
                saveJson(NOTE_FILE, notes);
                return reply("🔓 *Médias déverrouillés.*");
            }

            // ---------- BADGE / TAG DE GROUPE ----------
            case "groupbadge": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                const memberCount = participants.length;
                let badge = "🌱 Petit groupe";
                if (memberCount >= 200) badge = "🔥 Méga groupe";
                else if (memberCount >= 100) badge = "🚀 Grand groupe";
                else if (memberCount >= 50) badge = "⭐ Groupe actif";
                else if (memberCount >= 20) badge = "🌿 Groupe en croissance";
                return reply(`${badge}\n👥 *${memberCount} membres*`);
            }

            case "grouptag": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent définir un tag.*");
                const tag = args.join(' ').trim();
                if (!tag) return reply("❗ *Usage:* .grouptag <texte court>");
                const notes = loadJson(NOTE_FILE);
                notes[groupJid] = notes[groupJid] || {};
                notes[groupJid].tag = tag;
                saveJson(NOTE_FILE, notes);
                return reply(`✅ *Tag du groupe défini :* ${tag}`);
            }

            // ---------- SONDAGE RAPIDE OUI/NON ----------
            case "quickpoll": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                const question = args.join(' ').trim();
                if (!question) return reply("❗ *Usage:* .quickpoll <question>");
                try {
                    return sock.sendMessage(groupJid, {
                        poll: { name: question, values: ["✅ Oui", "❌ Non"], selectableCount: 1 }
                    });
                } catch (e) {
                    return reply(`❌ *Échec:* ${e.message}`);
                }
            }

            case "endpoll": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent clore un sondage.*");
                return reply("ℹ️ *WhatsApp ne permet pas de clore un sondage par API — informe les membres que le vote est terminé.*");
            }

            // ---------- SHOUTOUT (mise en avant d'un membre) ----------
            case "shoutout": {
                if (!isGroup) return reply("❌ *Commande de groupe uniquement.*");
                const target = getTargetJid({ msg, args });
                if (!target) return reply("❗ *Mentionne ou réponds à la personne à mettre en avant.*");
                const reason = args.slice(getTargetJid({ msg, args }) && args[0]?.includes('@') ? 1 : 0).join(' ').trim();
                const text = `🎉 *SHOUTOUT* 🎉\n\n👑 @${fmt(target)}${reason ? `\n📝 ${reason}` : ''}`;
                return sock.sendMessage(groupJid, { text, mentions: [target] }, { quoted: msg });
            }

            default:
                return;
        }
    }
};
