const { MessageMedia } = require('whatsapp-web.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// 🔑 Configuración de Credenciales Primarias
const GEMINI_API_KEY = "AQ.Ab8RN6J-5x57rikx5NrolJCHCHnRxkmHK0psnMdo8-0yDAA5yA"; 

let aiModel = null;
try {
    if (GEMINI_API_KEY) {
        const aiConfig = new GoogleGenerativeAI(GEMINI_API_KEY);
        aiModel = aiConfig.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
} catch (e) { console.log("Error inicializando Gemini."); }

const startTime = new Date();
const rpgDatabase = {};
const groupSettings = {}; // Almacena eventos de bienvenida/despedida

// Estructura de Sub-Bots vinculados
const subBotsActivos = []; 

function getProfile(userId, pushname) {
    if (!rpgDatabase[userId]) {
        rpgDatabase[userId] = {
            name: pushname || 'Usuario',
            coins: 500, bank: 1000, gems: 15, level: 0, xp: 0, lastDaily: 0, lastWork: 0
        };
    }
    return rpgDatabase[userId];
}

function getGroupConfig(chatId) {
    if (!groupSettings[chatId]) {
        groupSettings[chatId] = { welcome: false, bye: false };
    }
    return groupSettings[chatId];
}

async function ejecutar(client, msg) {
    try {
        if (!msg.body) return;
        const body = msg.body.trim();
        
        // Listener universal para comandos (. o sub-comandos)
        if (!body.startsWith('.')) return;

        const args = body.slice(1).trim().split(/ +/);
        let command = args.shift().toLowerCase();

        const chat = await msg.getChat();
        const sender = await msg.getContact();
        const userId = sender.id._serialized;
        const username = sender.pushname || 'Usuario';
        
        let isAdmin = false;
        if (chat.isGroup) {
            const participant = chat.participants.find(p => p.id._serialized === sender.id._serialized);
            if (participant && (participant.isAdmin || participant.isSuperAdmin)) isAdmin = true;
        }

        // Determinar si quien responde es un Sub-bot para limitar sus acciones
        const esSubBot = subBotsActivos.includes(client.info?.wid?._serialized);

        switch (command) {
            case 'menu':
            case 'bot':
                if (esSubBot) {
                    // 🎮 MENÚ REDUCIDO EXCLUSIVO PARA SUB-BOTS (Diversión y Juegos)
                    const menuSub = `╔════════════════════════╗
  🤖  *KORI - SUB BOT OFICIAL* ╚════════════════════════╝
 👤 *Usuario:* ${username}
 🕹 *Modo:* Entretenimiento Activo
──────────────────────────
 🎰 *\`Zona de Juegos & RPG\`*
 ➣ \`.perfil\` - Mira tu cuenta virtual
 ➣ \`.trabajar\` - Gana monedas cada 5 min
 ➣ \`.daily\` - Tu recompensa diaria
 ➣ \`.ruleta <cant>\` - Apuesta tus monedas

 🍯 *\`Interacción & Diversión\`*
 ➣ \`.chiste\` - Envía un chiste al azar
 ➣ \`.piropo\` - Lanza un piropo piola
 ➣ \`.consejo\` - Un consejo de vida
 ➣ \`.fraseromantica\` - Frase especial
 ➣ \`.s\` o \`.sticker\` - Convierte fotos

 📢 *Nota:* Este es un Sub-Bot de interacción. Para comandos avanzados de IA y Descargas, usa al Bot Principal.`;
                    await msg.reply(menuSub);
                    break;
                }

                // 👑 INTERFAZ ESTÉTICA PREMIUM PARA EL BOT PRINCIPAL
                const uptimeDiff = Math.abs(new Date() - startTime);
                const hours = Math.floor(uptimeDiff / (1000 * 60 * 60));
                const minutes = Math.floor((uptimeDiff % (1000 * 60 * 60)) / (1000 * 60));

                const menuPremium = `╭━━━〔 ✨ *KORI BOT PREMIUM* ✨ 〕━━━🎬
┃ 💎 *Estado:* Online / Estable
┃ 👤 *Usuario:* ${username.toUpperCase()}
┃ ⏱️ *Uptime:* ${hours}h ${minutes}m
╰─────────────────────────────🍁

 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 ┃ 🎵  *DESCARGAS MULTIMEDIA* ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  ☞ \`.play <nombre>\` ── Audio HQ (MP3)
  ☞ \`.video <nombre>\` ── Video HD (MP4)
  ☞ \`.yts <texto>\` ── Buscador de enlaces

 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 ┃ 🧠  *CEREBROS DE INTELIGENCIA* ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  ☞ \`.perplexity <pregunta>\` ── Respuestas con fuentes
  ☞ \`.chatgpt <pregunta>\` ── OpenAI Inteligencia
  ☞ \`.gemini <pregunta>\` ── Motor Google directo
  ☞ \`.ia <pregunta>\` ── Auto-selector veloz

 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 ┃ 🛡️  *HERRAMIENTAS DE GRUPO* ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  ☞ \`.welcome on/off\` ── Alternar bienvenida
  ☞ \`.bye on/off\` ── Alternar despedida
  ☞ \`.todos <motivo>\` ── Mención general
  ☞ \`.aviso\` ── Fijar mensaje de Administrador
  ☞ \`.reenviar\` ── Clonar contenido multimedia

 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 ┃ 🕹️  *SISTEMA VIRTUAL RPG & FUN*
 ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  ☞ \`.perfil\` | \`.trabajar\` | \`.daily\` | \`.ruleta\`
  ☞ \`.google\` | \`.clima\` | \`.dolar\` | \`.chiste\`
  ☞ \`.piropo\` | \`.s\` *(Stickers)*

 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 ┃ 🤖  *CENTRAL DE SUB-BOTS* ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  ☞ \`.subbot\` ── Vincular nuevo número o clon`;
                await msg.reply(menuPremium);
                break;
                case 'play':
                if (esSubBot) return msg.reply('❌ Comando deshabilitado en Sub-Bots.');
                if (!args.length) return msg.reply('❌ Escribe el nombre de la canción.');
                try {
                    await msg.reply('🎵 Procesando audio mediante servidores espejo...');
                    const query = encodeURIComponent(args.join(' '));
                    
                    // Servidor Primario (Cafirexos)
                    let res = await axios.get(`https://api.cafirexos.com/api/ytplay?text=${query}`).catch(() => null);
                    
                    // Servidor Secundario (Espejo de Respaldo por si falla el primero)
                    if (!res || !res.data?.resultado?.url) {
                        res = await axios.get(`https://api.vreden.my.id/api/ytplay?query=${query}`).catch(() => null);
                    }

                    const audioUrl = res?.data?.resultado?.url || res?.data?.result?.downloadUrl;
                    const titulo = res?.data?.resultado?.titulo || res?.data?.result?.title || 'Audio HQ';

                    if (audioUrl) {
                        const mediaRes = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                        const base64Audio = Buffer.from(mediaRes.data, 'binary').toString('base64');
                        const mediaFile = new MessageMedia('audio/mp3', base64Audio, `${titulo}.mp3`);
                        await chat.sendMessage(mediaFile, { caption: `🎧 *Kori Play:* ${titulo}` });
                    } else {
                        await msg.reply('❌ Todos los servidores de música están saturados. Intenta de nuevo.');
                    }
                } catch (e) { await msg.reply('❌ Falla en la conversión de audio.'); }
                break;

            case 'video':
                if (esSubBot) return msg.reply('❌ Comando deshabilitado en Sub-Bots.');
                if (!args.length) return msg.reply('❌ Escribe el nombre del video.');
                try {
                    await msg.reply('🎥 Buscando y compactando video MP4...');
                    const query = encodeURIComponent(args.join(' '));
                    
                    let res = await axios.get(`https://api.cafirexos.com/api/v1/ytmp4?url=${query}`).catch(() => null);
                    let videoUrl = res?.data?.resultado?.download || res?.data?.resultado?.url;

                    if (!videoUrl) { // Respaldo redundante
                        res = await axios.get(`https://api.vreden.my.id/api/ytmp4?query=${query}`).catch(() => null);
                        videoUrl = res?.data?.result?.downloadUrl;
                    }

                    if (videoUrl) {
                        const mediaRes = await axios.get(videoUrl, { responseType: 'arraybuffer' });
                        const base64Video = Buffer.from(mediaRes.data, 'binary').toString('base64');
                        const mediaFile = new MessageMedia('video/mp4', base64Video, `video.mp4`);
                        await chat.sendMessage(mediaFile, { caption: `🎬 Video cargado con éxito.` });
                    } else {
                        await msg.reply('❌ Archivo de video demasiado pesado o no encontrado.');
                    }
                } catch (e) { await msg.reply('❌ Error en el servidor de streaming de video.'); }
                break;

            case 'perplexity':
                if (!args.length) return msg.reply('❌ Introduce tu consulta para Perplexity.');
                try {
                    await msg.reply('🔍 *KORI IA (Perplexity)* investigando en la web en tiempo real...');
                    const prompt = encodeURIComponent(args.join(' '));
                    const res = await axios.get(`https://api.cafirexos.com/api/perplexity?text=${prompt}`);
                    if (res.data && res.data.resultado) {
                        await msg.reply(`🧠 *Perplexity AI (Resultados Verificados):* \n\n${res.data.resultado}`);
                    } else {
                        await msg.reply('❌ Respuesta nula de Perplexity. Prueba usando `.chatgpt`');
                    }
                } catch (err) { await msg.reply('❌ Servidor de Perplexity temporalmente fuera de línea.'); }
                break;

            case 'gemini':
                if (!args.length) return msg.reply('❌ Por favor, redacta una pregunta.');
                try {
                    if (aiModel) {
                        await msg.reply('🧠 *KORI IA (Gemini Directo)* procesando con tu API Key...');
                        const result = await aiModel.generateContent(args.join(' '));
                        const response = await result.response;
                        await msg.reply(`🤖 *Gemini Directo:* \n\n${response.text()}`);
                    } else {
                        // Espejo si la clave falla
                        const prompt = encodeURIComponent(args.join(' '));
                        const res = await axios.get(`https://api.cafirexos.com/api/gemini?text=${prompt}`);
                        await msg.reply(`🤖 *Gemini Espejo:* \n\n${res.data.resultado}`);
                    }
                } catch (err) { await msg.reply('❌ Fallo crítico en motores Gemini. Usa `.perplexity`'); }
                break;

            case 'ia':
            case 'chatgpt':
                if (!args.length) return msg.reply('❌ Escribe tu consulta.');
                try {
                    await msg.reply('🤖 *KORI IA (ChatGPT)* analizando...');
                    const prompt = encodeURIComponent(args.join(' '));
                    const res = await axios.get(`https://api.cafirexos.com/api/chatgpt?text=${prompt}`);
                    if (res.data && res.data.resultado) {
                        await msg.reply(`🤖 *ChatGPT:* \n\n${res.data.resultado}`);
                    } else {
                        await msg.reply('❌ Error de respuesta. Intenta con `.perplexity`');
                    }
                } catch (err) { await msg.reply('❌ Caída de los servicios OpenAI.'); }
                break;
                case 'welcome':
                if (!chat.isGroup || !isAdmin) return msg.reply('❌ Solo administradores en grupos.');
                if (args[0] === 'on') {
                    getGroupConfig(chat.id._serialized).welcome = true;
                    await msg.reply('✅ *Mensajes de Bienvenida:* ACTIVADOS para este grupo.');
                } else if (args[0] === 'off') {
                    getGroupConfig(chat.id._serialized).welcome = false;
                    await msg.reply('❌ *Mensajes de Bienvenida:* DESACTIVADOS.');
                } else { await msg.reply('💡 Uso correcto: `.welcome on` o `.welcome off`'); }
                break;

            case 'bye':
                if (!chat.isGroup || !isAdmin) return msg.reply('❌ Solo administradores en grupos.');
                if (args[0] === 'on') {
                    getGroupConfig(chat.id._serialized).bye = true;
                    await msg.reply('✅ *Mensajes de Despedida:* ACTIVADOS para este grupo.');
                } else if (args[0] === 'off') {
                    getGroupConfig(chat.id._serialized).bye = false;
                    await msg.reply('❌ *Mensajes de Despedida:* DESACTIVADOS.');
                } else { await msg.reply('💡 Uso correcto: `.bye on` o `.bye off`'); }
                break;

            case 'subbot':
                if (esSubBot) return;
                await msg.reply('🤖 *Iniciando módulo Sub-Bot Multi-Números...*\n\nPara vincular un nuevo sub-bot secundario con lista de comandos de entretenimiento reducida, contacta al desarrollador principal para emparejar el código QR o Token de sesión.');
                break;

            case 'yts':
                if (!args.length) return msg.reply('❌ ¿Qué deseas buscar?');
                try {
                    const query = encodeURIComponent(args.join(' '));
                    const resYts = await axios.get(`https://api.cafirexos.com/api/ytsearch?text=${query}`);
                    if (resYts.data?.resultado) {
                        let txt = `🎥 *\`Búsquedas de YouTube\`*\n\n`;
                        resYts.data.resultado.slice(0,3).forEach((v, i) => { txt += `${i+1}️⃣ *${v.title}*\n🔗 ${v.url}\n\n`; });
                        await msg.reply(txt.trim());
                    }
                } catch (e) { await msg.reply('❌ Error de consulta.'); }
                break;

            case 'google':
                if (!args.length) return msg.reply('❌ ¿Qué quieres buscar en Google?');
                try {
                    const query = encodeURIComponent(args.join(' '));
                    const res = await axios.get(`https://api.cafirexos.com/api/google?text=${query}`);
                    if (res.data?.resultado) {
                        let txt = `🔍 *\`Google Search\`*\n\n`;
                        res.data.resultado.slice(0,3).forEach((r) => { txt += `🔹 *${r.title}*\n🔗 _${r.link}_\n\n`; });
                        await msg.reply(txt.trim());
                    }
                } catch (e) { await msg.reply('❌ Error de red.'); }
                break;

            case 'clima':
                if (!args.length) return msg.reply('❌ Di una ciudad.');
                try {
                    const ciudad = encodeURIComponent(args.join(' '));
                    const res = await axios.get(`https://api.cafirexos.com/api/clima?text=${ciudad}`);
                    await msg.reply(`☀️ *Condiciones Climáticas:* \n\n${res.data.resultado || 'No disponible.'}`);
                } catch (e) { await msg.reply('❌ Error del clima.'); }
                break;

            case 'dolar':
                try {
                    const res = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
                    const r = res.data.rates;
                    await msg.reply(`💵 *\`Tipo de Cambio Financiero\`*\n🇵🇪 *Perú:* S/. ${r.PEN.toFixed(2)}\n🇲🇽 *México:* $${r.MXN.toFixed(2)}`);
                } catch (e) { await msg.reply('❌ Error financiero.'); }
                break;

            case 'chiste':
                const chistes = ["— ¿Qué hace una impresora de cabeza? \n— Imprimiendo en reversa. 😂", "— ¿Por qué los programadores prefieren la oscuridad? \n— Porque la luz produce bugs. 💻"];
                await msg.reply(`🃏 *Chiste:* \n\n${chistes[Math.floor(Math.random() * chistes.length)]}`);
                break;

            case 'piropo':
                await msg.reply("🍯 *Piropo:* Eres el código sin errores que todo programador sueña con encontrar. 😏");
                break;

            case 'consejo':
                await msg.reply("💡 *Consejo:* Mantén tus sub-bots limpios de comandos multimedia para ahorrar memoria RAM.");
                break;

            case 'fraseromantica':
                await msg.reply('❤️ "Ni la inteligencia artificial junta podría computar todo lo que me importas."');
                break;

            case 'perfil':
                const perfil = getProfile(userId, username);
                await msg.reply(`📇 *\`Perfil Kori Virtual\`*\n👤 *Nombre:* ${perfil.name}\n💰 *Bolsillo:* $${perfil.coins} monedas`);
                break;

            case 'work':
            case 'trabajar':
                const pWork = getProfile(userId, username);
                const tActual = Date.now();
                if (tActual - pWork.lastWork < 300000) return msg.reply('⏳ Estás exhausto, descansa unos minutos.');
                const gan = Math.floor(Math.random() * 300) + 100;
                pWork.coins += gan; pWork.lastWork = tActual;
                await msg.reply(`💰 Trabajaste y ganaste *$${gan} monedas virtuales*.`);
                break;

            case 'daily':
                const pDaily = getProfile(userId, username);
                const nw = Date.now();
                if (nw - pDaily.lastDaily < 86400000) return msg.reply('❌ Ya cobraste tu bono diario.');
                pDaily.coins += 1000; pDaily.lastDaily = nw;
                await msg.reply('🎁 *Bono Diario reclamado:* +$1,000 monedas.');
                break;

            case 'ruleta':
                const pRuleta = getProfile(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Pon una cantidad válida.');
                const apuesta = parseInt(args[0]);
                if (pRuleta.coins < apuesta) return msg.reply('❌ Saldo insuficiente.');
                if (Math.random() >= 0.5) { pRuleta.coins += apuesta; await msg.reply(`🎰 ¡Ganaste! +$${apuesta}`); }
                else { pRuleta.coins -= apuesta; await msg.reply(`🎰 Perdiste... -$${apuesta}`); }
                break;

            case 'todos':
                if (!chat.isGroup || !isAdmin) break;
                let infoTexto = `📣 *CONVOCATORIA GENERAL* 📣\n\n`;
                let menciones = [];
                for (let part of chat.participants) {
                    try {
                        const contact = await client.getContactById(part.id._serialized);
                        menciones.push(contact);
                        infoTexto += `@${part.id.user} `;
                    } catch (e) {}
                }
                await chat.sendMessage(infoTexto.trim(), { mentions: menciones });
                break;

            case 's':
            case 'sticker':
                if (msg.hasMedia || (msg.hasQuotedMsg && (await msg.getQuotedMessage()).hasMedia)) {
                    try {
                        const m = msg.hasMedia ? msg : await msg.getQuotedMessage();
                        const media = await m.downloadMedia();
                        await chat.sendMessage(media, { sendMediaAsSticker: true, stickerName: "KORI SUB-BOT", stickerAuthor: "DEYVI AOC" });
                    } catch (e) { await msg.reply('❌ Error al procesar imagen.'); }
                }
                break;

            default:
                break;
        }
    } catch (error) { console.log('Error crítico general:', error); }
}

module.exports = { ejecutar };
