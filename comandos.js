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
const registroActividad = {}; 

// Almacenamiento en caché de contenido multimedia y textos dinámicos en la nube de WhatsApp
const bancoStickers = { random: [], amor: [] };
const bancoVideos = { ff: [], dedicar: [], fruti: [], futbol: [], peliculas: [], tiktokfrases: [], tiktok: [], musica: [] };
const bancoTextos = { piropo: [], consejo: [], motivacion: [], fraseamor: [] };

// Cofre global para el minijuego de velocidad
let cofreActivo = { activo: false, monedas: 0 };

function getProfile(userId, pushname) {
    if (!rpgDatabase[userId]) {
        rpgDatabase[userId] = {
            name: pushname || 'Usuario',
            coins: 500, bank: 1000, gems: 0, level: 1, xp: 0, lastDaily: 0, lastWork: 0, lastMinar: 0, lastCrimen: 0,
            asegurado: false
        };
    }
    return rpgDatabase[userId];
}

function getGroupConfig(chatId) {
    if (!groupSettings[chatId]) {
        groupSettings[chatId] = { 
            welcome: false, bye: false, modoAdmin: false,
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

        // Procesador Automático para capturar stickers, videos y textos en tus grupos de respaldo
        if (chat.isGroup && (chat.name.toLowerCase().includes("banco") || chat.name.toLowerCase().includes("respaldo"))) {
            const tag = body.toLowerCase();
            if (msg.hasMedia) {
                const mediaType = msg.type;
                if (mediaType === 'sticker') {
                    if (tag.includes('#amor')) bancoStickers.amor.push(msg.id._serialized);
                    else bancoStickers.random.push(msg.id._serialized);
                } else if (mediaType === 'video' || mediaType === 'ptv') {
                    if (tag.includes('#ff')) bancoVideos.ff.push(msg.id._serialized);
                    else if (tag.includes('#dedicar')) bancoVideos.dedicar.push(msg.id._serialized);
                    else if (tag.includes('#fruti')) bancoVideos.fruti.push(msg.id._serialized);
                    else if (tag.includes('#futbol')) bancoVideos.futbol.push(msg.id._serialized);
                    else if (tag.includes('#peliculas')) bancoVideos.peliculas.push(msg.id._serialized);
                    else if (tag.includes('#tiktokfrases')) bancoVideos.tiktokfrases.push(msg.id._serialized);
                    else if (tag.includes('#tiktok')) bancoVideos.tiktok.push(msg.id._serialized);
                    else if (tag.includes('#musica')) bancoVideos.musica.push(msg.id._serialized);
                }
            } else {
                // Captura de textos dinámicos sin tocar código
                if (tag.includes('#piropo')) bancoTextos.piropo.push(msg.id._serialized);
                else if (tag.includes('#consejo')) bancoTextos.consejo.push(msg.id._serialized);
                else if (tag.includes('#motivacion')) bancoTextos.motivacion.push(msg.id._serialized);
                else if (tag.includes('#fraseamor')) bancoTextos.fraseamor.push(msg.id._serialized);
            }
            return;
        }

        if (chat.isGroup) {
            if (!registroActividad[chat.id._serialized]) registroActividad[chat.id._serialized] = {};
            registroActividad[chat.id._serialized][userId] = true;
        }

        if (!body.startsWith('.') && !body.toLowerCase().startsWith('aviso')) {
            if (body.toLowerCase().includes('bot') || msg.mentionedIds.includes(client.info.wid._serialized)) {
                const frasesBot = [
                    `¿Qué pasa, ${username}? Aquí estoy activo. Si quieres ver mis comandos pon *.menu* 😎`,
                    `¿Me llamaste? Más vale que sean monedas para mi ruleta... 🎰`,
                    `Dime, crack. ¿En qué soy útil hoy? Recuerda que el comando principal es *.menu* 🔥`
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

        // Restricción Inteligente Modo Admin
        if (chat.isGroup && !isAdmin) {
            const confC = getGroupConfig(chat.id._serialized);
            if (confC.modoAdmin && command !== 'bot' && command !== 'menu') return;
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

🛡️ *ADMINISTRACIÓN & CONFIGURACIONES*
────────────────────────────
📣 ➪ \`.todos <txt>\` ── Invocar miembros en lista
📢 ➪ \`aviso\` ── Comunicado oficial con multimedia
🚷 ➪ \`.kick @user\` ── Eliminar a un miembro
👻 ➪ \`.fantasmas\` ── Listar miembros inactivos
💀 ➪ \`.kickfantasmas\` ── Purgar a todos los inactivos
🚪 ➪ \`.welcome on/off/texto\` ── Gestionar Bienvenidas
👋 ➪ \`.bye on/off/texto\` ── Gestionar Despedidas
⚙️ ➪ \`.modoadmin on/off\` ── Restringir bot solo a admins

🧠 *INTELIGENCIA ARTIFICIAL*
────────────────────────────
🤖 ➪ \`.gemini <pregunta>\` ── Consultar a Gemini 1.5

🎰 *15 JUEGOS VIRTUALES & ECONOMÍA RPG*
────────────────────────────
📇 ➪ \`.perfil\` ── Ver tu billetera, nivel y gemas
💰 ➪ \`.trabajar\` ── Trabajar para ganar monedas
🎁 ➪ \`.daily\` ── Reclamar tu bono diario gratuito
🎲 ➪ \`.ruleta <cant>\` ── Apuesta tradicional de azar
🎰 ➪ \`.tragamonedas <cant>\` ── Ranura clásica de casino
🎰 ➪ \`.slot <cant>\` ── Variante veloz de suerte
🦹‍♂️ ➪ \`.robar @user\` ── Hurtar monedas de otro usuario
🛡️ ➪ \`.asegurar\` ── Proteger tu cuenta contra robos ($50)
🔫 ➪ \`.ruletarusa\` / \`.suicidio\` ── Azar mortal con kick
🃏 ➪ \`.blackjack <cant>\` ── Cartas 21 contra la casa
🎲 ➪ \`.dados <cant>\` ── Lanza los cubos contra el bot
🥊 ➪ \`.pelear @user\` ── Versus a puñetazos por botín
⚔️ ➪ \`.desafio @user <cant>\` ── Retar apostando saldo real
⛏️ ➪ \`.minar\` ── Excavar en la mina por gemas y oro
🕵️‍♂️ ➪ \`.crimen\` ── Dar un gran golpe ilegal de alto riesgo
📈 ➪ \`.invertir <cant>\` ── Comprar acciones financieras volátiles
📦 ➪ \`.cofre\` / \`.abricofrc\` ── Evento de cofre sorpresa
🎮 ➪ \`.ppt <cant> <piedra/papel/tijera>\` ── Desafío clásico

🎭 *INTERACTIVIDAD & DINÁMICAS SOCIALES*
────────────────────────────
💘 ➪ \`.crush\` / \`.crush @user\` ── Detector de compatibilidad
💋 ➪ \`.chapar @user\` ── Dar un beso en el chat
☠️ ➪ \`.matar @user\` ── Eliminar de broma a un amigo
👑 ➪ \`.rey\` | \`.gay\` | \`.suerte <txt>\` ── Entretenimiento rápido
👥 ➪ \`.formarpareja\` ── Casar a dos miembros aleatorios
🎨 ➪ \`.s\` ── Convertir fotos/videos en Sticker

📦 *CONTENIDO MULTIMEDIA & TEXTOS DINÁMICOS NUBE*
────────────────────────────
🤡 ➪ \`.stickerazar\` ── Sticker aleatorio variado
💖 ➪ \`.stickeramor\` ── Sticker romántico de amor
🔥 ➪ \`.vff\` ── Videos de Free Fire LATAM edits
🎬 ➪ \`.vdedicar\` ── Videos especiales para dedicar
🍓 ➪ \`.vfruti\` ── Fruti Novelas editadas
⚽ ➪ \`.vdeporte\` ── Videos de fútbol y deportes
🎥 ➪ \`.vpelicula\` ── Cortos de películas y resúmenes
📱 ➪ \`.vtiktok\` ── TikToks variados de todo tipo
✍️ ➪ \`.vfrases\` ── TikToks con frases profundas
🎵 ➪ \`.vmusica\` ── Videos musicales y tendencias
❤️ ➪ \`.frasestexto\` ── Frases de amor al azar desde la nube
🃏 ➪ \`.piropotexto\` ── Piropos picantes aleatorios de la nube
💡 ➪ \`.consejotexto\` ── Consejos sabios guardados en la nube
⚡ ➪ \`.motivacion\` ── Frases motivacionales directas

🎮 *CAMPAMENTO FREE FIRE AREA*
────────────────────────────
🏆 ➪ \`.4vs4\` | \`.6v6\` | \`.8vs8\` | \`.12vs12\`
🔑 ➪ \`.sala\` ── Formatear datos para crear Sala

✨ ─── \`By: DEYVI A.O.C\` ─── ✨`;

                    await msg.reply(menuTexto);
                }
                break;
                case 'modoadmin':
                if (!chat.isGroup) return msg.reply('❌ Este comando solo funciona en grupos.');
                if (!isAdmin) return msg.reply('❌ Solo los administradores pueden alterar el estado de acceso.');
                const confMod = getGroupConfig(chat.id._serialized);
                if (args[0] === 'on') {
                    confMod.modoAdmin = true;
                    await msg.reply('🔒 *MODO ADMIN ACTIVADO:* A partir de este momento, solo los administradores del grupo pueden usar los comandos del bot.');
                } else if (args[0] === 'off') {
                    confMod.modoAdmin = false;
                    await msg.reply('🔓 *MODO ADMIN DESACTIVADO:* Ahora todos los integrantes del grupo pueden interactuar con el bot libremente.');
                } else {
                    await msg.reply('💡 Uso correcto: `.modoadmin on` o `.modoadmin off`');
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
                case 'perfil':
                const perf = getProfile(userId, username);
                await msg.reply(`📇 *\`KORI RPG PROFILE\`*\n👤 *Nombre:* ${perf.name}\n📈 *Nivel:* ${perf.level}\n💰 *Bolsillo:* $${perf.coins}\n🏦 *Banco:* $${perf.bank}\n💎 *Gemas:* ${perf.gems}\n🛡️ *Seguro:* ${perf.asegurado ? 'ACTIVO ✅' : 'INACTIVO ❌'}`);
                break;

            case 'ruleta':
            case 'slot':
                const pRul = getProfile(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Pon una cantidad válida a apostar.');
                const ap = parseInt(args[0]);
                if (pRul.coins < ap || ap <= 0) return msg.reply('❌ Saldo insuficiente.');
                pRul.asegurado = false;
                if (Math.random() >= 0.5) { pRul.coins += ap; await msg.reply(`🎰 *¡Ganaste!:* Duplicaste tu dinero. +$${ap} monedas.`); } 
                else { pRul.coins -= ap; await msg.reply(`🎰 *Perdiste:* La banca gana. -$${ap} monedas.`); }
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
                let resultadoMsg = `🎰 *🎰 KORI CASINO 🎰* 🎰\n     [ ${i1} | ${i2} | ${i3} ]\n\n`;
                if (i1 === i2 && i2 === i3) { pSlot.coins += betSlot * 4; resultadoMsg += `🎉 *JACKPOT TRIPLE!* Ganaste *$${betSlot * 4} monedas*! 🍀`; }
                else if (i1 === i2 || i2 === i3 || i1 === i3) { pSlot.coins += Math.floor(betSlot * 1.5); resultadoMsg += `✨ *¡Suerte Doble!* Ganaste *$${Math.floor(betSlot * 1.5)} monedas*.`; }
                else { pSlot.coins -= betSlot; resultadoMsg += `📉 *Perdiste.* Perdiste *$${betSlot} monedas*.`; }
                await msg.reply(resultadoMsg);
                break;

            case 'ruletarusa':
            case 'suicidio':
                if (Math.floor(Math.random() * 6) === 0) {
                    await msg.reply('💥 *¡PUMMMMMM!* Te volaste los sesos de forma virtual. 💀☠️');
                    if (chat.isGroup && !isAdmin) { try { await chat.removeParticipants([userId]); } catch (e) {} }
                } else { await msg.reply('🛡️ *¡CLIC!* La recámara estaba vacía. Salvaste tu pellejo. 😎✨'); }
                break;

            case 'robar':
                if (!chat.isGroup) return msg.reply('❌ Solo sirve en grupos.');
                if (msg.mentionedIds.length === 0) return msg.reply('❌ Menciona a quién le vas a robar.');
                const ladron = getProfile(userId, username);
                const victimaId = msg.mentionedIds[0];
                if (userId === victimaId) return msg.reply('🧠 No te puedes robar a ti mismo.');
                const victimaCont = await client.getContactById(victimaId);
                const victima = getProfile(victimaId, victimaCont.pushname);
                if (victima.coins <= 50) return msg.reply('❌ Ese usuario no tiene nada de dinero.');
                if (victima.asegurado) { victima.asegurado = false; ladron.coins = Math.max(0, ladron.coins - 100); return await chat.sendMessage(`🚨 *¡ALARMA!:* @${sender.id.user} rebotó contra el escudo *ASEGURADO* de @${victimaCont.id.user} y pagó una multa de $100.`, { mentions: [sender, victimaCont] }); }
                if (Math.random() >= 0.5) { const robado = Math.floor(Math.random() * (victima.coins * 0.3)) + 20; victima.coins -= robado; ladron.coins += robado; await chat.sendMessage(`🦹‍♂️ *¡ÉXITO!:* @${sender.id.user} le robó *$${robado} monedas* a @${victimaCont.id.user}.`, { mentions: [sender, victimaCont] }); }
                else { ladron.coins = Math.max(0, ladron.coins - 80); await chat.sendMessage(`👮‍♂️ *¡PRESO!:* @${sender.id.user} falló y pagó una fianza de $80 monedas.`, { mentions: [sender, victimaCont] }); }
                break;

            case 'asegurar':
                const userAseg = getProfile(userId, username);
                if (userAseg.coins < 50) return msg.reply('❌ Necesitas $50 monedas para el escudo.');
                userAseg.coins -= 50; userAseg.asegurado = true;
                await msg.reply('🛡️ *ASEGURADO:* Tu cuenta está a salvo contra el próximo asalto.');
                break;

            case 'blackjack':
                const pBj = getProfile(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Uso: `.blackjack <cantidad>`');
                const apuestaBj = parseInt(args[0]);
                if (pBj.coins < apuestaBj || apuestaBj <= 0) return msg.reply('❌ No tienes ese dinero.');
                const tuPuntaje = Math.floor(Math.random() * 12) + 10; 
                const botPuntaje = Math.floor(Math.random() * 11) + 11;
                if (tuPuntaje > 21) { pBj.coins -= apuestaBj; await msg.reply(`🃏 Te pasaste de 21 con \`${tuPuntaje}\`. Perdiste *$${apuestaBj} monedas*.`); }
                else if (botPuntaje > 21 || tuPuntaje > botPuntaje) { pBj.coins += apuestaBj; await msg.reply(`🃏 ¡Ganaste! Sacaste \`${tuPuntaje}\` vs \`${botPuntaje}\` del bot. Te llevas *$${apuestaBj} monedas*.`); }
                else { pBj.coins -= apuestaBj; await msg.reply(`🃏 Perdiste. El bot sacó \`${botPuntaje}\` vs tu \`${tuPuntaje}\`. Perdiste *$${apuestaBj} monedas*.`); }
                break;

            case 'dados':
                const pDados = getProfile(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Uso: `.dados <cantidad>`');
                const apDados = parseInt(args[0]);
                if (pDados.coins < apDados || apDados <= 0) return msg.reply('❌ Dinero insuficiente.');
                const dadoUser = Math.floor(Math.random() * 6) + 1;
                const dadoBot = Math.floor(Math.random() * 6) + 1;
                if (dadoUser > dadoBot) { pDados.coins += apDados; await msg.reply(`🎲 Lanzaste \`${dadoUser}\` y el bot \`${dadoBot}\`. ¡Ganaste *$${apDados}*!`); }
                else if (dadoUser < dadoBot) { pDados.coins -= apDados; await msg.reply(`🎲 Lanzaste \`${dadoUser}\` y el bot \`${dadoBot}\`. ¡Perdiste *$${apDados}*!`); }
                else { await msg.reply(`🎲 Ambos sacaron \`${dadoUser}\`. ¡Empate!`); }
                break;

            case 'desafio':
                if (!chat.isGroup || msg.mentionedIds.length === 0 || !args[1] || isNaN(args[1])) return msg.reply('❌ Uso: `.desafio @user <monedas>`');
                const pDes1 = getProfile(userId, username);
                const des2Id = msg.mentionedIds[0];
                if (userId === des2Id) return msg.reply('❌ No puedes autodesafiarte.');
                const contDes2 = await client.getContactById(des2Id);
                const pDes2 = getProfile(des2Id, contDes2.pushname);
                const pozo = parseInt(args[1]);
                if (pDes1.coins < pozo || pDes2.coins < pozo || pozo <= 0) return msg.reply('❌ Uno de los dos no tiene suficiente saldo para cubrir el pozo.');
                if (Math.random() >= 0.5) { pDes1.coins += pozo; pDes2.coins -= pozo; await chat.sendMessage(`⚔️ *DUELO:* @${sender.id.user} destrozó en combate a @${contDes2.id.user} y le arrebató *$${pozo} monedas*.`, { mentions: [sender, contDes2] }); }
                else { pDes2.coins += pozo; pDes1.coins -= pozo; await chat.sendMessage(`⚔️ *DUELO:* @${contDes2.id.user} humilló en combate a @${sender.id.user} cobrando *$${pozo} monedas*.`, { mentions: [sender, contDes2] }); }
                break;

            case 'minar':
                const pMin = getProfile(userId, username);
                if (Date.now() - pMin.lastMinar < 600000) return msg.reply('⏳ La mina está colapsada. Espera unos minutos.');
                pMin.lastMinar = Date.now();
                if (Math.random() >= 0.7) { pMin.gems += 2; await msg.reply('⛏️💎 ¡Brillante! Encontraste **2 Gemas Preciosas** en las rocas del fondo.'); }
                else { const mineral = Math.floor(Math.random() * 300) + 100; pMin.coins += mineral; await msg.reply(`⛏️ Excavaste carbón y oro fino. Ganaste *$${mineral} monedas virtuales*.`); }
                break;

            case 'crimen':
                const pCrim = getProfile(userId, username);
                if (Date.now() - pCrim.lastCrimen < 900000) return msg.reply('🕵️‍♂️ La policía te está buscando. Mantente escondido un rato más.');
                pCrim.lastCrimen = Date.now();
                if (Math.random() >= 0.6) { const golpe = Math.floor(Math.random() * 800) + 400; pCrim.coins += golpe; await msg.reply(`🦹‍♂️💰 ¡GOLPE MAESTRO! Asaltaste un camión blindado con éxito y limpiaste *$${golpe} monedas*.`); }
                else { pCrim.coins = Math.max(0, pCrim.coins - 200); await msg.reply('🚓🚨 ¡FRACASO! Te emboscaron las fuerzas policiales. Perdiste *$200 monedas* en abogados de aduanas.'); }
                break;

            case 'invertir':
                const pInv = getProfile(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Uso: `.invertir <cantidad>`');
                const cantInv = parseInt(args[0]);
                if (pInv.coins < cantInv || cantInv <= 0) return msg.reply('❌ Billetera vacía.');
                if (Math.random() >= 0.45) { const rInv = Math.floor(cantInv * 2.2); pInv.coins += rInv; await msg.reply(`📈🚀 ¡Mercado alcista! Las acciones subieron como la espuma. Ganaste *$${rInv} monedas*.`); }
                else { pInv.coins -= cantInv; await msg.reply(`📉💥 ¡CRASH FINANCIERO! La bolsa se desplomó a cero. Perdiste toda tu inversión de *$${cantInv} monedas*.`); }
                break;

            case 'cofre':
                if (!isAdmin) return msg.reply('❌ Solo administradores pueden invocar un cofre sorpresivo.');
                cofreActivo.activo = true; cofreActivo.monedas = Math.floor(Math.random() * 1500) + 500;
                await chat.sendMessage('📦🎁 *¡UN COFRE MISTERIOSO HA CAÍDO EN EL CHAT!* 🎁📦\nEl primero en poner el comando *.abricofre* se queda con todo el botín en efectivo.');
                break;

            case 'abricofre':
                if (!cofreActivo.activo) return msg.reply('❌ No hay ningún cofre tirado en el suelo de este chat ahora.');
                const pCof = getProfile(userId, username); pCof.coins += cofreActivo.monedas;
                await chat.sendMessage(`🎉🥳 @${sender.id.user} abrió el cofre a la velocidad de la luz y reclamó *$${cofreActivo.monedas} monedas virtuales* de recompensa total!`, { mentions: [sender] });
                cofreActivo.activo = false;
                break;

            case 'ppt':
                const pPpt = getProfile(userId, username);
                if (!args[0] || isNaN(args[0]) || !args[1]) return msg.reply('❌ Uso: `.ppt <apuesta> <piedra/papel/tijera>`');
                const apPpt = parseInt(args[0]); const jugadaUser = args[1].toLowerCase();
                if (pPpt.coins < apPpt || apPpt <= 0) return msg.reply('❌ Monedas insuficientes.');
                if (!['piedra', 'papel', 'tijera'].includes(jugadaUser)) return msg.reply('❌ Elige: piedra, papel o tijera.');
                const opciones = ['piedra', 'papel', 'tijera']; const jugadaBot = opciones[Math.floor(Math.random() * 3)];
                let resPpt = `🎮 *PPT COMPETICIÓN:* Tú: \`${jugadaUser}\` | Bot: \`${jugadaBot}\`\n`;
                if (jugadaUser === jugadaBot) { await msg.reply(resPpt + '👔 ¡Empate técnico! Recuperas tus fondos.'); }
                else if ((jugadaUser==='piedra'&&jugadaBot==='tijera') || (jugadaUser==='papel'&&jugadaBot==='piedra') || (jugadaUser==='tijera'&&jugadaBot==='papel')) { pPpt.coins += apPpt; await msg.reply(resPpt + `🏆 ¡Ganaste de forma limpia! Sumas *$${apPpt} monedas*.`); }
                else { pPpt.coins -= apPpt; await msg.reply(resPpt + `📉 Perdiste. El bot destruyó tu jugada. Restas *$${apPpt} monedas*.`); }
                break;

            case 'pelear':
                if (!chat.isGroup || msg.mentionedIds.length === 0) return msg.reply('❌ Menciona a tu oponente.');
                const retador = getProfile(userId, username); const rivalId = msg.mentionedIds[0];
                if (userId === rivalId) return msg.reply('❌ No puedes pelear contigo mismo.');
                const rivalCont = await client.getContactById(rivalId); const rival = getProfile(rivalId, rivalCont.pushname);
                const botin = Math.floor(Math.random() * 100) + 50;
                await msg.reply(`🥊 *DUELO:* @${sender.id.user} y @${rivalCont.id.user} se lían a puñetazos por $${botin}...`);
                setTimeout(async () => {
                    if (Math.random() >= 0.5) { retador.coins += botin; rival.coins = Math.max(0, rival.coins - botin); await chat.sendMessage(`🏆 @${sender.id.user} noqueó a @${rivalCont.id.user} llevándose el premio. 🥇`, { mentions: [sender, rivalCont] }); }
                    else { rival.coins += botin; retador.coins = Math.max(0, retador.coins - botin); await chat.sendMessage(`🏆 @${rivalCont.id.user} durmió de una patada a @${sender.id.user} llevándose el premio. 🥇`, { mentions: [sender, rivalCont] }); }
                }, 2000);
                break;
               case 'frasestexto':
            case 'piropotexto':
            case 'consejotexto':
            case 'motivacion':
                const tipoTxt = command === 'frasestexto' ? 'fraseamor' : command === 'piropotexto' ? 'piropo' : command === 'consejotexto' ? 'consejo' : 'motivacion';
                if (bancoTextos[tipoTxt].length === 0) return msg.reply(`📦 No hay textos cargados en esta lista. Envía frases con el tag #${tipoTxt} en tu grupo de respaldo.`);
                const idTextoMensaje = bancoTextos[tipoTxt][Math.floor(Math.random() * bancoTextos[tipoTxt].length)];
                const msgCapturado = await client.getMessageById(idTextoMensaje);
                await msg.reply(msgCapturado.body.replace(`#${tipoTxt}`, '').trim());
                break;

            case 'stickerazar':
                if (bancoStickers.random.length === 0) return msg.reply('📦 Grupo de Stickers vacío. Aliméntalo desde tu chat de respaldo.');
                await chat.sendMessage(await client.getMessageById(bancoStickers.random[Math.floor(Math.random() * bancoStickers.random.length)]));
                break;

            case 'stickeramor':
                if (bancoStickers.amor.length === 0) return msg.reply('📦 No hay stickers con el tag #amor en tu grupo de respaldo.');
                await chat.sendMessage(await client.getMessageById(bancoStickers.amor[Math.floor(Math.random() * bancoStickers.amor.length)]));
                break;

            case 'vff':
            case 'vdedicar':
            case 'vfruti':
            case 'vdeporte':
            case 'vpelicula':
            case 'vtiktok':
            case 'vfrases':
            case 'vmusica':
                const catVid = command === 'vff' ? 'ff' : command === 'vdedicar' ? 'dedicar' : command === 'vfruti' ? 'fruti' : command === 'vdeporte' ? 'futbol' : command === 'vpelicula' ? 'peliculas' : command === 'vtiktok' ? 'tiktok' : command === 'vfrases' ? 'tiktokfrases' : 'musica';
                if (bancoVideos[catVid].length === 0) return msg.reply(`📦 Sin videos almacenados. Reenvía uno al grupo con el hashtag #${catVid}.`);
                await chat.sendMessage(await client.getMessageById(bancoVideos[catVid][Math.floor(Math.random() * bancoVideos[catVid].length)]));
                break;

            case 'chapar':
                if (!chat.isGroup || msg.mentionedIds.length === 0) return msg.reply('❌ Menciona a quién besar.');
                const bCont = await client.getContactById(msg.mentionedIds[0]);
                await chat.sendMessage(`💋 @${sender.id.user} arrastró a @${bCont.id.user} y le plantó un beso apasionado de película. 🔥💕`, { mentions: [sender, bCont] });
                break;

            case 'matar':
                if (!chat.isGroup || msg.mentionedIds.length === 0) return msg.reply('❌ Menciona a tu víctima.');
                const rCont = await client.getContactById(msg.mentionedIds[0]);
                await chat.sendMessage(`☠️ @${sender.id.user} mandó al lobby a @${rCont.id.user} de un tiro a la cabeza en Free Fire. 🎯`, { mentions: [sender, rCont] });
                break;

            case 'crush':
                if (!chat.isGroup) return msg.reply('❌ Exclusivo para grupos.');
                const miembros = chat.participants;
                if (msg.mentionedIds.length === 0) {
                    const u1 = miembros[Math.floor(Math.random() * miembros.length)].id.user;
                    let u2 = miembros[Math.floor(Math.random() * miembros.length)].id.user;
                    while (u1 === u2) { u2 = miembros[Math.floor(Math.random() * miembros.length)].id.user; }
                    const c1 = await client.getContactById(u1 + '@c.us'); const c2 = await client.getContactById(u2 + '@c.us');
                    await chat.sendMessage(`💘 *CRUSH ENCONTRADO:* @${u1} x @${u2} ── \`100% Compatibles\` 😍`, { mentions: [c1, c2] });
                } else {
                    const oC = await client.getContactById(msg.mentionedIds[0]); const porc = Math.floor(Math.random() * 100) + 1;
                    await chat.sendMessage(`💕 *AMOR METER:* @${sender.id.user} x @${oC.id.user} ── \`${porc}%\` 🔥`, { mentions: [sender, oC] });
                }
                break;

            case 'rey':
                const elRey = chat.participants[Math.floor(Math.random() * chat.participants.length)].id.user;
                const cRey = await client.getContactById(elRey + '@c.us');
                await chat.sendMessage(`👑 *DECRETO REAL:* Alaben todos al nuevo Monarca absoluto del chat: @${elRey} ✨`, { mentions: [cRey] });
                break;

            case 'gay':
                const elG = chat.participants[Math.floor(Math.random() * chat.participants.length)].id.user;
                const cG = await client.getContactById(elG + '@c.us');
                await chat.sendMessage(`🌈 *GAY-RADAR:* @${elG} ha sido indexado con un \`${Math.floor(Math.random() * 100) + 1}%\` de sospecha activa. 💅`, { mentions: [cG] });
                break;

            case 'suerte':
                if (!args.length) return msg.reply('❌ Haz tu pregunta.');
                const rB = ["🔮 Sí, absolutamente. ✅", "🔮 Las probabilidades están en cero. ❌", "🔮 El destino está nublado hoy. 🌀"];
                await msg.reply(rB[Math.floor(Math.random() * rB.length)]);
                break;

            case 'n':
            case 'reenviar':
                if (msg.hasQuotedMsg) {
                    const q = await msg.getQuotedMessage();
                    if (q.hasMedia) { await chat.sendMessage(await q.downloadMedia(), { caption: q.body || '' }); } 
                    else { await chat.sendMessage(q.body); }
                } else { await msg.reply('❌ Responde a un mensaje con *.n*'); }
                break;

            case 'gemini':
                if (!args.length || !aiModel) return msg.reply('❌ Escribe tu consulta.');
                try {
                    await msg.reply('🧠 *KORI IA* pensando...');
                    const result = await aiModel.generateContent(args.join(' '));
                    await msg.reply(`🤖 *Gemini:* \n\n${(await result.response).text()}`);
                } catch (err) { await msg.reply('❌ Error.'); }
                break;

            case 'work':
            case 'trabajar':
                const pW = getProfile(userId, username);
                if (Date.now() - pW.lastWork < 300000) return msg.reply('⏳ Estás exhausto, descansa.');
                const g = Math.floor(Math.random() * 250) + 150; pW.coins += g; pW.lastWork = Date.now(); pW.asegurado = false;
                await msg.reply(`💰 Trabajaste duro y ganaste *$${g} monedas*.`);
                break;

            case 'daily':
                const pD = getProfile(userId, username);
                if (Date.now() - pD.lastDaily < 86400000) return msg.reply('❌ Recompensa diaria ya tomada.');
                pD.coins += 1000; pD.lastDaily = Date.now(); pD.asegurado = false;
                await msg.reply('🎁 *RECOMPENSA DIARIA:* Sumaste *$1,000 monedas*.');
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
                if (['4vs4','6vs6','8vs8','12vs12'].includes(command)) await msg.reply(`🎮 *FREE FIRE:* @everyone ¡Se armó una escuadra de *${command.toUpperCase()}*! Dejen IDs. 🏆🔥`);
                if (command === 'sala') await msg.reply('🔑 *SALA DE FREE FIRE:* Cargando credenciales...');
                if (command === 'fraseromantica') await msg.reply('❤️ En el mapa de mi vida, tu número marca mi lugar favorito.');
                if (command === 'uptime') await msg.reply(`⏱️ *Activo:* ${Math.floor(Math.abs(new Date() - startTime) / (1000 * 60 * 60))} horas.`);
                if (command === 'sistema') await msg.reply(`🖥️ *Servidor:* Linux Cloud | Node.js v22 | Railway Optimizado.`);
                if (command === 'ping') await msg.reply('🚀 *¡Pong!* Kori Bot respondiendo a la velocidad de la luz.');
                if (command === 's' || command === 'sticker') {
                    if (msg.hasMedia || (msg.hasQuotedMsg && (await msg.getQuotedMessage()).hasMedia)) {
                        try {
                            await msg.reply('⏳ *Generando Sticker...*');
                            const m = msg.hasMedia ? msg : await msg.getQuotedMessage();
                            const media = await m.downloadMedia();
                            if (media) await chat.sendMessage(media, { sendMediaAsSticker: true, stickerName: "KORI SYSTEM 🤖", stickerAuthor: "DEYVI A.O.C ✨" });
                        } catch (e) { await msg.reply('❌ Error al crear sticker.'); }
                    } else { await msg.reply('❌ Responde a una imagen con *.s*'); }
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
                        "https://i.postimg.cc/mD87fXp4/freefire-welcome.jpg"
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
