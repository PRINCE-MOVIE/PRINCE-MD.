module.exports = {
  name: "kickall2",
  category: "group",
  description: "Kick tous les membres sauf admins, d'un seul coup",
  commands: ["kickall2", "kickall"],

  handler: async ({ sock, msg, reply, isGroup, isBotAdmin, isAdmin, isOwner, groupMetadata }) => {
    if (!isGroup) return reply("❌ *Commande pour groupe seulement!*");
    if (!isAdmin && !isOwner) return reply("❌ *Seuls les admins peuvent utiliser ça!*");
    if (!isBotAdmin) return reply("❌ *Je dois être admin pour kicker!*");

    try {
      const participants = groupMetadata.participants;
      const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

      // Liste des admins (ne jamais les kicker)
      const admins = participants
        .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
        .map(p => p.id);

      // On kick seulement les non-admins et pas le bot
      const toKick = participants
        .filter(p => !admins.includes(p.id) && p.id !== botJid)
        .map(p => p.id);

      if (toKick.length === 0) return reply("✅ *Aucun membre à kicker, il ne reste que des admins.*");

      await reply(`⚠️ *Kick en cours... ${toKick.length} membres vont être retirés d'un seul coup!*`);

      // Retrait en un seul appel groupé (WhatsApp/Baileys accepte un tableau de participants)
      let removed = [];
      let failed = [];
      try {
        const result = await sock.groupParticipantsUpdate(msg.key.remoteJid, toKick, "remove");
        // Baileys renvoie un tableau de statuts par participant ({ status, jid })
        if (Array.isArray(result)) {
          for (const r of result) {
            if (r.status === '200' || r.status === 200) removed.push(r.jid);
            else failed.push(r.jid);
          }
        } else {
          removed = toKick;
        }
      } catch (bulkErr) {
        // Si WhatsApp refuse le lot complet (groupe trop grand, limite atteinte),
        // on retente par paquets de 20 pour rester "en une seule vague" au lieu d'un par un.
        const CHUNK = 20;
        for (let i = 0; i < toKick.length; i += CHUNK) {
          const chunk = toKick.slice(i, i + CHUNK);
          try {
            await sock.groupParticipantsUpdate(msg.key.remoteJid, chunk, "remove");
            removed.push(...chunk);
          } catch (chunkErr) {
            failed.push(...chunk);
          }
        }
      }

      let summary = `✅ *Terminé! ${removed.length} membre(s) kické(s).*`;
      if (failed.length) summary += `\n⚠️ *${failed.length} membre(s) n'ont pas pu être retirés (déjà partis ou erreur WhatsApp).*`;
      return reply(summary);
    } catch (e) {
      return reply(`❌ Erreur: ${e.message}`);
    }
  },
};
