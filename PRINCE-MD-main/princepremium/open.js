module.exports = {
  name: "open",
  category: "group",
  description: "Ouvre le groupe pour tous les membres",
  commands: ["open", "opengc", "open_group"],

  handler: async ({ sock, msg, reply, isGroup, isBotAdmin, isAdmin, isOwner }) => {
    if (!isGroup) return reply("❌ *Cette commande est seulement pour les groupes !*");
    if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent utiliser cette commande !*");
    if (!isBotAdmin) return reply("❌ *Je dois être admin pour ouvrir le groupe !*");

    try {
      await sock.groupSettingUpdate(msg.key.remoteJid, "not_announcement");
      return reply("✅ *Groupe ouvert ! Tous les membres peuvent maintenant écrire.*");
    } catch (e) {
      return reply(`❌ Erreur: ${e.message}`);
    }
  },
};
