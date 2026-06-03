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
} catch (e) { console.log("Error cargando Gemini."); }

const startTime = new Date();
const rpgDatabase = {};
const groupSettings = {}; 
const registroActividad = {}; // Guarda el registro de inactivos para el sistema anti-fantasmas

function getProfile(userId, pushname) {
    if (!rpgDatabase[userId]) {
        rpgDatabase[userId] = {
            name: pushname || 'Usuario',
            coins: 500, bank: 1000, gems: 15, level: 0, xp: 0, lastDaily: 0, lastWork: 0,
            asegurado: false // Estado para evitar robos
        };
    }
    return rpgDatabase[userId];
}

function getGroupConfig(chatId) {
    if (!groupSettings[chatId]) {
        groupSettings[chatId] = { 
            welcome: false, bye: false,
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
        const chat = await msg.getChat();
        const sender = await msg.getContact();
        const userId = sender.id._serialized;
        const username = sender.pushname || 'Usuario';

        // Registrar actividad de los miembros
        if (chat.isGroup) {
            if (!registroActividad[chat.id._serialized]) registroActividad[chat.id._serialized] = {};
            registroActividad[chat.id._serialized][userId] = true;
        }

        // Conversación orgánica interactiva al mencionar "bot"
        if (!body.startsWith('.') && !body.toLowerCase().startsWith('aviso')) {
            if (body.toLowerCase().includes('bot') || msg.mentionedIds.includes(client.info.wid._serialized)) {
                const frasesBot = [
                    `¿Qué pasa, ${username}? Aquí estoy activo. Si quieres ver mis comandos pon *.menu* 😎`,
                    `¿Me llamaste? Más vale que sean monedas para mi ruleta... 🎰`,
                    `Dime, crack. ¿En qué soy útil hoy? Recuerda que el comando principal es *.menu* 🔥`,
                    `¡Presente! Kori Bot reportándose para el servicio. 🤖`
                ];
                return await msg.reply(frasesBot[Math.floor(Math.random() * frasesBot.length)]);
            }
            return;
        }

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

        if (body === '.menu') { command = 'bot'; args[0] = 'menú'; }

        let isAdmin = false;
        if (chat.isGroup) {
            const participant = chat.participants.find(p => p.id._serialized === userId);
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
⏱️ *Activo:* \`${hours}h ${minutes}m ${seconds}s\`

────────────────────────────
📊 *STATUS & SISTEMA*
────────────────────────────
📝 ➪ \`.owner\` ── Info del desarrollador
⚡ ➪ \`.ping\` ── Verificar velocidad del bot
🕒 ➪ \`.uptime\` ── Tiempo activo en línea
💻 ➪ \`.sistema\` ── Detalles del servidor cloud

🛡️ *ADMINISTRACIÓN & ANTI-FANTASMAS*
────────────────────────────
📣 ➪ \`.todos <txt>\` ── Invocar miembros en lista
📢 ➪ \`aviso\` ── Comunicado oficial con multimedia
🔄 ➪ \`.n\` o \`.reenviar\` ── Clonar contenido
🚷 ➪ \`.kick @user\` ── Eliminar a un miembro
👻 ➪ \`.fantasmas\` ── Listar miembros inactivos
💀 ➪ \`.kickfantasmas\` ── Purgar a todos los inactivos
🚪 ➪ \`.welcome on/off/texto\` ── Gestionar Bienvenidas
👋 ➪ \`.bye on/off/texto\` ── Gestionar Despedidas

🧠 *INTELIGENCIA ARTIFICIAL*
────────────────────────────
🤖 ➪ \`.gemini <pregunta>\` ── Consultar a Gemini 1.5

🎰 *JUEGOS VIRTUALES & ECONOMÍA RPG*
────────────────────────────
📇 ➪ \`.perfil\` ── Ver tu billetera y datos
💰 ➪ \`.trabajar\` ── Trabajar para ganar monedas
🎁 ➪ \`.daily\` ── Reclamar tu bono diario gratuito
🎲 ➪ \`.ruleta <cant>\` ── Apuesta tus monedas
🎰 ➪ \`.tragamonedas <cant>\` ── Suerte de casino express
🦹‍♂️ ➪ \`.robar @user\` ── Hurtar monedas de otro usuario
🛡️ ➪ \`.asegurar\` ── Proteger tu cuenta contra robos ($50)

🎭 *INTERACTIVIDAD MULTIJUGADOR & DINÁMICAS*
────────────────────────────
💘 ➪ \`.crush\` ── Pareja perfecta al azar del grupo
💕 ➪ \`.crush @user\` ── Medir nivel de amor mutuo
🥊 ➪ \`.pelear @user\` ── Versus a puño limpio por dinero
💋 ➪ \`.chapar @user\` ── Dar un beso apasionado en el chat
☠️ ➪ \`.matar @user\` ── Eliminar de broma a un amigo
👑 ➪ \`.rey\` ── Coronar al rey/reina del grupo
🌈 ➪ \`.gay\` ── Medir el porcentaje del gay-radar
🔮 ➪ \`.suerte <txt>\` ── Respuesta de la bola 8 mágica
🃏 ➪ \`.chiste\` / \`.piropo\` / \`.consejo\` ── Variedad al azar
🎨 ➪ \`.s\` ── Convertir fotos/videos en Sticker

🎮 *CAMPAMENTO FREE FIRE AREA*
────────────────────────────
🏆 ➪ \`.4vs4\` | \`.6v6\` | \`.8vs8\` | \`.12vs12\`
🔑 ➪ \`.sala\` ── Formatear datos para crear Sala

✨ ─── \`By: DEYVI A.O.C\` ─── ✨`;

                    await msg.reply(menuTexto);
                }
                break;
                case 'kick':
                if (!chat.isGroup) return msg.reply('❌ Este comando solo sirve en grupos.');
                if (!isAdmin) return msg.reply('❌ No eres administrador del grupo.');
                if (msg.mentionedIds.length === 0) return msg.reply('❌ Debes mencionar a la persona que deseas eliminar.');
                try {
                    for (let targetId of msg.mentionedIds) { await chat.removeParticipants([targetId]); }
                    await msg.reply('🔨 Miembro eliminado con éxito por el sistema de administración.');
                } catch (e) { await msg.reply('❌ Error: El bot necesita permisos de administrador.'); }
                break;

            case 'fantasmas':
                if (!chat.isGroup) return msg.reply('❌ Solo utilizable en grupos.');
                await msg.reply('🔍 Analizando el historial de interactividad del grupo...');
                let inactivos = [];
                let msgFantasmas = `👻 *LISTA DE MIEMBROS FANTASMAS (INACTIVOS)* 👻\n────────────────────────────\n`;
                let mencionesF = [];
                for (let p of chat.participants) {
                    if (!registroActividad[chat.id._serialized] || !registroActividad[chat.id._serialized][p.id._serialized]) {
                        if (!p.isAdmin && !p.isSuperAdmin) {
                            inactivos.push(p.id._serialized);
                            const cont = await client.getContactById(p.id._serialized);
                            mencionesF.push(cont);
                            msgFantasmas += `💀 ➪ @${p.id.user}\n`;
                        }
                    }
                }
                if (inactivos.length === 0) return msg.reply('✅ ¡Increíble! Este grupo no tiene ningún fantasma activo.');
                msgFantasmas += `\n⚠️ *Tip:* Usa \`.kickfantasmas\` para purgarlos de inmediato.`;
                await chat.sendMessage(msgFantasmas, { mentions: mencionesF });
                break;

            case 'kickfantasmas':
                if (!chat.isGroup) return msg.reply('❌ Solo utilizable en grupos.');
                if (!isAdmin) return msg.reply('❌ No eres administrador.');
                await msg.reply('☣️ *Iniciando purga masiva de inactivos...*');
                let aRemover = [];
                for (let p of chat.participants) {
                    if (!registroActividad[chat.id._serialized] || !registroActividad[chat.id._serialized][p.id._serialized]) {
                        if (!p.isAdmin && !p.isSuperAdmin) { aRemover.push(p.id._serialized); }
                    }
                }
                if (aRemover.length === 0) return msg.reply('❌ No se encontraron fantasmas para eliminar.');
                try {
                    await chat.removeParticipants(aRemover);
                    await chat.sendMessage(`💀 *Purga Completa:* Se expulsaron ${aRemover.length} fantasmas inactivos.`);
                } catch (err) { await msg.reply('❌ Error de permisos al expulsar.'); }
                break;

            case 'welcome':
                if (!chat.isGroup) return msg.reply('❌ Este comando solo funciona en grupos.');
                if (!isAdmin) return msg.reply('❌ Solo los administradores pueden configurar las bienvenidas.');
                const confW = getGroupConfig(chat.id._serialized);
                if (args[0] === 'on') { 
                    confW.welcome = true; 
                    await msg.reply('✅ *SISTEMA:* Las bienvenidas automáticas con foto han sido *ACTIVADAS* en este grupo.'); 
                } 
                else if (args[0] === 'off') { 
                    confW.welcome = false; 
                    await msg.reply('❌ *SISTEMA:* Las bienvenidas automáticas han sido *DESACTIVADAS*.'); 
                } 
                else if (args[0] === 'texto') {
                    const nuevoTexto = args.slice(1).join(' ');
                    if (!nuevoTexto) return msg.reply('❌ Uso correcto: `.welcome texto Hola @user bienvenido`');
                    confW.welcomeText = nuevoTexto;
                    await msg.reply('📝 *ÉXITO:* Nuevo texto de bienvenida guardado.');
                } else { 
                    await msg.reply('💡 *Modo de uso:* \n• `.welcome on` (Activar)\n• `.welcome off` (Desactivar)\n• `.welcome texto <mensaje>` (Cambiar texto)'); 
                }
                break;

            case 'bye':
                if (!chat.isGroup) return msg.reply('❌ Este comando solo funciona en grupos.');
                if (!isAdmin) return msg.reply('❌ Solo los administradores pueden configurar las despedidas.');
                const confB = getGroupConfig(chat.id._serialized);
                if (args[0] === 'on') { 
                    confB.bye = true; 
                    await msg.reply('✅ *SISTEMA:* Las despedidas automáticas han sido *ACTIVADAS*.'); 
                } 
                else if (args[0] === 'off') { 
                    confB.bye = false; 
                    await msg.reply('❌ *SISTEMA:* Las despedidas automáticas han sido *DESACTIVADAS*.'); 
                } 
                else if (args[0] === 'texto') {
                    const nuevoTexto = args.slice(1).join(' ');
                    if (!nuevoTexto) return msg.reply('❌ Uso correcto: `.bye texto Adiós @user`');
                    confB.byeText = nuevoTexto;
                    await msg.reply('📝 *ÉXITO:* Nuevo texto de despedida guardado.');
                } else { 
                    await msg.reply('💡 *Modo de uso:* \n• `.bye on` (Activar)\n• `.bye off` (Desactivar)\n• `.bye texto <mensaje>` (Cambiar texto)'); 
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
                case 'asegurar':
                const userAseg = getProfile(userId, username);
                if (userAseg.coins < 50) return msg.reply('❌ Necesitas al menos $50 monedas virtuales para pagar el seguro de tu billetera.');
                userAseg.coins -= 50;
                userAseg.asegurado = true;
                await msg.reply('🛡️ *CUENTA ASEGURADA:* Has activado el sistema de seguridad en tu billetera. Nadie te podrá robar monedas hasta tu próxima interacción.');
                break;

            case 'robar':
                if (!chat.isGroup) return msg.reply('❌ Solo sirve en grupos.');
                if (msg.mentionedIds.length === 0) return msg.reply('❌ Debes mencionar al usuario al que pretendes robar.');
                
                const ladron = getProfile(userId, username);
                const victimaId = msg.mentionedIds[0];
                
                if (userId === victimaId) return msg.reply('🧠 ¿Pretendes robarte a ti mismo? Eso es absurdo.');
                
                const victimaCont = await client.getContactById(victimaId);
                const victima = getProfile(victimaId, victimaCont.pushname);

                if (victima.coins <= 50) return msg.reply('❌ Ese usuario está tan quebrado que no vale la pena robarle.');
                
                if (victima.asegurado) {
                    victima.asegurado = false; 
                    const multa = 100;
                    ladron.coins = Math.max(0, ladron.coins - multa);
                    return await chat.sendMessage(`🚨 *¡ALARMA DETECTADA!:* @${sender.id.user} intentó robarle a @${victimaCont.id.user}, pero su cuenta estaba súper *ASEGURADA*. El ladrón huyó y pagó una multa de $${multa} monedas.`, { mentions: [sender, victimaCont] });
                }

                if (Math.random() >= 0.5) {
                    const robado = Math.floor(Math.random() * (victima.coins * 0.3)) + 20; 
                    victima.coins -= robado;
                    ladron.coins += robado;
                    await chat.sendMessage(`🦹‍♂️ *¡ASALTO EXITOSO!:* @${sender.id.user} fue sigiloso y le robó *$${robado} monedas* a @${victimaCont.id.user}. ¡A las bóvedas! 💸`, { mentions: [sender, victimaCont] });
                } else {
                    const fianza = 80;
                    ladron.coins = Math.max(0, ladron.coins - fianza);
                    await chat.sendMessage(`👮‍♂️ *¡AL CALABOZO!:* Atrapación. @${sender.id.user} falló el robo contra @${victimaCont.id.user} y fue enviado a prisión. Pagó una fianza de $${fianza} monedas para salir.`, { mentions: [sender, victimaCont] });
                }
                break;

            case 'tragamonedas':
                const pSlot = getProfile(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Uso: `.tragamonedas <cantidad>`');
                const betSlot = parseInt(args[0]);
                if (betSlot <= 0 || pSlot.coins < betSlot) return msg.reply('❌ Saldo insuficiente en tu bolsillo.');

                const iconos = ['🍒', '💎', '🔔', '🍀', '🍋'];
                const i1 = iconos[Math.floor(Math.random() * iconos.length)];
                const i2 = iconos[Math.floor(Math.random() * iconos.length)];
                const i3 = iconos[Math.floor(Math.random() * iconos.length)];

                let resultadoMsg = `🎰 *🎰 KORI CASINO TRAGAMONEDAS 🎰* 🎰\n────────────────────────────\n\n     [ ${i1} | ${i2} | ${i3} ]\n\n`;

                if (i1 === i2 && i2 === i3) {
                    const premio = betSlot * 4;
                    pSlot.coins += premio;
                    resultadoMsg += `🎉 *¡TRIPLE JACKPOT!* Coincidencia absoluta. Ganaste *$${premio} monedas virtuales*! 🍀💰`;
                } else if (i1 === i2 || i2 === i3 || i1 === i3) {
                    const premioM = Math.floor(betSlot * 1.5);
                    pSlot.coins += premioM;
                    resultadoMsg += `✨ *¡Par de ases!* Tuviste suerte duplicada. Ganaste *$${premioM} monedas*.`;
                } else {
                    pSlot.coins -= betSlot;
                    resultadoMsg += `📉 *Mala jugada.* La máquina devoró tu dinero. Perdiste *$${betSlot} monedas*.`;
                }
                await msg.reply(resultadoMsg);
                break;

            case 'pelear':
                if (!chat.isGroup || msg.mentionedIds.length === 0) return msg.reply('❌ Menciona a tu oponente con el comando `.pelear @user`');
                const retador = getProfile(userId, username);
                const rivalId = msg.mentionedIds[0];
                if (userId === rivalId) return msg.reply('❌ No puedes pelear contra tu propia sombra.');
                const rivalCont = await client.getContactById(rivalId);
                const rival = getProfile(rivalId, rivalCont.pushname);

                const botin = Math.floor(Math.random() * 100) + 50;
                await msg.reply(`🥊 *¡DUELO A MUERTE!:* @${sender.id.user} y @${rivalCont.id.user} se agarran a puñetazos en el centro del chat por un premio de $${botin} monedas...`);
                
                setTimeout(async () => {
                    if (Math.random() >= 0.5) {
                        retador.coins += botin; rival.coins = Math.max(0, rival.coins - botin);
                        await chat.sendMessage(`🏆 *¡VICTORIA!:* @${sender.id.user} noqueó épicamente a @${rivalCont.id.user} y se lleva la bolsa de dinero en efectivo. 🥇`, { mentions: [sender, rivalCont] });
                    } else {
                        rival.coins += botin; retador.coins = Math.max(0, retador.coins - botin);
                        await chat.sendMessage(`🏆 *¡CONTRAATAQUE!:* @${rivalCont.id.user} esquivó el golpe y mandó a dormir a @${sender.id.user} de una patada, ganando las monedas. 🥇`, { mentions: [sender, rivalCont] });
                    }
                }, 2000);
                break;

            case 'chapar':
                if (!chat.isGroup || msg.mentionedIds.length === 0) return msg.reply('❌ Menciona a quién le quieres dar el beso.');
                const besoCont = await client.getContactById(msg.mentionedIds[0]);
                const frasesBeso = [
                    `💋 @${sender.id.user} jaló del brazo a @${besoCont.id.user} y le plantó un beso apasionado de película que dejó al chat en completo silencio. 🔥`,
                    `💋 @${sender.id.user} le dio un tierno y sutil piquito en los labios a @${besoCont.id.user}. ¡Qué románticos! 💕`
                ];
                await chat.sendMessage(frasesBeso[Math.floor(Math.random() * frasesBeso.length)], { mentions: [sender, besoCont] });
                break;

            case 'matar':
                if (!chat.isGroup || msg.mentionedIds.length === 0) return msg.reply('❌ Menciona a tu víctima.');
                const ripCont = await client.getContactById(msg.mentionedIds[0]);
                const razonesMuerte = [
                    `☠️ @${sender.id.user} ejecutó a @${ripCont.id.user} usando una deagle con ráfaga a la cabeza en una sala de Free Fire. ¡Directo al lobby! 🎯`,
                    `☠️ @${sender.id.user} empujó sin querer a @${ripCont.id.user} a una piscina llena de pirañas mutantes. F por él. 🦖`
                ];
                await chat.sendMessage(razonesMuerte[Math.floor(Math.random() * razonesMuerte.length)], { mentions: [sender, ripCont] });
                break;

            case 'rey':
                if (!chat.isGroup) return msg.reply('❌ Solo para grupos.');
                const pRey = chat.participants;
                const elegidoRey = pRey[Math.floor(Math.random() * pRey.length)].id.user;
                const contRey = await client.getContactById(elegidoRey + '@c.us');
                await chat.sendMessage(`👑 *DECRETO REAL:* El destino ha hablado. Postren las rodillas ante Su Majestad @${elegidoRey}, el nuevo monarca absoluto de este chat. 🛐✨`, { mentions: [contRey] });
                break;

            case 'suerte':
                if (!args.length) return msg.reply('❌ Hazle una pregunta concreta a la bola mágica.');
                const respuestasBola = [
                    "🔮 *Bola 8 dice:* Sí, absolutamente. Todo está a tu favor. ✅",
                    "🔮 *Bola 8 dice:* Mis circuitos detectan que No, ni lo sueñes. ❌",
                    "🔮 *Bola 8 dice:* El destino está nublado hoy, vuelve a intentarlo más tarde. 🌀"
                ];
                await msg.reply(respuestasBola[Math.floor(Math.random() * respuestasBola.length)]);
                break;
                case 'crush':
                if (!chat.isGroup) return msg.reply('❌ Exclusivo para grupos.');
                const miembros = chat.participants;
                if (msg.mentionedIds.length === 0) {
                    if (miembros.length < 2) return msg.reply('❌ Falta gente.');
                    const u1 = miembros[Math.floor(Math.random() * miembros.length)].id.user;
                    let u2 = miembros[Math.floor(Math.random() * miembros.length)].id.user;
                    while (u1 === u2) { u2 = miembros[Math.floor(Math.random() * miembros.length)].id.user; }
                    const c1 = await client.getContactById(u1 + '@c.us');
                    const c2 = await client.getContactById(u2 + '@c.us');
                    await chat.sendMessage(`💘 *EL DETECTOR DE PAREJAS HA HABLADO* 💘\n\n👑 @${u1}  &  👑 @${u2}\n\n📊 *Compatibilidad:* \`100% - Pareja Perfecta Destinada\` 😍❤️`, { mentions: [c1, c2] });
                } else {
                    const objCont = await client.getContactById(msg.mentionedIds[0]);
                    const porc = Math.floor(Math.random() * 100) + 1;
                    let dictamen = porc < 30 ? '💔 Ahí no es, sal de ahí.' : porc < 70 ? '⚡ Con un par de salas de Free Fire lo conquistas.' : '❤️ ¡Se gustan en secreto!';
                    await chat.sendMessage(`💕 *MEDIDOR DE AMOR KORI* 💕\n\n👤 @${sender.id.user} x @${objCont.id.user}\n📊 *Resultado:* \`${porc}%\` \n💬 ${dictamen}`, { mentions: [sender, objCont] });
                }
                break;

            case 'gay':
                if (!chat.isGroup) return msg.reply('❌ Solo para grupos.');
                const elegidoG = chat.participants[Math.floor(Math.random() * chat.participants.length)].id.user;
                const contG = await client.getContactById(elegidoG + '@c.us');
                await chat.sendMessage(`🌈 *GAY-RADAR 3000:* El sistema seleccionó al azar a @${elegidoG} con un \`${Math.floor(Math.random() * 100) + 1}%\` de nivel detectado. 💅✨`, { mentions: [contG] });
                break;

            case 'consejo':
                const listaConsejos = ["No gastes todo en la ruleta, el trabajo diario da estabilidad.", "En Free Fire, la comunicación vale más que mil diamantes.", "Si te ignoran, tira un comando .todos y hazte notar."];
                await msg.reply(`💡 *Consejo Útil:* "${listaConsejos[Math.floor(Math.random() * listaConsejos.length)]}"`);
                break;

            case 'piropo':
                const listaPiropos = ["¿Acaso eres Google? Porque tienes todo lo que busco. 😏", "No es el wifi, eres tú quien me deja desconectado. ✨", "¿Tienes un mapa? Me perdí en tu foto de perfil. 🍯"];
                await msg.reply(`🍯 *Piropo:* "${listaPiropos[Math.floor(Math.random() * listaPiropos.length)]}"`);
                break;

            case 'chiste':
                const listaChistes = ["— ¿Qué hace una abeja en el gimnasio? \n— ¡Zumba! 🐝", "¿Por qué los pájaros no usan Facebook? Porque tienen Twitter. 🐦"];
                await msg.reply(`🃏 *Chiste:* ${listaChistes[Math.floor(Math.random() * listaChistes.length)]}`);
                break;

            case 'n':
            case 'reenviar':
                if (msg.hasQuotedMsg) {
                    const quoted = await msg.getQuotedMessage();
                    if (quoted.hasMedia) {
                        const archivoMedia = await quoted.downloadMedia();
                        await chat.sendMessage(archivoMedia, { caption: quoted.body || '' });
                    } else { await chat.sendMessage(quoted.body); }
                } else { await msg.reply('❌ Responde a algo con *.n*'); }
                break;

            case 'gemini':
                if (!args.length || !aiModel) return msg.reply('❌ Escribe tu consulta.');
                try {
                    await msg.reply('🧠 *KORI IA* pensando...');
                    const result = await aiModel.generateContent(args.join(' '));
                    await msg.reply(`🤖 *Gemini:* \n\n${(await result.response).text()}`);
                } catch (err) { await msg.reply('❌ Error al procesar.'); }
                break;

            case 'perfil':
                const perf = getProfile(userId, username);
                await msg.reply(`📇 *\`SISTEMA RPG\`*\n👤 *Nombre:* ${perf.name}\n💰 *Bolsillo:* $${perf.coins}\n🏦 *Banco:* $${perf.bank}\n🛡️ *Seguro:* ${perf.asegurado ? 'ACTIVO ✅' : 'INACTIVO ❌'}`);
                break;

            case 'work':
            case 'trabajar':
                const pWork = getProfile(userId, username);
                if (Date.now() - pWork.lastWork < 300000) return msg.reply('⏳ Estás cansado, espera unos minutos.');
                const gan = Math.floor(Math.random() * 250) + 150;
                pWork.coins += gan; pWork.lastWork = Date.now(); pWork.asegurado = false;
                await msg.reply(`💰 Ganaste *$${gan} monedas virtuales*.`);
                break;

            case 'daily':
                const pDaily = getProfile(userId, username);
                if (Date.now() - pDaily.lastDaily < 86400000) return msg.reply('❌ Ya reclamaste hoy.');
                pDaily.coins += 1000; pDaily.lastDaily = Date.now(); pDaily.asegurado = false;
                await msg.reply('🎁 *RECOMPENSA DIARIA* \n💵 *+$1,000 monedas*');
                break;

            case 'ruleta':
                const pRul = getProfile(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Pon una cantidad.');
                const ap = parseInt(args[0]);
                if (pRul.coins < ap || ap <= 0) return msg.reply('❌ Saldo insuficiente.');
                pRul.asegurado = false;
                if (Math.random() >= 0.5) { pRul.coins += ap; await msg.reply(`🎰 *¡Ganaste!:* +$${ap} monedas.`); } 
                else { pRul.coins -= ap; await msg.reply(`🎰 *Perdiste:* -$${ap} monedas.`); }
                break;

            case 'owner':
            case 'creador':
            case '4vs4':
            case '6vs6':
            case '8vs8':
            case '12vs12':
            case 'sala':
            case 'fraseromantica':
            case 'uptime':
            case 'sistema':
            case 'ping':
            case 's':
            case 'sticker':
                if (command === 'owner' || command === 'creador') await msg.reply(`👤 *Creador:* DEYVI A.O.C\n💬 *Soporte:* +51 900834505`);
                if (['4vs4','6vs6','8vs8','12vs12'].includes(command)) await msg.reply(`🎮 *¡FREE FIRE ACTIVO!* \n@everyone ¡Se armó un *${command.toUpperCase()}*! Dejen IDs. 🏆🔥`);
                if (command === 'sala') await msg.reply('🔑 *SALA DE FREE FIRE* \n🆔 *ID:* Cargando...\n🔒 *Pass:* Por privado.');
                if (command === 'fraseromantica') await msg.reply('❤️ *Frase:* "En el mapa de mi vida, tu número marca mi lugar favorito."');
                if (command === 'uptime') await msg.reply(`⏱️ *Activo:* ${Math.floor(Math.abs(new Date() - startTime) / (1000 * 60 * 60))} horas.`);
                if (command === 'sistema') await msg.reply(`🖥️ *Host:* Linux Cloud\n📦 *Engine:* Node.js v22\n🚀 *Estado:* Optimizado`);
                if (command === 'ping') await msg.reply('🚀 *¡Pong!* Kori Bot activo.');
                if (command === 's' || command === 'sticker') {
                    if (msg.hasMedia || (msg.hasQuotedMsg && (await msg.getQuotedMessage()).hasMedia)) {
                        try {
                            await msg.reply('⏳ *Generando Sticker...*');
                            const m = msg.hasMedia ? msg : await msg.getQuotedMessage();
                            const media = await m.downloadMedia();
                            if (media) await chat.sendMessage(media, { sendMediaAsSticker: true, stickerName: "KORI SYSTEM 🤖", stickerAuthor: "DEYVI A.O.C ✨" });
                        } catch (e) { await msg.reply('❌ Error al crear sticker.'); }
                    } else { await msg.reply('❌ Responde a una foto con *.s*'); }
                }
                break;

            default:
                break;
        }
    } catch (error) { console.log('Error general:', error); }
}

function vincularEventosEspeciales(client) {
    client.on('group_join', async (notification) => {
        try {
            const chat = await notification.getChat();
            const contact = await client.getContactById(notification.recipientIds[0]);
            const config = getGroupConfig(chat.id._serialized);
            if (config.welcome) {
                let mensajeFinal = config.welcomeText.replace('@user', `@${contact.id.user}`);
                let fotoMedia;
                try {
                    const pfpUrl = await client.getProfilePicUrl(contact.id._serialized);
                    if (pfpUrl) fotoMedia = await MessageMedia.fromUrl(pfpUrl);
                } catch (err) {}
                if (!fotoMedia) {
                    const fotosRespaldoWelcome = [
                        "https://i.postimg.cc/FsYfN5vK/welcome-image.jpg",
                        "https://i.postimg.cc/mD87fXp4/freefire-welcome.jpg",
                        "https://i.postimg.cc/3w6XGvP2/meme-bienvenida.jpg",
                        "https://i.postimg.cc/d1M8Xz9y/anime-welcome.jpg"
                    ];
                    fotoMedia = await MessageMedia.fromUrl(fotosRespaldoWelcome[Math.floor(Math.random() * fotosRespaldoWelcome.length)]).catch(() => null);
                }
                if (fotoMedia) await chat.sendMessage(fotoMedia, { caption: mensajeFinal, mentions: [contact] });
                else await chat.sendMessage(mensajeFinal, { mentions: [contact] });
            }
        } catch (e) { console.log(e); }
    });

    client.on('group_leave', async (notification) => {
        try {
            const chat = await notification.getChat();
            const contact = await client.getContactById(notification.recipientIds[0]);
            const config = getGroupConfig(chat.id._serialized);
            if (config.bye) {
                let mensajeFinal = config.byeText.replace('@user', `@${contact.id.user}`);
                const fotoDespedida = await MessageMedia.fromUrl("https://i.postimg.cc/gJ0pM9qf/bye-image.jpg").catch(() => null);
                if (fotoDespedida) await chat.sendMessage(fotoDespedida, { caption: mensajeFinal, mentions: [contact] });
                else await chat.sendMessage(mensajeFinal, { mentions: [contact] });
            }
        } catch (e) { console.log(e); }
    });
}

module.exports = { ejecutar, vincularEventosEspeciales };
