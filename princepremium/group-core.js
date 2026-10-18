/**
 * group-core.js — Commandes de gestion de groupe (PRINCE-MD)
 * kick, promote, demote, tagall, hidetag, tagadmin, groupinfo/groupstatus,
 * linkgroup, revokelink, setname, setdesc, mute/unmute, lockgroup/unlockgroup,
 * groupid, admins, members
 */

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
    name: "group-core",
    category: "group",
    description: "Commandes de gestion de groupe",
    commands: [
        "kick", "remove", "promote", "demote",
        "tagall", "hidetag", "tagadmin",
        "groupinfo", "groupstatus",
        "linkgroup", "revokelink",
        "setname", "setgname", "setdesc", "setgdesc",
        "mute", "unmute", "lockgroup", "unlockgroup",
        "groupid", "admins", "members"
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
            case "kick":
            case "remove": {
                if (!needAdmin() || !needBotAdmin()) return;
                const target = getTargetJid({ msg, args });
                if (!target) return reply("❗ *Mentionne ou réponds au message de la personne à retirer.*\nEx: .kick @membre");
                try {
                    await sock.groupParticipantsUpdate(groupJid, [target], "remove");
                    return reply(`✅ *@${fmtName(target)} a été retiré du groupe.*`, { mentions: [target] });
                } catch (e) {
                    return reply(`❌ *Échec :* ${e.message}`);
                }
            }

            case "promote": {
                if (!needAdmin() || !needBotAdmin()) return;
                const target = getTargetJid({ msg, args });
                if (!target) return reply("❗ *Mentionne ou réponds au message de la personne à promouvoir.*\nEx: .promote @membre");
                try {
                    await sock.groupParticipantsUpdate(groupJid, [target], "promote");
                    return reply(`✅ *@${fmtName(target)} est maintenant admin.*`, { mentions: [target] });
                } catch (e) {
                    return reply(`❌ *Échec :* ${e.message}`);
                }
            }

            case "demote": {
                if (!needAdmin() || !needBotAdmin()) return;
                const target = getTargetJid({ msg, args });
                if (!target) return reply("❗ *Mentionne ou réponds au message de la personne à rétrograder.*\nEx: .demote @membre");
                try {
                    await sock.groupParticipantsUpdate(groupJid, [target], "demote");
                    return reply(`✅ *@${fmtName(target)} n'est plus admin.*`, { mentions: [target] });
                } catch (e) {
                    return reply(`❌ *Échec :* ${e.message}`);
                }
            }

            case "tagall": {
                if (!needAdmin()) return;
                const ids = participants.map(p => p.id);
                const note = args.join(' ').trim();
                let text = `📢 *Tag All — ${groupMetadata.subject || ''}*\n\n` + (note ? `${note}\n\n` : '');
                ids.forEach(id => { text += `➤ @${fmtName(id)}\n`; });
                return reply(text, { mentions: ids });
            }

            case "hidetag": {
                if (!needAdmin()) return;
                const ids = participants.map(p => p.id);
                const text = args.length ? args.join(' ') : '📢';
                return reply(text, { mentions: ids });
            }

            case "tagadmin": {
                const adminIds = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id);
                if (!adminIds.length) return reply("ℹ️ *Aucun admin trouvé.*");
                let text = `👑 *Admins du groupe*\n\n`;
                adminIds.forEach(id => { text += `➤ @${fmtName(id)}\n`; });
                return reply(text, { mentions: adminIds });
            }

            case "admins": {
                const adminIds = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id);
                const text = adminIds.length
                    ? `👑 *${adminIds.length} admin(s):*\n` + adminIds.map(id => `• @${fmtName(id)}`).join('\n')
                    : "ℹ️ *Aucun admin trouvé.*";
                return reply(text, { mentions: adminIds });
            }

            case "members": {
                return reply(`👥 *Ce groupe compte ${participants.length} membre(s).*`);
            }

            case "groupinfo":
            case "groupstatus": {
                const owner = groupMetadata.owner ? fmtName(groupMetadata.owner) : 'inconnu';
                const adminCount = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').length;
                const text =
                    `📋 *INFOS DU GROUPE*\n\n` +
                    `▸ *Nom:* ${groupMetadata.subject || '—'}\n` +
                    `▸ *ID:* ${groupJid}\n` +
                    `▸ *Créateur:* ${owner}\n` +
                    `▸ *Membres:* ${participants.length}\n` +
                    `▸ *Admins:* ${adminCount}\n` +
                    `▸ *Description:* ${groupMetadata.desc || '—'}\n\n` +
                    `> *BY PRINCE PREMIUM*`;
                return reply(text);
            }

            case "groupid": {
                return reply(`🆔 *ID du groupe:*\n${groupJid}`);
            }

            case "linkgroup": {
                if (!needAdmin() || !needBotAdmin()) return;
                try {
                    const code = await sock.groupInviteCode(groupJid);
                    return reply(`🔗 *Lien du groupe:*\nhttps://chat.whatsapp.com/${code}`);
                } catch (e) {
                    return reply(`❌ *Échec :* ${e.message}`);
                }
            }

            case "revokelink": {
                if (!needAdmin() || !needBotAdmin()) return;
                try {
                    await sock.groupRevokeInvite(groupJid);
                    return reply(`✅ *Ancien lien révoqué, un nouveau lien a été généré.*`);
                } catch (e) {
                    return reply(`❌ *Échec :* ${e.message}`);
                }
            }

            case "setname":
            case "setgname": {
                if (!needAdmin() || !needBotAdmin()) return;
                const newName = args.join(' ').trim();
                if (!newName) return reply("❗ *Donne le nouveau nom.*\nEx: .setname Mon Super Groupe");
                try {
                    await sock.groupUpdateSubject(groupJid, newName);
                    return reply(`✅ *Nom du groupe changé en:* ${newName}`);
                } catch (e) {
                    return reply(`❌ *Échec :* ${e.message}`);
                }
            }

            case "setdesc":
            case "setgdesc": {
                if (!needAdmin() || !needBotAdmin()) return;
                const newDesc = args.join(' ').trim();
                if (!newDesc) return reply("❗ *Donne la nouvelle description.*\nEx: .setdesc Bienvenue !");
                try {
                    await sock.groupUpdateDescription(groupJid, newDesc);
                    return reply(`✅ *Description du groupe mise à jour.*`);
                } catch (e) {
                    return reply(`❌ *Échec :* ${e.message}`);
                }
            }

            case "mute":
            case "lockgroup": {
                if (!needAdmin() || !needBotAdmin()) return;
                // .mute <1h|6h|1d|7d> : verrouille puis rouvre tout seul à l'échéance (sans durée = verrou permanent)
                const durMap = { '1h': 3600, '6h': 21600, '1d': 86400, '7d': 604800 };
                const durStr = command === "mute" ? (args[0] || '').toLowerCase() : '';
                const secs = durMap[durStr];
                if (command === "mute" && args[0] && !secs) return reply("❗ *Durée invalide.*\nEx: .mute 1h  (1h, 6h, 1d ou 7d)");
                try {
                    await sock.groupSettingUpdate(groupJid, 'announcement');
                    if (secs) {
                        setTimeout(async () => {
                            try { await sock.groupSettingUpdate(groupJid, 'not_announcement'); } catch (_) {}
                        }, secs * 1000);
                        return reply(`🔇 *Groupe verrouillé pendant ${durStr}.* Utilise *.unmute* pour rouvrir avant.`);
                    }
                    return reply(`🔒 *Groupe verrouillé — seuls les admins peuvent écrire.*`);
                } catch (e) {
                    return reply(`❌ *Échec :* ${e.message}`);
                }
            }

            case "unmute":
            case "unlockgroup": {
                if (!needAdmin() || !needBotAdmin()) return;
                try {
                    await sock.groupSettingUpdate(groupJid, 'not_announcement');
                    return reply(`🔓 *Groupe déverrouillé — tout le monde peut écrire.*`);
                } catch (e) {
                    return reply(`❌ *Échec :* ${e.message}`);
                }
            }
        }
    }
};
