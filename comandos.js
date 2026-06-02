const { MessageMedia } = require('whatsapp-web.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// 🔑 Tu clave API nativa de Gemini
const GEMINI_API_KEY = "AQ.Ab8RN6J-5x57rikx5NrolJCHCHnRxkmHK0psnMdo8-0yDAA5yA"; 

let aiModel = null;
try {
    if (GEMINI_API_KEY) {
        const aiConfig = new GoogleGenerativeAI(GEMINI_API_KEY);
        aiModel = aiConfig.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
} catch (e) { 
    console.log("Error cargando Gemini."); 
}

const startTime = new Date();
const rpgDatabase = {};
const groupSettings = {}; // Aquí se guardan los textos personalizados de bienvenida/despedida de cada grupo

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
        groupSettings[chatId] = { 
            welcome: false, 
            bye: false,
            welcomeText: "✨ ¡Hola @user! Bienvenido(a) al grupo. Pásala genial y respeta las reglas. 🥳👑",
            byeText: "👋 Un miembro menos... @user se ha retirado del grupo. ¡Que te vaya bien! ✨"
        };
    }
    return groupSettings[chatId];
}

async function ejecutar(client, msg) {
    try {
        if (!msg.body) return;
        const body = msg.body.trim();
        
        if (!body.startsWith('.') && !body.toLowerCase().startsWith('aviso')) return;

        let command = '';
        let args = [];

        if (body.toLowerCase().startsWith('aviso')) {
            command = 'aviso';
            args = body.split(/ +/).slice(1);
        } else {
            const splitArgs = body.slice(1).trim().split(/ +/);
            command = splitArgs.shift().toLowerCase();
            args = splitArgs;
        }

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
            if (participant && (participant.isAdmin || participant.isSuperAdmin)) isAdmin = true;
        }

        switch (command) {
            case 'bot':
            case 'menu':
                if (args[0]?.toLowerCase() === 'menú' || args[0]?.toLowerCase() === 'menu' || command === 'menu') {
                    const uptimeDiff = Math.abs(new Date() - startTime);
                    const hours = Math.floor(uptimeDiff / (1000 * 60 * 60));
                    const minutes = Math.floor((uptimeDiff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((uptimeDiff % (1000 * 60)) / 1000);

                    const menuTexto = `✨ ╔════════════════════════╗ ✨
       👑  *KORI BOT - SYSTEM* ✨ ╚════════════════════════╝ ✨

👤 *Usuario:* \`${username.toUpperCase()}\`
⚔️ *Rango:* \`Novato V\`
⏱️ *Activo:* \`${hours}h ${minutes}m ${seconds}s\`

────────────────────────────
📊 *STATUS & SISTEMA*
────────────────────────────
📝 ➪ \`.owner\` ── Info del desarrollador
⚡ ➪ \`.ping\` ── Verificar velocidad del bot
🕒 ➪ \`.uptime\` ── Tiempo activo en línea
💻 ➪ \`.sistema\` ── Detalles del servidor cloud

🛡️ *GESTIÓN DE GRUPOS & COMPORTAMIENTOS*
────────────────────────────
📣 ➪ \`.todos <txt>\` ── Invocar y mencionar ordenado
📢 ➪ \`aviso\` ── Reenviar avisos importantes con foto
🔄 ➪ \`.reenviar\` ── Clonar contenido multimedia
🚪 ➪ \`.welcome on/off\` ── Interruptor de bienvenida
📝 ➪ \`.welcome texto <msg>\` ── Personalizar tu bienvenida
👋 ➪ \`.bye on/off\` ── Interruptor de despedida
📝 ➪ \`.bye texto <msg>\` ── Personalizar tu despedida

🧠 *INTELIGENCIA ARTIFICIAL (ESTABLE)*
────────────────────────────
🤖 ➪ \`.gemini <pregunta>\` ── Consultar a Gemini 1.5

🎰 *JUEGOS VIRTUALES & ECONOMÍA RPG*
────────────────────────────
📇 ➪ \`.perfil\` ── Ver tu billetera y datos
💰 ➪ \`.trabajar\` ── Trabajar para ganar monedas
🎁 ➪ \`.daily\` ── Reclamar tu bono diario gratuito
🎲 ➪ \`.ruleta <cant>\` ── Apuesta tus monedas en la suerte

🎭 *DIVERSIÓN INTEGRADA & CHAT*
────────────────────────────
🃏 ➪ \`.chiste\` ── Envía un chiste divertido
🍯 ➪ \`.piropo\` ── Envía un piropo piola
💡 ➪ \`.consejo\` ── Te da un consejo útil de vida
❤️ ➪ \`.fraseromantica\` ── Dedica una frase de amor
💵 ➪ \`.dolar\` ── Tipo de cambio del dólar actual
🎨 ➪ \`.s\` ── Convertir fotos/videos en Sticker

🎮 *CAMPAMENTO FREE FIRE AREA*
────────────────────────────
🏆 ➪ \`.4vs4\` | \`.6v6\` | \`.8vs8\` | \`.12vs12\`
🔑 ➪ \`.sala\` ── Formatear datos para crear Sala

✨ ─── \`By: DEYVI A.O.C\` ─── ✨`;

                    await msg.reply(menuTexto);
                }
                break;
                case 'welcome':
                if (!chat.isGroup || !isAdmin) return msg.reply('❌ Comando exclusivo para Administradores.');
                const confW = getGroupConfig(chat.id._serialized);
                if (args[0] === 'on') {
                    confW.welcome = true;
                    await msg.reply('✅ *Mensajes de Bienvenida con Foto:* ACTIVADOS.');
                } else if (args[0] === 'off') {
                    confW.welcome = false;
                    await msg.reply('❌ *Mensajes de Bienvenida:* DESACTIVADOS.');
                } else if (args[0] === 'texto') {
                    const nuevoTexto = args.slice(1).join(' ');
                    if (!nuevoTexto) return msg.reply('❌ Escribe el texto.\nEjemplo: `.welcome texto ¡Hola! Bienvenido @user`');
                    confW.welcomeText = nuevoTexto;
                    await msg.reply(`📝 *Bienvenida Guardada.*\n\n*Vista previa aproximada:*\n${nuevoTexto.replace('@user', '@' + sender.id.user)}`);
                } else { 
                    await msg.reply('💡 *Configuración de Bienvenida:*\n➪ `.welcome on/off` (Encender/Apagar)\n➪ `.welcome texto <Pon aquí tus frases y usa la palabra @user para etiquetarlo>`'); 
                }
                break;

            case 'bye':
                if (!chat.isGroup || !isAdmin) return msg.reply('❌ Comando exclusivo para Administradores.');
                const confB = getGroupConfig(chat.id._serialized);
                if (args[0] === 'on') {
                    confB.bye = true;
                    await msg.reply('✅ *Mensajes de Despedida con Foto:* ACTIVADOS.');
                } else if (args[0] === 'off') {
                    confB.bye = false;
                    await msg.reply('❌ *Mensajes de Despedida:* DESACTIVADOS.');
                } else if (args[0] === 'texto') {
                    const nuevoTexto = args.slice(1).join(' ');
                    if (!nuevoTexto) return msg.reply('❌ Escribe el texto.\nEjemplo: `.bye texto El usuario @user abandonó la escuadra.`');
                    confB.byeText = nuevoTexto;
                    await msg.reply(`📝 *Despedida Guardada.*\n\n*Vista previa aproximada:*\n${nuevoTexto.replace('@user', '@' + sender.id.user)}`);
                } else { 
                    await msg.reply('💡 *Configuración de Despedida:*\n➪ `.bye on/off` (Encender/Apagar)\n➪ `.bye texto <Pon aquí tus frases y usa la palabra @user para etiquetarlo>`'); 
                }
                break;

            case 'todos':
                if (!chat.isGroup || !isAdmin) break;
                let infoTexto = `📣 *CONVOCATORIA GENERAL DE MIEMBROS* 📣\n`;
                if (args.length > 0) infoTexto += `📝 *Motivo:* ${args.join(' ')}\n`;
                infoTexto += `────────────────────────────\n\n`;
                let mencionesMiembros = [];
                for (let participante of chat.participants) {
                    try {
                        const contacto = await client.getContactById(participante.id._serialized);
                        mencionesMiembros.push(contacto);
                        infoTexto += `💚 ➪ @${participante.id.user}\n`;
                    } catch (e) {}
                }
                await chat.sendMessage(infoTexto.trim(), { mentions: mencionesMiembros });
                break;

            case 'aviso':
                if (!chat.isGroup || !isAdmin) break;
                let txtAviso = `📢 *\`AVISO IMPORTANTE DE ADMINISTRACIÓN:\`*\n\n`;
                if (msg.hasQuotedMsg) {
                    const quotedMsg = await msg.getQuotedMessage();
                    txtAviso += quotedMsg.body || args.join(' ') || '';
                    if (quotedMsg.hasMedia) {
                        try {
                            const mediaAviso = await quotedMsg.downloadMedia();
                            await chat.sendMessage(mediaAviso, { caption: txtAviso });
                            break;
                        } catch (err) {}
                    }
                } else {
                    if (!args.length) return msg.reply('❌ Escribe el comunicado del aviso.');
                    txtAviso += args.join(' ');
                }
                await chat.sendMessage(txtAviso);
                break;

            case 'gemini':
                if (!args.length) return msg.reply('❌ Por favor, escribe tu pregunta para Gemini.');
                if (!aiModel) return msg.reply('❌ El motor directo de Gemini no está configurado.');
                try {
                    await msg.reply('🧠 *KORI IA* pensando...');
                    const result = await aiModel.generateContent(args.join(' '));
                    const response = await result.response;
                    await msg.reply(`🤖 *Respuesta de Gemini:* \n\n${response.text()}`);
                } catch (err) { await msg.reply('❌ Error al procesar con tu clave API de Google.'); }
                break;

            case 'reenviar':
                if (msg.hasQuotedMsg) {
                    const quoted = await msg.getQuotedMessage();
                    if (quoted.hasMedia) {
                        const archivoMedia = await quoted.downloadMedia();
                        await chat.sendMessage(archivoMedia, { caption: quoted.body || '' });
                    } else { await chat.sendMessage(quoted.body); }
                }
                break;

            case 'dolar':
                try {
                    const res = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
                    const r = res.data.rates;
                    await msg.reply(`💵 *\`TIPO DE CAMBIO FINANCIERO\`*\n────────────────────────────\n🇵🇪 *Perú (PEN):* S/. ${r.PEN.toFixed(2)}\n🇲🇽 *México (MXN):* $${r.MXN.toFixed(2)}\n🇨🇱 *Chile (CLP):* $${r.CLP.toFixed(2)}`);
                } catch (e) { await msg.reply('❌ Error al consultar valores.'); }
                break;

            case 'chiste':
                const chistes = ["— Papá, papá, ¿qué se siente tener un hijo tan guapo? \n— No sé hijo, pregúntale a tu abuelo. 😂", "¿Qué hace una abeja en el gimnasio? \n¡Zumba! 🐝"];
                await msg.reply(`🃏 *Chiste:* \n\n${chistes[Math.floor(Math.random() * chistes.length)]}`);
                break;

            case 'perfil':
                const perfil = getProfile(userId, username);
                await msg.reply(`📇 *\`SISTEMA RPG KORI\`*\n────────────────────────────\n👤 *Nombre:* ${perfil.name}\n💰 *Bolsillo:* $${perfil.coins} monedas\n🏦 *Banco Virtual:* $${perfil.bank} monedas\n💎 *Gemas:* ${perfil.gems}`);
                break;

            case 'work':
            case 'trabajar':
                const pWork = getProfile(userId, username);
                const tiempoActual = Date.now();
                if (tiempoActual - pWork.lastWork < 300000) {
                    const restante = Math.ceil((300000 - (tiempoActual - pWork.lastWork)) / 1000);
                    await msg.reply(`⏳ Espera *${restante} segundos* para volver a trabajar.`);
                    break;
                }
                const ganancias = Math.floor(Math.random() * 250) + 150;
                pWork.coins += ganancias; pWork.lastWork = tiempoActual;
                await msg.reply(`💰 Ganaste *$${ganancias} monedas virtuales*.`);
                break;

            case 'daily':
                const pDaily = getProfile(userId, username);
                const ahora = Date.now();
                if (ahora - pDaily.lastDaily < 86400000) return msg.reply('❌ Ya reclamaste tu recompensa diaria.');
                pDaily.coins += 1000; pDaily.lastDaily = ahora;
                await msg.reply('🎁 *RECOMPENSA DIARIA* \n────────────────────────────\n💵 *+$1,000 monedas virtuales*');
                break;

            case 'ruleta':
                const pRuleta = getProfile(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Introduce cantidad.');
                const apuesta = parseInt(args[0]);
                if (pRuleta.coins < apuesta) return msg.reply('❌ Saldo insuficiente.');
                if (Math.random() >= 0.5) { pRuleta.coins += apuesta; await msg.reply(`🎰 *¡Ganaste!:* +$${apuesta} monedas.`); } 
                else { pRuleta.coins -= apuesta; await msg.reply(`🎰 *Perdiste:* -$${apuesta} monedas.`); }
                break;
                case 'owner':
            case 'creador':
                await msg.reply(`👤 *Creador Oficial:* DEYVI A.O.C\n💬 *Contacto de Soporte:* +51 900834505`);
                break;

            case '4vs4':
            case '6vs6':
            case '8vs8':
            case '12vs12':
                await msg.reply(`🎮 *¡CONVOCATORIA DE FREE FIRE ACTIVA!* 🎮\n────────────────────────────\n\n@everyone ¡Se armó la escuadra para un *${command.toUpperCase()}*! Dejen sus IDs abajo y entren. 🏆🔥`);
                break;

            case 'sala':
                await msg.reply('🔑 ⚔️ *DATOS DE LA SALA DE FREE FIRE* ⚔️\n🆔 *ID de la Sala:* Cargando...\n🔒 *Contraseña:* Se enviará por privado.');
                break;

            case 'piropo':
                await msg.reply("🍯 *Piropo del Día:* ¿Acaso eres Google? Porque tienes todo lo que busco. 😏");
                break;

            case 'consejo':
                await msg.reply("💡 *Consejo Útil:* Ahorra tus monedas trabajando con \`.trabajar\` antes de ir a la ruleta.");
                break;

            case 'fraseromantica':
                await msg.reply('❤️ *Frase:* "En el mapa de mi vida, tu número de WhatsApp marca mi lugar favorito."');
                break;

            case 'uptime':
                const upDiff = Math.abs(new Date() - startTime);
                await msg.reply(`⏱️ *Activo:* ${Math.floor(upDiff / (1000 * 60 * 60))} horas.`);
                break;

            case 'sistema':
                await msg.reply(`🖥️ *Servidor:* Linux Cloud\n📦 *Engine:* Node.js v22\n🚀 *Estado:* Optimizado`);
                break;

            case 'ping':
                await msg.reply('🚀 *¡Pong!* Kori Bot activo.');
                break;

            case 's':
            case 'sticker':
                if (msg.hasMedia || (msg.hasQuotedMsg && (await msg.getQuotedMessage()).hasMedia)) {
                    try {
                        await msg.reply('⏳ *Generando Sticker...*');
                        const m = msg.hasMedia ? msg : await msg.getQuotedMessage();
                        const media = await m.downloadMedia();
                        if (media) {
                            await chat.sendMessage(media, {
                                sendMediaAsSticker: true,
                                stickerName: "KORI SYSTEM 🤖", stickerAuthor: "DEYVI A.O.C ✨"
                            });
                        }
                    } catch (e) { await msg.reply('❌ Error al crear sticker.'); }
                } else { await msg.reply('❌ Responde a una foto con *.s*'); }
                break;

            default:
                break;
        }
    } catch (error) { console.log('Error general:', error); }
}

// 🏠 ========================================================
// 🚪 DISPARADORES AUTOMÁTICOS DE EVENTOS DE GRUPO (WELCOME & BYE)
// 🏠 ========================================================

function vincularEventosEspeciales(client) {
    // 🚪 DETECTOR CUANDO ENTRA ALGUIEN NUEVO
    client.on('group_join', async (notification) => {
        try {
            const chat = await notification.getChat();
            const contact = await client.getContactById(notification.recipientIds[0]);
            const config = getGroupConfig(chat.id._serialized);

            if (config.welcome) {
                let mensajeFinal = config.welcomeText.replace('@user', `@${contact.id.user}`);
                let fotoMedia;

                try {
                    // Intenta extraer la foto real de perfil del usuario nuevo
                    const pfpUrl = await client.getProfilePicUrl(contact.id._serialized);
                    if (pfpUrl) {
                        fotoMedia = await MessageMedia.fromUrl(pfpUrl);
                    }
                } catch (err) { console.log("Usuario tiene foto privada, usando backup."); }

                // Si no tiene foto de perfil o falló, usa una foto genérica bonita de bienvenida
                if (!fotoMedia) {
                    fotoMedia = await MessageMedia.fromUrl("https://i.postimg.cc/FsYfN5vK/welcome-image.jpg").catch(() => null);
                }

                if (fotoMedia) {
                    await chat.sendMessage(fotoMedia, { caption: mensajeFinal, mentions: [contact] });
                } else {
                    await chat.sendMessage(mensajeFinal, { mentions: [contact] });
                }
            }
        } catch (e) { console.log("Error en evento welcome:", e); }
    });

    // 🚪 DETECTOR CUANDO ALGUIEN SE SALE O LO SACAN
    client.on('group_leave', async (notification) => {
        try {
            const chat = await notification.getChat();
            const contact = await client.getContactById(notification.recipientIds[0]);
            const config = getGroupConfig(chat.id._serialized);

            if (config.bye) {
                let mensajeFinal = config.byeText.replace('@user', `@${contact.id.user}`);
                
                // Carga una imagen descriptiva aleatoria triste de despedida
                const fotoDespedida = await MessageMedia.fromUrl("https://i.postimg.cc/gJ0pM9qf/bye-image.jpg").catch(() => null);

                if (fotoDespedida) {
                    await chat.sendMessage(fotoDespedida, { caption: mensajeFinal, mentions: [contact] });
                } else {
                    await chat.sendMessage(mensajeFinal, { mentions: [contact] });
                }
            }
        } catch (e) { console.log("Error en evento bye:", e); }
    });
}

// Exportamos todo limpio para vincularlo a tu archivo raíz
module.exports = { ejecutar, vincularEventosEspeciales };
