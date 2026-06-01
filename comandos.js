const { MessageMedia } = require('whatsapp-web.js');
const { GoogleGenAI } = require('@google/generative-ai');
const axios = require('axios');

// 🔑 PEGA AQUÍ TU CLAVE API COMPLETA ENTRE LAS COMILLAS (La que empieza con AQ.)
const GEMINI_API_KEY = "AQ.Ab8RN6J-5x57rikx5NrolJCHCHnRxkmHK0psnMdo8-0yDAA5yA"; 

// Inicialización corregida del motor de Inteligencia Artificial
let aiModel = null;
try {
    if (GEMINI_API_KEY && GEMINI_API_KEY !== "AQ.Ab8RN6J-5x57rikx5NrolJCHCHnRxkmHK0psnMdo8-0yDAA5yA") {
        // Corrección de inicialización oficial para el paquete @google/generative-ai
        const aiConfig = new GoogleGenAI(GEMINI_API_KEY);
        aiModel = aiConfig.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
} catch (error) {
    console.log("Error al encender el motor de Gemini:", error);
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

📊 *\`Info & Sistema\`* ╰➤ .owner | .creador | .ping | .uptime | .sistema

👥 *\`Gestión de Grupos\`*
╰➤ .todos <txt> | .aviso | .admins | .kick @usuario
╰➤ .promote @usuario | .demote @usuario | .grupo abrir/cerrar | .reenviar

⬇ *\`Descarga de Música\`*
╰➤ .play <nombre de canción>

💰 *\`Juegos RPG & Economía\`*
╰➤ .perfil | .work | .daily | .ruleta <cantidad> | .reg | .unreg

💭 *\`Super Inteligencia\`*
╰➤ .ia <pregunta> | .ai <pregunta>

🔍 *\`Búsquedas\`*
╰➤ .yts <nombre del video>

🧰 *\`Herramientas\`*
╰➤ .s | .sticker *(Responde a una foto)*

🍯 *\`Diversión & Frases\`*
╰➤ .consejo | .fraseromantica | .piropo

🥧 *\`Free Fire\`*
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
                    
                    // Servidor de descarga de música de alta fidelidad
                    const res = await axios.get(`https://api.vreden.web.id/api/ytplay?query=${query}`);
                    
                    if (res.data && res.data.result && res.data.result.music) {
                        const audioUrl = res.data.result.music;
                        const titulo = res.data.result.title || 'Audio de YouTube';
                        
                        const mediaRes = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                        const base64Audio = Buffer.from(mediaRes.data, 'binary').toString('base64');
                        const mediaFile = new MessageMedia('audio/mp3', base64Audio, `${titulo}.mp3`);
                        
                        await chat.sendMessage(mediaFile, { caption: `🎧 *Completado:* ${titulo}` });
                    } else {
                        await msg.reply('❌ Servidores de descarga saturados. Intenta de nuevo.');
                    }
                } catch (e) {
                    await msg.reply('❌ Error al procesar la descarga de audio.');
                }
                break;

            case 'yts':
                if (!args.length) {
                    await msg.reply('❌ Escribe qué deseas buscar. Ejemplo: `.yts rosa pastel`');
                    break;
                }
                try {
                    await msg.reply('🔍 Buscando videos en YouTube...');
                    const query = encodeURIComponent(args.join(' '));
                    const resYts = await axios.get(`https://api.vreden.web.id/api/ytsearch?query=${query}`);
                    
                    if (resYts.data && resYts.data.result && resYts.data.result.length > 0) {
                        let resultadoTexto = `🎥 *\`Resultados de YouTube\`*\n──────────────────\n\n`;
                        const videos = resYts.data.result.slice(0, 3);
                        videos.forEach((vid, i) => {
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

            case 'ia':
            case 'ai':
                if (!args.length) {
                    await msg.reply('❌ Hazme una pregunta real. Ejemplo: `.ia qué es la fotosíntesis`');
                    break;
                }
                
                if (!aiModel) {
                    await msg.reply('⚠️ Gemini no está configurado correctamente. Asegúrate de actualizar el código completo con la nueva versión fija.');
                    break;
                }

                try {
                    await msg.reply('🧠 *KORI IA (Gemini)* pensando tu respuesta...');
                    const promptOriginal = args.join(' ');
                    
                    // Instrucción para que el bot hable amigable como tú quieres
                    const contextoBot = "Actúa como Kori Bot, un asistente de WhatsApp genial, divertido e inteligente creado por DEYVI A.O.C. Responde en español de manera clara a la siguiente duda: ";
                    
                    const result = await aiModel.generateContent(contextoBot + promptOriginal);
                    const response = await result.response;
                    const text = response.text();
                    
                    await msg.reply(`🤖 *Respuesta de IA:* \n\n${text}`);
                } catch (e) {
                    console.log(e);
                    await msg.reply('❌ Error interno en los servidores de Gemini o clave inválida. Verifica que copiaste el código completo.');
                }
                break;

            case 'perfil':
                const perfil = getProfile(userId, username);
                await msg.reply(`📇 *\`Tu Perfil Virtual (RPG)\`*\n──────────────────\n👤 *Nombre:* ${perfil.name}\n⚔️ *Rango:* Novato \`\`\`V\`\`\`\n📊 *Progreso:* Nivel ${perfil.level} (${perfil.xp}/5000 XP)\n💎 *Gemas:* ${perfil.gems}\n💰 *Bolsillo:* $${perfil.coins} monedas\n🏦 *Banco Virtual:* $${perfil.bank} monedas`);
                break;

            case 'work':
            case 'trabajar':
                const pWork = getProfile(userId, username);
                const tiempoActual = Date.now();
                if (tiempoActual - pWork.lastWork < 300000) {
                    const restante = Math.ceil((300000 - (tiempoActual - pWork.lastWork)) / 1000);
                    await msg.reply(`⏳ Estás cansado. Espera *${restante} segundos* para volver a trabajar.`);
                    break;
                }

                const ganancias = Math.floor(Math.random() * (400 - 150 + 1)) + 150;
                const trabajos = ["un minero en Free Fire ⛏️", "un programador de bots 💻", "un repartidor de delivery 🛵", "un cazador de recompensas 🏹"];
                const trabajoAleatorio = trabajos[Math.floor(Math.random() * trabajos.length)];

                pWork.coins += ganancias;
                pWork.xp += 250;
                pWork.lastWork = tiempoActual;

                if (pWork.xp >= 5000) {
                    pWork.level += 1;
                    pWork.xp = 0;
                    await msg.reply(`🎉 ¡ENHORABUENA! @${sender.id.user} has subido al *Nivel ${pWork.level}*!`);
                }
                await msg.reply(`💰 Trabajaste como ${trabajoAleatorio}.\nGanaste: *$${ganancias} monedas virtuales* y *+250 XP*.`);
                break;

            case 'daily':
                const pDaily = getProfile(userId, username);
                const ahora = Date.now();
                if (ahora - pDaily.lastDaily < 86400000) {
                    await msg.reply('❌ Ya reclamaste tu recompensa diaria hoy. Regresa mañana!');
                    break;
                }
                
                pDaily.coins += 1000;
                pDaily.gems += 5;
                pDaily.lastDaily = ahora;
                await msg.reply('🎁 *RECOMPENSA DIARIA* 🎁\n──────────────────\nHas recibido:\n💵 *+$1,000 monedas*\n💎 *+5 Gemas gratis*');
                break;

            case 'ruleta':
                const pRuleta = getProfile(userId, username);
                if (!args.length || isNaN(args[0])) {
                    await msg.reply('❌ Introduce una cantidad válida para apostar. Ejemplo: `.ruleta 200`');
                    break;
                }
                
                const apuesta = parseInt(args[0]);
                if (apuesta <= 0) {
                    await msg.reply('❌ La apuesta debe ser mayor a 0.');
                    break;
                }
                if (pRuleta.coins < apuesta) {
                    await msg.reply(`❌ No tienes suficientes monedas en tu bolsillo. Saldo actual: $${pRuleta.coins}`);
                    break;
                }

                if (Math.random() >= 0.5) {
                    pRuleta.coins += apuesta;
                    await msg.reply(`🎰 *¡RULETA DE CASINO!* 🎰\n──────────────────\n¡Tuviste suerte! Salió ganador. ✨\n*Ganaste:* +$${apuesta} monedas.\n*Saldo actual:* $${pRuleta.coins}`);
                } else {
                    pRuleta.coins -= apuesta;
                    await msg.reply(`🎰 *¡RULETA DE CASINO!* 🎰\n──────────────────\n¡Mala suerte! La ruleta cayó en color contrario. 💀\n*Perdiste:* -$${apuesta} monedas.\n*Saldo actual:* $${pRuleta.coins}`);
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
                            if (mediaAviso) {
                                await chat.sendMessage(mediaAviso, { caption: txtAviso });
                                break;
                            }
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
                const mensajeAdicional = args.join(' ');
                let infoTexto = `📣 *KORI BOT LOS INVOCA* 📣\n`;
                if (mensajeAdicional) infoTexto += `📝 *Mensaje:* ${mensajeAdicional}\n`;
                infoTexto += `────────────────────────────\n`;
                
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
                await msg.reply(`🎮 *¡Convocatoria de Free Fire Activa!* \n\n@everyone ¡Se armó el *${command.toUpperCase()}*! Dejen su ID abajo. 🏆🔥`);
                break;

            case 'sala':
                await msg.reply('🔑 ⚔️ *CREACIÓN DE SALA FREE FIRE* ⚔️\n\n🆔 *ID de Sala:* Cargando...\n🔒 *Contraseña:* Al privado.');
                break;

            case 'piropo':
                const piropos = ["¿Acaso eres Google? Porque tienes todo lo que busco. 😏", "No es el wifi, eres tú quien me desconecta. ✨"];
                await msg.reply(`🍯 *Piropo:* \n\n${piropos[Math.floor(Math.random() * piropos.length)]}`);
                break;

            case 'consejo':
                await msg.reply(`💡 *Consejo:* Revisa bien los espacios al escribir comandos.`);
                break;

            case 'fraseromantica':
                await msg.reply('❤️ *Frase:* "Eres mi variable favorita en este código."');
                break;

            case 'uptime':
                const uptimeDiff2 = Math.abs(new Date() - startTime);
                await msg.reply(`⏱️ *Activo:* ${Math.floor(uptimeDiff2 / (1000 * 60 * 60))} horas.`);
                break;

            case 'sistema':
                await msg.reply(`🖥️ *Servidor:* Linux (Railway Cloud)\n📦 *Entorno:* Node.js v22`);
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
