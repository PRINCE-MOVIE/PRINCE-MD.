/**
 * group-tools-2.js — 15 commandes de groupe supplémentaires
 */

const fs = require('fs-extra');
const path = require('path');

const RULES_FILE = path.join(__dirname, '..', 'data', 'grouprules.json');
fs.ensureFileSync(RULES_FILE);

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

module.exports = {
    name: "group-tools-2",
    category: "group",
    description: "Commandes de groupe supplémentaires : règles, infos, verrouillage du chat",
    commands: [
        "groupdesc", "groupname", "countmembers", "adminlist", "grouprules",
        "setrules", "resetrules", "groupcreated", "staffonly", "lockchat",
        "unlockchat", "groupbio", "inviteinfo", "onlyadmins", "memberslist"
    ],

    handler: async ({ sock, msg, reply, args, command, isGroup, isAdmin, isBotAdmin, isOwner, groupMetadata }) => {
        const groupJid = msg.key.remoteJid;
        if (!isGroup) return reply("❌ *Cette commande fonctionne uniquement dans un groupe !*");

        switch (command) {
            case "groupdesc": {
                return reply(`📄 *Description du groupe:*\n${groupMetadata?.desc || '_Aucune description._'}`);
            }
            case "groupname": {
                return reply(`🏷️ *Nom du groupe:* ${groupMetadata?.subject || 'Inconnu'}`);
            }
            case "countmembers":
            case "memberslist": {
                const participants = groupMetadata?.participants || [];
                if (command === "countmembers") {
                    return reply(`👥 *Nombre de membres:* ${participants.length}`);
                }
                const list = participants.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`).join('\n');
                return sock.sendMessage(groupJid, {
                    text: `👥 *Membres du groupe (${participants.length}):*\n${list}`,
                    mentions: participants.map(p => p.id)
                }, { quoted: msg });
            }
            case "adminlist":
            case "staffonly": {
                const admins = (groupMetadata?.participants || []).filter(p => p.admin === 'admin' || p.admin === 'superadmin');
                if (!admins.length) return reply("❌ *Impossible de récupérer la liste des admins.*");
                const list = admins.map((a, i) => `${i + 1}. @${a.id.split('@')[0]}`).join('\n');
                return sock.sendMessage(groupJid, {
                    text: `👑 *Administrateurs (${admins.length}):*\n${list}`,
                    mentions: admins.map(a => a.id)
                }, { quoted: msg });
            }
            case "grouprules": {
                const rules = loadJson(RULES_FILE);
                const text = rules[groupJid];
                return reply(text ? `📜 *Règles du groupe:*\n${text}` : "📜 *Aucune règle définie.* Un admin peut en définir avec .setrules <texte>");
            }
            case "setrules": {
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent définir les règles.*");
                const text = args.join(' ');
                if (!text) return reply("❗ *Usage:* .setrules <texte des règles>");
                const rules = loadJson(RULES_FILE);
                rules[groupJid] = text;
                saveJson(RULES_FILE, rules);
                return reply("✅ *Règles du groupe mises à jour.*");
            }
            case "resetrules": {
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent réinitialiser les règles.*");
                const rules = loadJson(RULES_FILE);
                delete rules[groupJid];
                saveJson(RULES_FILE, rules);
                return reply("🧹 *Règles du groupe réinitialisées.*");
            }
            case "groupcreated": {
                if (!groupMetadata?.creation) return reply("❌ *Date de création indisponible.*");
                const date = new Date(groupMetadata.creation * 1000);
                return reply(`📅 *Groupe créé le:* ${date.toLocaleDateString('fr-FR')}`);
            }
            case "lockchat": {
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent utiliser cette commande !*");
                if (!isBotAdmin) return reply("❌ *Je dois être admin pour verrouiller le groupe !*");
                try {
                    await sock.groupSettingUpdate(groupJid, "announcement");
                    return reply("🔒 *Chat verrouillé : seuls les admins peuvent écrire.*");
                } catch (e) {
                    return reply(`❌ *Erreur:* ${e.message}`);
                }
            }
            case "unlockchat": {
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent utiliser cette commande !*");
                if (!isBotAdmin) return reply("❌ *Je dois être admin pour déverrouiller le groupe !*");
                try {
                    await sock.groupSettingUpdate(groupJid, "not_announcement");
                    return reply("🔓 *Chat déverrouillé : tout le monde peut écrire.*");
                } catch (e) {
                    return reply(`❌ *Erreur:* ${e.message}`);
                }
            }
            case "groupbio": {
                return reply(`📄 *Bio/description du groupe:*\n${groupMetadata?.desc || '_Aucune description définie._'}`);
            }
            case "inviteinfo": {
                if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent voir le lien d'invitation.*");
                if (!isBotAdmin) return reply("❌ *Je dois être admin pour récupérer le lien !*");
                try {
                    const code = await sock.groupInviteCode(groupJid);
                    return reply(`🔗 *Lien d'invitation:*\nhttps://chat.whatsapp.com/${code}`);
                } catch (e) {
                    return reply(`❌ *Erreur:* ${e.message}`);
                }
            }
            case "onlyadmins": {
                const settingAnnounce = groupMetadata?.announce;
                return reply(settingAnnounce
                    ? "🔒 *Actuellement, seuls les admins peuvent écrire dans ce groupe.*"
                    : "🔓 *Actuellement, tous les membres peuvent écrire dans ce groupe.*");
            }
        }
    }
};
