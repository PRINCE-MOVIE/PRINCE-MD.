/**
 * group-extra-2.js — Commandes de gestion de groupe supplémentaires
 * À placer dans : princepremium/group-extra-2.js (chargé automatiquement)
 *
 * .vcf                     → exporte les contacts du groupe (fichier .vcf)
 * .disappear <off|24h|7d|90d> → messages éphémères du groupe
 * .requests                → liste des demandes d'adhésion en attente
 * .approveall / .rejectall → accepte / refuse toutes les demandes
 */

const DURATIONS = { off: 0, '24h': 86400, '7d': 604800, '90d': 7776000 };

module.exports = {
    name: 'group-extra-2',
    category: 3,
    description: 'Gestion de groupe avancée',
    commands: [
        { cmd: 'vcf', desc: 'ᴇxᴘᴏʀᴛ ɢʀᴏᴜᴘ ᴄᴏɴᴛᴀᴄᴛꜱ' },
        { cmd: 'disappear', desc: 'ᴅɪꜱᴀᴘᴘᴇᴀʀɪɴɢ ᴍᴇꜱꜱᴀɢᴇꜱ' },
        { cmd: 'requests', desc: 'ᴘᴇɴᴅɪɴɢ ᴊᴏɪɴ ʀᴇǫᴜᴇꜱᴛꜱ' },
        { cmd: 'approveall', desc: 'ᴀᴘᴘʀᴏᴠᴇ ᴀʟʟ ʀᴇǫᴜᴇꜱᴛꜱ' },
        { cmd: 'rejectall', desc: 'ʀᴇᴊᴇᴄᴛ ᴀʟʟ ʀᴇǫᴜᴇꜱᴛꜱ' }
    ],

    handler: async ({ sock, msg, reply, args, command, isGroup, isAdmin, isBotAdmin, isOwner, groupMetadata, sessionConfig }) => {
        if (!isGroup) return reply('❌ *Cette commande fonctionne uniquement dans un groupe !*');
        if (!isAdmin && !isOwner) return reply('❌ *Seuls les admins peuvent utiliser cette commande !*');

        const prefix = sessionConfig?.PREFIX || '.';
        const chat = msg.key.remoteJid;

        try {
            switch (command) {
                case 'vcf': {
                    const members = groupMetadata?.participants || [];
                    // Les membres en @lid (numéro masqué) n'ont pas de numéro exploitable
                    const real = members.filter((p) => p.id.endsWith('@s.whatsapp.net'));
                    if (!real.length) return reply('❌ *Aucun numéro exploitable (membres à numéro masqué).*');

                    const vcard = real
                        .map((p, i) => {
                            const num = p.id.split('@')[0];
                            return `BEGIN:VCARD\nVERSION:3.0\nFN:Membre ${i + 1} (+${num})\nTEL;type=CELL;waid=${num}:+${num}\nEND:VCARD`;
                        })
                        .join('\n');

                    const name = (groupMetadata?.subject || 'groupe').replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
                    await sock.sendMessage(chat, {
                        document: Buffer.from(vcard, 'utf8'),
                        mimetype: 'text/x-vcard',
                        fileName: `${name}.vcf`,
                        caption: `✅ *${real.length} contact(s) exporté(s).*` +
                            (members.length > real.length ? `\n⚠️ ${members.length - real.length} membre(s) ignoré(s) (numéro masqué).` : '')
                    }, { quoted: msg });
                    return;
                }

                case 'disappear': {
                    if (!isBotAdmin) return reply('❌ *Je dois être admin pour faire ça !*');
                    const opt = (args[0] || '').toLowerCase();
                    if (!(opt in DURATIONS)) {
                        return reply(`❗ *Choisis une durée :* off, 24h, 7d, 90d\nEx : ${prefix}disappear 7d`);
                    }
                    await sock.groupToggleEphemeral(chat, DURATIONS[opt]);
                    return reply(opt === 'off'
                        ? '✅ *Messages éphémères désactivés.*'
                        : `✅ *Messages éphémères activés : ${opt}.*`);
                }

                case 'requests':
                case 'approveall':
                case 'rejectall': {
                    if (!isBotAdmin) return reply('❌ *Je dois être admin pour faire ça !*');
                    const list = await sock.groupRequestParticipantsList(chat);
                    if (!list?.length) return reply('ℹ️ *Aucune demande d\'adhésion en attente.*');

                    if (command === 'requests') {
                        const lines = list.slice(0, 50).map((r, i) => `*${i + 1}.* @${r.jid.split('@')[0]}`);
                        const more = list.length > 50 ? `\n\n_… et ${list.length - 50} autres_` : '';
                        return reply(
                            `*📥 DEMANDES EN ATTENTE (${list.length})*\n\n${lines.join('\n')}${more}\n\n` +
                            `▸ ${prefix}approveall pour tout accepter\n▸ ${prefix}rejectall pour tout refuser`,
                            { mentions: list.slice(0, 50).map((r) => r.jid) }
                        );
                    }

                    const action = command === 'approveall' ? 'approve' : 'reject';
                    await sock.groupRequestParticipantsUpdate(chat, list.map((r) => r.jid), action);
                    return reply(`✅ *${list.length} demande(s) ${action === 'approve' ? 'acceptée(s)' : 'refusée(s)'}.*`);
                }
            }
        } catch (e) {
            console.error(`group-extra-2 ${command} error:`, e);
            return reply(`❌ *Erreur :* ${e.message}`);
        }
    }
};
