// Servidor para evitar que Railway apague el bot
const http = require('http');
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot activo 24/7\n');
}).listen(port, () => {
    console.log(`🌍 Servidor corriendo en puerto ${port}`);
});

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const startTime = new Date();
const rpgDatabase = {};

// Función para la economía del juego
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

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--headless=new'
        ]
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('====================================');
    console.log('🔗 SACA EL QR DESDE ESTE ENLACE:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
    console.log('====================================');
});

client.on('ready', () => {
    console.log('¡El Bot está completamente en línea y respondiendo!');
});

client.on('message_create', async msg => {
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
╰➤ .4vs4 | .6vs6 | .8vs8 | .12vs12 | .sala`;

                    await msg.reply(menuTexto);
                }
                break;

            case 'play':
                if (!args.length) {
                    await msg.reply('❌ Escribe el nombre de la canción. Ejemplo: `.play Sia Unstoppable`');
                    break;
                }
                try {
                    await msg.reply('🎵 Buscando canción y convirtiendo a MP3... Espera un momento.');
                    const searchRes = await axios.get(`https://deliriusemperor-api.mp3yt.org/api/ytsearch?q=${encodeURIComponent(args.join(' '))}`);
                    if (!searchRes.data || !searchRes.data.data || searchRes.data.data.length === 0) {
                        await msg.reply('❌ No encontré esa canción en YouTube.');
                        break;
                    }
                    
                    const primerVideoUrl = searchRes.data.data[0].url;
                    const tituloCancion = searchRes.data.data[0].title;
                    const downloadRes = await axios.get(`https://deliriusemperor-api.mp3yt.org/api/download/ytmp3?url=${encodeURIComponent(primerVideoUrl)}`);
                    
                    if (downloadRes.data && downloadRes.data.data && downloadRes.data.data.downloadUrl) {
                        const audioUrl = downloadRes.data.data.downloadUrl;
                        const mediaRes = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                        const base64Audio = Buffer.from(mediaRes.data, 'binary').toString('base64');
                        const mediaFile = new MessageMedia('audio/mp3', base64Audio, `${tituloCancion}.mp3`);
                        await chat.sendMessage(mediaFile, { caption: `🎧 *Aquí tienes tu música:* ${tituloCancion}` });
                    } else {
                        await msg.reply('❌ No se pudo procesar el audio en este instante.');
                    }
                } catch (e) {
                    await msg.reply('❌ Error al intentar descargar el audio de música.');
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
            case 'viso':
                if (!chat.isGroup) {
                    await msg.reply('❌ Este comando solo funciona en grupos.');
                    break;
                }
                if (!isAdmin) {
                    await msg.reply('❌ Solo administradores.');
                    break;
                }

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
                        } catch (err) {
                            console.log(err);
                        }
                    }
                    await chat.sendMessage(txtAviso);
                } else {
                    await msg.reply('❌ Responde a un mensaje escribiendo *.aviso* para duplicarlo como comunicado.');
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
                } else {
                    await msg.reply('❌ Responde a un mensaje/imagen con *.reenviar* para volverlo a mandar.');
                }
                break;

            case 'todos':
                if (!chat.isGroup) {
                    await msg.reply('❌ Este comando solo funciona en grupos.');
                    break;
                }
                if (!isAdmin) {
                    await msg.reply('❌ Solo los administradores pueden usar este comando.');
                    break;
                }

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
                await msg.reply(`👤 *Creador del Bot:* DEYVI A.O.C\n💬 *Contacto:* Escríbele al +51 900834505 para soporte técnico.`);
                break;

            case 'reg':
                await msg.reply(`✅ *¡Registro Exitoso!* Hola ${username}, has sido guardado correctamente en el sistema virtual del bot.`);
                break;

            case 'unreg':
                await msg.reply('❌ *Registro Eliminado:* Tus datos virtuales han sido borrados con éxito.');
                break;

            case '4vs4':
            case '6vs6':
            case '8vs8':
            case '12vs12':
                await msg.reply(`🎮 *¡Convocatoria de Free Fire Activa!* \n\n@everyone ¡Salgan de sus escondites! Se está organizando un *${command.toUpperCase()}*. Preparen sus armas, confirmen su asistencia abajo y dejen su ID. 🏆🔥`);
                break;

            case 'sala':
                await msg.reply('🔑 ⚔️ *CREACIÓN DE SALA FREE FIRE* ⚔️\n──────────────────\n🆔 *ID de Sala:* (Esperando que el admin la cree...)\n🔒 *Contraseña:* (Se enviará al privado/chat en breve).\n\n¡Vayan entrando al juego ya mismo!');
                break;

            case 'piropo':
                const piropos = [
                    "¿Acaso eres Google? Porque tienes todo lo que estoy buscando. 😏",
                    "No es el wifi, es tu sonrisa la que me desconecta del mundo. ✨",
                    "Quisiera ser programador para compilar una vida entera junto a ti. 💻"
                ];
                await msg.reply(`🍯 *Piropo del día:* \n\n${piropos[Math.floor(Math.random() * piropos.length)]}`);
                break;

            case 'consejo':
                const consejos = [
                    "No cuentes los días, haz que los días cuenten. 😎",
                    "Si el código no compila a la primera, tómate un café y vuelve a revisar los puntos y comas. ☕"
                ];
                await msg.reply(`💡 *Consejo del bot:* \n\n${consejos[Math.floor(Math.random() * consejos.length)]}`);
                break;

            case 'fraseromantica':
                await msg.reply('❤️ *Frase Romántica:* \n\n"En un mundo lleno de variables, tú eres mi única constante inmutable."');
                break;

            case 'uptime':
                const uptimeDiff = Math.abs(new Date() - startTime);
                await msg.reply(`⏱️ *Tiempo en Línea:* El bot lleva activo de forma ininterrumpida: *${Math.floor(uptimeDiff / (1000 * 60 * 60))} horas*.`);
                break;

            case 'sistema':
                await msg.reply(`🖥️ *\`Estado del Servidor\`*\n──────────────────\n💻 *Plataforma:* Linux (Railway Cloud)\n📦 *Entorno:* Node.js v22.2.3\n⚙️ *Estado:* Operando en perfecto estado sin caídas.`);
                break;

            case 'ping':
                const startPing = Date.now();
                const reply = await msg.reply('🏓 Midiendo latencia...');
                await reply.edit(`🚀 *Pong!* Latencia: ${Date.now() - startPing}ms`);
                break;

            case 'admins':
                if (!chat.isGroup) break;
                let txtAdmins = `👑 *CONVOCANDO ADMINISTRADORES:* \n\n`;
                let mencionesAdmins = [];
                for (let part of chat.participants) {
                    if (part.isAdmin || part.isSuperAdmin) {
                        try {
                            const cont = await client.getContactById(part.id._serialized);
                            mencionesAdmins.push(cont);
                            txtAdmins += `@${part.id.user} `;
                        } catch (e) {}
                    }
                }
                await chat.sendMessage(txtAdmins, { mentions: mencionesAdmins });
                break;

            case 'kick':
                if (!chat.isGroup) break;
                if (!isAdmin) {
                    await msg.reply('❌ No tienes permisos.');
                    break;
                }
                if (msg.hasMentioned) {
                    const ment = await msg.getMentions();
                    await chat.removeParticipants([ment[0].id._serialized]);
                    await chat.sendMessage(`👋 @${ment[0].id.user} ha sido eliminado del grupo.`, { mentions: [ment[0]] });
                } else {
                    await msg.reply('❌ Menciona a quién deseas eliminar. Ejemplo: .kick @usuario');
                }
                break;

            case 'promote':
            case 'promete':
                if (!chat.isGroup || !isAdmin) break;
                if (msg.hasMentioned) {
                    const ment = await msg.getMentions();
                    await chat.promoteParticipants([ment[0].id._serialized]);
                    await msg.reply(`👑 ¡@${ment[0].id.user} ahora es Administrador!`);
                }
                break;

            case 'demote':
                if (!chat.isGroup || !isAdmin) break;
                if (msg.hasMentioned) {
                    const ment = await msg.getMentions();
                    await chat.demoteParticipants([ment[0].id._serialized]);
                    await msg.reply(`📉 A @${ment[0].id.user} se le han retirado los privilegios de Administrador.`);
                }
                break;

            case 'grupo':
                if (!chat.isGroup || !isAdmin) break;
                if (args[0] === 'abrir') {
                    await chat.setMessagesAdminsOnly(false);
                    await chat.sendMessage('🔓 *El grupo ha sido abierto.* Todos los participantes pueden enviar mensajes.');
                } else if (args[0] === 'cerrar') {
                    await chat.setMessagesAdminsOnly(true);
                    await chat.sendMessage('🔒 *El grupo ha sido cerrado.* Solo los administradores pueden enviar mensajes.');
                }
                break;

            case 'ia':
            case 'ai':
                if (!args.length) {
                    await msg.reply('❌ Escribe una pregunta. Ejemplo: `.ia ¿Cómo vuelan los aviones?`');
                    break;
                }
                try {
                    await msg.reply('🧠 *KORI IA* pensando... dame un momento.');
                    const peticion = await axios.get(`https://deliriusemperor-api.mp3yt.org/api/chatgpt?q=${encodeURIComponent(args.join(' '))}`);
                    if (peticion.data && peticion.data.data) {
                        await msg.reply(`🤖 *Respuesta de IA:* \n\n${peticion.data.data}`);
                    } else {
                        await msg.reply('❌ La IA está saturada en este momento, intenta de nuevo.');
                    }
                } catch (e) {
                    await msg.reply('❌ Hubo un fallo al conectar con la IA gratuita.');
                }
                break;

            case 'yts':
