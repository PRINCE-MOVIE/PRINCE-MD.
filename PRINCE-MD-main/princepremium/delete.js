/**
 * delete.js — Supprime le message cité dans un groupe.
 * Réservé aux admins (ou owner). Il faut répondre (reply) au message à supprimer.
 *
 * Usage : réponds au message visé avec .delete (ou .del)
 */

module.exports = {
    name: "delete",
    category: "group",
    description: "🗑️ Supprime le message cité (admins uniquement)",
    commands: ["delete", "del"],

    handler: async ({ m, reply, isGroup, isAdmin, isBotAdmin, isOwner }) => {
        if (!isGroup) {
            return reply(`👥 *Cette commande fonctionne uniquement dans les groupes.*`);
        }

        if (!isAdmin && !isOwner) {
            return reply(`❌ *Seuls les admins du groupe (ou le owner) peuvent utiliser cette commande.*`);
        }

        if (!m.quoted) {
            return reply(`↩️ *Réponds au message que tu veux supprimer avec .delete*`);
        }

        if (!isBotAdmin) {
            return reply(`🤖 *Je dois être admin du groupe pour pouvoir supprimer les messages des autres.*`);
        }

        try {
            await m.quoted.delete();
            await m.react('✅');
        } catch (e) {
            return reply(`❌ *Échec de la suppression:* ${e.message}`);
        }
    }
};
