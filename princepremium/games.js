const TRIVIA = [
    { q: "Quelle est la capitale du Japon ?", options: ["Pékin", "Séoul", "Tokyo", "Bangkok"], answer: 2 },
    { q: "Combien de continents y a-t-il sur Terre ?", options: ["5", "6", "7", "8"], answer: 2 },
    { q: "Quelle planète est surnommée la planète rouge ?", options: ["Vénus", "Mars", "Jupiter", "Saturne"], answer: 1 },
    { q: "Qui a peint la Joconde ?", options: ["Picasso", "Van Gogh", "Léonard de Vinci", "Michel-Ange"], answer: 2 },
    { q: "Quel est l'animal terrestre le plus rapide ?", options: ["Lion", "Guépard", "Cheval", "Aigle"], answer: 1 },
    { q: "En quelle année a eu lieu la première Coupe du Monde de football ?", options: ["1930", "1950", "1966", "1920"], answer: 0 }
];

const SCRAMBLE_WORDS = ["ordinateur", "telephone", "voiture", "montagne", "elephant", "bibliotheque", "aeroport", "chocolat"];

function shuffle(word) {
    const letters = word.split('');
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    const scrambled = letters.join('');
    return scrambled === word ? shuffle(word) : scrambled;
}

module.exports = {
    name: "games",
    category: 7,
    description: "Mini-jeux : pierre-feuille-ciseaux, trivia, mot brouillé",
    commands: ["rps", "pfc", "trivia", "quiz", "scramble", "anagram"],

    handler: async ({ sock, msg, reply, args, command }) => {
        const chat = msg.key.remoteJid;

        switch (command) {
            case "rps":
            case "pfc": {
                const map = { pierre: 'pierre', feuille: 'feuille', ciseaux: 'ciseaux', rock: 'pierre', paper: 'feuille', scissors: 'ciseaux' };
                const userChoice = map[(args[0] || '').toLowerCase()];
                if (!userChoice) return reply("❗ *Choisis:* pierre, feuille ou ciseaux.\nEx: .pfc pierre");
                const choices = ['pierre', 'feuille', 'ciseaux'];
                const botChoice = choices[Math.floor(Math.random() * 3)];
                let result;
                if (userChoice === botChoice) result = "🤝 *Égalité !*";
                else if (
                    (userChoice === 'pierre' && botChoice === 'ciseaux') ||
                    (userChoice === 'feuille' && botChoice === 'pierre') ||
                    (userChoice === 'ciseaux' && botChoice === 'feuille')
                ) result = "🎉 *Tu as gagné !*";
                else result = "😢 *Tu as perdu !*";
                return reply(`✊✋✌️ *Toi:* ${userChoice} | *Moi:* ${botChoice}\n\n${result}`);
            }

            case "trivia":
            case "quiz": {
                const q = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
                const optionsText = q.options.map((o, i) => `${i + 1}. ${o}`).join('\n');
                const sent = await reply(`❓ *${q.q}*\n\n${optionsText}\n\n⏳ *Réponse dans 8 secondes...*`);
                setTimeout(async () => {
                    try {
                        await sock.sendMessage(chat, {
                            text: `❓ *${q.q}*\n\n${optionsText}\n\n✅ *Réponse: ${q.options[q.answer]}*`,
                            edit: sent.key
                        });
                    } catch (e) { /* édition impossible, on ignore */ }
                }, 8000);
                return;
            }

            case "scramble":
            case "anagram": {
                const word = SCRAMBLE_WORDS[Math.floor(Math.random() * SCRAMBLE_WORDS.length)];
                const scrambled = shuffle(word);
                const sent = await reply(`🔤 *Devine le mot:* ${scrambled.toUpperCase()}\n\n⏳ *Réponse dans 10 secondes...*`);
                setTimeout(async () => {
                    try {
                        await sock.sendMessage(chat, {
                            text: `🔤 *Devine le mot:* ${scrambled.toUpperCase()}\n\n✅ *Réponse: ${word}*`,
                            edit: sent.key
                        });
                    } catch (e) { /* édition impossible, on ignore */ }
                }, 10000);
                return;
            }
        }
    }
};
