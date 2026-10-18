// Stockage des sessions en fichiers JSON (remplace MongoDB).
// Un fichier par numéro : ./data/sessions/<numéro>.json
// IMPORTANT : ce dossier doit être en dehors de ./session, car le bot vide
// ./session à l'arrêt du process.
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || './data';
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
fs.mkdirSync(SESSIONS_DIR, { recursive: true });

const clean = (n) => String(n).replace(/[^0-9]/g, '');
const fileOf = (n) => path.join(SESSIONS_DIR, `${clean(n)}.json`);

function readDoc(n) {
    try {
        return JSON.parse(fs.readFileSync(fileOf(n), 'utf8'));
    } catch {
        return null;
    }
}

function writeDoc(n, doc) {
    const file = fileOf(n);
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(doc));
    fs.renameSync(tmp, file); // écriture atomique : pas de fichier à moitié écrit
}

// Résultat "thenable" avec .lean(), pour rester compatible avec le code existant
function result(value) {
    const p = Promise.resolve(value);
    p.lean = () => Promise.resolve(value);
    return p;
}

const Session = {
    find() {
        let docs = [];
        try {
            docs = fs.readdirSync(SESSIONS_DIR)
                .filter((f) => f.endsWith('.json'))
                .map((f) => readDoc(f.replace('.json', '')))
                .filter(Boolean);
        } catch {}
        return result(docs);
    },

    findOne(filter = {}) {
        return result(filter.number ? readDoc(filter.number) : null);
    },

    deleteOne(filter = {}) {
        if (filter.number) {
            try { fs.unlinkSync(fileOf(filter.number)); } catch {}
        }
        return result({ deletedCount: 1 });
    },

    findOneAndUpdate(filter = {}, update = {}, options = {}) {
        if (!filter.number) return result(null);
        const current = readDoc(filter.number);
        if (!current && !options.upsert) return result(null);
        const fields = update.$set ? update.$set : update;
        const doc = { ...(current || { number: clean(filter.number) }), ...fields };
        writeDoc(filter.number, doc);
        return result(doc);
    }
};

module.exports = Session;
