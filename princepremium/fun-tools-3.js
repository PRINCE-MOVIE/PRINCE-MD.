const SLAPS = [
    "envoie une baffe monumentale à",
    "frappe avec une poêle géante",
    "gifle sans pitié",
    "assomme d'un coup de coussin surpuissant",
    "claque des deux mains sur les joues de"
];
const HUGS = [
    "fait un câlin chaleureux à",
    "serre très fort dans ses bras",
    "prend affectueusement dans ses bras",
    "fait un gros câlin réconfortant à"
];
const KISSES = [
    "fait un bisou sur la joue à",
    "envoie un bisou à distance à",
    "dépose un petit bisou sur le front de"
];
const PUNCHES = [
    "envoie un uppercut à",
    "donne un coup de poing amical à",
    "met un pain à",
    "frappe façon Street Fighter"
];
const BITES = [
    "mord gentiment",
    "croque affectueusement",
    "fait un petit mordillement à"
];
const ROASTS = [
    "T'es tellement lent(e) que même ton wifi te double.",
    "Ton dernier bon choix remonte à... on cherche encore.",
    "T'as l'énergie d'un chargeur à 1%.",
    "T'es le genre de personne qui met .5 secondes de retard sur tout.",
    "Même l'autocorrect abandonne avec toi.",
    "T'as un charisme de mode avion.",
    "Ton style a été inspiré par une panne de courant.",
    "T'es aussi fiable qu'un GPS sans réseau."
];
const MOODS = [
    "😴 Fatigué(e)", "🔥 Motivé(e) à bloc", "😎 Zen total", "🥱 Envie de rien",
    "🎉 Prêt(e) à faire la fête", "😤 Un peu à cran", "🤓 Mode sérieux activé",
    "😂 Prêt(e) à rigoler toute la journée", "☕ Mode café obligatoire", "🌧️ Ambiance nostalgique"
];
const CATCHPHRASES = [
    "On ne freine pas la légende.",
    "Ici, on avance ou on avance.",
    "Le calme avant la victoire.",
    "Toujours un coup d'avance.",
    "Discret mais inarrêtable.",
    "La classe ne s'explique pas, elle se constate.",
    "Objectif: tout, rien de moins.",
    "Le travail bat le talent quand le talent ne travaille pas."
];

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Génère un nombre pseudo-aléatoire stable pour une clé donnée (même sortie
// pour la même personne le même jour, plutôt qu'un résultat qui change à
// chaque appel — plus cohérent pour un "score du jour").
function seededPercent(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 101;
}

function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getMentionOrSelf({ msg, args, sender }) {
    const mentioned = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (mentioned && mentioned.length > 0) return mentioned[0];
    const quotedParticipant = msg?.message?.extendedTextMessage?.contextInfo?.participant;
    if (quotedParticipant) return quotedParticipant;
    return sender;
}

function fmtName(jid) {
    return jid ? jid.split('@')[0] : 'inconnu';
}

module.exports = {
    name: "fun-tools-3",
    category: "fun",
    description: "Commandes fun supplémentaires : actions, meters et générateurs",
    commands: [
        "slap", "hug", "kiss", "punch", "bite",
        "simprate", "iq", "luck", "rizz",
        "roastmyself", "namemeaning", "luckynumber",
        "mood", "powerlevel", "catchphrase"
    ],

    handler: async ({ msg, reply, args, command, sender, isGroup }) => {
        const actionTarget = () => {
            const mentioned = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            if (mentioned && mentioned.length > 0) return mentioned[0];
            const quotedParticipant = msg?.message?.extendedTextMessage?.contextInfo?.participant;
            if (quotedParticipant) return quotedParticipant;
            return null;
        };

        switch (command) {
            case "slap":
            case "hug":
            case "kiss":
            case "punch":
            case "bite": {
                const target = actionTarget();
                if (!target) return reply(`❗ *Mentionne ou réponds à quelqu'un.*\nEx: .${command} @membre`);
                const pool = { slap: SLAPS, hug: HUGS, kiss: KISSES, punch: PUNCHES, bite: BITES }[command];
                const emoji = { slap: "👋", hug: "🤗", kiss: "😘", punch: "👊", bite: "😬" }[command];
                return reply(`${emoji} *@${fmtName(sender)} ${pick(pool)} @${fmtName(target)} !*`, { mentions: [sender, target] });
            }

            case "simprate": {
                const target = actionTarget() || sender;
                const pct = seededPercent('simp' + target + todayKey());
                return reply(`💘 *@${fmtName(target)} est simp à ${pct}% aujourd'hui.*`, { mentions: [target] });
            }

            case "iq": {
                const target = actionTarget() || sender;
                const score = 60 + (seededPercent('iq' + target + todayKey()) % 91); // 60–150
                return reply(`🧠 *QI du jour de @${fmtName(target)} : ${score}*`, { mentions: [target] });
            }

            case "luck": {
                const target = actionTarget() || sender;
                const pct = seededPercent('luck' + target + todayKey());
                let verdict = pct >= 80 ? "Grosse chance aujourd'hui !" : pct >= 50 ? "Journée plutôt favorable." : pct >= 25 ? "Journée neutre, reste prudent(e)." : "Journée compliquée, évite les paris.";
                return reply(`🍀 *Chance du jour de @${fmtName(target)} : ${pct}%*\n${verdict}`, { mentions: [target] });
            }

            case "rizz": {
                const target = actionTarget() || sender;
                const pct = seededPercent('rizz' + target + todayKey());
                return reply(`😏 *Niveau de rizz de @${fmtName(target)} : ${pct}/100*`, { mentions: [target] });
            }

            case "roastmyself": {
                return reply(`🔥 *@${fmtName(sender)}* ${pick(ROASTS)}`, { mentions: [sender] });
            }

            case "namemeaning": {
                const name = args.join(' ').trim();
                if (!name) return reply("❗ *Donne un prénom.*\nEx: .namemeaning Alex");
                const traits = ["déterminé(e)", "créatif/créative", "loyal(e)", "mystérieux/mystérieuse", "énergique", "calme et posé(e)", "un brin chaotique", "né(e) leader"];
                const t = traits[seededPercent(name.toLowerCase()) % traits.length];
                return reply(`✨ *${name}* → selon la légende du bot, cette personne est *${t}*.\n(Purement pour le fun, évidemment 😄)`);
            }

            case "luckynumber": {
                const key = args.join(' ').trim() || sender;
                const num = seededPercent('num' + key + todayKey());
                return reply(`🔢 *Ton nombre chanceux du jour : ${num}*`);
            }

            case "mood": {
                return reply(`🎭 *Humeur du jour de @${fmtName(sender)} :* ${pick(MOODS)}`, { mentions: [sender] });
            }

            case "powerlevel": {
                const target = actionTarget() || sender;
                const level = (seededPercent('power' + target + todayKey()) + 1) * 9999;
                return reply(`⚡ *POWER LEVEL DE @${fmtName(target)} : ${level.toLocaleString('fr-FR')}...*\n💥 *C'EST PLUS DE 9000 !*`, { mentions: [target] });
            }

            case "catchphrase": {
                return reply(`🎙️ *"${pick(CATCHPHRASES)}"*`);
            }
        }
    }
};
