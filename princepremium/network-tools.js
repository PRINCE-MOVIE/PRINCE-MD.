const axios = require('axios');
let yts;
try { yts = require('yt-search'); } catch (e) { yts = null; }

module.exports = {
    name: "network-tools",
    category: 7,
    description: "Recherche YouTube, dictionnaire, conversion de devises",
    commands: ["ytsearch", "yts", "define", "dict", "currency", "conv"],

    handler: async ({ reply, args, command }) => {
        switch (command) {
            case "ytsearch":
            case "yts": {
                const query = args.join(' ');
                if (!query) return reply("❗ *Donne un mot-clé à rechercher.*\nEx: .yts prince md tutorial");
                if (!yts) return reply("❌ *Module de recherche YouTube indisponible.*");
                try {
                    const { videos } = await yts(query);
                    if (!videos || !videos.length) return reply("❌ *Aucun résultat trouvé.*");
                    const top = videos.slice(0, 5);
                    let text = `🔎 *Résultats YouTube pour "${query}":*\n\n`;
                    top.forEach((v, i) => {
                        text += `*${i + 1}. ${v.title}*\n⏱️ ${v.timestamp} — 👁️ ${v.views}\n🔗 ${v.url}\n\n`;
                    });
                    return reply(text.trim());
                } catch (e) {
                    return reply("❌ *Recherche impossible pour le moment.*");
                }
            }

            case "define":
            case "dict": {
                const word = args[0];
                if (!word) return reply("❗ *Donne un mot (en anglais).*\nEx: .define hello");
                try {
                    const { data } = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { timeout: 10000 });
                    const entry = data[0];
                    const meaning = entry.meanings?.[0];
                    const def = meaning?.definitions?.[0]?.definition;
                    if (!def) return reply("❌ *Aucune définition trouvée.*");
                    let text = `📖 *${entry.word}* _(${meaning.partOfSpeech || ''})_\n\n${def}`;
                    if (meaning.definitions[0].example) text += `\n\n💬 _"${meaning.definitions[0].example}"_`;
                    return reply(text);
                } catch (e) {
                    return reply("❌ *Mot introuvable (dictionnaire en anglais uniquement).*");
                }
            }

            case "currency":
            case "conv": {
                if (args.length < 3) return reply("❗ *Format:* .conv MONTANT DEVISE_DEPART DEVISE_ARRIVEE\nEx: .conv 100 USD EUR");
                const amount = parseFloat(args[0]);
                const from = args[1].toUpperCase();
                const to = args[2].toUpperCase();
                if (isNaN(amount)) return reply("❌ *Montant invalide.*");
                try {
                    const { data } = await axios.get(`https://open.er-api.com/v6/latest/${from}`, { timeout: 10000 });
                    const rate = data?.rates?.[to];
                    if (!rate) return reply("❌ *Devise non trouvée.*");
                    const result = (amount * rate).toFixed(2);
                    return reply(`💱 *${amount} ${from} = ${result} ${to}*`);
                } catch (e) {
                    return reply("❌ *Service de conversion indisponible pour le moment.*");
                }
            }
        }
    }
};
