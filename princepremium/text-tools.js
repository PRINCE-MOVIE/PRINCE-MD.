module.exports = {
    name: "text-tools",
    category: 5,
    description: "Outils texte & utilitaires",
    commands: [
        "calc", "math", "reverse", "upper", "lower", "count",
        "base64encode", "b64e", "base64decode", "b64d",
        "hex", "unhex", "binary", "unbinary",
        "password", "genpass", "clock", "date", "lorem"
    ],

    handler: async ({ reply, args, command }) => {
        const text = args.join(' ');

        switch (command) {
            case "calc":
            case "math": {
                if (!text) return reply("❗ *Donne une expression.*\nEx: .calc 12*(3+4)");
                if (!/^[0-9+\-*/().\s%]+$/.test(text)) {
                    return reply("❌ *Expression invalide — chiffres et opérateurs uniquement (+ - * / % ( )).*");
                }
                try {
                    const result = Function(`"use strict"; return (${text})`)();
                    return reply(`🧮 *Résultat:* ${result}`);
                } catch (e) {
                    return reply("❌ *Expression invalide.*");
                }
            }

            case "reverse": {
                if (!text) return reply("❗ *Donne un texte à inverser.*");
                return reply(`🔄 ${text.split('').reverse().join('')}`);
            }

            case "upper": {
                if (!text) return reply("❗ *Donne un texte.*");
                return reply(text.toUpperCase());
            }

            case "lower": {
                if (!text) return reply("❗ *Donne un texte.*");
                return reply(text.toLowerCase());
            }

            case "count": {
                if (!text) return reply("❗ *Donne un texte à compter.*");
                const words = text.trim().split(/\s+/).length;
                return reply(`📊 *${text.length} caractères, ${words} mot(s).*`);
            }

            case "base64encode":
            case "b64e": {
                if (!text) return reply("❗ *Donne un texte à encoder.*");
                return reply(`🔐 ${Buffer.from(text, 'utf-8').toString('base64')}`);
            }

            case "base64decode":
            case "b64d": {
                if (!text) return reply("❗ *Donne un texte base64 à décoder.*");
                try {
                    return reply(`🔓 ${Buffer.from(text, 'base64').toString('utf-8')}`);
                } catch (e) {
                    return reply("❌ *Texte base64 invalide.*");
                }
            }

            case "hex": {
                if (!text) return reply("❗ *Donne un texte à convertir.*");
                return reply(`🔢 ${Buffer.from(text, 'utf-8').toString('hex')}`);
            }

            case "unhex": {
                if (!text) return reply("❗ *Donne un texte hexadécimal.*");
                try {
                    return reply(`🔤 ${Buffer.from(text, 'hex').toString('utf-8')}`);
                } catch (e) {
                    return reply("❌ *Texte hexadécimal invalide.*");
                }
            }

            case "binary": {
                if (!text) return reply("❗ *Donne un texte à convertir.*");
                const bin = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
                return reply(`0️⃣1️⃣ ${bin}`);
            }

            case "unbinary": {
                if (!text) return reply("❗ *Donne un binaire (séparé par des espaces).*");
                try {
                    const str = text.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
                    return reply(`🔤 ${str}`);
                } catch (e) {
                    return reply("❌ *Binaire invalide.*");
                }
            }

            case "password":
            case "genpass": {
                const length = Math.min(Math.max(parseInt(args[0]) || 12, 6), 32);
                const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
                let pass = '';
                for (let i = 0; i < length; i++) pass += chars[Math.floor(Math.random() * chars.length)];
                return reply(`🔑 *Mot de passe généré:*\n${pass}`);
            }

            case "clock":
            case "date": {
                const now = new Date();
                return reply(`🕒 ${now.toLocaleString('fr-FR', { timeZone: 'Africa/Lagos' })}`);
            }

            case "lorem": {
                const count = Math.min(Math.max(parseInt(args[0]) || 20, 5), 100);
                const words = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua".split(' ');
                let result = [];
                for (let i = 0; i < count; i++) result.push(words[i % words.length]);
                return reply(result.join(' ') + '.');
            }
        }
    }
};
