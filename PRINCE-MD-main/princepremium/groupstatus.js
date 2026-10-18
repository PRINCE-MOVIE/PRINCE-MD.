/**
 * groupstatus.js — Vrai STATUT DE GROUPE WhatsApp (celui qui s'affiche dans le
 * groupe avec « Ajouté par ~ nom du bot »).
 *
 * Commandes : .gcstatus / .groupstatus / .togstatus
 *
 * Usage :
 *   .gcstatus <texte>
 *   .gcstatus #RRGGBB <texte>              (couleur de fond)
 *   (reply à un message texte)  .gcstatus
 *   (reply à image/vidéo/audio) .gcstatus <légende optionnelle>
 *
 */
const crypto = require('crypto');
const { generateWAMessageContent, generateWAMessageFromContent } = require('baileys');


const RANDOM_COLORS = ['#7d3c98', '#1abc9c', '#e74c3c', '#2980b9', '#e67e22', '#16a085', '#8e44ad', '#c0392b'];
const randomColor = () => RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];

function parseColorAndText(args) {
    if (args.length && /^#[0-9a-fA-F]{6}$/.test(args[0])) {
        return { color: args[0], text: args.slice(1).join(' ').trim() };
    }
    return { color: randomColor(), text: args.join(' ').trim() };
}

// Envoie un vrai statut de groupe (message enveloppé dans groupStatusMessageV2)
async function sendGroupStatus(sock, groupJid, content, bgColor) {
    const inside = await generateWAMessageContent(content, { upload: sock.waUploadToServer });

    if (bgColor && inside.extendedTextMessage) {
        inside.extendedTextMessage.backgroundArgb = (0xFF000000 | parseInt(bgColor.slice(1), 16)) >>> 0;
    }

    const messageSecret = crypto.randomBytes(32);
    const wrapped = generateWAMessageFromContent(
        groupJid,
        {
            messageContextInfo: { messageSecret },
            groupStatusMessageV2: {
                message: { ...inside, messageContextInfo: { messageSecret } }
            }
        },
        {}
    );

    await sock.relayMessage(groupJid, wrapped.message, { messageId: wrapped.key.id });
    return wrapped;
}

module.exports = {
    name: "groupstatus",
    category: "group",
    description: "📣 Poster un vrai statut de groupe (texte, image, vidéo, audio)",
    commands: ["groupstatus", "gcstatus", "togstatus", "gstatus", "poststatus", "statuspost"],

    handler: async ({ sock, msg, m, reply, args, isGroup, isOwner }) => {
        if (!isOwner) return reply("❌ *Seul le propriétaire du bot peut utiliser cette commande.*");
        if (!isGroup) return reply("❌ *Cette commande fonctionne uniquement dans un groupe.*");

        const groupJid = msg.key.remoteJid;
        const { color, text } = parseColorAndText(args);

        try {
            // 1) Média envoyé directement avec la commande en légende, 2) média cité
            let source = null;
            let kind = null;
            if (m?.type === 'imageMessage' || m?.type === 'videoMessage') {
                source = m; kind = m.type;
            } else if (m?.quoted && ['imageMessage', 'videoMessage', 'audioMessage'].includes(m.quoted.type)) {
                source = m.quoted; kind = m.quoted.type;
            }

            if (source) {
                const buffer = await source.download();
                if (!buffer) return reply("❌ *Échec du téléchargement du média.*");

                let content;
                if (kind === 'imageMessage') content = { image: buffer, caption: args.join(' ').trim() };
                else if (kind === 'videoMessage') content = { video: buffer, caption: args.join(' ').trim() };
                else content = { audio: buffer, mimetype: 'audio/mp4', ptt: false };

                await sendGroupStatus(sock, groupJid, content);
                return reply("✅ *Statut de groupe publié.*");
            }

            // Texte : args, sinon texte du message cité
            let finalText = text;
            if (!finalText && m?.quoted) {
                const qType = m.quoted.type;
                if (qType === 'conversation') finalText = (m.quoted.msg || '').trim();
                else if (qType === 'extendedTextMessage') finalText = (m.quoted.msg?.text || '').trim();
            }

            if (!finalText) {
                return reply(
                    "❌ *Usage :*\n" +
                    "• .gcstatus <texte>\n" +
                    "• .gcstatus #1abc9c <texte>\n" +
                    "• (reply à un texte/image/vidéo/audio) .gcstatus"
                );
            }

            await sendGroupStatus(sock, groupJid, { text: finalText }, color);
            return reply("✅ *Statut de groupe publié.*");
        } catch (e) {
            console.error('groupstatus error:', e);
            return reply(`❌ *Échec :* ${e.message}`);
        }
    }
};
                                                          
