/**
 * fun-tools-2.js — 20 commandes de divertissement supplémentaires (100% autonomes)
 */

const WYR = [
    "avoir le pouvoir de voler ou d'être invisible ?",
    "vivre sans musique ou sans films ?",
    "parler toutes les langues ou jouer de tous les instruments ?",
    "être toujours en retard ou toujours trop en avance ?",
    "avoir la télépathie ou la téléportation ?",
    "manger seulement du sucré ou seulement du salé pour toujours ?",
    "vivre 200 ans ou être riche toute ta vie ?",
    "ne plus jamais dormir ou ne plus jamais manger ?"
];

const RIDDLES = [
    { q: "Je n'ai pas de voix mais je te parle. Qui suis-je ?", a: "Un livre" },
    { q: "Plus j'ai chaud, plus je grandis. Qui suis-je ?", a: "Le feu" },
    { q: "Je tombe sans jamais me faire mal. Qui suis-je ?", a: "La pluie / la nuit" },
    { q: "On me casse avant de m'utiliser. Qui suis-je ?", a: "Un œuf" },
    { q: "J'ai des dents mais je ne mords pas. Qui suis-je ?", a: "Un peigne" }
];

const TWISTERS = [
    "Un chasseur sachant chasser doit savoir chasser sans son chien.",
    "Les chaussettes de l'archiduchesse sont-elles sèches, archi-sèches ?",
    "Ces cyprès sont si loin que je ne sais si c'en sont.",
    "Si six scies scient six cyprès, six cent six scies scient six cent six cyprès."
];

const ROASTS = [
    "Toi t'es tellement lent que ta connexion internet doit attendre après toi 😂",
    "T'as l'air de quelqu'un qui met le papier toilette dans le mauvais sens 😅",
    "T'es tellement occupé que même le WiFi te fuit.",
    "T'as raté ton audition pour devenir sérieux dans la vie.",
    "T'es le genre de personne à dire 'j'arrive' 20 minutes avant même de se doucher."
];

const FORTUNES = [
    "Une bonne surprise t'attend cette semaine.",
    "Fais confiance à ton instinct aujourd'hui.",
    "Un ancien ami va bientôt te contacter.",
    "Ton travail acharné va bientôt payer.",
    "Prends le temps de te reposer, tu le mérites.",
    "Une opportunité inattendue va se présenter."
];

const HOROSCOPES = {
    bélier: "Énergie débordante aujourd'hui, canalise-la bien !",
    taureau: "Un moment de calme te fera le plus grand bien.",
    gémeaux: "Communication au top, profites-en pour discuter d'un projet.",
    cancer: "Prends soin de tes proches, ça te reviendra.",
    lion: "Ton charisme attire l'attention, utilise-le à bon escient.",
    vierge: "L'organisation sera ta meilleure alliée aujourd'hui.",
    balance: "Cherche l'équilibre entre travail et détente.",
    scorpion: "Une décision importante approche, fais confiance à ton jugement.",
    sagittaire: "L'aventure t'appelle, ose sortir de ta zone de confort.",
    capricorne: "Ta discipline paiera bientôt, reste concentré.",
    verseau: "Une idée originale pourrait changer ton quotidien.",
    poissons: "Écoute ton intuition, elle ne te trompe pas aujourd'hui."
};

const NICKNAMES = ["Le Boss", "Capitaine Chaos", "Roi/Reine du Débat", "Maître Zen", "Le Stratège", "L'Éclair", "Le Sage", "Le Rigolo Officiel"];

const CAT_FACTS = [
    "Un chat passe environ 70% de sa vie à dormir.",
    "Les chats ont 32 muscles dans chaque oreille.",
    "Un chat ne peut pas goûter le sucré.",
    "Les empreintes nasales des chats sont uniques, comme nos empreintes digitales."
];

const DOG_FACTS = [
    "Les chiens peuvent sentir la peur grâce aux hormones que nous dégageons.",
    "L'odorat d'un chien est environ 40 fois plus puissant que celui d'un humain.",
    "Les chiens rêvent, tout comme les humains.",
    "Le Basenji est une race de chien qui ne peut pas aboyer."
];

const SPACE_FACTS = [
    "Un jour sur Vénus est plus long qu'une année sur Vénus.",
    "Il y a plus d'étoiles dans l'univers que de grains de sable sur Terre.",
    "Le Soleil représente environ 99,8% de la masse du système solaire.",
    "L'espace n'est pas complètement silencieux, il existe des ondes sonores dans certains gaz."
];

const TAROT_CARDS = ["Le Bateleur", "L'Impératrice", "La Roue de Fortune", "La Force", "L'Étoile", "Le Soleil", "Le Monde", "La Justice", "L'Amoureux", "Le Mat"];

module.exports = {
    name: "fun-tools-2",
    category: 7,
    description: "Commandes de divertissement supplémentaires",
    commands: [
        "wyr", "riddle", "twister", "ship", "roast", "fortune", "horoscope",
        "zodiac", "nickname", "fbi", "wouldurather2", "tarot", "flip3x",
        "numerology", "emojiart", "reverse2", "typing", "catfact", "dogfact", "spacefact"
    ],

    handler: async ({ reply, args, command }) => {
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

        switch (command) {
            case "wyr":
            case "wouldurather2": {
                return reply(`🤔 *Tu préfères...* ${pick(WYR)}`);
            }
            case "riddle": {
                const r = pick(RIDDLES);
                return reply(`🧩 *Devinette:* ${r.q}\n\n_Réponds avec .riddle à nouveau pour une autre, ou réfléchis bien !_\n\n||Réponse : ${r.a}||`);
            }
            case "twister": {
                return reply(`👅 *Virelangue:* ${pick(TWISTERS)}`);
            }
            case "ship": {
                if (args.length < 2) return reply("❗ *Usage:* .ship <nom1> <nom2>\nEx: .ship Marie Paul");
                const pct = Math.floor(Math.random() * 101);
                const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
                return reply(`💞 *${args[0]} + ${args[1]}*\n[${bar}] ${pct}%`);
            }
            case "roast": {
                return reply(`🔥 ${pick(ROASTS)}`);
            }
            case "fortune": {
                return reply(`🔮 *Ta prédiction:* ${pick(FORTUNES)}`);
            }
            case "horoscope":
            case "zodiac": {
                const sign = (args[0] || '').toLowerCase();
                if (!HOROSCOPES[sign]) {
                    return reply(`❗ *Signe invalide.* Choisis parmi:\n${Object.keys(HOROSCOPES).join(', ')}`);
                }
                return reply(`✨ *${sign.charAt(0).toUpperCase() + sign.slice(1)}:* ${HOROSCOPES[sign]}`);
            }
            case "nickname": {
                const name = args.join(' ') || 'Toi';
                return reply(`🏷️ *${name}* → *${pick(NICKNAMES)}*`);
            }
            case "fbi": {
                return reply("🚨 *FBI OPEN UP!* 🚨\nOn a repéré une activité suspecte... juste pour rire 😂");
            }
            case "tarot": {
                return reply(`🃏 *Ta carte du jour:* ${pick(TAROT_CARDS)}`);
            }
            case "flip3x": {
                const results = Array.from({ length: 3 }, () => Math.random() < 0.5 ? "Pile" : "Face");
                return reply(`🪙 *Résultats:* ${results.join(', ')}`);
            }
            case "numerology": {
                const name = args.join('');
                if (!name) return reply("❗ *Usage:* .numerology <nom>\nEx: .numerology Marie");
                const sum = name.toLowerCase().split('').reduce((a, c) => a + (c.charCodeAt(0) - 96 > 0 && c.charCodeAt(0) - 96 <= 26 ? c.charCodeAt(0) - 96 : 0), 0);
                let n = sum;
                while (n > 9) n = String(n).split('').reduce((a, d) => a + parseInt(d), 0);
                return reply(`🔮 *Nombre numérologique de "${args.join(' ')}":* ${n}`);
            }
            case "emojiart": {
                const arts = ["( ͡° ͜ʖ ͡°)", "(╯°□°）╯︵ ┻━┻", "ʕ•ᴥ•ʔ", "(づ｡◕‿‿◕｡)づ", "(ノ°Д°)ノ︵ ┻━┻", "◕‿◕"];
                return reply(pick(arts));
            }
            case "reverse2": {
                const text = args.join(' ');
                if (!text) return reply("❗ *Usage:* .reverse2 <texte>\nEx: .reverse2 bonjour");
                return reply(`🔁 ${text.split('').reverse().join('')}`);
            }
            case "typing": {
                const wpm = Math.floor(Math.random() * 60) + 30;
                return reply(`⌨️ *Vitesse de frappe simulée:* ${wpm} mots/min`);
            }
            case "catfact": {
                return reply(`🐱 ${pick(CAT_FACTS)}`);
            }
            case "dogfact": {
                return reply(`🐶 ${pick(DOG_FACTS)}`);
            }
            case "spacefact": {
                return reply(`🚀 ${pick(SPACE_FACTS)}`);
            }
        }
    }
};
