/**
 * productivity-tools.js — 15 commandes de productivité
 * .qr et .shorturl utilisent des API publiques réputées fiables (api.qrserver.com, is.gd).
 * Le reste est 100% autonome (aucune dépendance externe).
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const moment = require('moment-timezone');

const TODO_FILE = path.join(__dirname, '..', 'data', 'todo.json');
fs.ensureFileSync(TODO_FILE);

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

const TIMEZONE_ALIASES = {
    paris: 'Europe/Paris', france: 'Europe/Paris', londres: 'Europe/London', london: 'Europe/London',
    newyork: 'America/New_York', ny: 'America/New_York', losangeles: 'America/Los_Angeles',
    tokyo: 'Asia/Tokyo', kinshasa: 'Africa/Kinshasa', rdc: 'Africa/Kinshasa', congo: 'Africa/Kinshasa',
    dakar: 'Africa/Dakar', abidjan: 'Africa/Abidjan', lagos: 'Africa/Lagos', dubai: 'Asia/Dubai',
    moscou: 'Europe/Moscow', moscow: 'Europe/Moscow', beijing: 'Asia/Shanghai', pekin: 'Asia/Shanghai',
    sydney: 'Australia/Sydney', bruxelles: 'Europe/Brussels', geneve: 'Europe/Zurich', montreal: 'America/Toronto'
};

module.exports = {
    name: "productivity-tools",
    category: 5,
    description: "Outils de productivité : todo-list, heure mondiale, QR code, raccourcisseur de lien",
    commands: [
        "qr", "shorturl", "worldtime", "timezone", "todo", "todolist",
        "deltodo", "cleartodo", "remindme", "stopwatch", "countdown2",
        "dayof", "daysleft", "weekday", "calendar"
    ],

    handler: async ({ reply, args, command, sender }) => {
        const text = args.join(' ');

        switch (command) {
            case "qr": {
                if (!text) return reply("❗ *Usage:* .qr <texte ou lien>\nEx: .qr https://whatsapp.com");
                const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(text)}`;
                return reply(`📱 *QR code généré:*\n${url}`);
            }
            case "shorturl": {
                if (!text) return reply("❗ *Usage:* .shorturl <lien complet>\nEx: .shorturl https://example.com/tres/long/chemin");
                try {
                    const res = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(text)}`, { timeout: 15000 });
                    return reply(`🔗 *Lien raccourci:* ${res.data}`);
                } catch (e) {
                    return reply("❌ *Le service de raccourcissement est indisponible pour le moment.*");
                }
            }
            case "worldtime": {
                const city = (args[0] || '').toLowerCase().replace(/\s+/g, '');
                const tz = TIMEZONE_ALIASES[city];
                if (!tz) return reply(`❗ *Ville non reconnue.* Essaie:\n${Object.keys(TIMEZONE_ALIASES).join(', ')}`);
                return reply(`🌍 *Heure à ${args[0]}:* ${moment().tz(tz).format('DD/MM/YYYY HH:mm:ss')}`);
            }
            case "timezone": {
                const city = (args[0] || '').toLowerCase().replace(/\s+/g, '');
                const tz = TIMEZONE_ALIASES[city];
                if (!tz) return reply(`❗ *Ville non reconnue.* Essaie:\n${Object.keys(TIMEZONE_ALIASES).join(', ')}`);
                return reply(`🕐 *Fuseau horaire de ${args[0]}:* ${tz} (UTC${moment().tz(tz).format('Z')})`);
            }
            case "todo": {
                if (!text) return reply("❗ *Usage:* .todo <tâche>\nEx: .todo Acheter du pain");
                const data = loadJson(TODO_FILE);
                data[sender] = data[sender] || [];
                data[sender].push(text);
                saveJson(TODO_FILE, data);
                return reply(`✅ *Tâche ajoutée (${data[sender].length} au total).*`);
            }
            case "todolist": {
                const data = loadJson(TODO_FILE);
                const list = data[sender] || [];
                if (!list.length) return reply("📋 *Ta liste est vide.* Ajoute une tâche avec .todo <texte>");
                return reply(`📋 *Ta liste de tâches:*\n${list.map((t, i) => `${i + 1}. ${t}`).join('\n')}`);
            }
            case "deltodo": {
                const idx = parseInt(args[0]) - 1;
                const data = loadJson(TODO_FILE);
                const list = data[sender] || [];
                if (isNaN(idx) || idx < 0 || idx >= list.length) return reply("❗ *Usage:* .deltodo <numéro>\nUtilise .todolist pour voir les numéros.");
                const removed = list.splice(idx, 1);
                saveJson(TODO_FILE, data);
                return reply(`🗑️ *Tâche supprimée:* ${removed[0]}`);
            }
            case "cleartodo": {
                const data = loadJson(TODO_FILE);
                data[sender] = [];
                saveJson(TODO_FILE, data);
                return reply("🧹 *Liste de tâches vidée.*");
            }
            case "remindme": {
                const minutes = parseInt(args[0]);
                const msgTxt = args.slice(1).join(' ');
                if (isNaN(minutes) || minutes < 1 || minutes > 1440 || !msgTxt) {
                    return reply("❗ *Usage:* .remindme <minutes> <message>\nEx: .remindme 30 Appeler maman");
                }
                setTimeout(() => { reply(`⏰ *Rappel:* ${msgTxt}`); }, minutes * 60 * 1000);
                return reply(`⏰ *Rappel programmé dans ${minutes} minute(s).*`);
            }
            case "stopwatch": {
                return reply(`⏱️ *Chronomètre démarré:* ${moment().format('HH:mm:ss')}\n_Note un point de départ, le bot ne fait pas de suivi en direct._`);
            }
            case "countdown2": {
                const target = args[0];
                if (!target || !/^\d{2}\/\d{2}\/\d{4}$/.test(target)) return reply("❗ *Usage:* .countdown2 JJ/MM/AAAA\nEx: .countdown2 25/12/2026");
                const [d, mo, y] = target.split('/').map(Number);
                const targetDate = new Date(y, mo - 1, d);
                const diffMs = targetDate - new Date();
                if (diffMs < 0) return reply("❌ *Cette date est déjà passée.*");
                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                return reply(`⏳ *Il reste ${days} jour(s) avant le ${target}.*`);
            }
            case "dayof": {
                const target = args[0];
                if (!target || !/^\d{2}\/\d{2}\/\d{4}$/.test(target)) return reply("❗ *Usage:* .dayof JJ/MM/AAAA\nEx: .dayof 25/12/2026");
                const [d, mo, y] = target.split('/').map(Number);
                const date = new Date(y, mo - 1, d);
                if (isNaN(date.getTime())) return reply("❌ *Date invalide.*");
                const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                return reply(`📅 *${target} tombe un:* ${jours[date.getDay()]}`);
            }
            case "daysleft": {
                const target = args[0];
                if (!target || !/^\d{2}\/\d{2}\/\d{4}$/.test(target)) return reply("❗ *Usage:* .daysleft JJ/MM/AAAA\nEx: .daysleft 31/12/2026");
                const [d, mo, y] = target.split('/').map(Number);
                const targetDate = new Date(y, mo - 1, d);
                const diffDays = Math.ceil((targetDate - new Date()) / (1000 * 60 * 60 * 24));
                return reply(diffDays >= 0 ? `📆 *Jours restants:* ${diffDays}` : `📆 *C'était il y a ${Math.abs(diffDays)} jour(s).*`);
            }
            case "weekday": {
                const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                return reply(`📅 *Aujourd'hui c'est:* ${jours[new Date().getDay()]}`);
            }
            case "calendar": {
                const now = new Date();
                const month = args[0] ? parseInt(args[0]) - 1 : now.getMonth();
                const year = args[1] ? parseInt(args[1]) : now.getFullYear();
                if (isNaN(month) || month < 0 || month > 11 || isNaN(year)) return reply("❗ *Usage:* .calendar <mois 1-12> <année>\nEx: .calendar 12 2026");
                const first = new Date(year, month, 1);
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const moisNoms = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
                let out = `📅 *${moisNoms[month]} ${year}*\nDi Lu Ma Me Je Ve Sa\n`;
                let line = '   '.repeat(first.getDay());
                for (let day = 1; day <= daysInMonth; day++) {
                    line += String(day).padStart(2, ' ') + ' ';
                    if ((first.getDay() + day) % 7 === 0) { out += line + '\n'; line = ''; }
                }
                if (line.trim()) out += line;
                return reply(out);
            }
        }
    }
};
