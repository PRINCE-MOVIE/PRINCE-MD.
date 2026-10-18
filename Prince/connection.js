const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const {
    exec
} = require('child_process');
const { sms } = require("./msg");
const router = express.Router();
const pino = require('pino');
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const Jimp = require('jimp');
const crypto = require('crypto');
const axios = require('axios');
const yts = require('yt-search');
const { ytmp3, ytmp4 } = require('sadaslk-dlcore');
const os = require('os');
const fecth = require('node-fetch');
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
ffmpeg.setFfmpegPath(ffmpegPath);
const antiDeletePlugin = require('../princepremium/antidelete');
const emojiDlPlugin = require('../princepremium/emoji_dl');
const onceDlPlugin = require('../princepremium/once_dl');
const antilinkPlugin = require('../princepremium/antilink');
const welcomePlugin = require('../princepremium/welcome');
const groupGuardPlugin = require('../princepremium/group-guard');
const cmd = require('./cmd');
const Group = require('./group');
  const images = [
  'https://files.catbox.moe/ne8vy5.png',
  'https://files.catbox.moe/ne8vy5.png'
];

Object.defineProperty(global, 'akira', {
    get: () => images[Math.floor(Math.random() * images.length)]
});

const {
    default: makeWASocket,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    DisconnectReason,
    downloadMediaMessage,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    fetchLatestBaileysVersion, 
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    extractMessageContent, 
    jidDecode,
    MessageRetryMap,
    jidNormalizedUser, 
    proto,
    getContentType,
    areJidsSameUser,
    generateWAMessage, 
    delay, 
    Browsers
} = require("baileys");

const MEDIA_TYPES = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'];

const config = {
    AUTO_VIEW_STATUS: 'false',
    AUTO_LIKE_STATUS: 'false',
	BUTTON_MODE: 'true',
    MODE: 'public',
    PREFIX: '.',
    MAX_RETRIES: 3,
    ADMIN_LIST_PATH: './admin.json',
    AKIRA_IMG: 'https://i.postimg.cc/4xXj3T8R/file-00000000f890820e9ec3d21792b1cc8b.png',
    NEWSLETTER_JID: process.env.NEWSLETTER_JID || '120363410956242470@newsletter',
    NEWSLETTER_LIST: process.env.NEWSLETTER_JID
        ? [process.env.NEWSLETTER_JID, '120363421591325947@newsletter']
        : ['120363410956242470@newsletter', '120363421591325947@newsletter'],
    NEWSLETTER_MESSAGE_ID: '428',
    OTP_EXPIRY: 300000,
    OWNER_NUMBER: process.env.OWNER_NUMBER || '+243860885022',
    CHANNEL_LINK: process.env.CHANNEL_LINK || 'https://whatsapp.com/channel/0029Vb8KrLcJpe8piGeSfH0i'
};

if (!global.sadewVideoSearch) global.sadewVideoSearch = {};
if (!global.sadewMenuTracker) global.sadewMenuTracker = {};

const activeSockets = new Map();
const socketCreationTime = new Map();
const socketHandlersMap = new Map();
// Les clés Signal (session-*.json, sender-key-*.json...) changent en dehors de
// l'évènement 'creds.update' (à chaque message envoyé/reçu). Sans cette
// synchronisation périodique, seule creds.json aurait été sauvegardée en
// continu et les clés de session seraient reperdues au prochain redémarrage.
const sessionSyncIntervals = new Map();
const SESSION_BASE_PATH = './session';
// Minuteurs d'expiration des tentatives de pairing (un par numéro)
const pairingTimers = new Map();
const PAIRING_TIMEOUT = 3 * 60 * 1000;

// ATTENTION : Baileys remplit creds.me DÈS la demande du code (requestPairingCode),
// donc creds.me ne prouve rien. creds.account (identité signée par WhatsApp)
// n'existe qu'une fois le code réellement validé sur le téléphone.
function credsArePaired(c) {
    return !!(c && (c.registered || c.account));
}
function isPaired(sock) {
    return credsArePaired(sock?.authState?.creds);
}
function localSessionPaired(sessionPath) {
    try {
        const f = path.join(sessionPath, 'creds.json');
        if (!fs.existsSync(f)) return false;
        return credsArePaired(JSON.parse(fs.readFileSync(f, 'utf8')));
    } catch {
        return false;
    }
}
const NUMBER_LIST_PATH = './numbers.json';

const SessionSchema = new mongoose.Schema({
    number: {
        type: String,
        unique: true,
        required: true
    },
    creds: {
        type: Object,
        required: true
    },
    // Contient TOUS les fichiers du dossier de session (creds.json + les clés
    // Signal : session-*.json, sender-key-*.json, pre-key-*.json,
    // app-state-sync-key-*.json...). Avant ce correctif, seul creds.json était
    // sauvegardé/restauré : sur un hébergeur au disque éphémère comme Railway,
    // chaque redémarrage effaçait les clés de session Signal alors que l'autre
    // bout (WhatsApp/le téléphone) continuait d'utiliser l'ancien état du
    // "ratchet". Résultat : dès qu'un message arrivait avec l'ancien état,
    // le déchiffrement échouait avec "Bad MAC Error", en boucle.
    files: {
        type: Object,
        default: {}
    },
    config: {
        type: Object
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Session = mongoose.model('SessionNew', SessionSchema); 

async function connectMongoDB() {
    try {
        
const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('MONGODB_URI is not set. Add it to your .env file.');
            process.exit(1);
        }
        await mongoose.connect(mongoUri, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000 
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
}
(async () => {
    await connectMongoDB();
    // BUG TROUVÉ : cette fonction existait déjà dans le code mais n'était
    // jamais appelée nulle part. Résultat : après CHAQUE redémarrage du
    // process (redeploy Railway, crash géré par uncaughtException, etc.),
    // aucune session WhatsApp n'était reconnectée automatiquement — le bot
    // restait complètement hors ligne tant que personne ne repassait
    // manuellement par la page de pairing. C'est une cause directe et
    // fréquente de "le bot ne répond plus" après un déploiement.
    await autoReconnectOnStartup();
})();

if (!fs.existsSync(SESSION_BASE_PATH)) {
    fs.mkdirSync(SESSION_BASE_PATH, {
        recursive: true
    });
}

function initialize() {
    activeSockets.clear();
    socketCreationTime.clear();
    console.log('Cleared active sockets and creation times on startup');
}

async function uploadToCatbox(stream, fileName) {
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', stream, fileName);

        const res = await axios.post(
            'https://catbox.moe/user/api.php',
            form,
            { headers: form.getHeaders(), timeout: 0 }
        );

        if (!res.data.startsWith('https://')) return null;
        return res.data.trim();
    } catch {
        return null;
    }
}

async function saveMediaToCatbox(msg) {
    try {
        const type = Object.keys(msg.message)[0];
        const mediaMap = {
            imageMessage: 'image',
            videoMessage: 'video',
            audioMessage: 'audio',
            documentMessage: 'document'
        };

        if (!mediaMap[type]) return null;

        const mediaMsg = msg.message[type];
        const size = mediaMsg.fileLength || 0;
        
        if (size > 100 * 1024 * 1024) return null;

        const stream = await downloadContentFromMessage(
            mediaMsg,
            mediaMap[type]
        );

        const ext =
            type === 'imageMessage' ? 'jpg' :
            type === 'videoMessage' ? 'mp4' :
            type === 'audioMessage' ? 'opus' :
            'bin';

        return await uploadToCatbox(stream, `${msg.key.id}.${ext}`);
    } catch {
        return null;
    }
}


async function cleanupInactiveSessions() {
    try {
        const sessions = await Session.find({}, 'number').lean();
        let cleanedCount = 0;

        for (const {
                number
            }
            of sessions) {
            const sanitizedNumber = number.replace(/[^0-9]/g, '');

            if (!activeSockets.has(sanitizedNumber) && !socketCreationTime.has(sanitizedNumber)) {
                const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);

                if (fs.existsSync(sessionPath)) {
                    const stats = fs.statSync(sessionPath);
                    const timeSinceModified = Date.now() - stats.mtime.getTime();

                    if (timeSinceModified > 60 * 60 * 1000) {
                        console.log(`Cleaning up stale session: ${sanitizedNumber}`);
                        fs.removeSync(sessionPath);
                        cleanedCount++;
                    }
                }
            }
        }

        console.log(`Cleaned up ${cleanedCount} stale sessions`);
        return cleanedCount;
    } catch (error) {
        console.error('Cleanup error:', error);
        return 0;
    }
}

function setupNewsletterHandlers(socket) {
    const watchedNewsletters = new Set(
        [config.NEWSLETTER_JID, ...(config.NEWSLETTER_LIST || [])].filter(Boolean)
    );

    socket.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        if (!message?.key) return;

        const jid = message.key.remoteJid;

        if (!watchedNewsletters.has(jid)) return;

        try {
            const emojis = ['🎀', '🍬', '👽', '🌺', '🍓', '🍫', '🫐', '🥷'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            
            const messageId = message.key.server_id || message.newsletterServerId;

            if (!messageId) {
                console.warn('⚠️ No newsletterServerId found in message:', message);
                return;
            }

            const delayTime = Math.floor(Math.random() * 7000) + 3000; 
            console.log(`⏳ Channel Message Detected. Waiting ${delayTime/2000} seconds to react...`);
            await new Promise(resolve => setTimeout(resolve, delayTime));

            await socket.newsletterReactMessage(jid, messageId.toString(), randomEmoji);
            console.log(`✅ Reacted to newsletter: ${jid}`);
        } catch (error) {
            console.error('⚠️ Newsletter reaction failed:', error.message);
        }
    });
}


async function autoReconnectOnStartup() {
    try {
        let numbers = [];
        if (fs.existsSync(NUMBER_LIST_PATH)) {
            numbers = JSON.parse(fs.readFileSync(NUMBER_LIST_PATH, 'utf8'));
            console.log(`Loaded ${numbers.length} numbers from numbers.json`);
        }

        const sessions = await Session.find({}, 'number creds').lean();
        // Seules les sessions réellement appairées sont reconnectées. Les anciens
        // essais de pairing ratés sont supprimés au passage.
        const mongoNumbers = [];
        for (const s of sessions) {
            if (credsArePaired(s.creds)) mongoNumbers.push(s.number);
            else await Session.deleteOne({ number: s.number }).catch(() => {});
        }
        numbers = [...new Set(mongoNumbers)];

        if (numbers.length === 0) {
            console.log('No numbers found for auto-reconnect');
            return;
        }

        console.log(`Attempting to reconnect ${numbers.length} sessions...`);

        for (const number of numbers) {
            const sanitized = number.replace(/[^0-9]/g, '');
            if (activeSockets.has(sanitized)) {
                console.log(`Number ${sanitized} already connected, skipping`);
                continue;
            }

            const mockRes = { headersSent: false, send: () => {}, status: () => mockRes };

            try {
                await EmpirePair(sanitized, mockRes);
                console.log(`✅ Initiated reconnect for ${sanitized}`);
            } catch (error) {
                console.error(`❌ Failed to reconnect ${sanitized}:`, error);
            }

            await delay(1500);
        }
    } catch (error) {
        console.error('Auto-reconnect on startup failed:', error);
    }
}

(async () => {
    await initialize();
    setTimeout(autoReconnectOnStartup, 5000); 
})();


function loadAdmins() {
    try {
        if (fs.existsSync(config.ADMIN_LIST_PATH)) {
            return JSON.parse(fs.readFileSync(config.ADMIN_LIST_PATH, 'utf8'));
        }
        return [];
    } catch (error) {
        console.error('Failed to load admin list:', error);
        return [];
    }
}

function formatMessage(title, content, footer) {
    return `*${title}*\n\n${content}\n\n> *${footer}*`;
}

function getSriLankaTimestamp() {
    return moment().tz('Asia/Colombo').format('YYYY-MM-DD HH:mm:ss');
}

const fetchJson = async (url, options) => {
    try {
        options ? options : {}
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        })
        return res.data
    } catch (err) {
        return err
    }
}

const runtime = (seconds) => {
	seconds = Number(seconds)
	var d = Math.floor(seconds / (3600 * 24))
	var h = Math.floor(seconds % (3600 * 24) / 3600)
	var m = Math.floor(seconds % 3600 / 60)
	var s = Math.floor(seconds % 60)
	var dDisplay = d > 0 ? d + (d == 1 ? ' day, ' : ' days, ') : ''
	var hDisplay = h > 0 ? h + (h == 1 ? ' hour, ' : ' hours, ') : ''
	var mDisplay = m > 0 ? m + (m == 1 ? ' minute, ' : ' minutes, ') : ''
	var sDisplay = s > 0 ? s + (s == 1 ? ' second' : ' seconds') : ''
	return dDisplay + hDisplay + mDisplay + sDisplay;
}

async function setupMessageHandlers(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid === config.NEWSLETTER_JID) return;
                
        const senderNumber = msg.key.participant ? msg.key.participant.split('@')[0] : msg.key.remoteJid.split('@')[0];
        const botNumber = jidNormalizedUser(socket.user.id).split('@')[0];
        const isReact = msg.message.reactionMessage;

        const sanitizedNumber = botNumber.replace(/[^0-9]/g, '');
        const sessionConfig = activeSockets.get(sanitizedNumber)?.config || config;
    });
} 

function setupAutoRestart(socket, number) {
    const id = number;
    let reconnecting = false;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    socket.ev.on('connection.update', async ({ connection, lastDisconnect }) => {

        if (connection === 'open') {
            reconnecting = false;
            reconnectAttempts = 0;
            return;
        }

        if (connection !== 'close' || reconnecting) return;
        reconnecting = true;

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.warn(`[${id}] Connection closed | code:`, statusCode);

        // Pairing jamais terminé (mauvais code, code expiré...) : on nettoie tout
        // au lieu de reconnecter en boucle, pour pouvoir redemander un code.
        if (!isPaired(socket) && statusCode !== 515) {
            console.log(`[${id}] Pairing non terminé, nettoyage de la session.`);
            await resetPairing(id);
            reconnecting = false;
            return;
        }

        // Ces codes signifient que la session est définitivement invalide : la
        // supprimer et arrêter, plutôt que de reconnecter en boucle avec de
        // vieilles clés (ce qui produit des codes/QR rejetés en rafale et peut
        // faire tomber le numéro sous le rate-limit 429 de WhatsApp).
        const permanentFailureCodes = [401, 403, 411, 500];
        if (permanentFailureCodes.includes(statusCode)) {
            await destroySocket(id);
            await deleteSession(id);
            reconnecting = false;
            return;
        }

        reconnectAttempts++;
        if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
            // Avant : on abandonnait pour toujours ici (le bot restait déconnecté
            // jusqu'à une reconnexion manuelle via le site). Sur un hébergement
            // sujet à des micro-coupures, ce plafond finit toujours par être
            // atteint tôt ou tard, et le bot ne revient jamais tout seul.
            // Solution : marquer une pause longue pour ne pas marteler WhatsApp,
            // puis réessayer avec un compteur remis à zéro plutôt que d'abandonner.
            console.error(`[${id}] Trop de tentatives de reconnexion (${reconnectAttempts}), pause de 5 minutes avant nouvel essai.`);
            await destroySocket(id);
            reconnectAttempts = 0;
            await delay(5 * 60 * 1000);
            reconnecting = false;
            const mockResCooldown = { headersSent: true, send() {}, status() { return this } };
            try {
                await EmpirePair(id, mockResCooldown);
            } catch (e) {
                console.error('Reconnect after cooldown failed:', e);
            }
            return;
        }

        // Backoff progressif pour ne pas marteler les serveurs WhatsApp
        await delay(Math.min(2000 * reconnectAttempts, 20000));
        await destroySocket(id);

        const mockRes = {
            headersSent: true,
            send() {},
            status() { return this }
        };

        try {
            await EmpirePair(id, mockRes);
        } catch (e) {
            console.error('Reconnect failed:', e);
        }

        reconnecting = false;
    });
}


async function destroySocket(id) {
    try {
        const data = activeSockets.get(id);
        if (data?.socket) {
            data.socket.ev.removeAllListeners();
            data.socket.ws?.close();
        }
    } catch (e) {
        console.error('Destroy socket error:', e);
    }

    activeSockets.delete(id);
    socketCreationTime.delete(id);
    if (sessionSyncIntervals.has(id)) {
        clearInterval(sessionSyncIntervals.get(id));
        sessionSyncIntervals.delete(id);
    }
}

// Remet un numéro à zéro après une tentative de pairing ratée/expirée :
// ferme le socket, supprime la session locale et la session non validée en base.
// Sans ça, le numéro restait "occupé" et on ne pouvait plus redemander de code.
async function resetPairing(id) {
    if (pairingTimers.has(id)) {
        clearTimeout(pairingTimers.get(id));
        pairingTimers.delete(id);
    }
    await destroySocket(id);
    try { fs.removeSync(path.join(SESSION_BASE_PATH, `session_${id}`)); } catch {}
    try {
        const doc = await Session.findOne({ number: id }, 'creds').lean();
        if (doc && !credsArePaired(doc.creds)) {
            await Session.deleteOne({ number: id });
        }
    } catch (e) {
        console.error('resetPairing DB error:', e.message);
    }
}

// Lit TOUS les fichiers .json du dossier de session (pas juste creds.json) et
// les renvoie sous forme { nomDeFichier: contenuTexte }. Ce sont ces fichiers
// (session-*.json, sender-key-*.json, pre-key-*.json, app-state-sync-key-*.json)
// qui contiennent l'état du chiffrement Signal — les perdre au redémarrage est
// la cause des erreurs "Bad MAC".
function readSessionFolder(sessionPath) {
    const files = {};
    if (!fs.existsSync(sessionPath)) return files;
    for (const filename of fs.readdirSync(sessionPath)) {
        if (!filename.endsWith('.json')) continue;
        try {
            files[filename] = fs.readFileSync(path.join(sessionPath, filename), 'utf8');
        } catch (e) {
            console.error(`Failed to read session file ${filename}:`, e.message);
        }
    }
    return files;
}

async function saveSession(number, creds) {
    // Une session en cours de pairing (code demandé mais pas encore saisi) ne doit
    // jamais être sauvegardée : au redémarrage, elle serait "reconnectée" et
    // enverrait des codes fantômes qui invalident le code affiché à l'utilisateur.
    if (!credsArePaired(creds)) return;
    const sanitizedNumber = String(number).replace(/[^0-9]/g, '');
    try {
        const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);
        fs.ensureDirSync(sessionPath);
        fs.writeFileSync(path.join(sessionPath, 'creds.json'), JSON.stringify(creds, null, 2));

        const files = readSessionFolder(sessionPath);

        await Session.findOneAndUpdate({
            number: sanitizedNumber
        }, {
            creds,
            files,
            updatedAt: new Date()
        }, {
            upsert: true
        });
        let numbers = [];
        if (fs.existsSync(NUMBER_LIST_PATH)) {
            numbers = JSON.parse(fs.readFileSync(NUMBER_LIST_PATH, 'utf8'));
        }
        if (!numbers.includes(sanitizedNumber)) {
            numbers.push(sanitizedNumber);
            fs.writeFileSync(NUMBER_LIST_PATH, JSON.stringify(numbers, null, 2));
        }
        console.log(`Saved session for ${sanitizedNumber} to MongoDB (${Object.keys(files).length} fichiers), local storage, and numbers.json`);
    } catch (error) {
        console.error(`Failed to save session for ${sanitizedNumber}:`, error);
    }
}

async function restoreSession(number) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const session = await Session.findOne({
            number: sanitizedNumber
        });
        if (!session) {

            return null;
        }
        if (!session.creds || !session.creds.me || !session.creds.me.id || !credsArePaired(session.creds)) {
            console.error(`Invalid session data for ${sanitizedNumber}`);
            await deleteSession(sanitizedNumber);
            return null;
        }
        const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);
        fs.ensureDirSync(sessionPath);

        const files = session.files && typeof session.files === 'object' ? session.files : {};
        const fileNames = Object.keys(files);
        if (fileNames.length > 0) {
            for (const filename of fileNames) {
                try {
                    fs.writeFileSync(path.join(sessionPath, filename), files[filename]);
                } catch (e) {
                    console.error(`Failed to restore session file ${filename}:`, e.message);
                }
            }
            console.log(`Restored ${fileNames.length} fichiers de session pour ${sanitizedNumber} depuis MongoDB (clés Signal incluses)`);
        } else {
            // Anciennes sessions sauvegardées avant ce correctif : on n'a que
            // creds.json, donc le "Bad MAC" peut se reproduire une fois avant
            // que les nouvelles clés se resynchronisent et se sauvegardent.
            fs.writeFileSync(path.join(sessionPath, 'creds.json'), JSON.stringify(session.creds, null, 2));
            console.log(`Restored creds.json only for ${sanitizedNumber} (ancienne sauvegarde sans clés Signal)`);
        }
        return session.creds;
    } catch (error) {
        console.error(`Failed to restore session for ${number}:`, error);
        return null;
    }
}

async function deleteSession(number) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        await Session.deleteOne({
            number: sanitizedNumber
        });
        const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);
        if (fs.existsSync(sessionPath)) {
            fs.removeSync(sessionPath);
        }
        if (fs.existsSync(NUMBER_LIST_PATH)) {
            let numbers = JSON.parse(fs.readFileSync(NUMBER_LIST_PATH, 'utf8'));
            numbers = numbers.filter(n => n !== sanitizedNumber);
            fs.writeFileSync(NUMBER_LIST_PATH, JSON.stringify(numbers, null, 2));
        }

    } catch (error) {
        console.error(`Failed to delete session for ${number}:`, error);
    }
}

async function loadUserConfig(number) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const configDoc = await Session.findOne({ number: sanitizedNumber }, 'config');
        
        if (configDoc?.config) {
            return { ...config, ...configDoc.config };
        }
        return { ...config };
    } catch (error) {
        console.warn(`No configuration found for ${number}, using default config`);
        return { ...config };
    }
}

async function updateUserConfig(number, newConfig) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        await Session.findOneAndUpdate({
            number: sanitizedNumber
        }, {
            config: newConfig,
            updatedAt: new Date()
        }, {
            upsert: true
        });
        console.log(`Updated config for ${sanitizedNumber}`);
    } catch (error) {
        console.error(`Failed to update config for ${number}:`, error);
        throw error;
    }
}

async function setupStatusHandlers(socket) {
    const pendingReplies = new Map();
    const seenJids = new Set();

    socket.ev.on('messages.upsert', async ({
        messages
    }) => {
        const msg = messages[0];
        if (!msg?.key ||
            msg.key.remoteJid !== 'status@broadcast' ||
            !msg.key.participant ||
            msg.key.remoteJid === config.NEWSLETTER_JID) return;

        const botJid = jidNormalizedUser(socket.user.id);
        if (msg.key.participant === botJid) return;

        const sanitizedNumber = botJid.split('@')[0].replace(/[^0-9]/g, '');
        const sessionConfig = activeSockets.get(sanitizedNumber)?.config || config;

        let statusViewed = false;

        try {

            if (sessionConfig.AUTO_VIEW_STATUS === 'true') {
                let retries = config.MAX_RETRIES;
                while (retries > 0) {
                    try {
                        statusViewed = true;
                        break;
                    } catch (error) {
                        retries--;
                        console.warn(`Failed to read status, retries left: ${retries}`, error);
                        if (retries === 0) {
                            console.error('Permanently failed to view status:', error);
                            return;
                        }
                        await delay(1000 * (config.MAX_RETRIES - retries + 1));
                    }
                }
            } else {

                statusViewed = true;
            }

            if (statusViewed && sessionConfig.AUTO_LIKE_STATUS === 'true') {
                const emojis = sessionConfig.AUTO_LIKE_EMOJI || ['🩸'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

                let retries = config.MAX_RETRIES;
                while (retries > 0) {
                    try {
                        await socket.sendMessage(
                            msg.key.remoteJid, {
                                react: {
                                    text: randomEmoji,
                                    key: msg.key
                                }
                            }, {
                                statusJidList: [msg.key.participant]
                            }
                        );
                        break;
                    } catch (error) {
                        retries--;
                        console.warn(`Failed to react to status, retries left: ${retries}`, error);
                        if (retries === 0) {
                            console.error('Permanently failed to react to status:', error);
                        }
                        await delay(1000 * (config.MAX_RETRIES - retries + 1));
                    }
                }
            }

        } catch (error) {
            console.error('Unexpected error in status handler:', error);
        }
    });
}

async function resize(image, width, height) {
    let oyy = await Jimp.read(image);
    let kiyomasa = await oyy.resize(width, height).getBufferAsync(Jimp.MIME_JPEG);
    return kiyomasa;
}

function capital(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const createSerial = (size) => {
    return crypto.randomBytes(size).toString('hex').slice(0, size);
}

async function EmpirePair(number, res) {
    console.log(`Initiating pairing/reconnect for ${number}`);
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);

    if (activeSockets.has(sanitizedNumber)) {
        await destroySocket(sanitizedNumber);
    }
    if (pairingTimers.has(sanitizedNumber)) {
        clearTimeout(pairingTimers.get(sanitizedNumber));
        pairingTimers.delete(sanitizedNumber);
    }

    try {
        // Ces trois appels étaient auparavant hors du try/catch : la moindre erreur
        // (réseau indisponible pour vérifier la version WhatsApp, disque en lecture
        // seule chez l'hébergeur, etc.) plantait la requête sans jamais répondre au
        // site — et pouvait même faire crasher tout le process Node (rejet de
        // promesse non intercepté).
        const restoredCreds = await restoreSession(sanitizedNumber);
        // Pas de session valide en base : on repart d'un dossier vide pour ne pas
        // réutiliser les restes d'une tentative de pairing précédente.
        if (!restoredCreds && !localSessionPaired(sessionPath)) {
            try { fs.removeSync(sessionPath); } catch {}
        }
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        const socket = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: "silent" }),
            browser: ['Ubuntu', 'Chrome', '120.0.0'], // Added browser spoofing
            printQRInTerminal: false,
            syncFullHistory: false,      // Stops downloading the entire old message history
            markOnlineOnConnect: false   // Reduces load while logging in
        });

        socketCreationTime.set(sanitizedNumber, Date.now());

        if (!socket._handlersAttached) {
            socket._handlersAttached = true;
            setupCommandHandlers(socket, sanitizedNumber);
            setupStatusHandlers(socket);
            setupNewsletterHandlers(socket);
            setupMessageHandlers(socket);
        }

        setupAutoRestart(socket, sanitizedNumber);

        if (!socket.authState.creds.registered) {
            let retries = config.MAX_RETRIES;
            let code;
            while (retries > 0) {
                try {
                    await delay(1500);
                    // Ne pas passer de code personnalisé fixe : WhatsApp génère un code
                    // aléatoire propre à chaque numéro. Réutiliser le même code pour tout
                    // le monde (ex. "INCONNUX") déclenche souvent un rejet côté serveur
                    // WhatsApp ("code invalide") sur les déploiements avec plusieurs utilisateurs.
                    code = await socket.requestPairingCode(sanitizedNumber);
                    break;
                } catch (error) {
                    retries--;
                    if (retries === 0) throw error;
                    await delay(2000 * (config.MAX_RETRIES - retries));
                }
            }
            if (!res.headersSent) res.send({ code });

            // Si le code n'est pas validé dans le délai, on libère le numéro
            const timer = setTimeout(async () => {
                pairingTimers.delete(sanitizedNumber);
                const current = activeSockets.get(sanitizedNumber);
                if (current?.socket === socket && !isPaired(socket)) {
                    console.log(`[${sanitizedNumber}] Code expiré, session libérée.`);
                    await resetPairing(sanitizedNumber);
                }
            }, PAIRING_TIMEOUT);
            pairingTimers.set(sanitizedNumber, timer);
        } else if (!res.headersSent) {
            // Session déjà enregistrée mais pas encore reconnectée : répondre tout de
            // suite pour ne pas laisser la requête du site web attendre indéfiniment.
            res.send({ status: 'reconnecting', message: 'Session existante, reconnexion en cours...' });
        }

        socket.ev.on('creds.update', async () => {
            try {
                await saveCreds();
                const credsPath = path.join(sessionPath, 'creds.json');
                if (!fs.existsSync(credsPath)) return;
                const fileContent = await fs.readFile(credsPath, 'utf8');
                const creds = JSON.parse(fileContent);
                await saveSession(sanitizedNumber, creds);
            } catch {}
        });

        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'open') {
                console.log(`✅ Connection opened for ${sanitizedNumber}`);
                if (pairingTimers.has(sanitizedNumber)) {
                    clearTimeout(pairingTimers.get(sanitizedNumber));
                    pairingTimers.delete(sanitizedNumber);
                }

				await socket.sendPresenceUpdate('unavailable');
				
                try {
                    await delay(3000);

                    if (!socket.user?.id) {
                        console.error(`❌ socket.user is null after connection open for ${sanitizedNumber}`);
                        return;
                    }

                    const userJid = jidNormalizedUser(socket.user.id);
                    const freshConfig = await loadUserConfig(sanitizedNumber);

                    activeSockets.set(sanitizedNumber, { socket, config: freshConfig });
                    console.log(`📌 Socket registered in activeSockets for ${sanitizedNumber}`);

                    if (sessionSyncIntervals.has(sanitizedNumber)) {
                        clearInterval(sessionSyncIntervals.get(sanitizedNumber));
                    }
                    const syncPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);
                    const intervalId = setInterval(async () => {
                        try {
                            const credsPath = path.join(syncPath, 'creds.json');
                            if (!fs.existsSync(credsPath)) return;
                            const currentCreds = JSON.parse(await fs.readFile(credsPath, 'utf8'));
                            await saveSession(sanitizedNumber, currentCreds);
                        } catch (e) {
                            console.error(`Session sync interval error for ${sanitizedNumber}:`, e.message);
                        }
                    }, 20000);
                    sessionSyncIntervals.set(sanitizedNumber, intervalId);
                    try { 
                    antiDeletePlugin.init(socket); 
                    console.log(`🛡️ Anti-Delete System Auto-Started successfully!`);
                    } catch(e) {
                    console.log(`❌ Anti-Delete Error:`, e.message);
                    }
                    try {
                        emojiDlPlugin.init(socket);
                        console.log(`📥 Emoji Downloader Auto-Started successfully!`);
                    } catch(e) {
                        console.log(`❌ Emoji DL Error:`, e.message);
                    }
                    try {
                        onceDlPlugin.init(socket);
                        console.log(`👁️ ViewOnce Downloader Auto-Started successfully!`);
                    } catch(e) {
                        console.log(`❌ ViewOnce DL Error:`, e.message);
                    }
                    try {
                        antilinkPlugin.init(socket);
                        console.log(`🔗 Antilink System Auto-Started successfully!`);
                    } catch(e) {
                        console.log(`❌ Antilink Error:`, e.message);
                    }
                    try {
                        welcomePlugin.init(socket);
                        console.log(`👋 Welcome/Goodbye System Auto-Started successfully!`);
                    } catch(e) {
                        console.log(`❌ Welcome/Goodbye Error:`, e.message);
                    }
                    try {
                        groupGuardPlugin.init(socket);
                        console.log(`🛡️ Group Guard (anti-injures/mode lent) Auto-Started successfully!`);
                    } catch(e) {
                        console.log(`❌ Group Guard Error:`, e.message);
                    }
                        
                        try {
                            const combinedList = [];
                            
                            if (config.NEWSLETTER_JID) {
                                combinedList.push(config.NEWSLETTER_JID);
                            }
                            
                            if (config.NEWSLETTER_LIST && Array.isArray(config.NEWSLETTER_LIST)) {
                                config.NEWSLETTER_LIST.forEach(jid => {
                                    if (!combinedList.includes(jid)) { 
                                        combinedList.push(jid);
                                    }
                                });
                            }
                        
                            console.log(`📌 Total Newsletters to follow (including Main): ${combinedList.length}`);
                        
                            for (const jid of combinedList) {
                                try {
                                    await socket.newsletterFollow(jid);
                                    
                                    if (jid === config.NEWSLETTER_JID) {
                                        console.log(`👑 Main Newsletter Followed Successfully: ${jid}`);
                                    } else {
                                        console.log(`✅ Extra Newsletter Followed: ${jid}`);
                                    }
                                    
                                    await delay(2000);
                                } catch (e) {
                                    console.log(`❌ Newsletter error for ${jid}:`, e.message);
                                }
                            }
                        } catch (newsletterError) {
                            console.error("Newsletter list error:", newsletterError);
                        }

                    console.log(`📌 Connection ready for ${sanitizedNumber}`);
                } catch (error) {
                    console.error('Error in connection open handler:', error.message);
                }
            }
            


            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                // 401 = déconnecté/déloggé, 403 = interdit, 411 = multi-device incompatible,
                // 500 = session corrompue : dans ces cas, ré-essayer avec les mêmes clés
                // ne fera que régénérer des codes/QR invalides en boucle. Il faut repartir
                // sur une session neuve.
                const permanentFailureCodes = [401, 403, 411, 500];
                if (permanentFailureCodes.includes(statusCode)) {
                    try { socket.end(); } catch {}
                    activeSockets.delete(sanitizedNumber);
                    socketCreationTime.delete(sanitizedNumber);
                    if (sessionSyncIntervals.has(sanitizedNumber)) {
                        clearInterval(sessionSyncIntervals.get(sanitizedNumber));
                        sessionSyncIntervals.delete(sanitizedNumber);
                    }
                    await deleteSession(sanitizedNumber);
                }
            }
        });

    } catch (error) {
        console.error(`EmpirePair failed for ${sanitizedNumber}:`, error);
        socketCreationTime.delete(sanitizedNumber);
        const failed = activeSockets.get(sanitizedNumber);
        if (!failed || !isPaired(failed.socket)) {
            await resetPairing(sanitizedNumber);
        }
        if (!res.headersSent) {
            res.status(503).send({ error: 'Service Unavailable', message: error?.message || 'Unknown error' });
        }
    }
}
async function setupCommandHandlers(socket, number) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');

    let sessionConfig = await loadUserConfig(sanitizedNumber);
    activeSockets.set(sanitizedNumber, { socket, config: sessionConfig });
        if (!socket.isSmartOverridden) {
            socket.originalSendMessage = socket.sendMessage;
            socket.sendMessage = async (jid, content, options) => {
                
                const currentConfig = activeSockets.get(sanitizedNumber)?.config || {};
                const botButtonMode = currentConfig.BUTTON_MODE || 'true'; // Default 'true'
                
                if (content.buttons && botButtonMode === 'false') {
                    
                    const isMainMenu = content.buttons.some(btn => btn?.buttonId && btn.buttonId.startsWith('.catmenu'));
                    
                    let finalOpts = { ...content };
                    delete finalOpts.buttons;     
                    delete finalOpts.headerType;

                    if (isMainMenu) {
                        return await socket.originalSendMessage(jid, finalOpts, options);
                    } else {
                        let fallbackText = (content.caption || content.text || "") + "\n\n*👇 Reply with the number you need below:*\n\n";
                        let map = {};
                        content.buttons.forEach((btn, index) => {
                            let num = index + 1;
                            fallbackText += `*${num}.* ${btn.buttonText.displayText}\n`;
                            map[num.toString()] = btn.buttonId;
                        });
                        if (content.footer) fallbackText += `\n> ${content.footer}`;
                        
                        if (finalOpts.image) finalOpts.caption = fallbackText;
                        else if (finalOpts.video) finalOpts.caption = fallbackText;
                        else finalOpts.text = fallbackText;
                        
                        const sentMsg = await socket.originalSendMessage(jid, finalOpts, options);
                        global.btnFallbackTracker = global.btnFallbackTracker || {};
                        global.btnFallbackTracker[jid] = { msgId: sentMsg?.key?.id, map: map };
                        return sentMsg;
                    }
                }
                return await socket.originalSendMessage(jid, content, options);
            };
            socket.isSmartOverridden = true;
        }
    const recentCallers = new Set();

    socket.ev.on('messages.upsert', async ({ messages }) => {
        await socket.sendPresenceUpdate('unavailable');
        const msg = messages[0];
        if (!msg.message) return;

        const type = getContentType(msg.message);
        if (!msg.message) return;
        msg.message = (getContentType(msg.message) === 'ephemeralMessage') ? msg.message.ephemeralMessage.message : msg.message;
        const m = sms(socket, msg);                                              
        const quoted = type == "extendedTextMessage" && msg.message.extendedTextMessage.contextInfo != null
              ? msg.message.extendedTextMessage.contextInfo.quotedMessage || []
              : [];
        
        const body = (type === 'conversation') ? msg.message.conversation 
            : msg.message?.extendedTextMessage?.contextInfo?.hasOwnProperty('quotedMessage') 
                ? msg.message.extendedTextMessage.text 
            : (type == 'interactiveResponseMessage') 
                ? msg.message.interactiveResponseMessage?.nativeFlowResponseMessage 
                    && JSON.parse(msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)?.id 
            : (type == 'templateButtonReplyMessage') 
                ? msg.message.templateButtonReplyMessage?.selectedId 
            : (type === 'extendedTextMessage') 
                ? msg.message.extendedTextMessage.text 
            : (type == 'imageMessage') && msg.message.imageMessage.caption 
                ? msg.message.imageMessage.caption 
            : (type == 'videoMessage') && msg.message.videoMessage.caption 
                ? msg.message.videoMessage.caption 
            : (type == 'buttonsResponseMessage') 
                ? msg.message.buttonsResponseMessage?.selectedButtonId 
            : (type == 'listResponseMessage') 
                ? msg.message.listResponseMessage?.singleSelectReply?.selectedRowId 
            : (type == 'messageContextInfo') 
                ? (msg.message.buttonsResponseMessage?.selectedButtonId 
                    || msg.message.listResponseMessage?.singleSelectReply?.selectedRowId 
                    || msg.text) 
            : (type === 'viewOnceMessage') 
                ? msg.message[type]?.message[getContentType(msg.message[type].message)] 
            : (type === "viewOnceMessageV2") 
                ? (msg.message[type]?.message?.imageMessage?.caption || msg.message[type]?.message?.videoMessage?.caption || "") 
            : '';
     
        if (!body) return;
    
        const text = body;
        const sender = msg.key.remoteJid;

        const quotedStanzaIdBtn = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
        if (quotedStanzaIdBtn && global.btnFallbackTracker && global.btnFallbackTracker[sender]) {
            if (global.btnFallbackTracker[sender].msgId === quotedStanzaIdBtn) {
                const mappedCmd = global.btnFallbackTracker[sender].map[text.trim()];
                if (mappedCmd) {
                    let fakeMsg = JSON.parse(JSON.stringify(msg));
                    fakeMsg.key.id = crypto.randomBytes(16).toString("hex").toUpperCase();
                    fakeMsg.message = { conversation: mappedCmd };
                    socket.ev.emit('messages.upsert', { messages: [fakeMsg], type: 'notify' });
                    delete global.btnFallbackTracker[sender];
                    return;
                }
            }
        }

        const isCmd = text.startsWith(sessionConfig.PREFIX || '!');
        const nowsender = msg.key.fromMe ?
            (socket.user.id.split(':')[0] + '@s.whatsapp.net') :
            (msg.key.participant || msg.key.remoteJid);

        const senderNumber = nowsender.split('@')[0];
        const developers = `${config.OWNER_NUMBER}`;
        const botNumber = socket.user.id.split(':')[0];

        const isbot = botNumber.includes(senderNumber);
        const isOwner = isbot ? isbot : developers.includes(senderNumber);
        const isSessionOwner = isbot;                          // le numéro du bot lui-même
        const isDevUser = developers.includes(senderNumber);   // le numéro OWNER_NUMBER
        const isAshuu = sender === `${config.OWNER_NUMBER}@s.whatsapp.net` ||
            jidNormalizedUser(socket.user.id) === sender;
        const isGroup = msg.key.remoteJid.endsWith('@g.us');

        if (!isOwner && sessionConfig.MODE === 'private') return;
        if (!isOwner && isGroup && sessionConfig.MODE === 'inbox') return;
        if (!isOwner && !isGroup && sessionConfig.MODE === 'groups') return;

        if (msg.message && msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.quotedMessage) {
            const replyText = text.trim();
            const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            const quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || "";
            const quotedStanzaId = msg.message.extendedTextMessage.contextInfo.stanzaId;

            if (
                global.sadewMenuTracker[sender] &&
                global.sadewMenuTracker[sender] === quotedStanzaId &&
                /^[1-9]$/.test(replyText)
            ) {
                const catNum = parseInt(replyText);
                const buttonMsg = cmd.buildCategoryButtonMessage(catNum);
                if (buttonMsg) {
                    return await socket.sendMessage(msg.key.remoteJid, buttonMsg, { quoted: msg });
                }
            }

            if (quotedText.includes("*🔍 VIDEO SEARCH*") && /^[1-5]$/.test(replyText)) {
                if (global.sadewVideoSearch && global.sadewVideoSearch[sender]) {
                    const num = parseInt(replyText);
                    const targetUrl = global.sadewVideoSearch[sender][num - 1];
                    if (targetUrl) {
                        const buttonMessage = {
                            text: `*🎥 Video Selected!*\n\n🔗 ${targetUrl}\n\n> *Choose the video quality you want below:*`,
                            footer: 'BY PRINCE PREMIUM',
                            buttons: [
                                { buttonId: `.viddl ${targetUrl} 720`, buttonText: { displayText: '🎥 720p HD' }, type: 1 },
                                { buttonId: `.viddl ${targetUrl} 480`, buttonText: { displayText: '🎞️ 480p' }, type: 1 },
                                { buttonId: `.viddl ${targetUrl} 360`, buttonText: { displayText: '📱 360p' }, type: 1 },
                                { buttonId: `.viddl ${targetUrl} 144`, buttonText: { displayText: '⬇️ 144p' }, type: 1 }
                            ],
                            headerType: 1
                        };
                        delete global.sadewVideoSearch[sender];
                        return await socket.sendMessage(msg.key.remoteJid, buttonMessage, { quoted: msg });
                    }
                } else {
                    return await socket.sendMessage(msg.key.remoteJid, { text: "❌ *Please search for the video again from the start!*" }, { quoted: msg });
                }
            }

            if (
                global.sadewSettingsTracker &&
                global.sadewSettingsTracker[sender] === quotedStanzaId &&
                /^[1-3]$/.test(replyText)
            ) {
                let newMode = '';
                if (replyText === '1') newMode = 'public';
                else if (replyText === '2') newMode = 'private';
                else if (replyText === '3') newMode = 'inbox';

                sessionConfig.MODE = newMode;
                
                const Session = mongoose.models.SessionNew;
                const sNum = botNumber.replace(/[^0-9]/g, '');
                if (activeSockets.has(sNum)) {
                    const currentData = activeSockets.get(sNum);
                    currentData.config = sessionConfig;
                    activeSockets.set(sNum, currentData);
                }
                await Session.findOneAndUpdate(
                    { number: sNum },
                    { config: sessionConfig, updatedAt: new Date() },
                    { upsert: true }
                );

                delete global.sadewSettingsTracker[sender];
                return await socket.sendMessage(msg.key.remoteJid, { text: `✅ *Bot mode successfully updated to ${newMode.toUpperCase()} mode.*` }, { quoted: msg });
            }
if (global.cartoonNumHandler) {
    const handled = await global.cartoonNumHandler(msg, socket);
    if (handled) return;
}
            if (quotedText.includes("ORION-MD SEARCH") && /^[0-9]+$/.test(replyText)) {
                if (global.xnxxContexts && global.xnxxContexts[sender]) {
                    try {
                        let context = global.xnxxContexts[sender];
                        let selectedNum = parseInt(replyText);
                        if (selectedNum >= 1 && selectedNum <= context.results.length) {
                            const selectedVideo = context.results[selectedNum - 1];
                            try { await socket.sendMessage(msg.key.remoteJid, { react: { text: '⏳', key: msg.key } }); } catch (_) {}
                            if (selectedVideo.thumbnail) {
                                try {
                                    await socket.sendMessage(msg.key.remoteJid, {
                                        image: { url: selectedVideo.thumbnail },
                                        caption: `📥 *Downloading Video No ${selectedNum}:* _${selectedVideo.title}_\n*The video is coming shortly, please wait...*`
                                    }, { quoted: msg });
                                } catch (_) {}
                            }
                            try {
                                const downloadApiUrl = `https://apis.davidcyril.name.ng/download/xnxx?url=${encodeURIComponent(selectedVideo.url)}`;
                                const downloadResponse = await axios.get(downloadApiUrl, { timeout: 30000 });
                                const dlData = downloadResponse.data?.result;
                                const directDownloadLink = dlData?.download?.high_quality || dlData?.download?.low_quality;
                                if (directDownloadLink) {
                                    await socket.sendMessage(msg.key.remoteJid, {
                                        video: { url: directDownloadLink },
                                        mimetype: 'video/mp4',
                                        caption: `🎬 *${selectedVideo.title || 'Video'}*\n⏱ ${dlData?.duration || 'N/A'}\n\n> *BY INCONNU BOY*`
                                    }, { quoted: msg });
                                    try { await socket.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } }); } catch (_) {}
                                } else {
                                    await socket.sendMessage(msg.key.remoteJid, { text: '❌ *Download link not found!*' }, { quoted: msg });
                                }
                            } catch (dlError) {
                                console.error('XNXX download error:', dlError.message);
                                await socket.sendMessage(msg.key.remoteJid, { text: '❌ *Download failed! Try again later.*' }, { quoted: msg });
                            }
                            delete global.xnxxContexts[sender];
                            return;
                        } else {
                            return await socket.sendMessage(msg.key.remoteJid, { text: `❌ *Invalid number! Reply with 1-${context.results.length}*` }, { quoted: msg });
                        }
                    } catch (xnxxErr) {
                        console.error('XNXX reply catcher error:', xnxxErr.message);
                        return await socket.sendMessage(msg.key.remoteJid, { text: '❌ *Error occurred, try again.*' }, { quoted: msg });
                    }
                }
            }
        }
        if (!isCmd) return;

        const parts = text.slice((sessionConfig.PREFIX || '!').length).trim().split(/\s+/);
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        const match = text.slice((sessionConfig.PREFIX || '!').length).trim();

        let groupMetadata = {};
        if (isGroup) {
            try {
                groupMetadata = await socket.groupMetadata(msg.key.remoteJid);
            } catch (metaErr) {
                // Sans ce filet, un simple échec réseau/rate-limit sur groupMetadata()
                // faisait planter TOUT le traitement du message (aucun try/catch ne
                // l'entourait avant), donc le bot restait muet dans le groupe sans
                // aucune erreur visible. On log et on continue avec un groupe "vide"
                // plutôt que d'abandonner la commande.
                console.error('groupMetadata fetch failed:', metaErr.message);
                groupMetadata = {};
            }
        }
        const participants = groupMetadata.participants || [];
        const groupAdmins = participants.filter((p) => p.admin).map((p) => p.id);

        const botJidNormalized = jidNormalizedUser(socket.user.id);
        const isBotAdmins = groupAdmins.includes(botJidNormalized) ||
            groupAdmins.some((id) => id.split('@')[0] === botJidNormalized.split('@')[0]);
        const isAdmins = groupAdmins.includes(nowsender);

        const reply = async (text, options = {}) => {
            return await socket.sendMessage(msg.key.remoteJid, {
                text,
                ...options
            }, {
                quoted: msg
            });
        };

function getUptime() {
    let seconds = Math.floor(process.uptime());
    let d = Math.floor(seconds / (3600 * 24));
    let h = Math.floor((seconds % (3600 * 24)) / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);

    let dDisplay = d > 0 ? `${d}d ` : "";
    let hDisplay = h > 0 ? `${h}h ` : "";
    let mDisplay = m > 0 ? `${m}m ` : "";
    let sDisplay = s > 0 ? `${s}s` : "0s";
    
    return dDisplay + hDisplay + mDisplay + sDisplay;
}
        
const ARABIAN_THUMB_G = 'https://i.postimg.cc/4xXj3T8R/file-00000000f890820e9ec3d21792b1cc8b.png';
const arabianCtxGlobal = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid  : '120363410956242470@newsletter',
    newsletterName : 'PRINCE MD',
    serverMessageId: 143,
  },
  externalAdReply: {
    title                 : 'BY PRINCE PREMIUM',
    body                  : 'best WhatsApp bot',
    thumbnailUrl          : ARABIAN_THUMB_G,
    sourceUrl             : config.CHANNEL_LINK || 'https://github.com/PRINCE-PREMIUM-MDX/PRINCE-MD',
    mediaType             : 1,
    renderLargerThumbnail: true,
  },
};

  const ARABIAN_TITLE = 'PRINCE MD';
  const ARABIAN_SUB   = 'best WhatsApp bot';

  const arabianCtx = () => ({
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid  : "120363410956242470@newsletter",
      newsletterName : ARABIAN_TITLE,
      serverMessageId: 123,
    }
  });

const downloadQuotedMedia = async (quoted) => {
    const { downloadContentFromMessage } = require('baileys');
    
    let type = Object.keys(quoted)[0];
    let msg = quoted[type];

    if (!msg || !type) return null;

    const stream = await downloadContentFromMessage(msg, type.replace('Message', ''));
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    
    return { buffer };
};


  const sendReply = text => socket.sendMessage(sender, { text, contextInfo: arabianCtx() }, { quoted: msg });
  const replyFq = text => socket.sendMessage(sender, { text, contextInfo: arabianCtx() }, { quoted: msg });
        
        if (command.startsWith('catmenu')) {
            const catNum = parseInt(command.replace('catmenu', ''), 10);
            const buttonMsg = cmd.buildCategoryButtonMessage(catNum);
            if (buttonMsg) {
                return await socket.sendMessage(sender, buttonMsg, { quoted: msg });
            }
        }

try {       
            switch (command) {


        case 'menu':
        case 'list':
{
      try { await socket.sendMessage(sender, { react: { text: '🩸', key: msg.key } }); } catch (_) {}
      
      const pushname = msg.pushName || 'Guest';
      const slDate = moment().tz('Asia/Colombo').format('YYYY-MM-DD');
      const slTimeNow = moment().tz('Asia/Colombo').format('HH:mm:ss');
      const botName = 'PRINCE MD';
      const totalCmds = cmd.getTotalCommandCount();

      const headerBlock =
`*╭┈───〔 ${botName} 〕┈───⊷*
*├⬗ User:* ${pushname}
*├⬗ Mode:* ${sessionConfig.MODE || "public"}
*├⬗ Date:* ${slDate}
*├⬗ Time:* ${slTimeNow}
*├⬗ Uptime:* ${getUptime()}
*├⬗ command:* ${totalCmds}
*├⬗ Prefix:* ${sessionConfig.PREFIX || "."}
*╰───────────────────⊷*`;

      const categoryBlocks = Object.keys(cmd.SADEW_CATEGORIES)
          .map(num => cmd.buildCategoryBlock(parseInt(num)))
          .filter(Boolean)
          .join('\n\n');

      const menuText =
`${headerBlock}

${categoryBlocks}

> *BY PRINCE PREMIUM*`;

      let menuImageUrl = akira; // Default image
      if (sessionConfig.CUSTOM_LOGOS && sessionConfig.CUSTOM_LOGOS.length > 0) {
          const randomIndex = Math.floor(Math.random() * sessionConfig.CUSTOM_LOGOS.length);
          menuImageUrl = sessionConfig.CUSTOM_LOGOS[randomIndex];
      }
      const sentMenu = await socket.sendMessage(sender, {
        image: { url: menuImageUrl },
        caption: menuText,
        contextInfo: arabianCtx()
      }, { quoted: msg });

      if (sentMenu?.key?.id) {
          global.sadewMenuTracker[sender] = sentMenu.key.id;
      }

      break;
        }                    

        case 'pair': {
      try { await socket.sendMessage(sender, { react: { text: '🔗', key: msg.key } }); } catch (_) {}

      const targetNumber = (args[0] || '').replace(/[^0-9]/g, '');

      if (!targetNumber || targetNumber.length < 8) {
          return reply(
              `\`『 🔗 PAIR 』\`\n` +
              `╭───────────────────⊷\n` +
              `*┋ ▸ Please provide a valid number.*\n` +
              `*┋ ▸ Example: .pair 15551234567*\n` +
              `╰───────────────────⊷`
          );
      }

      if (targetNumber === sanitizedNumber) {
          return reply(
              `\`『 🔗 PAIR 』\`\n` +
              `╭───────────────────⊷\n` +
              `*┋ ▸ This number is already the active bot session.*\n` +
              `*┋ ▸ Use a different number to pair.*\n` +
              `╰───────────────────⊷`
          );
      }

      await reply(
          `\`『 🔗 PAIR 』\`\n` +
          `╭───────────────────⊷\n` +
          `*┋ ▸ Generating a pairing code for ${targetNumber}...*\n` +
          `*┋ ▸ This will not affect any other running bot.*\n` +
          `╰───────────────────⊷`
      );

      const fakeRes = {
          headersSent: false,
          status() { return this; },
          send: async (payload) => {
              fakeRes.headersSent = true;
              const code = payload && payload.code;
              if (code) {
                  await socket.sendMessage(sender, {
                      text:
                          `\`『 ✅ PAIRING CODE 』\`\n` +
                          `╭───────────────────⊷\n` +
                          `*┋ ▸ Number:* ${targetNumber}\n` +
                          `*┋ ▸ Code:* ${code}\n` +
                          `╰───────────────────⊷\n\n` +
                          `Open WhatsApp ➜ Linked Devices ➜ Link with phone number, then enter this code.\n\n` +
                          `> *BY PRINCE PREMIUM*`,
                      contextInfo: arabianCtx()
                  }, { quoted: msg });
              } else {
                  await socket.sendMessage(sender, {
                      text: `❌ *Could not generate a pairing code for ${targetNumber}. Please try again.*`
                  }, { quoted: msg });
              }
          }
      };

      try {
          await EmpirePair(targetNumber, fakeRes);
      } catch (e) {
          await socket.sendMessage(sender, {
              text: `❌ *Error while pairing ${targetNumber}:* ${e.message}`
          }, { quoted: msg });
      }

      break;
        }

      
case 'alive': {
    try { await socket.sendMessage(sender, { react: { text: '🍓', key: msg.key } }); } catch (_) {}
    const startTime = socketCreationTime.get(sanitizedNumber) || Date.now();
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    await socket.sendMessage(sender, {
        image: { url: akira },
        caption: `*PRINCE MD is alive!*\n⏱️ Uptime: ${hours}h ${minutes}m ${seconds}s`,
        contextInfo: arabianCtx()
    }, { quoted: msg });

    break;
}



    case 'system': {
      try { await socket.sendMessage(sender, { react: { text: '🛸', key: msg.key } }); } catch (_) {}

      const uptime = getUptime();
      const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
      const nodeVersion = process.version;
      const platform = os.platform();
      
      const slDate = moment().tz('Asia/Colombo').format('YYYY-MM-DD');
      const slTimeNow = moment().tz('Asia/Colombo').format('HH:mm:ss');

      const sysInfo = `*🩸 PRINCE MD🩸*\n\n` +
              `┏━━━━━°⌜ \`WELCOME\` ⌟°━━━━━┓\n` +
                      `┃ *𝚄𝙿𝚃𝙸𝙼𝙴:* ${uptime}\n` +
                      `┃ *𝚁𝙰𝙼 𝚄𝚂𝙰𝙶𝙴:* ${ramUsage} MB / ${totalRam} GB\n` +
                      `┃ *𝙽𝙾𝙳𝙴 𝚅𝙴𝚁:* ${nodeVersion}\n` +
                      `┃ *𝙿𝙻𝙰𝚃𝙵𝙾𝚁𝙼:* ${platform}\n` +
                      `┃ *𝙳𝙰𝚃𝙴:* ${slDate}\n` +
                      `┃ *𝚃𝙸𝙼𝙴:* ${slTimeNow}\n` +
              `┗━━━━━°⌜ \`TO PRINCE\` ⌟°━━━━━┛\n\n` +
                      `> *BY PRINCE PREMIUM*`;

      await socket.sendMessage(sender, {
        image: { url: akira },
        caption: sysInfo,
        contextInfo: arabianCtx()
      }, { quoted: msg });

      break;
    }


case 'song':
case 'ytmp3':
case 'music':
case 'yta': {
    try {
        const query = args.join(' ');
        if (!query) return reply("🎵 *Please provide a song name or a YouTube link!*\n💡 Example: `.song master sir` or `.song <youtube link>`");

        try { await socket.sendMessage(sender, { react: { text: '🔎', key: msg.key } }); } catch (_) {}

        const API_TOKEN = "VK4fry";
        const YT_SEARCH_API = "https://whiteshadow-x-api.onrender.com/api/search/yt";
        const YT_DOWNLOAD_API = "https://whiteshadow-x-api.onrender.com/api/download/ytmp3";

        let youtubeUrl = null;
        let songTitle = "ORION Audio";

        const regex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s?#]+)/i;
        const match = query.match(regex);

        if (match) {
            youtubeUrl = match[0].trim();
            reply("🔗 _YouTube link detected. Fetching data from server..._");
        } else {
            reply(`🔍 _Searching YouTube for: "${query}"..._`);
            const searchRes = await axios.get(`${YT_SEARCH_API}?q=${encodeURIComponent(query)}&apitoken=${API_TOKEN}`);
            
            if (searchRes.data && searchRes.data.success && searchRes.data.result.length > 0) {
                youtubeUrl = searchRes.data.result[0].url;
                songTitle = searchRes.data.result[0].title || songTitle;
            }
        }

        if (!youtubeUrl) {
            try { await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }); } catch (_) {}
            return reply("❌ *Error:* Could not find the song or video!");
        }

        reply("Extracting 320kbps High-Quality MP3..._");
        
        let audioDownloadUrl = null;
        const dlRes = await axios.get(`${YT_DOWNLOAD_API}?url=${encodeURIComponent(youtubeUrl)}&quality=320&apitoken=${API_TOKEN}`);

        if (dlRes.data && dlRes.data.success && dlRes.data.result) {
            audioDownloadUrl = dlRes.data.result.download_url;
            songTitle = dlRes.data.result.title || songTitle;
        }

        if (!audioDownloadUrl) {
            try { await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }); } catch (_) {}
            return reply("❌ *Error:* Could not fetch the audio due to a server outage.");
        }

        try { await socket.sendMessage(sender, { react: { text: '📥', key: msg.key } }); } catch (_) {}

        const captionMsg = `Orion md Music System* ✨\n\n📌 *Title:* ${songTitle}\n💿 *Quality:* 320kbps Ultra-High Quality\n🚀 *Status:* downloading...`;
        await reply(captionMsg);

        const cleanFileName = songTitle.replace(/[\\/:*?"<>|]/g, "_").slice(0, 60) + ".mp3";
        
        await socket.sendMessage(sender, {
            audio: { url: audioDownloadUrl },
            mimetype: 'audio/mpeg',
            fileName: cleanFileName,
            ptt: false
        }, { quoted: msg });

        try { await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } }); } catch (_) {}

    } catch (e) {
        console.log("SONG CMD ERROR:", e);
        try { await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }); } catch (_) {}
        reply("❌ * Internal Error:* " + e.message);
    }
    break;
}

                    

case 'video':
case 'ytmp4':
case 'playvid': {
    try {
        const query = args.join(' ');
        if (!query) return reply("🎥 *Please provide a video name or a YouTube link!*");

        try { await socket.sendMessage(sender, { react: { text: '🔍', key: msg.key } }); } catch (_) {}

        const API_TOKEN = "VK4fry";
        const YT_SEARCH_API = "https://whiteshadow-x-api.onrender.com/api/search/yt";
        
        const isUrl = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s?#]+)/i.test(query);

        if (isUrl) {
            const url = query.match(/(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s?#]+)/i)[0];
            const buttonMessage = {
                text: `*🎥 Video Link Detected!*\n\n🔗 ${url}\n\n> *Choose the video quality you want below:*`,
                footer: 'BY PRINCE PREMIUM',
                buttons: [
                    { buttonId: `.viddl ${url} 720`, buttonText: { displayText: '🎥 720p HD' }, type: 1 },
                    { buttonId: `.viddl ${url} 480`, buttonText: { displayText: '🎞️ 480p' }, type: 1 },
                    { buttonId: `.viddl ${url} 360`, buttonText: { displayText: '📱 360p' }, type: 1 },
                    { buttonId: `.viddl ${url} 144`, buttonText: { displayText: '⬇️ 144p' }, type: 1 }
                ],
                headerType: 1
            };
            return await socket.sendMessage(sender, buttonMessage, { quoted: msg });
        }

        const searchRes = await axios.get(`${YT_SEARCH_API}?q=${encodeURIComponent(query)}&apitoken=${API_TOKEN}`);
        if (!searchRes.data || !searchRes.data.success || !searchRes.data.result || searchRes.data.result.length === 0) {
            return reply("❌ *Could not find a video!*");
        }

        const topResults = searchRes.data.result.slice(0, 5); 
        let listText = `*🔍VIDEO SEARCH*\n\n`;
        
        global.sadewVideoSearch[sender] = topResults.map(v => v.url);
        
        topResults.forEach((v, index) => {
            listText += `*${index + 1}.* ${v.title}\n⏱️ Duration: ${v.duration || "N/A"}\n\n`;
        });
        
        listText += `> *Reply to this message with the number (1, 2, 3...) of the video you want.* (No prefix needed)`;

        await socket.sendMessage(sender, { text: listText }, { quoted: msg });

    } catch (e) {
        console.log("VIDEO CMD ERROR:", e);
        reply("❌ *ERROR: Please try again later!*");
    }
    break;
}


case 'viddl': {
    let inputPath, outputPath;
    try {
        if (!args[0] || !args[1]) return;
        const url = args[0];
        const quality = args[1];

        try { await socket.sendMessage(sender, { react: { text: '📥', key: msg.key } }); } catch (_) {}
        reply(`Downloading & Converting ${quality}p Video..._`);

        let downloadUrl = "";
        let videoTitle = "Sadew-MD Video";

        try {
            const zantaApiUrl = `https://api.zanta-mini.store/api/ytdl?apiKey=zan_FIAO7Ayh_eo1vllkep6&url=${encodeURIComponent(url)}&type=mp4&quality=${quality}`;
            const res1 = await axios.get(zantaApiUrl);
            if (res1.data && res1.data.success && res1.data.result && res1.data.result.download_url) {
                downloadUrl = res1.data.result.download_url;
                videoTitle = res1.data.result.title || videoTitle;
            } else {
                throw new Error("Primary API Failed");
            }
        } catch (err1) {
            try {
                const dxzApiUrl = `https://ytdl-new-dxz.vercel.app/api/ytmp4?url=${encodeURIComponent(url)}&quality=${quality}`;
                const res2 = await axios.get(dxzApiUrl);
                if (res2.data) {
                    downloadUrl = res2.data.video_url || res2.data.download_url || res2.data.url;
                    videoTitle = res2.data.title || videoTitle;
                }
            } catch (err2) {
                console.log("[SADEW-MD] All APIs Failed.");
            }
        }

        if (!downloadUrl) return reply("❌ *Error: Could not get the video link!*");

        const fs = require('fs');
        const path = require('path');
        const crypto = require('crypto');

        const tempId = crypto.randomBytes(4).toString('hex');
        inputPath = path.join(__dirname, `input_${tempId}.mp4`);
        outputPath = path.join(__dirname, `output_${tempId}.mp4`);

        const response = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const writer = fs.createWriteStream(inputPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        reply("⚙️ _Preparing the video for WhatsApp..._");

        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .outputOptions([
                    '-c:v libx264',       // Video codec required by WhatsApp
                    '-c:a aac',           // Audio codec required by WhatsApp
                    '-preset ultrafast',  // Convert quickly
                    '-crf 28',            // Balance out the quality
                    '-movflags +faststart' // So it can start playing right away
                ])
                .save(outputPath)
                .on('end', resolve)
                .on('error', (err) => {
                    console.error("FFMPEG ERROR:", err);
                    reject(err);
                });
        });

        const slDate = moment().tz('Asia/Colombo').format('YYYY-MM-DD');
        const slTimeNow = moment().tz('Asia/Colombo').format('HH:mm:ss');

        let caption = `*PRINCE MD*\n\n` +
                      `*TITLE :* ${videoTitle}\n` +
                      `*QUALITY :* ${quality}p\n` +
                      `__________________________\n\n` +
                      `*DATE :* ${slDate} | ⌚ *TIME :* ${slTimeNow}\n\n` +
                      `> *BY PRINCE PREMIUM*`;

        await socket.sendMessage(sender, {
            video: fs.readFileSync(outputPath),
            mimetype: 'video/mp4',
            caption: caption,
            fileName: `Sadew_Video_${quality}p.mp4`
        }, { quoted: msg });

        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        try { await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } }); } catch (_) {}

    } catch (e) {
        console.log("VIDDL CMD ERROR:", e);
        reply("❌ *ERROR: This video could not be downloaded!*");
        
        const fs = require('fs');
        try {
            if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (err) {}
    }
    break;
}
                    
case 'fb':
case 'facebook': {
    try {
        const query = args.join(' ');
        if (!query) return reply("🔗 *Send me a video link !*");
        
        if (!query.includes('facebook.com') && !query.includes('fb.watch')) {
            return reply("❌ *This Not Valid Facebook Link !*");
        }

        try { await socket.sendMessage(sender, { react: { text: '📥', key: msg.key } }); } catch (_) {}

        const fbRes = await axios.get(`https://www.movanest.xyz/v2/fbdown?url=${encodeURIComponent(query)}`);
        
        if (!fbRes.data.status || !fbRes.data.results.length) {
            return reply("❌ *I cant get video link !*");
        }

        const videoData = fbRes.data.results[0];
        const videoUrl = videoData.hdQualityLink || videoData.normalQualityLink; 
        const quality = videoData.hdQualityLink ? 'High Definition (HD)' : 'Standard (SD)';

        const response = await axios.get(videoUrl, { 
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            }
        });
        const videoBuffer = Buffer.from(response.data);
        const fileSizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(2);

        const slDate = moment().tz('Asia/Colombo').format('YYYY-MM-DD');
        const slTimeNow = moment().tz('Asia/Colombo').format('HH:mm:ss');

        const caption = `*PRINCE MD*\n\n` +
                        `*TITLE :* ${videoData.title !== "No video title" ? videoData.title : 'Facebook Video'}\n` +
                        `*DURATION :* ${videoData.duration}\n` +
                        `*QUALITY :* ${quality}\n` +
                        `*SIZE :* ${fileSizeMB} MB\n` +
                        `__________________________\n\n` +
                        `*DATE :* ${slDate} | ⌚ *TIME :* ${slTimeNow}\n\n` +
                        `> *BY PRINCE PREMIUM*`;

        await socket.sendMessage(sender, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            caption: caption,
            fileName: `fb_video_${slTimeNow}.mp4`
        }, { quoted: msg });

        try { await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } }); } catch (_) {}

    } catch (e) {
        console.log("FB CMD ERROR:", e);
        reply("❌ *API error !*");
        try { await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }); } catch (_) {}
    }
    break;
}


case 'tiktok':
case 'tt': {
    try {
        const query = args.join(' ');
        if (!query) return reply("🔗 *Send me a tiktok link !*");
        
        const tiktokRegex = /(tiktok\.com|vt\.tiktok\.com)/;
        if (!tiktokRegex.test(query)) {
            return reply("❌ *This is not valid tiktok link !*");
        }

        try { await socket.sendMessage(sender, { react: { text: '📥', key: msg.key } }); } catch (_) {}

        const https = require("https");
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });

        const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(query)}`;
        const response = await axios.get(apiUrl, { httpsAgent, timeout: 15000 });
        const data = response.data;

        if (!data || !data.data) {
            return reply("❌ *I cant get video !*");
        }

        const videoUrl = data.data.hdplay || data.data.play;
        if (!videoUrl) throw new Error("No video URL found.");

        const isHD = data.data.hdplay ? "High Quality (HD) ✅" : "Normal Quality ⚠️";
        const title = data.data.title || "TikTok Video";

        const videoStream = await axios.get(videoUrl, {
            httpsAgent,
            responseType: 'arraybuffer',
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            }
        });
        
        const videoBuffer = Buffer.from(videoStream.data);
        const fileSizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(2);

        const slDate = moment().tz('Asia/Colombo').format('YYYY-MM-DD');
        const slTimeNow = moment().tz('Asia/Colombo').format('HH:mm:ss');

        const caption = `*ORION MD*\n\n` +
                        `*TITLE :* ${title}\n` +
                        `*QUALITY :* ${isHD}\n` +
                        `*SIZE :* ${fileSizeMB} MB\n` +
                        `*WATERMARK :* No\n` +
                        `__________________________\n\n` +
                        `*DATE :* ${slDate} | ⌚ *TIME :* ${slTimeNow}\n\n` +
                        `>BY PRINCE PREMIUM⋆`;

        if (videoBuffer.length > 40 * 1024 * 1024) {
            await socket.sendMessage(sender, {
                document: videoBuffer,
                mimetype: "video/mp4",
                fileName: `tiktok_HD_${slTimeNow}.mp4`,
                caption: caption
            }, { quoted: msg });
        } else {
            await socket.sendMessage(sender, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption: caption,
                fileName: `tiktok_HD_${slTimeNow}.mp4`
            }, { quoted: msg });
        }

        try { await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } }); } catch (_) {}

    } catch (e) {
        console.log("TIKTOK CMD ERROR:", e);
        let errorMsg = e.message.includes("timeout")
            ? "❌ *Timeout:* Server took too long."
            : "❌ *Known Error*";
        reply(errorMsg);
        try { await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }); } catch (_) {}
    }
    break;
}  
case 'ttp': {
    try {
        const axios = require("axios");
        const fs = require("fs/promises");
        const path = require("path");
        const os = require("os");
        const { spawn } = require("child_process");
        const moment = require('moment-timezone');
        
        const ffmpegPath = require('ffmpeg-static'); 

        let query = args.join(' ');
        if (!query && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
            query = msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
        } else if (!query && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text) {
            query = msg.message.extendedTextMessage.contextInfo.quotedMessage.extendedTextMessage.text;
        }

        const extractUrl = (text) => {
            const match = String(text || "").match(/https?:\/\/[^\s]+/i);
            return match ? match[0].replace(/[),.]+$/, "") : "";
        };
        
        const tiktokUrl = extractUrl(query);
        const quality = /\b(normal|sd|720)\b/i.test(query) ? "normal" : "hd";

        if (!tiktokUrl) return reply("🎥 *Please provide a TikTok photo slideshow link!*");
        if (!/tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com/i.test(tiktokUrl)) {
            return reply("❌ *This is not a valid TikTok link!*");
        }

        try { await socket.sendMessage(sender, { react: { text: '📥', key: msg.key } }); } catch (_) {}
        reply("📥 _Preparing the TikTok photo video... please wait. ⏳_");

        const TIKWM_API = "https://www.tikwm.com/api/";
        const MAX_IMAGES = 30;
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        
        const buildTikwmUrl = (url) => (!url ? "" : /^https?:\/\//i.test(url) ? url : `https://www.tikwm.com${url.startsWith("/") ? "" : "/"}${url}`);
        
        const fetchTikwmData = async (url) => {
            for (let i = 1; i <= 3; i++) {
                try {
                    const res = await axios.get(TIKWM_API, { params: { url, hd: 1 }, headers: { "User-Agent": "Mozilla/5.0" }});
                    if (res.data?.code === 0) return res.data;
                } catch (e) { if (i < 3) await sleep(2000); }
            }
            throw new Error("Could not fetch data from the TikTok API.");
        };

        const pickImages = (data) => {
            const root = data?.data || {};
            const lists = [root.images, root.image_post?.images];
            const set = new Set();
            for (const list of lists) {
                if (Array.isArray(list)) list.forEach(img => {
                    if (typeof img === 'string') set.add(buildTikwmUrl(img));
                    else if (img?.url || img?.display_image) set.add(buildTikwmUrl(img.url || img.display_image));
                });
            }
            return [...set].slice(0, MAX_IMAGES);
        };

        const downloadBuffer = async (url, isAudio = false) => {
            const res = await axios.get(url, { responseType: "arraybuffer", headers: { "User-Agent": "Mozilla/5.0" } });
            return { buffer: Buffer.from(res.data), type: isAudio ? ".mp3" : ".jpg" };
        };

        const getAudioDuration = (audioPath) => {
            return new Promise((resolve) => {
                const child = spawn(ffmpegPath, ["-i", audioPath]);
                let output = "";
                child.stderr.on("data", d => output += d);
                child.on("close", () => {
                    const match = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)/);
                    if (match) {
                        const hours = parseInt(match[1], 10);
                        const minutes = parseInt(match[2], 10);
                        const seconds = parseFloat(match[3]);
                        resolve((hours * 3600) + (minutes * 60) + seconds);
                    } else {
                        resolve(15); 
                    }
                });
                child.on("error", () => resolve(15));
            });
        };

        const runCommand = (cmd, args) => {
            return new Promise((resolve, reject) => {
                const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
                let out = ""; child.stdout.on("data", d => out += d);
                let err = ""; child.stderr.on("data", d => err += d);
                
                const timer = setTimeout(() => {
                    child.kill('SIGKILL');
                    reject(new Error("FFmpeg Process Timeout! The process got stuck."));
                }, 180000);

                child.on("close", code => {
                    clearTimeout(timer);
                    code === 0 ? resolve(out) : reject(new Error(`FFmpeg Failed: ${err.slice(-500)}`));
                });
                child.on("error", (e) => {
                    clearTimeout(timer);
                    reject(new Error(`FFmpeg error: ${e.message}`));
                });
            });
        };

        const createVideo = async (imagePaths, audioPath, outPath, qlty) => {
            const profile = qlty === "hd" ? { w: 720, h: 1280 } : { w: 720, h: 1280 };
            const scaleFilter = `scale=${profile.w}:${profile.h}:force_original_aspect_ratio=decrease,pad=${profile.w}:${profile.h}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,format=yuv420p`;

            const listPath = path.join(path.dirname(outPath), "images.txt");
            let listBody = "";

            if (imagePaths.length === 1) {
                listBody += `file '${imagePaths[0].replace(/\\/g, "/")}'\n`;
                listBody += `duration 600.000\n`; 
                listBody += `file '${imagePaths[0].replace(/\\/g, "/")}'\n`;
            } else {
                let audioDuration = await getAudioDuration(audioPath);
                if (!audioDuration || audioDuration <= 0) audioDuration = 15; 
                
                const eachDuration = audioDuration / imagePaths.length;
                for (let i = 0; i < imagePaths.length; i++) {
                    listBody += `file '${imagePaths[i].replace(/\\/g, "/")}'\n`;
                    if (i === imagePaths.length - 1) {
                        listBody += `duration 600.000\n`; 
                    } else {
                        listBody += `duration ${eachDuration.toFixed(3)}\n`;
                    }
                }
                listBody += `file '${imagePaths[imagePaths.length - 1].replace(/\\/g, "/")}'\n`;
            }

            await fs.writeFile(listPath, listBody);

            await runCommand(ffmpegPath, [
                "-y", "-f", "concat", "-safe", "0", "-i", listPath, "-i", audioPath,
                "-vf", scaleFilter,
                "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28",
                "-c:a", "aac", "-shortest", "-fflags", "+genpts", "-movflags", "+faststart", outPath
            ]);
            return profile;
        };

        const result = await fetchTikwmData(tiktokUrl);
        const images = pickImages(result);
        const audioUrl = buildTikwmUrl(result.data?.music_info?.play || result.data?.music);
        
        if (!images.length || !audioUrl) throw new Error("This is not a photo slideshow, or the audio could not be fetched.");

        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sadew-ttp-"));
        let finalVideoBuffer;
        let videoMeta;

        try {
            const imagePaths = [];
            for (let i = 0; i < images.length; i++) {
                const img = await downloadBuffer(images[i], false);
                const p = path.join(tmpDir, `img${i}${img.type}`);
                await fs.writeFile(p, img.buffer);
                imagePaths.push(p);
            }
            const aud = await downloadBuffer(audioUrl, true);
            const audPath = path.join(tmpDir, `aud${aud.type}`);
            await fs.writeFile(audPath, aud.buffer);

            const outPath = path.join(tmpDir, "out.mp4");
            videoMeta = await createVideo(imagePaths, audPath, outPath, quality);
            finalVideoBuffer = await fs.readFile(outPath);
        } finally {
            await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        }

        const slDate = moment().tz('Asia/Colombo').format('YYYY-MM-DD');
        const slTimeNow = moment().tz('Asia/Colombo').format('HH:mm:ss');
        const fileSizeMB = (finalVideoBuffer.length / (1024 * 1024)).toFixed(2);

        const caption = `*↳ ❝ [PRINCE MD] ¡! ❞*\n\n` +
                        `🎬 *TITLE :* TikTok Photo Video\n` +
                        `📸 *IMAGES :* ${images.length}\n` +
                        `📺 *QUALITY :* ${videoMeta.w}x${videoMeta.h}\n` +
                        `⚖️ *SIZE :* ${fileSizeMB} MB\n` +
                        `__________________________\n\n` +
                        `📅 *DATE :* ${slDate} | ⌚ *TIME :* ${slTimeNow}\n\n` +
                        `> *BY PRINCE PREMIUM*`;

        try { await socket.sendMessage(sender, { react: { text: '⬆️', key: msg.key } }); } catch (_) {}

        await socket.sendMessage(sender, {
            video: finalVideoBuffer,
            mimetype: 'video/mp4',
            caption: caption,
            fileName: `Sadew_TikTok_${slTimeNow}.mp4`
        }, { quoted: msg });

        try { await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } }); } catch (_) {}

    } catch (e) {
        console.log("TTP CMD ERROR:", e);
        reply(`❌ *ERROR:* ${e.message || "Unknown error"}\n\nPlease try a different link!`);
        try { await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }); } catch (_) {}
    }
    break;
}

case 'ai':
case 'akira':
case 'cuty': {
    try { await socket.sendMessage(sender, { react: { text: '🍫', key: msg.key } }); } catch (_) {}
    const { NiyoXClient } = require("niyox");
    const title = "HELLO FRIEND";
    const footer = "> *PRINCE-MD*";

    const q = msg.message?.conversation || 
              msg.message?.extendedTextMessage?.text || 
              msg.message?.imageMessage?.caption || 
              msg.message?.videoMessage?.caption || 
              '';

    if (!q || q.trim() === '') {
        return await socket.sendMessage(sender, { text: "Go on, say something, I'm cuty Girl 🎀" }, { quoted: msg });
    }

    const prompt = `You are a warm, caring, human-like friend chatting with someone on WhatsApp. Keep your tone friendly, upbeat, and casual — like texting a close friend. If the user's message is only emojis, feel free to reply with just emojis too. Pay attention to the flow of the conversation and reply in a way that fits what was said before. Reply in the same language the user writes in. Keep your replies under 300 characters. Avoid generic greetings like "hello" or "how can I help you" — you're not a customer-support assistant, you're a real, relatable personality. Your name is cuty Girl 🎀. Respond with empathy and natural human warmth, the way a supportive friend would. If someone asks who created you, just say you were made by sadew rashmika. User Message: ${q}`;

    try {
        const client = new NiyoXClient({ sessionId: sender, timeout: 15000 });
        const response = await client.chat(prompt);

        const aiResponse = response?.result;

        if (!aiResponse) {
            return await socket.sendMessage(sender, { text: "❌ Sorry honey known error" }, { quoted: msg });
        }

        await socket.sendMessage(sender, {
            image: { url: akira },
            caption: `${title}\n\n${aiResponse}\n\n${footer}`,
            contextInfo: arabianCtx() 
        }, { quoted: msg });

    } catch (err) {
        console.error("NiyoX Error:", err.message);
        await socket.sendMessage(sender, { text: "❌ I need cooldown time" }, { quoted: msg });
    }
    break;
}

case 'darkai':
case 'wormgpt': {
    try {
        const query = args.join(' ');
        if (!query) return reply("❌ *Please enter a question or a command.*\n\n💡 Example: `.darkai write a hacking script`");

        const from = msg.key.remoteJid;

        await socket.sendMessage(from, { react: { text: '💀', key: msg.key } });
        let initialMsg = await socket.sendMessage(from, { text: '👾 *𝗣𝗿𝗼𝗰𝗲𝘀𝘀𝗶𝗻𝗴...* ⏳' }, { quoted: msg });

        const WOLF_API_KEY = "wxa_f_4e840b5e42";
        const targetUrl = `https://apis.xwolf.space/api/ai/wormgpt?q=${encodeURIComponent(query)}&key=${WOLF_API_KEY}`;
        
        const response = await axios.get(targetUrl, { timeout: 40000 });

        if (response.data) {
            const aiReply = response.data.result || response.data.response || response.data.reply;

            if (aiReply) {
                const finalMessage = `*PRINCE DARK GPT*\n\n` +
                                     `${aiReply}\n\n` +
                                     `> *BY PRINCE PREMIUM*`;

                await socket.sendMessage(from, {
                    text: finalMessage,
                    edit: initialMsg.key
                });
                
                await socket.sendMessage(from, { react: { text: '✅', key: msg.key } });

            } else {
                await socket.sendMessage(from, { 
                    text: `❌ *WormGPT Raw Response:* \n\n${JSON.stringify(response.data, null, 2)}`,
                    edit: initialMsg.key
                });
            }
        } else {
            await socket.sendMessage(from, { 
                text: "❌ *Error:* Received an empty response from the API.",
                edit: initialMsg.key
            });
            await socket.sendMessage(from, { react: { text: '❌', key: msg.key } });
        }

    } catch (e) {
        console.log("WORM-GPT ERROR:", e);
        try { 
            await socket.sendMessage(msg.key.remoteJid, { text: `❌ *WormGPT API Error:* ${e.message}` });
            await socket.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } }); 
        } catch (_) {}
    }
    break;
}
					
        
case 'vv': {
      let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted) return reply(`Reply to a view-once message with *.vv*`);
      // Un message "vue unique" est enveloppé : on récupère le vrai contenu à l'intérieur
      quoted = quoted.viewOnceMessageV2?.message
            || quoted.viewOnceMessageV2Extension?.message
            || quoted.viewOnceMessage?.message
            || quoted;
      try {
        const qt = MEDIA_TYPES.find(t => quoted[t]);
        if (!qt) return reply('Reply to a view-once image, video or audio with *.vv*');
        const media = await downloadQuotedMedia({ [qt]: quoted[qt] });
        if (!media?.buffer) return reply('Could not download that media.');
        
        if (qt === 'imageMessage') {
          await socket.sendMessage(sender, { image: media.buffer, caption: 'View-once unlocked 👀', contextInfo: arabianCtx() }, { quoted: msg });
        } else if (qt === 'videoMessage') {
          await socket.sendMessage(sender, { video: media.buffer, caption: 'View-once unlocked 👀', contextInfo: arabianCtx() }, { quoted: msg });
        } else if (qt === 'audioMessage') {
          await socket.sendMessage(sender, { audio: media.buffer, mimetype: quoted.audioMessage?.mimetype || 'audio/mpeg', ptt: quoted.audioMessage?.ptt, contextInfo: arabianCtx() }, { quoted: msg });
        } else if (qt === 'stickerMessage') {
          await socket.sendMessage(sender, { sticker: media.buffer, contextInfo: arabianCtx() }, { quoted: msg });
        } else {
          await socket.sendMessage(sender, { document: media.buffer, mimetype: quoted[qt]?.mimetype || 'application/octet-stream', fileName: quoted[qt]?.fileName || 'file', contextInfo: arabianCtx() }, { quoted: msg });
        }
        
        try { await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } }); } catch (_) {}
      } catch (e) { await reply(`Failed: ${e.message}`); }
      break;
    }


    case 'active': {
      if (!isOwner && !isDevUser) return reply('Owner/Dev only.');
      
      const sockets = typeof activeSockets !== 'undefined' ? activeSockets : new Map();
      const nums = Array.from(sockets.keys());
      
      const responseText = `*↳ ❝ [ACTIVE SESSIONS] ¡! ❞*\n\n` +
                           `> *\`📡 𝙲𝙾𝚄𝙽𝚃 :\`* ${nums.length}\n\n` +
                           `${nums.map((n, i) => `> *\`${i + 1}.\`* +${n}`).join('\n')}\n\n` +
                           `> *BY PRINCE PREMIUM*`;
                           
      await reply(responseText);
      break;
    }
case 'xnxx':
case 'xxx': {
    try {
        const query = args.join(' ');
        if (!query) return await socket.sendMessage(sender, { text: '🔗 *Send me a search query!*\n\nExample: `.xnxx sri lankan`' }, { quoted: msg });

        try { await socket.sendMessage(sender, { react: { text: '🔍', key: msg.key } }); } catch (_) {}

        if (!global.xnxxContexts) global.xnxxContexts = {};

const searchApiUrl = `https://api.zanta-mini.store/api/xnxx/search?apiKey=zan_FIAO7Ayh_eo1vllkep6&url=${encodeURIComponent(query)}`;
        
        let searchResponse;
        try {
            searchResponse = await axios.get(searchApiUrl, { timeout: 15000 });
        } catch (apiErr) {
            console.error('XNXX search API error:', apiErr.message);
            return await socket.sendMessage(sender, { text: '❌ *Search failed! API error, try again later.*' }, { quoted: msg });
        }

        const results = searchResponse.data?.results || [];
        
        if (!results || !results.length) {
            return await socket.sendMessage(sender, { text: '🤷‍♀️ *No results found for:* ' + query }, { quoted: msg });
        }

        global.xnxxContexts[sender] = { results: results.slice(0, 15) };

        let listText = `*🔍 SEARCH*\n*🔎 Query:* _${query}_\n*📊 Results:* ${Math.min(results.length, 15)}\n\n`;

        results.slice(0, 15).forEach((video, idx) => {
            listText += `*${idx + 1}.* ${video.title || 'No title'}\n\n`;
        });

        listText += `\n*📩 Reply with the number from the list above (1-${Math.min(results.length, 15)}) to download.*\n\n> *BY PRINCE PREMIUM*`;

        await socket.sendMessage(sender, { text: listText }, { quoted: msg });
        try { await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } }); } catch (_) {}

    } catch (err) {
        console.error('XNXX command error:', err.message);
        try { await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }); } catch (_) {}
        await socket.sendMessage(sender, { text: '❌ *XNXX search failed!*' }, { quoted: msg });
    }
    break;
}

    case 'npm': {
      const pkg = args[0]?.trim();
      if (!pkg) return reply(`Usage: .npm <package>`);
      
      try {
        const res = await axios.get(`https://registry.npmjs.org/${pkg}`, { timeout: 10000 });
        const d = res.data;
        
        const npmInfo = `*↳ ❝ [PRINCE MD] ¡! ❞*\n` +
                        `⊹₊⟡⋆ 𝗡𝗮𝗺𝗲 - ${d.name} 𝜗𝜚⋆\n\n` +
                        `> *\`📦 𝚅𝙴𝚁𝚂𝙸𝙾𝙽 :\`* ${d['dist-tags']?.latest || 'N/A'}\n` +
                        `> *\`📝 𝙳𝙴𝚂𝙲 :\`* ${(d.description || 'N/A').slice(0, 100)}\n` +
                        `> *\`👤 𝙰𝚄𝚃𝙷𝙾𝚁 :\`* ${d.author?.name || 'N/A'}\n` +
                        `> *\`📄 𝙻𝙸𝙲𝙴𝙽𝚂𝙴 :\`* ${d.license || 'N/A'}\n` +
                        `> *\`🔗 𝙻𝙸𝙽𝙺 :\`* https://npmjs.com/package/${d.name}\n\n` +
                        `> *BY PRINCE PREMIUM*`;

        await socket.sendMessage(sender, { 
          image: { url: akira },
          caption: npmInfo, 
          contextInfo: typeof arabianCtx === 'function' ? arabianCtx() : {} 
        }, { quoted: msg });

      } catch (e) { 
        await reply(`Package not found: ${pkg}`); 
      }
      break;
    }





                    

case 'gimg':
case 'img': {
  const q = args.join(' ').trim();
  if (!q) return reply(`Usage: .gimg <query>`);
  try {
    await socket.sendMessage(sender, {
      react: { text: '🖼️', key: msg.key }
    });
  } catch (_) {}

  try {
    const res = await axios.get(
      `https://www.movanest.xyz/v2/pinterest?query=${encodeURIComponent(q)}&pageSize=10`
    );

    if (res.data && res.data.results && res.data.results.length > 0) {
      const random =
        res.data.results[
          Math.floor(Math.random() * res.data.results.length)
        ];

      const imgUrl = random.image;
      await socket.sendMessage(
        sender,
        {
          image: { url: imgUrl },
          caption:
`*ORION MD IMGS*

*₊❏❜ ⋮ 🔍 Search:* ${q}

> *BY PRINCE PREMIUM*`
        },
          { quoted: msg }
      );
    } else {
      await reply(`I cant find it !`);
    }
  } catch (e) {
    console.error(e);
    await reply(`Image search failed:\n${e.message}`);
  }
  break;
}


    case 'getdp':
    case 'pfp': {
      try {
        const qCtx = msg.message?.extendedTextMessage?.contextInfo;
        let target;
        if (qCtx?.mentionedJid?.[0]) {
          target = qCtx.mentionedJid[0];
        } else if (qCtx?.participant) {
          target = qCtx.participant;
        } else if (args[0]?.replace(/[^0-9]/g, '')) {
          target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        } else {
          target = sender;
        }

        let dpUrl;
        try {
          dpUrl = await socket.profilePictureUrl(target, 'image');
        } catch (e) {
          return reply('No DP or Privacy protected');
        }

        await socket.sendMessage(sender, { 
          image: { url: dpUrl }, 
          caption: `*↳ ❝ [🩸 PRINCE MD 🩸] ¡! ❞*\n\n📷 Profile picture of @${target.split('@')[0]}`, 
          mentions: [target] 
        }, { quoted: msg });

      } catch (err) {
        console.error(err);
        reply('Known Error');
      }
      break;
    }


case 'add': {
    if (!isOwner) {
        return await socket.sendMessage(sender, {
            text: '👥 This command use only owner.'
        }, { quoted: msg });
    }

   if (!isGroup) {
        return await socket.sendMessage(sender, {
            text: '👥 This command use only group.'
        }, { quoted: msg });
    }

    const q = msg.message?.conversation || 
              msg.message?.extendedTextMessage?.text || '';

    const number = q.trim().replace(/[^0-9]/g, '');
    if (!number) {
        return await socket.sendMessage(sender, { 
            text: '*❗ Please provide a phone number!* \n📋 Example: .add 55xxxxxxx' 
        });
    }

    try {
        await socket.sendMessage(sender, { react: { text: '➕', key: msg.key } });

        const userJid = number + '@s.whatsapp.net';
        await socket.groupParticipantsUpdate(msg.key.remoteJid, [userJid], 'add');

        await socket.sendMessage(sender, { 
            text: `*✅ Successfully added +${number} to the group!*` 
        }, { quoted: msg });

        await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } });

    } catch (err) {
        console.error('Add Error:', err);
        await socket.sendMessage(sender, { 
            text: `*❌ Failed to add member!*\n*Reason:* ${err.message}` 
        });
    }
    break;
}

    case 'bio':
    case 'setbio': {
      const text = args.join(' ').trim();
      if (!text) return reply(`Usage: ${sessionConfig.PREFIX || '!'}bio <text>`);
      try { await socket.updateProfileStatus(text); await reply(`✅ Bio updated: ${text}`); }
      catch (e) { await reply(`Failed: ${e.message}`); }
      break;
    }

                                                
case 'seticon': {
    if (!isGroup) return reply('Groups only.');
    
    const groupId = msg.key.remoteJid; 

    const quotedIcon = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedIcon?.imageMessage) return reply(`Reply to an image with *.seticon*`);

    try {
        const media = await downloadQuotedMedia(quotedIcon);
        
        if (!media || !media.buffer) return reply('Could not download image.');

        await socket.updateProfilePicture(groupId, media.buffer);
        
        await reply('✅ Group icon updated successfully.');
    } catch (e) { 
        console.log(e);
        await reply(`seticon failed: ${e.message}`); 
    }
    break;
}
                    

    case 'leave': {
      if (!isGroup) return reply('Groups only.');
      if (!isOwner && !isSessionOwner && !isDevUser) return reply('Only owner can make the bot leave.');
      try {
        await reply('👋 Goodbye! Leaving group...');
        await delay(1500);
        await socket.groupLeave(sender);
      } catch (e) { await reply(`leave failed: ${e.message}`); }
      break;
    }


case 'hentai': {
  try {
    await socket.sendMessage(sender, {
      react: { text: '🔞', key: msg.key }
    });
  } catch (_) {}

  try {
    const response = await axios.get('https://www.movanest.xyz/v2/hentai?query=random');
    const data = response.data;

    if (data && data.status && data.result && data.result.length > 0) {
      const results = data.result;
      const randomVideo = results[Math.floor(Math.random() * results.length)];
      
      const videoUrl = randomVideo.video_1 || randomVideo.video_2;
      if (!videoUrl) return reply("No Video Available !");

      await socket.sendMessage(
        sender, 
        {
          video: { url: videoUrl },
          caption:
`*DOWNLOAD HENTAI*

*❏ ⋮ Title:* ${randomVideo.title}
*❏ ⋮ Category:* ${randomVideo.category}
*❏ ⋮ Views:* ${randomVideo.views_count}

> *BY PRINCE PREMIUM*`
        }, 
        { quoted: msg }
      );
    } else {
      await reply("Server Error ! pls try again later .");
    }

  } catch (error) {
    console.error(error);
    await reply(`Error! API:\n${error.message}`);
  }
  break;
}


case 'styletext':
case 'fancy':
case 'fancytext': {
    const q = msg.message?.conversation || 
              msg.message?.extendedTextMessage?.text || 
              msg.message?.imageMessage?.caption || '';

    const textToStyle = q.replace(/^[^\s]+\s+/, '').trim();

    if (!textToStyle || textToStyle === '') {
        return await socket.sendMessage(sender, { 
            text: '*❓ Text Is Missing.* \n📋 Ex: .styletext Hello World' 
        });
    }

    try {
        await socket.sendMessage(sender, { react: { text: '✨', key: msg.key } });

        const response = await axios.get(`https://www.movanest.xyz/v2/fancytext?word=${encodeURIComponent(textToStyle)}`);
        
        if (!response.data.status) {
            throw new Error('API processing failed');
        }

        const results = response.data.results;
        
        let styledMsg = `*✨ FANCY TEXT STYLES *\n\n`;
        styledMsg += `*Original:* ${textToStyle}\n\n`;
        styledMsg += `*┏━━━━━°⌜ \`赤い糸\` ⌟°━━━━━┓*\n`;

        results.slice(0, 25).forEach((styledText, index) => {
            styledMsg += `*┃ ${index + 1}.* ${styledText}\n`;
        });
        
        styledMsg += `*┗━━━━━°⌜ \`赤い糸\` ⌟°━━━━━┛*\n\n`;
        styledMsg += `> *PRINCE PREMIUM*`;

        await socket.sendMessage(sender, { 
            image: { url: akira }, 
            text: styledMsg
        }, { quoted: msg });

        await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } });

    } catch (err) {
        console.error('StyleText API Error:', err);
        await socket.sendMessage(sender, { 
            text: `*❌ Known Error Try Again*` 
        });
    }
    break;
}



case 'lvcal': {
    const q = msg.message?.conversation || 
              msg.message?.extendedTextMessage?.text || '';

    const parts = q.trim().split('&');
    if (parts.length !== 2) {
        return await socket.sendMessage(sender, { 
            text: '*❗ Please provide two names!* \n📋 Example: .lvcal John & Jane' 
        });
    }

    try {
        await socket.sendMessage(sender, { react: { text: '💕', key: msg.key } });

        const name1 = parts[0].trim();
        const name2 = parts[1].trim();
        
        const combined = name1.toLowerCase() + name2.toLowerCase();
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            hash = combined.charCodeAt(i) + ((hash << 5) - hash);
        }
        const percentage = Math.abs(hash % 101);

        let hearts = '';
        if (percentage >= 90) hearts = '💖💖💖💖💖';
        else if (percentage >= 70) hearts = '💖💖💖💖';
        else if (percentage >= 50) hearts = '💖💖💖';
        else if (percentage >= 30) hearts = '💖💖';
        else hearts = '💖';

        let shipText = `*↳ ❝ [PRINCE MD] ¡! ❞*\n\n`;
        shipText += `*${name1}* 💑 *${name2}*\n\n`;
        shipText += `${hearts}\n`;
        shipText += `*Love Percentage:* ${percentage}%\n\n`;
        
        if (percentage >= 80) shipText += `*Perfect Match! 🔥💕*`;
        else if (percentage >= 60) shipText += `*Great Chemistry! ✨💝*`;
        else if (percentage >= 40) shipText += `*Good Potential! 💫💓*`;
        else if (percentage >= 20) shipText += `*Needs Work! 🤔💔*`;
        else shipText += `*Not Meant To Be! 😢💔*`;
        
        shipText += `\n\n> *BY PRINCE PREMIUM*`;

        await socket.sendMessage(sender, { text: shipText }, { quoted: msg });
        await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } });

    } catch (err) {
        console.error('Ship Error:', err);
        await socket.sendMessage(sender, { text: '*❌ Love calculator failed!*' });
    }
    break;
}


case 'hack': {
    try {
        const from = msg.key.remoteJid; 
        const steps = [
            ' *Prince 𝐇𝐚𝐜𝐤 𝐒𝐭𝐚𝐫𝐢𝐧𝐠...*',
            '`ɪɴɪᴛɪᴀʟɪᴢɪɴɢ ʜᴀᴄᴋɪɴɢ ᴛᴏᴏʟꜱ...` 🛠️',
            '`ᴄᴏɴɴᴇᴄᴛɪɴɢ ᴛᴏ ʀᴇᴍᴏᴛᴇ ꜱᴇʀᴠᴇʀ...` 🌐',
            '```[##] 20%``` ⏳',
            '```[####] 40%``` ⏳',
            '```[######] 60%``` ⏳',
            '```[########] 80%``` ⏳',
            '```[##########] 100%``` ✅',
            '🔒 *𝐒ystem 𝐁reach: 𝐒uccessful!* 🔓',
            '*Orion 𝐇acking 𝐒uccessful 🎭*',
        ];

        await socket.sendMessage(from, { react: { text: '💀', key: msg.key } });

        let initialMsg = await socket.sendMessage(from, { text: steps[0] }, { quoted: msg });

        for (let i = 1; i < steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000)); 

            await socket.sendMessage(from, {
                text: steps[i],
                edit: initialMsg.key,
                contextInfo: typeof arabianCtx === 'function' ? arabianCtx() : {} 
            });
        }

    } catch (e) {
        console.log(e);
        reply(`❌ *Error!* ${e.message}`);
    }
    break;
}

} 

const plugin = cmd.findPluginForCommand(command);
if (plugin) {
    try {
        let pluginGroupMetadata = isGroup ? groupMetadata : null;
        let pluginIsAdmin = false;
        let pluginIsBotAdmin = false;
        if (isGroup) {
            try {
                if (!pluginGroupMetadata || !pluginGroupMetadata.participants) {
                    pluginGroupMetadata = await Group.getGroupMetadata(socket, msg.key.remoteJid);
                }
                const pluginParticipants = Group.getParticipants(pluginGroupMetadata);
                pluginIsAdmin = Group.isParticipantAdmin(pluginParticipants, nowsender) || isOwner;
                pluginIsBotAdmin = await Group.isBotAdmin(socket, msg.key.remoteJid);
            } catch (metaErr) {
                console.error('Plugin group metadata error:', metaErr.message);
            }
        }
        await plugin.handler({
            sock: socket,
            socket,
            msg,
            sender,
            command,
            args,
            reply,
            m,
            quoted,
            isOwner,
            isGroup,
            isAdmin: pluginIsAdmin,
            isBotAdmin: pluginIsBotAdmin,
            groupMetadata: pluginGroupMetadata,
            botNumber,
            senderNumber,
            metaQuote: msg,
            sessionConfig,
            activeSockets
        });
    } catch (pluginErr) {
        console.error(`Plugin ${plugin.name} error:`, pluginErr.message);
    }
}

        } catch (error) {
            console.error('Command handler error:', error);
            await socket.sendMessage(sender, {
                text: `❌ ERROR\nAn error occurred: ${error.message}`,
            });
        }
    });
}

router.get('/', async (req, res) => {
    const { number } = req.query;

    if (!number) {
        return res.status(400).send({
            error: 'Number parameter is required'
        });
    }
    
    if (activeSockets.size >= 77) {
        return res.status(429).send({ 
            status: 'limit_reached',
            message: 'Active connections limit reached. Please try again in 1 hour.'
        });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    if (sanitizedNumber.length < 8) {
        return res.status(400).send({ error: 'Invalid number' });
    }

    const current = activeSockets.get(sanitizedNumber);
    if (current && isPaired(current.socket)) {
        return res.status(200).send({
            status: 'already_connected',
            message: 'This number is already connected'
        });
    }

    // Tentative précédente non terminée (mauvais code, expiré...) : on nettoie
    // et on génère un nouveau code au lieu de bloquer le numéro.
    if (current || socketCreationTime.has(sanitizedNumber)) {
        await resetPairing(sanitizedNumber);
    }

    await EmpirePair(number, res);
});


router.get('/active', (req, res) => {
    console.log('Active sockets:', Array.from(activeSockets.keys()));
    res.status(200).send({
        count: activeSockets.size,
        numbers: Array.from(activeSockets.keys())
    });
});

process.on('exit', () => {
    activeSockets.forEach((socket, number) => {
        socket.ws.close();
        activeSockets.delete(number);
        socketCreationTime.delete(number);
    });
    fs.emptyDirSync(SESSION_BASE_PATH);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    // pm2 restart ne fait rien si le process n'est pas lancé via PM2 (ex: "npm
    // start" tout court, comme dans package.json actuellement) : la commande
    // échoue silencieusement et le bot reste planté. On tente quand même le
    // restart PM2 (utile si PM2 est bien utilisé en prod), mais dans tous les
    // cas on quitte le process : Render/Railway/Docker/PM2 redémarrent
    // automatiquement un process qui s'arrête, alors qu'un process qui reste
    // en vie dans un état cassé ne redémarre jamais tout seul.
    try { exec(`pm2 restart ${process.env.PM2_NAME || 'dtz-mini-bot-session'}`); } catch {}
    setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason) => {
    // Sans ce filet, une seule promesse rejetée sans .catch() ailleurs dans ce
    // fichier (il y en a beaucoup) peut arrêter tout le process Node — et donc
    // le bot ainsi que le site de pairing — sans le moindre message clair.
    console.error('Unhandled promise rejection:', reason);
});

module.exports = router;
