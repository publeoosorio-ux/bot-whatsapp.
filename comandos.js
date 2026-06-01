const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');

const startTime = new Date();
const rpgDatabase = {};

// Base de datos simple para el RPG
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
╰➤ .play <canción> *(Descarga Música MP3)*
╰➤ .video <nombre> *(Descarga Video MP4)*

💭 *\`Trilogía de Inteligencia Artificial\`*
╰➤ .gemini <pregunta> *(Motor Google Gemini)*
╰➤ .chatgpt <pregunta> *(Motor OpenAI GPT-4)*
╰➤ .claude <pregunta> *(Motor Anthropic Claude)*
╰➤ .ia <pregunta> *(Usa la IA más rápida disponible)*

🔍 *\`Búsquedas & Herramientas\`*
╰➤ .yts <búsqueda> | .s | .sticker | .google <tema>

🍯 *\`Diversión, Frases & Utilidades\`*
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
                    const res = await axios.get(`https://api.zenkey.my.id/api/download/ytmp3?query=${query}`);
                    if (res.data && res.data.result && res.data.result.download_url) {
                        const audioUrl = res.data.result.download_url;
                        const titulo = res.data.result.title || 'Audio de Kori Bot';
                        const mediaRes = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                        const base64Audio = Buffer.from(mediaRes.data, 'binary').toString('base64');
                        const mediaFile = new MessageMedia('audio/mp3', base64Audio, `${titulo}.mp3`);
                        await chat.sendMessage(mediaFile, { caption: `🎧 *Completado:* ${titulo}` });
                    } else {
                        await msg.reply('❌ No se pudo descargar la canción. Intenta con otro nombre.');
                    }
                } catch (e) {
                    await msg.reply('❌ El servidor de música está saturado. Intenta de nuevo en unos minutos.');
                }
                break;

            case 'video':
                if (!args.length) {
                    await msg.reply('❌ Escribe el nombre del video. Ejemplo: `.video goles de Messi`');
                    break;
                }
                try {
                    await msg.reply('🎥 Buscando y procesando el video... Por favor espera.');
                    const query = encodeURIComponent(args.join(' '));
                    const res = await axios.get(`https://api.zenkey.my.id/api/download/ytmp4?query=${query}`);
                    if (res.data && res.data.result && res.data.result.download_url) {
                        const videoUrl = res.data.result.download_url;
                        const titulo = res.data.result.title || 'Video';
                        const mediaRes = await axios.get(videoUrl, { responseType: 'arraybuffer' });
                        const base64Video = Buffer.from(mediaRes.data, 'binary').toString('base64');
                        const mediaFile = new MessageMedia('video/mp4', base64Video, `${titulo}.mp4`);
                        await chat.sendMessage(mediaFile, { caption: `🎬 *Aquí tienes:* ${titulo}` });
                    } else {
                        await msg.reply('❌ No se pudo obtener el archivo de video.');
                    }
                } catch (e) {
                    await msg.reply('❌ Servidor de video en mantenimiento temporal.');
                }
                break;
                case 'ia':
            case 'chatgpt':
                if (!args.length) return msg.reply('❌ Escribe tu consulta. Ejemplo: `.chatgpt cómo se hace un bot`');
                try {
                    await msg.reply('🤖 *KORI IA (ChatGPT)* analizando...');
                    const prompt = encodeURIComponent(args.join(' '));
                    const res = await axios.get(`https://api.zenkey.my.id/api/ai/chatgpt?prompt=${prompt}`);
                    if (res.data && res.data.result) {
                        await msg.reply(`🤖 *Respuesta de ChatGPT:* \n\n${res.data.result}`);
                    } else {
                        await msg.reply('❌ Respuesta vacía de ChatGPT, intenta con `.gemini`');
                    }
                } catch (err) {
                    await msg.reply('❌ Error de conexión con ChatGPT. Prueba usando `.gemini` o `.claude`');
                }
                break;

            case 'gemini':
                if (!args.length) return msg.reply('❌ Escribe tu consulta. Ejemplo: `.gemini qué es el sol`');
                try {
                    await msg.reply('🧠 *KORI IA (Gemini)* pensando...');
                    const prompt = encodeURIComponent(args.join(' '));
                    const res = await axios.get(`https://api.zenkey.my.id/api/ai/gemini?prompt=${prompt}`);
                    if (res.data && res.data.result) {
                        await msg.reply(`🤖 *Respuesta de Gemini:* \n\n${res.data.result}`);
                    } else {
                        await msg.reply('❌ Error al procesar con Gemini.');
                    }
                } catch (err) {
                    await msg.reply('❌ Los servidores globales de Gemini no respondieron. Intenta con `.chatgpt`');
                }
                break;

            case 'claude':
                if (!args.length) return msg.reply('❌ Escribe tu consulta. Ejemplo: `.claude redacta un ensayo`');
                try {
                    await msg.reply('🦅 *KORI IA (Claude)* procesando...');
                    const prompt = encodeURIComponent(args.join(' '));
                    const res = await axios.get(`https://api.zenkey.my.id/api/ai/claude?prompt=${prompt}`);
                    if (res.data && res.data.result) {
                        await msg.reply(`🤖 *Respuesta de Claude:* \n\n${res.data.result}`);
                    } else {
                        await msg.reply('❌ Error al procesar con Claude.');
                    }
                } catch (err) {
                    await msg.reply('❌ Servidor de Claude ocupado. Usa `.chatgpt`');
                }
                break;

            case 'yts':
                if (!args.length) return msg.reply('❌ Escribe qué deseas buscar. Ejemplo: `.yts rap`');
                try {
                    await msg.reply('🔍 Buscando videos en YouTube...');
                    const query = encodeURIComponent(args.join(' '));
                    const resYts = await axios.get(`https://api.zenkey.my.id/api/search/youtube?query=${query}`);
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

            case 'google':
                if (!args.length) return msg.reply('❌ ¿Qué quieres buscar en Google? Ejemplo: `.google programación Node.js`');
                try {
                    const query = encodeURIComponent(args.join(' '));
                    const res = await axios.get(`https://api.zenkey.my.id/api/search/google?query=${query}`);
                    if (res.data && res.data.result && res.data.result.length > 0) {
                        let txt = `🔍 *\`Resultados de Google\`*\n──────────────────\n\n`;
                        res.data.result.slice(0, 3).forEach((r) => {
                            txt += `🔹 *${r.title}*\n📝 ${r.snippet}\n🔗 _${r.link}_\n\n`;
                        });
                        await msg.reply(txt.trim());
                    } else {
                        await msg.reply('❌ No se encontraron resultados en la web.');
                    }
                } catch (e) {
                    await msg.reply('❌ Error al conectar con Google.');
                }
                break;

            case 'clima':
                if (!args.length) return msg.reply('❌ Di una ciudad. Ejemplo: `.clima Lima`');
                try {
                    const ciudad = encodeURIComponent(args.join(' '));
                    const res = await axios.get(`https://api.zenkey.my.id/api/tools/weather?location=${ciudad}`);
                    if (res.data && res.data.result) {
                        const c = res.data.result;
                        await msg.reply(`☀️ *\`Clima en ${args.join(' ')}\`*\n──────────────────\n🌡️ *Temperatura:* ${c.temperature || 'N/A'}\n💨 *Viento:* ${c.wind || 'N/A'}\n📝 *Estado:* ${c.description || 'N/A'}`);
                    } else {
                        await msg.reply('❌ No se pudo encontrar esa ciudad.');
                    }
                } catch (e) {
                    await msg.reply('❌ Error al consultar el clima.');
                }
                break;

            case 'dolar':
                try {
                    await msg.reply('💵 Consultando tipo de cambio del mercado financiero...');
                    const res = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
                    if (res.data && res.data.rates) {
                        const r = res.data.rates;
                        await msg.reply(`💵 *\`Precio del Dólar Actual\`*\n──────────────────\n🇵🇪 *Perú (PEN):* S/. ${r.PEN.toFixed(2)}\n🇲🇽 *México (MXN):* $${r.MXN.toFixed(2)}\n🇨🇱 *Chile (CLP):* $${r.CLP.toFixed(2)}\n🇦🇷 *Argentina (ARS):* $${r.ARS.toFixed(2)}`);
                    }
                } catch (e) {
                    await msg.reply('❌ Error al obtener cotización.');
                }
                break;

            case 'chiste':
                const chistes = [
                    "— Papá, papá, ¿qué se siente tener un hijo tan guapo? \n— No sé hijo, pregúntale a tu abuelo. 😂",
                    "¿Qué hace una abeja en el gimnasio? \n¡Zumba! 🐝",
                    "¿Por qué los pájaros no usan Facebook? \nPorque ya tienen Twitter. 🐦"
                ];
                await msg.reply(`🃏 *Chiste:* \n\n${chistes[Math.floor(Math.random() * chistes.length)]}`);
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
                pWork.coins += ganancias;
                pWork.xp += 250;
                pWork.lastWork = tiempoActual;
                await msg.reply(`💰 Trabajaste duro y ganaste *$${ganancias} monedas virtuales* y *+250 XP*.`);
                break;

            case 'daily':
                const pDaily = getProfile(userId, username);
                const ahora = Date.now();
                if (ahora - pDaily.lastDaily < 86400000) {
                    await msg.reply('❌ Ya reclamaste tu recompensa diaria hoy.');
                    break;
                }
                pDaily.coins += 1000;
                pDaily.gems += 5;
                pDaily.lastDaily = ahora;
                await msg.reply('🎁 *RECOMPENSA DIARIA* 🎁\n──────────────────\n💵 *+$1,000 monedas*\n💎 *+5 Gemas gratis*');
                break;

            case 'ruleta':
                const pRuleta = getProfile(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Introduce cantidad. Ejemplo: `.ruleta 200`');
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
                await msg.reply(`💡 *Consejo:* Invierte tus monedas en el comando .ruleta solo cuando te sientas con suerte.`);
                break;

            case 'fraseromantica':
                await msg.reply('❤️ *Frase:* "Eres mi variable favorita en este código."');
                break;

            case 'uptime':
                const uptimeDiff = Math.abs(new Date() - startTime);
                await msg.reply(`⏱️ *Activo:* ${Math.floor(uptimeDiff / (1000 * 60 * 60))} horas.`);
                break;

            case 'sistema':
                await msg.reply(`🖥️ *Servidor:* Linux\n📦 *Entorno:* Node.js v22\n🛠️ *IAs Conectadas:* ChatGPT, Gemini, Claude.`);
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
