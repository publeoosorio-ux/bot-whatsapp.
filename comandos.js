const { MessageMedia } = require('whatsapp-web.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// 🔑 CLAVE API DIRECTA DE TU CAPTURA
const GEMINI_API_KEY = "AQ.Ab8RN6J-5x57rikx5NrolJCHCHnRxkmHK0psnMdo8-0yDAA5yA"; 

let aiModel = null;
try {
    if (GEMINI_API_KEY) {
        const aiConfig = new GoogleGenerativeAI(GEMINI_API_KEY);
        aiModel = aiConfig.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
} catch (error) {
    console.log("Error al cargar Gemini nativo:", error);
}

const startTime = new Date();
const rpgDatabase = {};

function getProfile(userId, pushname) {
    if (!rpgDatabase[userId]) {
        rpgDatabase[userId] = {
            name: pushname || 'Usuario',
            coins: 500, 
            bank: 1000,
            gems: 15,
            level: 0,
            xp: 0,
            lastDaily: 0,
            lastWork: 0
        };
    }
    return rpgDatabase[userId];
}

async function ejecutar(client, msg) {
    try {
        if (!msg.body) return;
        const body = msg.body.trim();
        
        if (!body.startsWith('.') && !body.toLowerCase().startsWith('aviso')) return;

        const args = body.slice(1).trim().split(/ +/);
        let command = args.shift().toLowerCase();

        if (body === '.menu') {
            command = 'bot';
            args[0] = 'menú';
        }

        const chat = await msg.getChat();
        const sender = await msg.getContact();
        const userId = sender.id._serialized;
        const username = sender.pushname || 'Usuario';
        
        let isAdmin = false;
        if (chat.isGroup) {
            const participant = chat.participants.find(p => p.id._serialized === sender.id._serialized);
            if (participant && (participant.isAdmin || participant.isSuperAdmin)) {
                isAdmin = true;
            }
        }

        switch (command) {
            case 'bot':
                if (args[0]?.toLowerCase() === 'menú' || args[0]?.toLowerCase() === 'menu') {
                    const uptimeDiff = Math.abs(new Date() - startTime);
                    const hours = Math.floor(uptimeDiff / (1000 * 60 * 60));
                    const minutes = Math.floor((uptimeDiff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((uptimeDiff % (1000 * 60)) / 1000);

                    const menuTexto = `🌐 *\`Menú Principal (KORI BOT)\`*
────────────────────────────
👤 Usuario: ${username.toUpperCase()}
🔰 Rol: Novato \`\`\`V\`\`\` ⚔️
⏱ Activo: ${hours}:${minutes}:${seconds}

📊 *\`Info & Sistema\`* ╰➤ .owner | .ping | .uptime | .sistema

👥 *\`Gestión de Grupos\`*
╰➤ .todos <txt> | .aviso | .admins | .kick @usuario
╰➤ .promote @usuario | .demote @usuario | .grupo abrir/cerrar | .reenviar

⬇ *\`Descargas Automáticas\`*
╰➤ .play <canción> *(Música MP3)*
╰➤ .video <nombre> *(Video MP4)*

💭 *\`Sección de Inteligencia Artificial\`*
╰➤ .gemini <pregunta> *(Motor Google Directo)*
╰➤ .chatgpt <pregunta> *(Motor OpenAI GPT)*
╰➤ .ia <pregunta> *(IA de Respuesta Rápida)*

🔍 *\`Búsquedas & Herramientas\`*
╰➤ .yts <búsqueda> | .s | .sticker | .google <tema>

🍯 *\`Diversión & Utilidades\`*
╰➤ .consejo | .fraseromantica | .piropo | .chiste | .clima <ciudad> | .dolar

🥧 *\`Free Fire Area\`*
╰➤ .4vs4 | .66vs6 | .8vs8 | .12vs12 | .sala`;

                    await msg.reply(menuTexto);
                }
                break;

            case 'play':
                if (!args.length) {
                    await msg.reply('❌ Escribe el nombre de la canción. Ejemplo: `.play Sia Unstoppable`');
                    break;
                }
                try {
                    await msg.reply('🎵 Buscando canción y procesando audio... Por favor espera.');
                    const query = encodeURIComponent(args.join(' '));
                    
                    const res = await axios.get(`https://api.cafirexos.com/api/ytplay?text=${query}`);
                    
                    if (res.data && res.data.resultado && res.data.resultado.url) {
                        const audioUrl = res.data.resultado.url;
                        const titulo = res.data.resultado.titulo || 'Audio';
                        
                        const mediaRes = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                        const base64Audio = Buffer.from(mediaRes.data, 'binary').toString('base64');
                        const mediaFile = new MessageMedia('audio/mp3', base64Audio, `${titulo}.mp3`);
                        
                        await chat.sendMessage(mediaFile, { caption: `🎧 *Completado:* ${titulo}` });
                    } else {
                        await msg.reply('❌ No se pudo descargar esta pista de audio.');
                    }
                } catch (e) {
                    await msg.reply('❌ Servidor de música saturado o caída de YouTube.');
                }
                break;

            case 'video':
                if (!args.length) {
                    await msg.reply('❌ Escribe el nombre del video. Ejemplo: `.video goles`');
                    break;
                }
                try {
                    await msg.reply('🎥 Buscando y procesando el video... Por favor espera.');
                    const query = encodeURIComponent(args.join(' '));
                    const res = await axios.get(`https://api.cafirexos.com/api/v1/ytmp4?url=${query}`);
                    
                    let videoUrl = res.data?.resultado?.download || res.data?.resultado?.url;
                    if (videoUrl) {
                        const mediaRes = await axios.get(videoUrl, { responseType: 'arraybuffer' });
                        const base64Video = Buffer.from(mediaRes.data, 'binary').toString('base64');
                        const mediaFile = new MessageMedia('video/mp4', base64Video, `video.mp4`);
                        await chat.sendMessage(mediaFile, { caption: `🎬 Video procesado correctamente.` });
                    } else {
                        await msg.reply('❌ Intenta con un término más específico para el video.');
                    }
                } catch (e) {
                    await msg.reply('❌ Error al procesar el archivo MP4 de video.');
                }
                break;
                case 'gemini':
                if (!args.length) return msg.reply('❌ Escribe tu consulta.');
                if (!aiModel) return msg.reply('❌ Motor Gemini directo deshabilitado.');
                try {
                    await msg.reply('🧠 *KORI IA (Gemini Directo)* pensando...');
                    const prompt = args.join(' ');
                    const result = await aiModel.generateContent(prompt);
                    const response = await result.response;
                    const text = response.text();
                    await msg.reply(`🤖 *Respuesta de Gemini:* \n\n${text}`);
                } catch (err) {
                    await msg.reply('❌ Error en tu clave API o cuota de Gemini agotada.');
                }
                break;

            case 'ia':
            case 'chatgpt':
                if (!args.length) return msg.reply('❌ Escribe tu consulta.');
                try {
                    await msg.reply('🤖 *KORI IA (ChatGPT)* analizando...');
                    const prompt = encodeURIComponent(args.join(' '));
                    const res = await axios.get(`https://api.cafirexos.com/api/chatgpt?text=${prompt}`);
                    if (res.data && res.data.resultado) {
                        await msg.reply(`🤖 *Respuesta de ChatGPT:* \n\n${res.data.resultado}`);
                    } else {
                        await msg.reply('❌ Servidor de ChatGPT vacío. Intenta con `.gemini`');
                    }
                } catch (err) {
                    await msg.reply('❌ Error de conexión con el motor IA externo.');
                }
                break;

            case 'yts':
                if (!args.length) return msg.reply('❌ Escribe qué deseas buscar.');
                try {
                    await msg.reply('🔍 Buscando videos en YouTube...');
                    const query = encodeURIComponent(args.join(' '));
                    const resYts = await axios.get(`https://api.cafirexos.com/api/ytsearch?text=${query}`);
                    if (resYts.data && resYts.data.resultado && resYts.data.resultado.length > 0) {
                        let resultadoTexto = `🎥 *\`Resultados de YouTube\`*\n──────────────────\n\n`;
                        resYts.data.resultado.slice(0, 3).forEach((vid, i) => {
                            resultadoTexto += `${i+1}️⃣ *${vid.title}*\n🔗 *Link:* ${vid.url}\n\n`;
                        });
                        await msg.reply(resultadoTexto.trim());
                    } else {
                        await msg.reply('❌ No se encontraron videos.');
                    }
                } catch (e) {
                    await msg.reply('❌ Error al conectar con YouTube.');
                }
                break;

            case 'google':
                if (!args.length) return msg.reply('❌ ¿Qué quieres buscar en Google?');
                try {
                    const query = encodeURIComponent(args.join(' '));
                    const res = await axios.get(`https://api.cafirexos.com/api/google?text=${query}`);
                    if (res.data && res.data.resultado && res.data.resultado.length > 0) {
                        let txt = `🔍 *\`Resultados de Google\`*\n──────────────────\n\n`;
                        res.data.resultado.slice(0, 3).forEach((r) => {
                            txt += `🔹 *${r.title}*\n🔗 _${r.link}_\n\n`;
                        });
                        await msg.reply(txt.trim());
                    } else {
                        await msg.reply('❌ No se encontraron resultados.');
                    }
                } catch (e) {
                    await msg.reply('❌ Servidor de Google en mantenimiento.');
                }
                break;

            case 'clima':
                if (!args.length) return msg.reply('❌ Di una ciudad.');
                try {
                    const ciudad = encodeURIComponent(args.join(' '));
                    const res = await axios.get(`https://api.cafirexos.com/api/clima?text=${ciudad}`);
                    if (res.data && res.data.resultado) {
                        await msg.reply(`☀️ *\`Clima\`*\n──────────────────\n${res.data.resultado}`);
                    } else {
                        await msg.reply('❌ Ciudad no encontrada.');
                    }
                } catch (e) {
                    await msg.reply('❌ Error al consultar el tiempo.');
                }
                break;

            case 'dolar':
                try {
                    const res = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
                    if (res.data && res.data.rates) {
                        const r = res.data.rates;
                        await msg.reply(`💵 *\`Precio del Dólar Actual\`*\n──────────────────\n🇵🇪 *Perú:* S/. ${r.PEN.toFixed(2)}\n🇲🇽 *México:* $${r.MXN.toFixed(2)}\n🇦🇷 *Argentina:* $${r.ARS.toFixed(2)}`);
                    }
                } catch (e) {
                    await msg.reply('❌ Error al obtener cotización.');
                }
                break;

            case 'chiste':
                const chistes = [
                    "— Papá, papá, ¿qué se siente tener un hijo tan guapo? \n— No sé hijo, pregúntale a tu abuelo. 😂",
                    "¿Qué hace una abeja en el gimnasio? \n¡Zumba! 🐝"
                ];
                await msg.reply(`🃏 *Chiste:* \n\n${chistes[Math.floor(Math.random() * chistes.length)]}`);
                break;

            case 'perfil':
                const perfil = getProfile(userId, username);
                await msg.reply(`📇 *\`Tu Perfil Virtual (RPG)\`*\n──────────────────\n👤 *Nombre:* ${perfil.name}\n⚔️ *Rango:* Novato\n💰 *Bolsillo:* $${perfil.coins} monedas`);
                break;

            case 'work':
            case 'trabajar':
                const pWork = getProfile(userId, username);
                const tiempoActual = Date.now();
                if (tiempoActual - pWork.lastWork < 300000) {
                    const restante = Math.ceil((300000 - (tiempoActual - pWork.lastWork)) / 1000);
                    await msg.reply(`⏳ Espera *${restante} segundos*.`);
                    break;
                }
                const ganancias = Math.floor(Math.random() * (400 - 150 + 1)) + 150;
                pWork.coins += ganancias;
                pWork.lastWork = tiempoActual;
                await msg.reply(`💰 Ganaste *$${ganancias} monedas virtuales*.`);
                break;

            case 'daily':
                const pDaily = getProfile(userId, username);
                const ahora = Date.now();
                if (ahora - pDaily.lastDaily < 86400000) {
                    await msg.reply('❌ Ya lo reclamaste hoy.');
                    break;
                }
                pDaily.coins += 1000;
                pDaily.lastDaily = ahora;
                await msg.reply('🎁 *RECOMPENSA DIARIA* 🎁\n💵 *+$1,000 monedas*');
                break;

            case 'ruleta':
                const pRuleta = getProfile(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Introduce cantidad.');
                const apuesta = parseInt(args[0]);
                if (pRuleta.coins < apuesta) return msg.reply('❌ Dinero insuficiente.');
                if (Math.random() >= 0.5) {
                    pRuleta.coins += apuesta;
                    await msg.reply(`🎰 *Ganaste:* +$${apuesta} monedas.`);
                } else {
                    pRuleta.coins -= apuesta;
                    await msg.reply(`🎰 *Perdiste:* -$${apuesta} monedas.`);
                }
                break;

            case 'aviso':
                if (!chat.isGroup || !isAdmin) break;
                if (msg.hasQuotedMsg) {
                    const quotedMsg = await msg.getQuotedMessage();
                    let txtAviso = `📢 *\`AVISO IMPORTANTE DE ADM:\`*\n\n${quotedMsg.body || ''}`;
                    if (quotedMsg.hasMedia) {
                        try {
                            const mediaAviso = await quotedMsg.downloadMedia();
                            await chat.sendMessage(mediaAviso, { caption: txtAviso });
                            break;
                        } catch (err) {}
                    }
                    await chat.sendMessage(txtAviso);
                }
                break;

            case 'reenviar':
                if (msg.hasQuotedMsg) {
                    const quoted = await msg.getQuotedMessage();
                    if (quoted.hasMedia) {
                        const archivoMedia = await quoted.downloadMedia();
                        await chat.sendMessage(archivoMedia, { caption: quoted.body || '' });
                    } else {
                        await chat.sendMessage(quoted.body);
                    }
                }
                break;

            case 'todos':
                if (!chat.isGroup || !isAdmin) break;
                let infoTexto = `📣 *KORI BOT LOS INVOCA* 📣\n────────────────────────────\n`;
                let mencionesMiembros = [];
                for (let participante of chat.participants) {
                    try {
                        const contacto = await client.getContactById(participante.id._serialized);
                        mencionesMiembros.push(contacto);
                        infoTexto += `💚➪@${participante.id.user}\n`;
                    } catch (e) {}
                }
                await chat.sendMessage(infoTexto.trim(), { mentions: mencionesMiembros });
                break;

            case 'owner':
            case 'creador':
                await msg.reply(`👤 *Creador del Bot:* DEYVI A.O.C\n💬 *Contacto:* +51 900834505`);
                break;

            case 'reg':
                await msg.reply(`✅ *¡Registro Exitoso!* Hola ${username}.`);
                break;

            case 'unreg':
                await msg.reply('❌ *Registro Eliminado.*');
                break;

            case '4vs4':
            case '6vs6':
            case '8vs8':
            case '12vs12':
                await msg.reply(`🎮 *¡Convocatoria de Free Fire Activa!* \n\n@everyone ¡Se armó el *${command.toUpperCase()}*!`);
                break;

            case 'sala':
                await msg.reply('🔑 ⚔️ *CREACIÓN DE SALA FREE FIRE* ⚔️\n\n🆔 *ID de Sala:* Cargando...');
                break;

            case 'piropo':
                const piropos = ["¿Acaso eres Google? Porque tienes todo lo que busco. 😏"];
                await msg.reply(`🍯 *Piropo:* \n\n${piropos[Math.floor(Math.random() * piropos.length)]}`);
                break;

            case 'consejo':
                await msg.reply(`💡 *Consejo:* Usa comandos espaciados.`);
                break;

            case 'fraseromantica':
                await msg.reply('❤️ *Frase:* "Eres mi variable favorita en este código."');
                break;

            case 'uptime':
                const uptimeDiff = Math.abs(new Date() - startTime);
                await msg.reply(`⏱️ *Activo:* ${Math.floor(uptimeDiff / (1000 * 60 * 60))} horas.`);
                break;

            case 'sistema':
                await msg.reply(`🖥️ *Servidor:* Linux\n📦 *Entorno:* Node.js v22\n🛠️ *IAs Conectadas:* Gemini Directo, ChatGPT.`);
                break;

            case 'ping':
                await msg.reply('🚀 *Pong!* Bot activo y respondiendo rápido.');
                break;

            case 's':
            case 'sticker':
                if (msg.hasMedia || (msg.hasQuotedMsg && (await msg.getQuotedMessage()).hasMedia)) {
                    try {
                        await msg.reply('⏳ *Procesando tu Sticker...*');
                        const mensajeConFoto = msg.hasMedia ? msg : await msg.getQuotedMessage();
                        const media = await mensajeConFoto.downloadMedia();
                        if (media) {
                            await chat.sendMessage(media, {
                                sendMediaAsSticker: true,
                                stickerName: "KORI BOT 🤖",
                                stickerAuthor: "DEYVI A.O.C ✨"
                            });
                        }
                    } catch (e) {
                        await msg.reply('❌ Error al crear sticker.');
                    }
                } else {
                    await msg.reply('❌ Responde a una foto con *.s*');
                }
                break;

            default:
                break;
        }
    } catch (error) {
        console.log('Error en comandos:', error);
    }
}

module.exports = { ejecutar };
