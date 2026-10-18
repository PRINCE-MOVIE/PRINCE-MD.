const { jidNormalizedUser } = require('baileys');

// ---------------------------------------------------------------------------
// Cache de groupMetadata (5 min). Sans ça, chaque commande dans un groupe
// déclenchait un appel réseau complet à socket.groupMetadata(), et WhatsApp
// finit par throttle ces requêtes répétées après quelques heures d'usage —
// le bot répond alors avec un retard de plus en plus grand. Voir la doc
// officielle Baileys ("cachedGroupMetadata is recommended for groups").
// ---------------------------------------------------------------------------
const GROUP_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const groupMetadataCache = new Map(); // jid -> { data, expiresAt }

function setGroupMetadataCache(jid, data) {
    groupMetadataCache.set(jid, { data, expiresAt: Date.now() + GROUP_CACHE_TTL_MS });
}

function getFreshCachedEntry(jid) {
    const entry = groupMetadataCache.get(jid);
    if (entry && entry.expiresAt > Date.now()) return entry.data;
    return null;
}

async function getGroupMetadata(socket, groupJid) {
    const cached = getFreshCachedEntry(groupJid);
    if (cached) return cached;
    const data = await socket.groupMetadata(groupJid);
    setGroupMetadataCache(groupJid, data);
    return data;
}

// À passer en option `cachedGroupMetadata` de makeWASocket : Baileys interroge
// cette fonction EN INTERNE (résolution des participants, déchiffrement des
// messages de groupe, etc.) avant de refaire un appel réseau lui-même.
function cachedGroupMetadataGetter(jid) {
    return getFreshCachedEntry(jid) || undefined;
}

// À appeler une seule fois juste après la création du socket : garde le cache
// à jour dès qu'un groupe change (participants, nom...) au lieu d'attendre
// l'expiration du TTL.
function attachGroupMetadataCacheListeners(socket) {
    if (socket._groupMetadataCacheAttached) return;
    socket._groupMetadataCacheAttached = true;

    const refresh = async (jid) => {
        try {
            const data = await socket.groupMetadata(jid);
            setGroupMetadataCache(jid, data);
        } catch (_) {
            // groupe quitté / inaccessible entre-temps, on ignore
        }
    };

    socket.ev.on('groups.update', (updates) => {
        for (const u of updates || []) if (u?.id) refresh(u.id);
    });
    socket.ev.on('group-participants.update', (event) => {
        if (event?.id) refresh(event.id);
    });
}

function getParticipants(metadata) {
    return metadata?.participants || [];
}

function isParticipantAdmin(participants, jid) {
    return participants.some(p => p.id === jid && (p.admin === 'admin' || p.admin === 'superadmin'));
}

async function isGroupAdmin(socket, groupJid, userJid) {
    const metadata = await getGroupMetadata(socket, groupJid);
    const participants = getParticipants(metadata);
    return isParticipantAdmin(participants, userJid);
}

async function isBotAdmin(socket, groupJid) {
    const metadata = await getGroupMetadata(socket, groupJid);
    const participants = getParticipants(metadata);
    const botJid = jidNormalizedUser(socket.user.id);
    const botNumber = botJid.split('@')[0];
    // WhatsApp migre certains groupes vers des identifiants @lid (Linked ID) au lieu du
    // numéro classique @s.whatsapp.net. socket.user.id reste au format numéro, donc une
    // simple comparaison de chaîne peut échouer même si le bot EST bien admin.
    // socket.user.lid (quand disponible) donne l'identifiant @lid du bot pour comparer aussi.
    const rawLid = socket.user.lid || socket.authState?.creds?.me?.lid || null;
    const botLid = rawLid ? jidNormalizedUser(rawLid) : null;
    const botLidNumber = botLid ? botLid.split('@')[0] : null;

    return participants.some(p => {
        const isThisBot =
            p.id === botJid ||
            p.id.split('@')[0] === botNumber ||
            (botLid && p.id === botLid) ||
            (botLidNumber && p.id.split('@')[0] === botLidNumber);
        return isThisBot && (p.admin === 'admin' || p.admin === 'superadmin');
    });
}

function getGroupAdmins(participants) {
    return participants
        .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
        .map(p => p.id);
}

function senderJidFromNumber(number) {
    return `${number}@s.whatsapp.net`;
}

module.exports = {
    getGroupMetadata,
    getParticipants,
    isParticipantAdmin,
    isGroupAdmin,
    isBotAdmin,
    getGroupAdmins,
    senderJidFromNumber,
    cachedGroupMetadataGetter,
    attachGroupMetadataCacheListeners
};
