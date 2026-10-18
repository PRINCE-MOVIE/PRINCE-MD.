module.exports = {
  name: "close",
  category: "group",
  description: "Ferme le groupe, seuls les admins peuvent écrire",
  commands: ["close", "closegc", "close_group"],

  handler: async ({ sock, msg, reply, isGroup, isBotAdmin, isAdmin, isOwner }) => {
    if (!isGroup) return reply("❌ *Cette commande est seulement pour les groupes !*");
    if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent utiliser cette commande !*");
    if (!isBotAdmin) return reply("❌ *Je dois être admin pour fermer le groupe !*");

    try {
      await sock.groupSettingUpdate(msg.key.remoteJid, "announcement");
      return reply("🔒 *Groupe fermé ! Seuls les admins peuvent maintenant écrire.*");
    } catch (e) {
      return reply(`❌ Erreur: ${e.message}`);
    }
  },
};
