/**
 * owner-extra.js — Commandes réservées au propriétaire du bot
 * À placer dans : princepremium/owner-extra.js (chargé automatiquement)
 *
 * .block / .unblock  <@mention | réponse | numéro>
 * .listgc                       → liste des groupes du bot
 * .join <lien d'invitation>     → rejoindre un groupe
 * .bc <texte>                   → message à tous les groupes
 * .setppbot (réponse à une image) → change la photo du bot
 */

const { jidNormalizedUser } = require('baileys');

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = {
    name: 'owner-extra',
    category: 6,
    description: 'Outils propriétaire',
    commands: [
        { cmd: 'block', desc: 'ʙʟᴏᴄᴋ ᴀ ᴜꜱᴇʀ' },
        { cmd: 'unblock', desc: 'ᴜɴʙʟᴏᴄᴋ ᴀ ᴜꜱᴇʀ' },
        { cmd: 'listgc', desc: 'ʟɪꜱᴛ ʙᴏᴛ ɢʀᴏᴜᴘꜱ' },
        { cmd: 'join', desc: 'ᴊᴏɪɴ ᴀ ɢʀᴏᴜᴘ ᴡɪᴛʜ ʟɪɴᴋ' },
        { cmd: 'bc', desc: 'ʙʀᴏᴀᴅᴄᴀꜱᴛ ᴛᴏ ᴀʟʟ ɢʀᴏᴜᴘꜱ' },
        { cmd: 'setppbot', desc: 'ᴄʜᴀɴɢᴇ ʙᴏᴛ ᴘʀᴏꜰɪʟᴇ ᴘɪᴄ' }
    ],

    handler: async ({ sock, msg, m, reply, args, command, isOwner, isGroup, sessionConfig }) => {
        if (!isOwner) return reply('❌ *Réservé au propriétaire du bot.*');

        const prefix = sessionConfig?.PREFIX || '.';
        const chat = msg.key.remoteJid;
        const ctx = msg.message?.extendedTextMessage?.contextInfo;

        const getTarget = () => {
            if (ctx?.mentionedJid?.[0]) return ctx.mentionedJid[0];
            if (ctx?.participant) return ctx.participant;
            const n = (args[0] || '').replace(/\D/g, '');
            if (n.length >= 8) return `${n}@s.whatsapp.net`;
            if (!isGroup) return chat;
            return null;
        };

        try {
            switch (command) {
                case 'block':
                case 'unblock': {
                    const target = getTarget();
                    if (!target) return reply(`❗ *Mentionne quelqu'un, réponds à un message ou donne un numéro.*\nEx : ${prefix}${command} 243xxxxxxxxx`);
                    await sock.updateBlockStatus(target, command);
                    return reply(`✅ *@${target.split('@')[0]} ${command === 'block' ? 'bloqué' : 'débloqué'}.*`, { mentions: [target] });
                }

                case 'listgc': {
                    const groups = Object.values(await sock.groupFetchAllParticipating());
                    if (!groups.length) return reply('ℹ️ *Le bot n\'est dans aucun groupe.*');
                    const lines = groups
                        .slice(0, 60)
                        .map((g, i) => `*${i + 1}.* ${g.subject}\n     👥 ${g.participants?.length || 0} • ${g.id}`);
                    const more = groups.length > 60 ? `\n\n_… et ${groups.length - 60} autres_` : '';
                    return reply(`*📋 GROUPES (${groups.length})*\n\n${lines.join('\n')}${more}`);
                }

                case 'join': {
                    const link = (args[0] || ctx?.quotedMessage?.conversation || '');
                    const match = link.match(/chat\.whatsapp\.com\/([A-Za-z0-9]{20,24})/);
                    if (!match) return reply(`❗ *Donne un lien d'invitation valide.*\nEx : ${prefix}join https://chat.whatsapp.com/xxxx`);
                    await sock.groupAcceptInvite(match[1]);
                    return reply('✅ *Groupe rejoint avec succès.*');
                }

                case 'bc': {
                    const text = args.join(' ').trim();
                    if (!text) return reply(`❗ *Écris le message à diffuser.*\nEx : ${prefix}bc Bonne année à tous !`);
                    const groups = Object.values(await sock.groupFetchAllParticipating());
                    if (!groups.length) return reply('ℹ️ *Aucun groupe.*');
                    await reply(`📢 *Diffusion vers ${groups.length} groupe(s)…*`);
                    let ok = 0;
                    for (const g of groups) {
                        try {
                            await sock.sendMessage(g.id, { text: `📢 *ANNONCE*\n\n${text}` });
                            ok++;
                        } catch (e) {
                            console.error('bc error:', g.id, e.message);
                        }
                        // Pause entre chaque envoi : évite le risque de ban pour spam
                        await delay(2500);
                    }
                    return reply(`✅ *Diffusion terminée : ${ok}/${groups.length} groupe(s).*`);
                }

                case 'setppbot': {
                    const hasImage = m.type === 'imageMessage' || m.quoted?.type === 'imageMessage';
                    if (!hasImage) return reply(`❗ *Réponds à une image avec ${prefix}setppbot.*`);
                    const buffer = m.type === 'imageMessage' ? await m.download() : await m.quoted.download();
                    if (!buffer) return reply('❌ *Impossible de télécharger l\'image.*');
                    await sock.updateProfilePicture(jidNormalizedUser(sock.user.id), buffer);
                    return reply('✅ *Photo du bot mise à jour.*');
                }
            }
        } catch (e) {
            console.error(`owner-extra ${command} error:`, e);
            return reply(`❌ *Erreur :* ${e.message}`);
        }
    }
};
