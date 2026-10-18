const { jidNormalizedUser } = require('baileys');

async function getGroupMetadata(socket, groupJid) {
    return socket.groupMetadata(groupJid);
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
    senderJidFromNumber
};
