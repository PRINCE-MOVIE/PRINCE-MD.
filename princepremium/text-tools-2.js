/**
 * text-tools-2.js — 20 commandes supplémentaires de texte & encodage
 * Toutes ces commandes sont 100% autonomes (aucune API externe), donc fiables.
 */

const MORSE_MAP = {
    a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.',
    h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.',
    o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-',
    v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
};
const MORSE_MAP_REV = Object.fromEntries(Object.entries(MORSE_MAP).map(([k, v]) => [v, k]));

const LEET_MAP = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', g: '9', b: '8' };
const LEET_MAP_REV = Object.fromEntries(Object.entries(LEET_MAP).map(([k, v]) => [v, k]));

const SMALLCAPS_MAP = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
    j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
    s: 'ꜱ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
};

const rot13 = (s) => s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
});

const toLeet = (s) => s.toLowerCase().split('').map(c => LEET_MAP[c] || c).join('');
const fromLeet = (s) => s.split('').map(c => LEET_MAP_REV[c] || c).join('');

const toMorse = (s) => s.toLowerCase().split('').map(c => c === ' ' ? '/' : (MORSE_MAP[c] || '')).filter(Boolean).join(' ');
const fromMorse = (s) => s.trim().split(' ').map(code => code === '/' ? ' ' : (MORSE_MAP_REV[code] || '')).join('');

const isPalindrome = (s) => {
    const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean.length > 0 && clean === clean.split('').reverse().join('');
};

const slugify = (s) => s.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

const shuffleStr = (s) => {
    const arr = s.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
};

module.exports = {
    name: "text-tools-2",
    category: 5,
    description: "Outils de texte et d'encodage supplémentaires",
    commands: [
        "rot13", "leet", "unleet", "morse", "unmorse",
        "urlencode", "urldecode", "htmlencode", "htmldecode",
        "palindrome", "anagramcheck", "wordcount", "charcount", "vowelcount",
        "shuffle", "capitalize", "titlecase", "slug", "repeat", "smallcaps"
    ],

    handler: async ({ reply, args, command }) => {
        const text = args.join(' ');
        const need = (usage) => reply(`❗ *Texte requis.*\nEx: ${usage}`);

        switch (command) {
            case "rot13": {
                if (!text) return need(".rot13 bonjour");
                return reply(`🔐 *ROT13:* ${rot13(text)}`);
            }
            case "leet": {
                if (!text) return need(".leet bonjour");
                return reply(`💾 *Leet:* ${toLeet(text)}`);
            }
            case "unleet": {
                if (!text) return need(".unleet b0nj0ur");
                return reply(`💾 *Texte:* ${fromLeet(text)}`);
            }
            case "morse": {
                if (!text) return need(".morse SOS");
                return reply(`📡 *Morse:* ${toMorse(text)}`);
            }
            case "unmorse": {
                if (!text) return need(".unmorse ... --- ...");
                return reply(`📡 *Texte:* ${fromMorse(text).toUpperCase()}`);
            }
            case "urlencode": {
                if (!text) return need(".urlencode https://ex.com/a b");
                return reply(`🔗 *Encodé:* ${encodeURIComponent(text)}`);
            }
            case "urldecode": {
                if (!text) return need(".urldecode https%3A%2F%2Fex.com");
                try {
                    return reply(`🔗 *Décodé:* ${decodeURIComponent(text)}`);
                } catch {
                    return reply("❌ *Chaîne encodée invalide.*");
                }
            }
            case "htmlencode": {
                if (!text) return need(".htmlencode <b>salut</b>");
                const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
                return reply(`🌐 *Encodé:* ${text.replace(/[&<>"']/g, c => map[c])}`);
            }
            case "htmldecode": {
                if (!text) return need(".htmldecode &lt;b&gt;salut&lt;/b&gt;");
                const map = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
                return reply(`🌐 *Décodé:* ${text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, m => map[m])}`);
            }
            case "palindrome": {
                if (!text) return need(".palindrome kayak");
                return reply(isPalindrome(text) ? "✅ *C'est un palindrome !*" : "❌ *Ce n'est pas un palindrome.*");
            }
            case "anagramcheck": {
                const parts = text.split(',').map(s => s.trim()).filter(Boolean);
                if (parts.length !== 2) return need(".anagramcheck chien, niche");
                const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '').split('').sort().join('');
                return reply(norm(parts[0]) === norm(parts[1]) ? "✅ *Ce sont des anagrammes !*" : "❌ *Ce ne sont pas des anagrammes.*");
            }
            case "wordcount": {
                if (!text) return need(".wordcount une phrase ici");
                const n = text.trim().split(/\s+/).filter(Boolean).length;
                return reply(`🔢 *Nombre de mots:* ${n}`);
            }
            case "charcount": {
                if (!text) return need(".charcount bonjour");
                return reply(`🔢 *Nombre de caractères:* ${text.length}`);
            }
            case "vowelcount": {
                if (!text) return need(".vowelcount bonjour");
                const n = (text.match(/[aeiouyAEIOUY]/g) || []).length;
                return reply(`🔢 *Nombre de voyelles:* ${n}`);
            }
            case "shuffle": {
                if (!text) return need(".shuffle bonjour");
                return reply(`🔀 *Résultat:* ${shuffleStr(text)}`);
            }
            case "capitalize": {
                if (!text) return need(".capitalize bonjour le monde");
                return reply(`🔠 *Résultat:* ${text.charAt(0).toUpperCase() + text.slice(1)}`);
            }
            case "titlecase": {
                if (!text) return need(".titlecase bonjour le monde");
                return reply(`🔠 *Résultat:* ${titleCase(text)}`);
            }
            case "slug": {
                if (!text) return need(".slug Mon Super Article !");
                return reply(`🔗 *Slug:* ${slugify(text)}`);
            }
            case "repeat": {
                const n = parseInt(args[0]);
                const rest = args.slice(1).join(' ');
                if (!n || !rest || n < 1 || n > 20) return need(".repeat 3 salut");
                return reply(Array(n).fill(rest).join(' '));
            }
            case "smallcaps": {
                if (!text) return need(".smallcaps bonjour");
                const out = text.toLowerCase().split('').map(c => SMALLCAPS_MAP[c] || c).join('');
                return reply(out);
            }
        }
    }
};
