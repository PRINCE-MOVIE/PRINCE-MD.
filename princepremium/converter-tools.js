/**
 * converter-tools.js — 15 convertisseurs d'unités & de bases (100% autonomes)
 */

module.exports = {
    name: "converter-tools",
    category: 5,
    description: "Convertisseurs d'unités, de devises simples et de bases numériques",
    commands: [
        "cm2ft", "ft2cm", "kg2lb", "lb2kg", "c2f", "f2c",
        "km2mi", "mi2km", "bin2dec", "dec2bin", "hex2dec", "dec2hex",
        "oct2dec", "dec2oct", "temp"
    ],

    handler: async ({ reply, args, command }) => {
        const num = (i = 0) => parseFloat(args[i]);
        const need = (usage) => reply(`❗ *Usage:* ${usage}`);

        switch (command) {
            case "cm2ft": {
                const v = num();
                if (isNaN(v)) return need(".cm2ft 180");
                return reply(`📏 *${v} cm =* ${(v / 30.48).toFixed(2)} ft`);
            }
            case "ft2cm": {
                const v = num();
                if (isNaN(v)) return need(".ft2cm 6");
                return reply(`📏 *${v} ft =* ${(v * 30.48).toFixed(2)} cm`);
            }
            case "kg2lb": {
                const v = num();
                if (isNaN(v)) return need(".kg2lb 70");
                return reply(`⚖️ *${v} kg =* ${(v * 2.20462).toFixed(2)} lb`);
            }
            case "lb2kg": {
                const v = num();
                if (isNaN(v)) return need(".lb2kg 150");
                return reply(`⚖️ *${v} lb =* ${(v / 2.20462).toFixed(2)} kg`);
            }
            case "c2f": {
                const v = num();
                if (isNaN(v)) return need(".c2f 25");
                return reply(`🌡️ *${v}°C =* ${(v * 9 / 5 + 32).toFixed(1)}°F`);
            }
            case "f2c": {
                const v = num();
                if (isNaN(v)) return need(".f2c 77");
                return reply(`🌡️ *${v}°F =* ${((v - 32) * 5 / 9).toFixed(1)}°C`);
            }
            case "temp": {
                const v = num(0);
                const unit = (args[1] || '').toLowerCase();
                if (isNaN(v) || !['c', 'f', 'k'].includes(unit)) return need(".temp 25 c  (convertit vers les 2 autres unités)");
                let c;
                if (unit === 'c') c = v;
                else if (unit === 'f') c = (v - 32) * 5 / 9;
                else c = v - 273.15;
                const f = c * 9 / 5 + 32;
                const k = c + 273.15;
                return reply(`🌡️ *${v}°${unit.toUpperCase()} =*\n${c.toFixed(1)}°C | ${f.toFixed(1)}°F | ${k.toFixed(1)}K`);
            }
            case "km2mi": {
                const v = num();
                if (isNaN(v)) return need(".km2mi 100");
                return reply(`🛣️ *${v} km =* ${(v * 0.621371).toFixed(2)} mi`);
            }
            case "mi2km": {
                const v = num();
                if (isNaN(v)) return need(".mi2km 60");
                return reply(`🛣️ *${v} mi =* ${(v / 0.621371).toFixed(2)} km`);
            }
            case "bin2dec": {
                const v = args[0];
                if (!v || !/^[01]+$/.test(v)) return need(".bin2dec 101010");
                return reply(`🔢 *Décimal:* ${parseInt(v, 2)}`);
            }
            case "dec2bin": {
                const v = parseInt(args[0]);
                if (isNaN(v) || v < 0) return need(".dec2bin 42");
                return reply(`🔢 *Binaire:* ${v.toString(2)}`);
            }
            case "hex2dec": {
                const v = (args[0] || '').replace(/^0x/i, '');
                if (!v || !/^[0-9a-fA-F]+$/.test(v)) return need(".hex2dec 2A");
                return reply(`🔢 *Décimal:* ${parseInt(v, 16)}`);
            }
            case "dec2hex": {
                const v = parseInt(args[0]);
                if (isNaN(v) || v < 0) return need(".dec2hex 42");
                return reply(`🔢 *Hexadécimal:* ${v.toString(16).toUpperCase()}`);
            }
            case "oct2dec": {
                const v = args[0];
                if (!v || !/^[0-7]+$/.test(v)) return need(".oct2dec 52");
                return reply(`🔢 *Décimal:* ${parseInt(v, 8)}`);
            }
            case "dec2oct": {
                const v = parseInt(args[0]);
                if (isNaN(v) || v < 0) return need(".dec2oct 42");
                return reply(`🔢 *Octal:* ${v.toString(8)}`);
            }
        }
    }
};
