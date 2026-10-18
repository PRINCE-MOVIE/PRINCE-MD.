const EIGHTBALL = [
    "Oui, certainement.", "C'est décidé.", "Sans aucun doute.", "Oui, absolument.",
    "Tu peux compter dessus.", "Selon moi, oui.", "Les perspectives sont bonnes.",
    "Réponse floue, retente.", "Redemande plus tard.", "Mieux vaut ne pas te le dire maintenant.",
    "Impossible de prédire pour le moment.", "Concentre-toi et redemande.",
    "N'y compte pas.", "Ma réponse est non.", "Mes sources disent non.",
    "Les perspectives ne sont pas si bonnes.", "Très douteux."
];

const JOKES = [
    "Pourquoi les plongeurs plongent-ils toujours en arrière et jamais en avant ? Parce que sinon ils tombent dans le bateau.",
    "Qu'est-ce qu'un crocodile qui surveille la Bourse ? Un Caïman-Trader.",
    "Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ? Un chat-mallow.",
    "Pourquoi les poissons détestent-ils jouer au tennis ? Parce qu'ils ont peur du filet.",
    "Quel est le comble pour un électricien ? De ne pas être au courant.",
    "Que dit un informaticien quand il s'ennuie ? Je Java le temps passer.",
    "Pourquoi le football c'est comique ? Parce que Ronaldo."
];

const FACTS = [
    "Le miel ne se périme jamais s'il est bien conservé.",
    "Les pieuvres ont trois cœurs.",
    "Un jour sur Vénus est plus long qu'une année sur Vénus.",
    "Les bananes sont des baies, mais pas les fraises.",
    "Le cœur d'une crevette se trouve dans sa tête.",
    "Il est impossible de se lécher le coude (pour la quasi-totalité des gens)."
];

const QUOTES = [
    "« Le succès, c'est se relever à chaque échec. » — Winston Churchill",
    "« Fais de ta vie un rêve, et d'un rêve, une réalité. » — Antoine de Saint-Exupéry",
    "« Le doute est le commencement de la sagesse. » — Aristote",
    "« On ne voit bien qu'avec le cœur. » — Antoine de Saint-Exupéry",
    "« La vie, c'est comme une bicyclette, il faut avancer pour ne pas perdre l'équilibre. » — Albert Einstein"
];

const COMPLIMENTS = [
    "Tu illumines cette conversation ✨",
    "Ton énergie est contagieuse aujourd'hui 🔥",
    "Tu as un excellent sens de l'humour 😄",
    "Tu es quelqu'un sur qui on peut compter 💪",
    "Ta créativité est impressionnante 🎨"
];

const TRUTHS = [
    "Quel est ton plus grand rêve ?",
    "Quelle est la chose la plus folle que tu aies faite ?",
    "Quel est ton plus grand regret ?",
    "Qui admires-tu le plus et pourquoi ?",
    "Quel est ton secret le mieux gardé (que tu peux partager) ?"
];

const DARES = [
    "Envoie un vocal en chantant.",
    "Écris ton prochain message uniquement en émojis.",
    "Complimente 3 personnes du groupe.",
    "Raconte ta blague préférée.",
    "Change ta photo de profil pour 10 minutes."
];

module.exports = {
    name: "fun-tools",
    category: 7,
    description: "Commandes de divertissement",
    commands: ["8ball", "dice", "de", "coinflip", "pf", "choose", "choix", "truth", "dare", "joke", "blague", "fact", "quote", "citation", "compliment", "rate"],

    handler: async ({ reply, args, command }) => {
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

        switch (command) {
            case "8ball": {
                const question = args.join(' ');
                if (!question) return reply("❗ *Pose une question.*\nEx: .8ball vais-je réussir mon examen ?");
                return reply(`🎱 *${pick(EIGHTBALL)}*`);
            }

            case "dice":
            case "de": {
                const roll = Math.floor(Math.random() * 6) + 1;
                return reply(`🎲 *Tu as fait ${roll} !*`);
            }

            case "coinflip":
            case "pf": {
                const result = Math.random() < 0.5 ? "Pile" : "Face";
                return reply(`🪙 *${result} !*`);
            }

            case "choose":
            case "choix": {
                const options = args.join(' ').split(',').map(o => o.trim()).filter(Boolean);
                if (options.length < 2) return reply("❗ *Donne au moins 2 choix séparés par des virgules.*\nEx: .choix pizza, sushi, burger");
                return reply(`🤔 *Je choisis:* ${pick(options)}`);
            }

            case "truth": {
                return reply(`💭 *Vérité:* ${pick(TRUTHS)}`);
            }

            case "dare": {
                return reply(`🔥 *Action:* ${pick(DARES)}`);
            }

            case "joke":
            case "blague": {
                return reply(`😂 ${pick(JOKES)}`);
            }

            case "fact": {
                return reply(`📚 *Le saviez-vous ?*\n${pick(FACTS)}`);
            }

            case "quote":
            case "citation": {
                return reply(`✨ ${pick(QUOTES)}`);
            }

            case "compliment": {
                return reply(`💖 ${pick(COMPLIMENTS)}`);
            }

            case "rate": {
                const thing = args.join(' ');
                if (!thing) return reply("❗ *Dis-moi quoi noter.*\nEx: .rate cette idée");
                const score = Math.floor(Math.random() * 11);
                return reply(`⭐ *"${thing}"* → ${score}/10`);
            }
        }
    }
};
