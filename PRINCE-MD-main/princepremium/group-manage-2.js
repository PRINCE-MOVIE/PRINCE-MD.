const fs = require('fs-extra');
const path = require('path');

const WARNS_FILE = path.join(__dirname, '..', 'data', 'warns.json');
fs.ensureFileSync(WARNS_FILE);

function loadWarns() {
    try {
        const content = fs.readFileSync(WARNS_FILE, 'utf-8').trim();
        return content ? JSON.parse(content) : {};
    } catch (e) {
        return {};
    }
}

function saveWarns(data) {
    fs.writeFileSync(WARNS_FILE, JSON.stringify(data, null, 2));
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

function fmtName(jid) {
    return jid ? jid.split('@')[0] : 'inconnu';
}

module.exports = {
    name: "group-manage-2",
    category: "group",
    description: "Commandes de gestion de groupe supplémentaires",
    commands: [
        "grouppic", "setgrouppic", "setgpp",
        "whois", "randommember", "pickmember", "giveaway",
        "clearwarns", "topwarned", "testwelcome",
        "groupsettings", "groupage"
    ],

    handler: async ({ sock, msg, reply, args, command, isGroup, isAdmin, isBotAdmin, isOwner, groupMetadata, sender }) => {
        if (!isGroup) return reply("❌ *Cette commande fonctionne uniquement dans un groupe !*");

        const groupJid = msg.key.remoteJid;
        const participants = groupMetadata?.participants || [];

        const needAdmin = () => {
            if (!isAdmin && !isOwner) {
                reply("❌ *Seuls les admins du groupe peuvent utiliser cette commande !*");
                return false;
            }
            return true;
        };
        const needBotAdmin = () => {
            if (!isBotAdmin) {
                reply("❌ *Je dois être admin du groupe pour faire ça !*");
                return false;
            }
            return true;
        };

        switch (command) {
            case "grouppic": {
                try {
                    const url = await sock.profilePictureUrl(groupJid, 'image');
                    return sock.sendMessage(groupJid, { image: { url }, caption: `🖼️ *Photo de ${groupMetadata.subject || 'ce groupe'}*` });
                } catch (e) {
                    return reply("❌ *Ce groupe n'a pas de photo de profil.*");
                }
            }

            case "setgrouppic":
            case "setgpp": {
                if (!needAdmin() || !needBotAdmin()) return;
                const quotedImg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
                const directImg = msg.message?.imageMessage;
                const target = quotedImg || directImg;
                if (!target) return reply("❗ *Réponds à une image (ou envoie-la avec la commande en légende) pour l'utiliser comme photo de groupe.*");
                try {
                    const { downloadContentFromMessage } = require('baileys');
                    const stream = await downloadContentFromMessage(target, 'image');
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                    await sock.updateProfilePicture(groupJid, buffer);
                    return reply("✅ *Photo du groupe mise à jour !*");
                } catch (e) {
                    return reply(`❌ *Échec :* ${e.message}`);
                }
            }

            case "whois": {
                const target = getTargetJid({ msg, args }) || sender;
                const p = participants.find(x => x.id === target);
                if (!p) return reply("❌ *Membre introuvable dans ce groupe.*");
                const role = p.admin === 'superadmin' ? 'Créateur' : p.admin === 'admin' ? 'Admin' : 'Membre';
                return reply(
                    `👤 *Infos membre*\n\n` +
                    `▸ *Numéro:* @${fmtName(target)}\n` +
                    `▸ *Rôle:* ${role}`,
                    { mentions: [target] }
                );
            }

            case "randommember":
            case "pickmember": {
                const pool = participants.filter(p => !p.id.split('@')[0].includes('status'));
                if (!pool.length) return reply("❌ *Aucun membre trouvé.*");
                const pick = pool[Math.floor(Math.random() * pool.length)];
                return reply(`🎯 *Membre tiré au sort:* @${fmtName(pick.id)}`, { mentions: [pick.id] });
            }

            case "giveaway": {
                const n = Math.max(1, Math.min(parseInt(args[0]) || 1, 10));
                const pool = [...participants];
                const winners = [];
                for (let i = 0; i < n && pool.length; i++) {
                    const idx = Math.floor(Math.random() * pool.length);
                    winners.push(pool.splice(idx, 1)[0].id);
                }
                if (!winners.length) return reply("❌ *Aucun membre trouvé.*");
                const text = `🎉 *Résultat du tirage (${winners.length} gagnant${winners.length > 1 ? 's' : ''}) :*\n\n` +
                    winners.map((w, i) => `${i + 1}. @${fmtName(w)}`).join('\n');
                return reply(text, { mentions: winners });
            }

            case "clearwarns": {
                if (!needAdmin()) return;
                const warns = loadWarns();
                delete warns[groupJid];
                saveWarns(warns);
                return reply("✅ *Tous les avertissements de ce groupe ont été réinitialisés.*");
            }

            case "topwarned": {
                const warns = loadWarns()[groupJid] || {};
                const entries = Object.entries(warns).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]).slice(0, 10);
                if (!entries.length) return reply("✅ *Personne n'a d'avertissement dans ce groupe.*");
                const text = `⚠️ *Classement des avertissements*\n\n` +
                    entries.map(([jid, c], i) => `${i + 1}. @${fmtName(jid)} — ${c}/3`).join('\n');
                return reply(text, { mentions: entries.map(([jid]) => jid) });
            }

            case "testwelcome": {
                return reply(`👋 *Aperçu du message de bienvenue*\n\nBienvenue @${fmtName(sender)} dans *${groupMetadata.subject || 'le groupe'}* !`, { mentions: [sender] });
            }

            case "groupsettings": {
                let announceOnly = false;
                try { announceOnly = groupMetadata.announce === true; } catch (e) {}
                const text =
                    `⚙️ *Paramètres du groupe*\n\n` +
                    `▸ *Nom:* ${groupMetadata.subject || '—'}\n` +
                    `▸ *Membres:* ${participants.length}\n` +
                    `▸ *Verrouillé (annonces seules):* ${announceOnly ? 'Oui' : 'Non'}\n` +
                    `▸ *Bot admin:* ${isBotAdmin ? 'Oui' : 'Non'}\n\n` +
                    `ℹ️ Utilise *.antilink*, *.antibadword* et *.slowmode* pour voir/configurer ces protections en détail.`;
                return reply(text);
            }

            case "groupage": {
                const created = groupMetadata.creation;
                if (!created) return reply("❌ *Date de création introuvable pour ce groupe.*");
                const days = Math.floor((Date.now() / 1000 - created) / 86400);
                const dateStr = new Date(created * 1000).toLocaleDateString('fr-FR');
                return reply(`📅 *Ce groupe a été créé le ${dateStr}*\n🕒 *Soit il y a ${days} jour${days > 1 ? 's' : ''}.*`);
            }
        }
    }
};
