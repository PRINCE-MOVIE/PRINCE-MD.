/**
 * math-tools.js — 15 commandes de maths & calculs (100% autonomes)
 */

function isPrimeNum(n) {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
    return true;
}

function factorial(n) {
    let r = 1n;
    for (let i = 2n; i <= BigInt(n); i++) r *= i;
    return r;
}

function fibSeq(n) {
    const seq = [0, 1];
    while (seq.length < n) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
    return seq.slice(0, n);
}

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }

function toRoman(num) {
    const map = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
    let res = '';
    for (const [val, sym] of map) while (num >= val) { res += sym; num -= val; }
    return res;
}

function fromRoman(str) {
    const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    str = str.toUpperCase();
    let res = 0;
    for (let i = 0; i < str.length; i++) {
        const cur = map[str[i]], next = map[str[i + 1]];
        if (!cur) return null;
        if (next && cur < next) res -= cur; else res += cur;
    }
    return res;
}

module.exports = {
    name: "math-tools",
    category: 5,
    description: "Calculatrices & outils mathématiques",
    commands: [
        "isprime", "factorial", "fibonacci", "gcd", "lcm", "percent",
        "bmi", "age", "roman", "unroman", "sqrt", "power", "average", "sum", "randnum"
    ],

    handler: async ({ reply, args, command }) => {
        switch (command) {
            case "isprime": {
                const n = parseInt(args[0]);
                if (isNaN(n)) return reply("❗ *Donne un nombre entier.*\nEx: .isprime 17");
                return reply(isPrimeNum(n) ? `✅ *${n} est un nombre premier.*` : `❌ *${n} n'est pas premier.*`);
            }
            case "factorial": {
                const n = parseInt(args[0]);
                if (isNaN(n) || n < 0 || n > 500) return reply("❗ *Donne un entier entre 0 et 500.*\nEx: .factorial 10");
                return reply(`🧮 *${n}! =* ${factorial(n).toString()}`);
            }
            case "fibonacci": {
                const n = parseInt(args[0]);
                if (isNaN(n) || n < 1 || n > 50) return reply("❗ *Donne un entier entre 1 et 50.*\nEx: .fibonacci 10");
                return reply(`🔢 *Suite de Fibonacci:* ${fibSeq(n).join(', ')}`);
            }
            case "gcd": {
                const a = parseInt(args[0]), b = parseInt(args[1]);
                if (isNaN(a) || isNaN(b)) return reply("❗ *Donne deux nombres.*\nEx: .gcd 24 36");
                return reply(`🧮 *PGCD:* ${gcd(a, b)}`);
            }
            case "lcm": {
                const a = parseInt(args[0]), b = parseInt(args[1]);
                if (isNaN(a) || isNaN(b)) return reply("❗ *Donne deux nombres.*\nEx: .lcm 4 6");
                return reply(`🧮 *PPCM:* ${lcm(a, b)}`);
            }
            case "percent": {
                const a = parseFloat(args[0]), b = parseFloat(args[1]);
                if (isNaN(a) || isNaN(b)) return reply("❗ *Usage:* .percent <valeur> <total>\nEx: .percent 25 200");
                return reply(`📊 *Résultat:* ${((a / b) * 100).toFixed(2)}%`);
            }
            case "bmi": {
                const kg = parseFloat(args[0]), cm = parseFloat(args[1]);
                if (isNaN(kg) || isNaN(cm)) return reply("❗ *Usage:* .bmi <poids_kg> <taille_cm>\nEx: .bmi 70 175");
                const m = cm / 100;
                const bmi = kg / (m * m);
                let cat = bmi < 18.5 ? "Insuffisance pondérale" : bmi < 25 ? "Poids normal" : bmi < 30 ? "Surpoids" : "Obésité";
                return reply(`⚖️ *IMC:* ${bmi.toFixed(1)} (${cat})`);
            }
            case "age": {
                const parts = (args[0] || '').split(/[\/\-]/);
                if (parts.length !== 3) return reply("❗ *Usage:* .age JJ/MM/AAAA\nEx: .age 15/06/2000");
                const [d, mo, y] = parts.map(Number);
                const birth = new Date(y, mo - 1, d);
                if (isNaN(birth.getTime())) return reply("❌ *Date invalide.*");
                const now = new Date();
                let age = now.getFullYear() - birth.getFullYear();
                const m = now.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                return reply(`🎂 *Âge:* ${age} ans`);
            }
            case "roman": {
                const n = parseInt(args[0]);
                if (isNaN(n) || n < 1 || n > 3999) return reply("❗ *Donne un entier entre 1 et 3999.*\nEx: .roman 2024");
                return reply(`🏛️ *Chiffre romain:* ${toRoman(n)}`);
            }
            case "unroman": {
                const s = (args[0] || '').trim();
                if (!s) return reply("❗ *Donne un chiffre romain.*\nEx: .unroman MMXXIV");
                const val = fromRoman(s);
                if (val === null) return reply("❌ *Chiffre romain invalide.*");
                return reply(`🏛️ *Valeur:* ${val}`);
            }
            case "sqrt": {
                const n = parseFloat(args[0]);
                if (isNaN(n) || n < 0) return reply("❗ *Donne un nombre positif.*\nEx: .sqrt 144");
                return reply(`🧮 *Racine carrée:* ${Math.sqrt(n)}`);
            }
            case "power": {
                const a = parseFloat(args[0]), b = parseFloat(args[1]);
                if (isNaN(a) || isNaN(b)) return reply("❗ *Usage:* .power <base> <exposant>\nEx: .power 2 10");
                return reply(`🧮 *Résultat:* ${Math.pow(a, b)}`);
            }
            case "average": {
                const nums = args.map(Number).filter(n => !isNaN(n));
                if (!nums.length) return reply("❗ *Donne des nombres séparés par des espaces.*\nEx: .average 4 8 15 16 23");
                const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
                return reply(`📊 *Moyenne:* ${avg.toFixed(2)}`);
            }
            case "sum": {
                const nums = args.map(Number).filter(n => !isNaN(n));
                if (!nums.length) return reply("❗ *Donne des nombres séparés par des espaces.*\nEx: .sum 4 8 15 16 23");
                return reply(`➕ *Somme:* ${nums.reduce((a, b) => a + b, 0)}`);
            }
            case "randnum": {
                const min = parseInt(args[0]) || 1, max = parseInt(args[1]) || 100;
                if (min >= max) return reply("❗ *Usage:* .randnum <min> <max>\nEx: .randnum 1 100");
                return reply(`🎲 *Nombre aléatoire:* ${Math.floor(Math.random() * (max - min + 1)) + min}`);
            }
        }
    }
};
