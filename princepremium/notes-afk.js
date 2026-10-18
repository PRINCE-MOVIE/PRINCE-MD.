const fs = require('fs-extra');
const path = require('path');

const NOTES_FILE = path.join(__dirname, '..', 'data', 'notes.json');
const AFK_FILE = path.join(__dirname, '..', 'data', 'afk.json');
fs.ensureFileSync(NOTES_FILE);
fs.ensureFileSync(AFK_FILE);

function loadJson(file) {
    try {
        const content = fs.readFileSync(file, 'utf-8').trim();
        return content ? JSON.parse(content) : {};
    } catch (e) {
        return {};
    }
}
function saveJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "notes-afk",
    category: 5,
    description: "Notes personnelles et statut absent (AFK)",
    commands: ["note", "notes", "delnote", "afk", "unafk", "checkafk"],

    handler: async ({ reply, args, command, sender }) => {
        switch (command) {
            case "note": {
                const text = args.join(' ');
                if (!text) return reply("❗ *Donne le texte de la note.*\nEx: .note acheter du pain");
                const notes = loadJson(NOTES_FILE);
                notes[sender] = notes[sender] || [];
                notes[sender].push(text);
                saveJson(NOTES_FILE, notes);
                return reply(`📝 *Note enregistrée (${notes[sender].length} au total).*`);
            }

            case "notes": {
                const notes = loadJson(NOTES_FILE);
                const mine = notes[sender] || [];
                if (!mine.length) return reply("📭 *Tu n'as aucune note.*");
                const text = mine.map((n, i) => `${i + 1}. ${n}`).join('\n');
                return reply(`📝 *Tes notes:*\n${text}`);
            }

            case "delnote": {
                const index = parseInt(args[0]) - 1;
                const notes = loadJson(NOTES_FILE);
                const mine = notes[sender] || [];
                if (isNaN(index) || index < 0 || index >= mine.length) {
                    return reply("❗ *Donne le numéro de la note à supprimer.*\nEx: .delnote 2 (voir .notes)");
                }
                const removed = mine.splice(index, 1);
                notes[sender] = mine;
                saveJson(NOTES_FILE, notes);
                return reply(`🗑️ *Note supprimée:* ${removed[0]}`);
            }

            case "afk": {
                const reason = args.join(' ') || "pas de raison précisée";
                const afk = loadJson(AFK_FILE);
                afk[sender] = { reason, since: Date.now() };
                saveJson(AFK_FILE, afk);
                return reply(`💤 *Statut AFK activé.*\n*Raison:* ${reason}`);
            }

            case "unafk": {
                const afk = loadJson(AFK_FILE);
                if (!afk[sender]) return reply("ℹ️ *Tu n'étais pas en AFK.*");
                delete afk[sender];
                saveJson(AFK_FILE, afk);
                return reply("✅ *Statut AFK désactivé, bon retour !*");
            }

            case "checkafk": {
                const target = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : sender;
                const afk = loadJson(AFK_FILE);
                const info = afk[target];
                if (!info) return reply("✅ *Cette personne n'est pas en AFK.*");
                const minutes = Math.floor((Date.now() - info.since) / 60000);
                return reply(`💤 *En AFK depuis ${minutes} min.*\n*Raison:* ${info.reason}`);
            }
        }
    }
};
