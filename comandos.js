const { MessageMedia } = require('whatsapp-web.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const axios = require('axios');

// 🔑 CLAVE API GEMINI (PROCESADOR COGNITIVO)
const GEMINI_API_KEY = "AQ.Ab8RN6J-5x57rikx5NrolJCHCHnRxkmHK0psnMdo8-0yDAA5yA"; 
let aiModel = null;
try {
    if (GEMINI_API_KEY) {
        const aiConfig = new GoogleGenerativeAI(GEMINI_API_KEY);
        aiModel = aiConfig.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
} catch (e) { console.log("Error cargando Gemini."); }

const startTime = new Date();
let cofreActivo = { activo: false, monedas: 0 };

// ⚙️ CONFIGURACIÓN DE MEMORIA VOLÁTIL PARA MULTIMEDIA EN EJECUCIÓN (ANTI-RETARDO)
const bancoStickers = { random: [], amor: [] };
const bancoVideos = { ff: [], dedicar: [], fruti: [], futbol: [], peliculas: [], tiktokfrases: [], tiktok: [], musica: [] };

// 💾 ESQUEMAS NATIVOS PARA MONGODB ATLAS (PERSISTENCIA TOTAL DE TU JUEGO)
const UsuarioSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    name: { type: String, default: 'Usuario' },
    coins: { type: Number, default: 500 },
    bank: { type: Number, default: 1000 },
    gems: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    lastDaily: { type: Number, default: 0 },
    lastWork: { type: Number, default: 0 },
    lastMinar: { type: Number, default: 0 },
    lastCrimen: { type: Number, default: 0 },
    asegurado: { type: Boolean, default: false }
});
const UsuarioModel = mongoose.model('UsuarioRPG', UsuarioSchema);

const GrupoSchema = new mongoose.Schema({
    groupId: { type: String, required: true, unique: true },
    welcome: { type: Boolean, default: false },
    bye: { type: Boolean, default: false },
    modoAdmin: { type: Boolean, default: false },
    welcomeText: { type: String, default: "✨ ¡Hola @user! Bienvenido(a) al grupo. Pásala genial y respeta las reglas. 🥳👑" },
    byeText: { type: String, default: "👋 Un miembro menos... @user se ha retirado. ¡Que te vaya bien! ✨" },
    msgPersonalizado: { type: String, default: "✨ *MENSAJE CORPORATIVO KORI BOT* ✨\n\n💻 Desarrollador Oficial: DEYVI A.O.C\n📞 Soporte Técnico: +51 900834505\n💬 ¡Escríbenos si tienes dudas o reportes!" }
});
const GrupoModel = mongoose.model('GrupoConfig', GrupoSchema);

const TextoNubeSchema = new mongoose.Schema({
    tipo: { type: String, required: true }, // 'piropo', 'consejo', 'motivacion', 'fraseamor'
    contenido: { type: String, required: true }
});
const TextoNubeModel = mongoose.model('TextoNube', TextoNubeSchema);

// 🧠 FUNCIONES ASÍNCRONAS INTELIGENTES DE ACCESO A BASE DE DATOS
async function getProfile(userId, pushname) {
    let perfil = await UsuarioModel.findOne({ userId });
    if (!perfil) {
        perfil = new UsuarioModel({ userId, name: pushname || 'Usuario' });
        await perfil.save();
    }
    return perfil;
}

async function getGroupConfig(groupId) {
    let config = await GrupoModel.findOne({ groupId });
    if (!config) {
        config = new GrupoModel({ groupId });
        await config.save();
    }
    return config;
         }
// 🎮 MOTOR PRINCIPAL DEL BOT
async function ejecutar(client, msg) {
    try {
        let body = "";
        if (typeof msg.body === 'string') body = msg.body.trim();
        else if (msg.caption && typeof msg.caption === 'string') body = msg.caption.trim();

        const chat = await msg.getChat();
        const sender = await msg.getContact();
        const userId = sender.id._serialized;
        const username = sender.pushname || 'Usuario';
        const chatNameLower = chat.name ? chat.name.toLowerCase() : "";

        // 📥 CAPTURADOR EN TIEMPO REAL PARA GRUPOS DE RESPALDO (A PRUEBA DE MAYÚSCULAS)
        if (chat.isGroup && (chatNameLower.includes("banco") || chatNameLower.includes("respaldo"))) {
            const tag = body.toLowerCase();
            if (msg.type === 'sticker') {
                try {
                    const media = await msg.downloadMedia();
                    if (media) {
                        if (tag.includes('#amor')) bancoStickers.amor.push(media);
                        else bancoStickers.random.push(media);
                    }
                } catch (e) { console.log("Error descargando sticker de respaldo."); }
                return;
            } 
            if (msg.type === 'video' || msg.type === 'ptv') {
                try {
                    const media = await msg.downloadMedia();
                    if (media) {
                        if (tag.includes('#ff')) bancoVideos.ff.push(media);
                        else if (tag.includes('#dedicar')) bancoVideos.dedicar.push(media);
                        else if (tag.includes('#fruti')) bancoVideos.fruti.push(media);
                        else if (tag.includes('#futbol') || tag.includes('#deporte')) bancoVideos.futbol.push(media);
                        else if (tag.includes('#peliculas')) bancoVideos.peliculas.push(media);
                        else if (tag.includes('#tiktokfrases')) bancoVideos.tiktokfrases.push(media);
                        else if (tag.includes('#tiktok')) bancoVideos.tiktok.push(media);
                        else if (tag.includes('#musica')) bancoVideos.musica.push(media);
                    }
                } catch (e) { console.log("Error descargando video de respaldo."); }
                return;
            }
            if (msg.type === 'chat' && body !== "") {
                let tipo = "";
                if (tag.includes('#piropo')) tipo = 'piropo';
                else if (tag.includes('#consejo')) tipo = 'consejo';
                else if (tag.includes('#motivacion')) tipo = 'motivacion';
                else if (tag.includes('#fraseamor')) tipo = 'fraseamor';

                if (tipo) {
                    const limpio = body.replace(new RegExp(`#${tipo}`, 'gi'), '').trim();
                    const nuevoTexto = new TextoNubeModel({ tipo, contenido: limpio });
                    await nuevoTexto.save();
                }
                return;
            }
        }

        // 🧠 RESPUESTAS AUTOMÁTICAS DINÁMICAS (MENCIONES O PALABRA "BOT")
        if (!body.startsWith('.') && !body.toLowerCase().startsWith('aviso')) {
            if (body.toLowerCase().includes('bot') || (msg.mentionedIds && msg.mentionedIds.includes(client.info.wid._serialized))) {
                const frasesBot = [
                    `¿Qué pasó, ${username}? Aquí estoy online y listo. Pon *.menu* para ver qué puedo hacer. 😎`,
                    `¿Me llamaste, crack? Más vale que sean monedas para apostar en mi ruleta... 🎰`,
                    `Dime, campeón. ¿En qué te asisto hoy? Recuerda que mi comando base es *.menu* 🔥`,
                    `Presente. Ejecutando procesos al 100% de velocidad con base de datos. ⚡`,
                    `¿Quién invoca al rey del servidor? Ah, eres tú, ${username}. ¡Hola! 👋`,
                    `Escuché la palabra 'Bot' y mi sistema se activó automáticamente. ¿Qué hacemos? 💻`,
                    `A ver, a ver... ¿Quién me necesita? Si buscas diversión, pon *.tragamonedas* ya mismo. 🎰`,
                    `Aquí estoy, el bot más rápido de Railway. ¿Listo para perder unas monedas en los dados? 🎲`,
                    `¿Qué onda, ${username}? Recuerda que para usar la Inteligencia Artificial puedes usar *.gemini* 🤖`,
                    `Modo activo. Si eres administrador, recuerda que tienes comandos de control exclusivos. 🛡️`,
                    `¿Invocándome otra vez? No te olvides de mandar tu captura de spam al creador para mantener el servicio gratis. 👑`,
                    `Dime, jugador. ¿Listo para una ronda de *.ruletarusa* o tienes miedo? 🔫`,
                    `Kori System reportándose sin novedad en el grupo. ¡Un saludo! ✨`
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

        if (body === '.menu') { command = 'menu'; }

        const gConfig = chat.isGroup ? await getGroupConfig(chat.id._serialized) : null;

        let isAdmin = false;
        if (chat.isGroup) {
            const participant = chat.participants.find(p => p.id._serialized === userId);
            if (participant && (participant.isAdmin || participant.isSuperAdmin)) isAdmin = true;
        }

        if (chat.isGroup && !isAdmin && gConfig?.modoAdmin && command !== 'menu') return;

        switch (command) {
            case 'menu':
                const uptimeDiff = Math.abs(new Date() - startTime);
                const hours = Math.floor(uptimeDiff / (1000 * 60 * 60));
                const minutes = Math.floor((uptimeDiff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((uptimeDiff % (1000 * 60)) / 1000);

                const menuTexto = `✨ ╔════════════════════════╗ ✨
       👑  *KORI BOT - EXECUTIVE* ✨ ╚════════════════════════╝ ✨

👤 *Usuario:* \`${username.toUpperCase()}\`
⏱️ *Uptime:* \`${hours}h ${minutes}m ${seconds}s\`
🔌 *Database:* \`MongoDB Atlas (Online) 🟢\`

────────────────────────────
📊 *STATUS & SISTEMA*
────────────────────────────
📝 ➪ \`.owner\` ── Info del desarrollador oficial
⚡ ➪ \`.ping\` ── Verificar latencia del sistema
🕒 ➪ \`.uptime\` ── Tiempo de actividad continua
💻 ➪ \`.sistema\` ── Detalles del servidor cloud

🛡️ *ADMINISTRACIÓN & SEGURIDAD*
────────────────────────────
📣 ➪ \`.todos <txt>\` ── Mencionar a todos los miembros
📢 ➪ \`aviso\` ── Comunicado oficial con imagen/video
🚷 ➪ \`.kick @user\` ── Remover miembro del grupo
🚪 ➪ \`.welcome on/off/texto\` ── Mensaje de Bienvenida
👋 ➪ \`.bye on/off/texto\` ── Mensaje de Despedida
⚙️ ➪ \`.modoadmin on/off\` ── Exclusividad para admins
📝 ➪ \`.editmsg <texto>\` ── Cambiar info del comando \`.vermsg\`
📋 ➪ \`.vermsg\` ── Envía los datos fijados del grupo

🤖 *INTELIGENCIA ARTIFICIAL*
────────────────────────────
🧠 ➪ \`.gemini <texto>\` ── Consulta directa a Gemini 1.5

🎰 *MINIJUEGOS & ECONOMÍA PERSISTENTE*
────────────────────────────
📇 ➪ \`.perfil\` ── Ver tu saldo y nivel en la nube
💰 ➪ \`.trabajar\` ── Trabajar para recolectar dinero
🎁 ➪ \`.daily\` ── Bono diario de obsequio
🎲 ➪ \`.ruleta <cant>\` | \`.slot <cant>\` ── Apuestas de azar
🎰 ➪ \`.tragamonedas <cant>\` ── Multiplicador de casino
🦹‍♂️ ➪ \`.robar @user\` ── Asaltar el saldo de otro usuario
🛡️ ➪ \`.asegurar\` ── Comprar blindaje contra hurtos ($50)
🔫 ➪ \`.ruletarusa\` ── Desafío de eliminación por azar
🃏 ➪ \`.blackjack <cant>\` ── Cartas 21 contra la casa
🎲 ➪ \`.dados <cant>\` ── Lanzamiento de cubos numéricos
🥊 ➪ \`.pelear @user\` ── Combate callejero por apuestas
⚔️ ➪ \`.desafio @user <cant>\` ── Retar a un duelo oficial
⛏️ ➪ \`.minar\` ── Buscar gemas preciosas en la cantera
🕵️‍♂️ ➪ \`.crimen\` ── Actividad ilegal de alta recompensa
📈 ➪ \`.invertir <cant>\` ── Inversiones de bolsa fluctuantes
📦 ➪ \`.cofre\` / \`.abricofre\` ── Evento global de cofre sorpresa
🎮 ➪ \`.ppt <cant> <jugada>\` ── Piedra, Papel o Tijera

🎭 *INTERACTIVOS & STICKERS*
────────────────────────────
💘 ➪ \`.crush\` / \`.crush @user\` ── Test de compatibilidad
💋 ➪ \`.chapar @user\` ── Enviar un beso al chat
☠️ ➪ \`.matar @user\` ── Eliminar a un amigo en broma
👑 ➪ \`.rey\` | \`.gay\` | \`.suerte <preg>\` ── Juegos rápidos
👥 ➪ \`.formarpareja\` ── Casar a dos miembros al azar
🎨 ➪ \`.s\` ── Generar Sticker desde multimedia

📦 *CONTENIDO MULTIMEDIA NUBE*
────────────────────────────
🤡 ➪ \`.stickerazar\` ── Sticker variado aleatorio
💖 ➪ \`.stickeramor\` ── Sticker romántico interactivo
🔥 ➪ \`.vff\` ── Videos de Free Fire edits
🎬 ➪ \`.vdedicar\` ── Videos para dedicar a tu pareja
🍓 ➪ \`.vfruti\` ── Cortometrajes y Fruti Novelas
⚽ ➪ \`.vdeporte\` ── Jugadas de fútbol y deportes
🎥 ➪ \`.vpelicula\` ── Resúmenes de películas
📱 ➪ \`.vtiktok\` ── Vídeos virales de TikTok
✍️ ➪ \`.vfrases\` ── Clips motivacionales con texto
🎵 ➪ \`.vmusica\` ── Tendencias musicales del momento
❤️ ➪ \`.frasestexto\` ── Frases de amor de MongoDB
🃏 ➪ \`.piropotexto\` ── Piropos guardados en MongoDB
💡 ➪ \`.consejotexto\` ── Consejos almacenados en MongoDB
⚡ ➪ \`.motivacion\` ── Mensajes de superación en MongoDB

🎮 *ÁREA DE CAMPAÑA FREE FIRE*
────────────────────────────
🏆 ➪ \`.4vs4\` | \`.6v6\` | \`.8vs8\` | \`.12vs12\`
🔑 ➪ \`.sala\` ── Plantilla para organizar salas

────────────────────────────
💻 *DATOS DEL PROGRAMADOR & SOPORTE*
────────────────────────────
👑 *Creador Principal:* DEYVI A.O.C
📞 *Contacto / WhatsApp:* +51 900834505
🛠️ *Dudas de soporte:* Si el bot presenta fallas o lentitud, escribe directamente al número oficial adjuntando tu captura.

⚠️ *REMINDER / RECORDATORIO IMPORTANTE:*
Si estás usando la versión gratuita del bot, recuerda hacer el spam respectivo en tus grupos o redes, tomar captura del apoyo y enviársela de inmediato al creador al número: *51900834505* para mantener tu token activo sin suspensiones. ¡Gracias por el apoyo!

✨ ─── \`By: DEYVI A.O.C\` ─── ✨`;

                await msg.reply(menuTexto);
                break;
                case 'editmsg':
                if (!chat.isGroup || !isAdmin) return msg.reply('❌ Comando exclusivo de administradores.');
                const contenidoMensaje = args.join(' ');
                if (!contenidoMensaje) return msg.reply('❌ Formato incorrecto. Uso: `.editmsg Aquí va el texto institucional del grupo`');
                gConfig.msgPersonalizado = contenidoMensaje;
                await gConfig.save();
                await msg.reply('✅ *Éxito:* Mensaje personalizado guardado en MongoDB para este grupo.');
                break;

            case 'vermsg':
                if (!chat.isGroup) return msg.reply('❌ Solo funciona en grupos.');
                await msg.reply(gConfig.msgPersonalizado);
                break;

            case 'modoadmin':
                if (!chat.isGroup || !isAdmin) return msg.reply('❌ No tienes los permisos requeridos.');
                if (args[0] === 'on') { gConfig.modoAdmin = true; await msg.reply('🔒 *MODO ADMIN ACTIVO:* Bot bloqueado para miembros generales.'); }
                else if (args[0] === 'off') { gConfig.modoAdmin = false; await msg.reply('🔓 *MODO ADMIN INACTIVO:* Acceso libre.'); }
                await gConfig.save();
                break;

            case 'kick':
                if (!chat.isGroup || !isAdmin) return;
                if (!msg.mentionedIds.length) return msg.reply('❌ Menciona al usuario.');
                try {
                    for (let target of msg.mentionedIds) { await chat.removeParticipants([target]); }
                    await msg.reply('🔨 Expulsado.');
                } catch (e) { await msg.reply('❌ Falta de rango de admin en el bot.'); }
                break;

            case 'welcome':
                if (!chat.isGroup || !isAdmin) return;
                if (args[0] === 'on') gConfig.welcome = true;
                else if (args[0] === 'off') gConfig.welcome = false;
                else if (args[0] === 'texto') gConfig.welcomeText = args.slice(1).join(' ');
                await gConfig.save();
                await msg.reply('📝 Estado de bienvenida actualizado.');
                break;

            case 'bye':
                if (!chat.isGroup || !isAdmin) return;
                if (args[0] === 'on') gConfig.bye = true;
                else if (args[0] === 'off') gConfig.bye = false;
                else if (args[0] === 'texto') gConfig.byeText = args.slice(1).join(' ');
                await gConfig.save();
                await msg.reply('📝 Estado de despedida actualizado.');
                break;

            case 'todos':
                if (!chat.isGroup || !isAdmin) break;
                let mTexto = `📣 *CONVOCATORIA GENERAL* 📣\n\n`;
                if (args.length > 0) mTexto += `📝 *Nota:* ${args.join(' ')}\n\n`;
                let mList = [];
                for (let part of chat.participants) {
                    try {
                        const cont = await client.getContactById(part.id._serialized);
                        mList.push(cont); mTexto += `💚 ➪ @${part.id.user}\n`;
                    } catch (e) {}
                }
                await chat.sendMessage(mTexto.trim(), { mentions: mList });
                break;

            case 'aviso':
                if (!chat.isGroup || !isAdmin) break;
                let txtAv = `📢 *\`AVISO INSTITUCIONAL\`*\n\n`;
                if (msg.hasQuotedMsg) {
                    const qM = await msg.getQuotedMessage(); txtAv += qM.body || args.join(' ') || '';
                    if (qM.hasMedia) {
                        try { await chat.sendMessage(await qM.downloadMedia(), { caption: txtAv }); break; } catch (err) {}
                    }
                } else { txtAv += args.join(' '); }
                await chat.sendMessage(txtAv);
                break;
                case 'perfil':
                const perf = await getProfile(userId, username);
                await msg.reply(`📇 *\`KORI RPG PROFILE\`*\n\n👤 *Nombre:* ${perf.name}\n📈 *Nivel:* ${perf.level}\n💰 *Bolsillo:* $${perf.coins}\n🏦 *Banco:* $${perf.bank}\n💎 *Gemas:* ${perf.gems}\n🛡️ *Seguro:* ${perf.asegurado ? 'ACTIVO ✅' : 'INACTIVO ❌'}`);
                break;

            case 'work':
            case 'trabajar':
                const pW = await getProfile(userId, username);
                if (Date.now() - pW.lastWork < 300000) return msg.reply('⏳ Estás exhausto. Descansa unos minutos.');
                const sueldo = Math.floor(Math.random() * 250) + 150; pW.coins += sueldo; pW.lastWork = Date.now(); pW.asegurado = false;
                await pW.save(); await msg.reply(`💰 Trabajaste duro y cobraste *$${sueldo} monedas*.`);
                break;

            case 'daily':
                const pD = await getProfile(userId, username);
                if (Date.now() - pD.lastDaily < 86400000) return msg.reply('❌ Ya recogiste tu recompensa diaria.');
                pD.coins += 1000; pD.lastDaily = Date.now(); pD.asegurado = false;
                await pD.save(); await msg.reply('🎁 *DIARIO:* Sumaste *$1,000 monedas* a tu balance.');
                break;

            case 'ruleta':
            case 'slot':
                const pRul = await getProfile(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Digita un valor numérico.');
                const ap = parseInt(args[0]);
                if (pRul.coins < ap || ap <= 0) return msg.reply('❌ Fondos insuficientes en bolsillo.');
                pRul.asegurado = false;
                if (Math.random() >= 0.5) { pRul.coins += ap; await msg.reply(`🎰 *¡GANASTE!:* Duplicaste la apuesta. +$${ap}.`); } 
                else { pRul.coins -= ap; await msg.reply(`🎰 *PERDISTE:* La casa se queda con tu dinero. -$${ap}.`); }
                await pRul.save();
                break;

            case 'tragamonedas':
                const pSlot = await getProfile(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Digita el monto.');
                const bS = parseInt(args[0]);
                if (bS <= 0 || pSlot.coins < bS) return msg.reply('❌ Monedas insuficientes.');
                const ics = ['🍒', '💎', '🔔', '🍀', '🍋'];
                const r1 = ics[Math.floor(Math.random() * ics.length)];
                const r2 = ics[Math.floor(Math.random() * ics.length)];
                const r3 = ics[Math.floor(Math.random() * ics.length)];
                let resS = `🎰 *🎰 KORI CASINO 🎰* 🎰\n     [ ${r1} | ${r2} | ${r3} ]\n\n`;
                if (r1 === r2 && r2 === r3) { pSlot.coins += bS * 4; resS += `🎉 *JACKPOT TRIPLE!* Recibes *$${bS * 4}*!`; }
                else if (r1 === r2 || r2 === r3 || r1 === r3) { pSlot.coins += Math.floor(bS * 1.5); resS += `✨ *¡Suerte Par!* Recibes *$${Math.floor(bS * 1.5)}*.`; }
                else { pSlot.coins -= bS; resS += `📉 *Perdiste.* -$${bS}.`; }
                await pSlot.save(); await msg.reply(resS);
                break;

            case 'ruletarusa':
                if (Math.floor(Math.random() * 6) === 0) {
                    await msg.reply('💥 *¡PUMMMMMM!* Bala en la recámara. Has muerto. 💀');
                    if (chat.isGroup && !isAdmin) { try { await chat.removeParticipants([userId]); } catch (e) {} }
                } else { await msg.reply('🛡️ *¡CLIC!* Tambor vacío. Sobreviviste un turno.'); }
                break;

            case 'robar':
                if (!chat.isGroup || !msg.mentionedIds.length) return msg.reply('❌ Menciona a tu objetivo.');
                const ladron = await getProfile(userId, username); const vId = msg.mentionedIds[0];
                if (userId === vId) return msg.reply('🧠 Acción inválida.');
                const vCont = await client.getContactById(vId); const victima = await getProfile(vId, vCont.pushname);
                if (victima.coins <= 50) return msg.reply('❌ El objetivo no tiene capital.');
                if (victima.asegurado) { victima.asegurado = false; ladron.coins = Math.max(0, ladron.coins - 100); await victima.save(); await ladron.save(); return await chat.sendMessage(`🚨 *ALERTA:* @${sender.id.user} rebotó contra el escudo de @${vCont.id.user}. Penalización de $100.`, { mentions: [sender, vCont] }); }
                if (Math.random() >= 0.5) { const rob = Math.floor(Math.random() * (victima.coins * 0.3)) + 20; victima.coins -= rob; ladron.coins += rob; await victima.save(); await ladron.save(); await chat.sendMessage(`🦹‍♂️ *ÉXITO:* @${sender.id.user} extrajo *$${rob}* de las pertenencias de @${vCont.id.user}.`, { mentions: [sender, vCont] }); }
                else { ladron.coins = Math.max(0, ladron.coins - 80); await ladron.save(); await chat.sendMessage(`👮‍♂️ *FALLO:* Capturado en flagrancia. Multa judicial de $80 para @${sender.id.user}.`, { mentions: [sender] }); }
                break;

            case 'asegurar':
                const uAs = await getProfile(userId, username);
                if (uAs.coins < 50) return msg.reply('❌ Requieres $50 monedas.');
                uAs.coins -= 50; uAs.asegurado = true; await uAs.save();
                await msg.reply('🛡️ *SISTEMA:* Seguro anti-robos deployed en tu cuenta.');
                break;

            case 'blackjack':
                const pBj = await getProfile(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Digita el valor.');
                const aB = parseInt(args[0]);
                if (pBj.coins < aB || aB <= 0) return msg.reply('❌ Saldo insuficiente.');
                const tP = Math.floor(Math.random() * 12) + 10; const bP = Math.floor(Math.random() * 11) + 11;
                if (tP > 21) { pBj.coins -= aB; await msg.reply(`🃏 Te excediste con \`${tP}\`. Perdiste *$${aB}*.`); }
                else if (bP > 21 || tP > bP) { pBj.coins += aB; await msg.reply(`🃏 ¡Victoria! Lograste \`${tP}\` contra \`${bP}\` del crupier. +$${aB}.`); }
                else { pBj.coins -= aB; await msg.reply(`🃏 Derrota. El crupier plantó \`${bP}\` frente a tu \`${tP}\`. -$${aB}.`); }
                await pBj.save();
                break;

            case 'dados':
                const pDd = await getProfile(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Digita la apuesta.');
                const aD = parseInt(args[0]);
                if (pDd.coins < aD || aD <= 0) return msg.reply('❌ Balance insuficiente.');
                const dU = Math.floor(Math.random() * 6) + 1; const dB = Math.floor(Math.random() * 6) + 1;
                if (dU > dB) { pDd.coins += aD; await msg.reply(`🎲 Obtuviste \`${dU}\` vs \`${dB}\` del sistema. ¡Ganaste *$${aD}*!`); }
                else if (dU < dB) { pDd.coins -= aD; await msg.reply(`🎲 Obtuviste \`${dU}\` vs \`${dB}\` del sistema. ¡Perdiste *$${aD}*!`); }
                else { await msg.reply(`🎲 Empate técnico a \`${dU}\`. Fondos devueltos.`); }
                await pDd.save();
                break;

            case 'desafio':
                if (!chat.isGroup || !msg.mentionedIds.length || !args[1] || isNaN(args[1])) return msg.reply('❌ Parámetros inválidos. Uso: `.desafio @user 100`');
                const d1 = await getProfile(userId, username); const d2Id = msg.mentionedIds[0];
                if (userId === d2Id) return msg.reply('❌ Autodesafío no permitido.');
                const cD2 = await client.getContactById(d2Id); const d2 = await getProfile(d2Id, cD2.pushname);
                const pz = parseInt(args[1]);
                if (d1.coins < pz || d2.coins < pz || pz <= 0) return msg.reply('❌ Fondos insuficientes en alguna de las dos cuentas.');
                if (Math.random() >= 0.5) { d1.coins += pz; d2.coins -= pz; await chat.sendMessage(`⚔️ @${sender.id.user} pulverizó en duelo a @${cD2.id.user} llevándose *$${pz}*.`, { mentions: [sender, cD2] }); }
                else { d2.coins += pz; d1.coins -= pz; await chat.sendMessage(`⚔️ @${cD2.id.user} dominó el encuentro y cobró *$${pz}* de @${sender.id.user}.`, { mentions: [sender, cD2] }); }
                await d1.save(); await d2.save();
                break;

            case 'minar':
                const pM = await getProfile(userId, username);
                if (Date.now() - pM.lastMinar < 600000) return msg.reply('⏳ Herramientas sobrecalentadas. Espera un momento.');
                pM.lastMinar = Date.now();
                if (Math.random() >= 0.7) { pM.gems += 2; await msg.reply('⛏️💎 ¡Excelente yacimiento! Extrajiste **2 Gemas Preciosas**.'); }
                else { const min = Math.floor(Math.random() * 300) + 100; pM.coins += min; await msg.reply(`⛏️ Carbón y oro recolectados. Valor de venta: +$${min}.`); }
                await pM.save();
                break;

            case 'crimen':
                const pCr = await getProfile(userId, username);
                if (Date.now() - pCr.lastCrimen < 900000) return msg.reply('🕵️‍♂️ Operación bajo vigilancia federal. Espera.');
                pCr.lastCrimen = Date.now();
                if (Math.random() >= 0.6) { const gp = Math.floor(Math.random() * 800) + 400; pCr.coins += gp; await msg.reply(`🦹‍♂️💰 Éxito criminal de alto calibre. Utilidad neta: *$${gp}*.`); }
                else { pCr.coins = Math.max(0, pCr.coins - 200); await msg.reply('🚓🚨 Interceptado por fuerzas especiales. Multa de fianza aplicada: *$200*.'); }
                await pCr.save();
                break;

            case 'invertir':
                const pIv = await getProfile(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Digita el capital a colocar.');
                const cIv = parseInt(args[0]);
                if (pIv.coins < cIv || cIv <= 0) return msg.reply('❌ Saldo insatisfactorio.');
                if (Math.random() >= 0.45) { const rI = Math.floor(cIv * 2.2); pIv.coins += rI; await msg.reply(`📈 Gráficos en verde. Retorno corporativo del +120%: +$${rI}.`); }
                else { pIv.coins -= cIv; await msg.reply(`📉 Liquidez absorbida por mercado bajista. Pérdida completa de *$${cIv}*.`); }
                await pIv.save();
                break;

            case 'cofre':
                if (!isAdmin) return;
                cofreActivo.activo = true; cofreActivo.monedas = Math.floor(Math.random() * 1500) + 500;
                await chat.sendMessage('📦🎁 *¡COFRE EXCLUSIVO DROP EN EL GRUPO!* 🎁📦\nColoca de inmediato el comando *.abricofre* para reclamar el contenido.');
                break;

            case 'abricofre':
                if (!cofreActivo.activo) return msg.reply('❌ El entorno no registra cofres disponibles.');
                const pCf = await getProfile(userId, username); pCf.coins += cofreActivo.monedas; await pCf.save();
                await chat.sendMessage(`🎉🥳 @${sender.id.user} descifró el cofre y se adjudicó *$${cofreActivo.monedas}* monedas libres!`, { mentions: [sender] });
                cofreActivo.activo = false;
                break;

            case 'ppt':
                const pPp = await getProfile(userId, username);
                if (!args[0] || isNaN(args[0]) || !args[1]) return msg.reply('❌ Estructura errónea: `.ppt 50 piedra`');
                const aP = parseInt(args[0]); const jU = args[1].toLowerCase();
                if (pPp.coins < aP || aP <= 0) return msg.reply('❌ Saldo insuficiente.');
                if (!['piedra', 'papel', 'tijera'].includes(jU)) return msg.reply('❌ Elige piedra, papel o tijera.');
                const ops = ['piedra', 'papel', 'tijera']; const jB = ops[Math.floor(Math.random() * 3)];
                let rP = `🎮 Elección: \`${jU}\` | Kori Bot: \`${jB}\`\n`;
                if (jU === jB) { await msg.reply(rP + '👔 Declarado un empate sin variaciones.'); }
                else if ((jU==='piedra'&&jB==='tijera') || (jU==='papel'&&jB==='piedra') || (jU==='tijera'&&jB==='papel')) { pPp.coins += aP; await msg.reply(rP + `🏆 Victoria contundente. Recibes *$${aP}*.`); }
                else { pPp.coins -= aP; await msg.reply(rP + `📉 Derrota frente al algoritmo. Pierdes *$${aP}*.`); }
                await pPp.save();
                break;

            case 'pelear':
                if (!chat.isGroup || !msg.mentionedIds.length) return msg.reply('❌ Estipula tu contrincante.');
                const rtd = await getProfile(userId, username); const rvId = msg.mentionedIds[0];
                if (userId === rvId) return;
                const rvC = await client.getContactById(rvId); const rvl = await getProfile(rvId, rvC.pushname);
                const bt = Math.floor(Math.random() * 100) + 50;
                await msg.reply(`🥊 Intercambio de golpes iniciado entre @${sender.id.user} y @${rvC.id.user}...`);
                setTimeout(async () => {
                    if (Math.random() >= 0.5) { rtd.coins += bt; rvl.coins = Math.max(0, rvl.coins - bt); await chat.sendMessage(`🏆 @${sender.id.user} noqueó a su oponente. Recompensa: +$${bt}.`, { mentions: [sender, rvC] }); }
                    else { rvl.coins += bt; rtd.coins = Math.max(0, rtd.coins - bt); await chat.sendMessage(`🏆 @${rvC.id.user} dominó la lona. Recompensa: +$${bt}.`, { mentions: [sender, rvC] }); }
                    await rtd.save(); await rvl.save();
                }, 1500);
                break;
                case 'frasestexto':
            case 'piropotexto':
            case 'consejotexto':
            case 'motivacion':
                const tp = command === 'frasestexto' ? 'fraseamor' : command === 'piropotexto' ? 'piropo' : command === 'consejotexto' ? 'consejo' : 'motivacion';
                const textosGuardados = await TextoNubeModel.find({ tipo: tp });
                if (!textosGuardados || textosGuardados.length === 0) return msg.reply(`📦 Base de datos remota sin registros para el tag #${tp}.`);
                const elegido = textosGuardados[Math.floor(Math.random() * textosGuardados.length)].contenido;
                await msg.reply(elegido);
                break;

            case 'stickerazar':
                if (bancoStickers.random.length === 0) return msg.reply('📦 Memoria intermedia vacía. Envía stickers al grupo de respaldo.');
                await chat.sendMessage(bancoStickers.random[Math.floor(Math.random() * bancoStickers.random.length)], { sendMediaAsSticker: true });
                break;

            case 'stickeramor':
                if (bancoStickers.amor.length === 0) return msg.reply('📦 El almacén temporal no registra stickers de amor.');
                await msg.reply('⚙️ *Kori Analizador:* Procesando cálculo de compatibilidad amorosa... ⏱️');
                setTimeout(async () => {
                    await chat.sendMessage(bancoStickers.amor[Math.floor(Math.random() * bancoStickers.amor.length)], { sendMediaAsSticker: true });
                }, 1200);
                break;

            case 'vff':
            case 'vdedicar':
            case 'vfruti':
            case 'vdeporte':
            case 'vpelicula':
            case 'vtiktok':
            case 'vfrases':
            case 'vmusica':
                const ct = command === 'vff' ? 'ff' : command === 'vdedicar' ? 'dedicar' : command === 'vfruti' ? 'fruti' : command === 'vdeporte' ? 'futbol' : command === 'vpelicula' ? 'peliculas' : command === 'vtiktok' ? 'tiktok' : command === 'vfrases' ? 'tiktokfrases' : 'musica';
                if (bancoVideos[ct].length === 0) return msg.reply(`📦 Error: No hay videos cargados en la caché para el tag #${ct}.`);
                await chat.sendMessage(bancoVideos[ct][Math.floor(Math.random() * bancoVideos[ct].length)]);
                break;

            case 'chapar':
                if (!chat.isGroup || !msg.mentionedIds.length) return;
                const bC = await client.getContactById(msg.mentionedIds[0]);
                await chat.sendMessage(`💋 @${sender.id.user} le otorgó un beso apasionado en los labios a @${bC.id.user}. 🔥💕`, { mentions: [sender, bC] });
                break;

            case 'matar':
                if (!chat.isGroup || !msg.mentionedIds.length) return;
                const rC = await client.getContactById(msg.mentionedIds[0]);
                await chat.sendMessage(`☠️ @${sender.id.user} eliminó tácticamente con un tiro certero a @${rC.id.user}. 🎯`, { mentions: [sender, rC] });
                break;

            case 'crush':
                if (!chat.isGroup) return;
                const mbs = chat.participants;
                if (!msg.mentionedIds.length) {
                    const u1 = mbs[Math.floor(Math.random() * mbs.length)].id.user;
                    let u2 = mbs[Math.floor(Math.random() * mbs.length)].id.user;
                    while (u1 === u2) u2 = mbs[Math.floor(Math.random() * mbs.length)].id.user;
                    const c1 = await client.getContactById(u1 + '@c.us'); const c2 = await client.getContactById(u2 + '@c.us');
                    await chat.sendMessage(`💘 *ALGORITMO CUPIDO:* @${u1} x @${u2} ── \`100% Compatibles\` 😍`, { mentions: [c1, c2] });
                } else {
                    const oC = await client.getContactById(msg.mentionedIds[0]); const pr = Math.floor(Math.random() * 100) + 1;
                    await chat.sendMessage(`💕 *COMPATIBILIDAD:* @${sender.id.user} x @${oC.id.user} ── \`${pr}%\` 🔥`, { mentions: [sender, oC] });
                }
                break;

            case 'rey':
                const ry = chat.participants[Math.floor(Math.random() * chat.participants.length)].id.user;
                const cRy = await client.getContactById(ry + '@c.us');
                await chat.sendMessage(`👑 *DECRETO:* Postrémonos ante el auténtico Rey del servidor: @${ry} ✨`, { mentions: [cRy] });
                break;

            case 'gay':
                const gy = chat.participants[Math.floor(Math.random() * chat.participants.length)].id.user;
                const cGy = await client.getContactById(gy + '@c.us');
                await chat.sendMessage(`🌈 *SCANNER:* @${gy} registra niveles del \`${Math.floor(Math.random() * 100) + 1}%\`. 💅`, { mentions: [cGy] });
                break;

            case 'suerte':
                if (!args.length) return msg.reply('❌ Añade la interrogante.');
                const rps = ["🔮 Concedido. Es una realidad absoluta. ✅", "🔮 Las variables matemáticas arrojan un no rotundo. ❌", "🔮 Fluctuaciones detectadas. Inténtalo de nuevo. 🌀"];
                await msg.reply(rps[Math.floor(Math.random() * rps.length)]);
                break;

            case 'n':
            case 'reenviar':
                if (msg.hasQuotedMsg) {
                    const q = await msg.getQuotedMessage();
                    if (q.hasMedia) await chat.sendMessage(await q.downloadMedia(), { caption: q.body || '' }); 
                    else await chat.sendMessage(q.body);
                }
                break;

            case 'gemini':
                if (!args.length || !aiModel) return msg.reply('❌ Ingresa una consulta válida.');
                try {
                    await msg.reply('🧠 *KORI SYSTEM IA* procesando datos...');
                    const result = await aiModel.generateContent(args.join(' '));
                    await msg.reply(`🤖 *Gemini Core:* \n\n${(await result.response).text()}`);
                } catch (err) { await msg.reply('❌ Inconvenientes con la API de IA.'); }
                break;

            case 'owner':
            case 'creador':
            case '4vs4':
            case '6vs6':
            case '8vs8':
            case '12vs12':
            case 'sala':
            case 'uptime':
            case 'sistema':
            case 'ping':
            case 's':
            case 'sticker':
                if (command === 'owner' || command === 'creador') await msg.reply(`👤 *Líder de Proyecto:* DEYVI A.O.C\n📞 *Línea Comercial / Soporte:* +51 900834505\n💻 *Cloud Server:* Node.js 22 & MongoDB Atlas.`);
                if (['4vs4','6vs6','8vs8','12vs12'].includes(command)) await msg.reply(`🎮 *CAMPAMENTO FF:* @everyone ¡Escuadra requerida para confrontamiento *${command.toUpperCase()}*! Coordinar IDs.`);
                if (command === 'sala') await msg.reply('🔑 *SALA DE COMPETENCIA:* Preparando parámetros base...');
                if (command === 'uptime') await msg.reply(`⏱️ *Línea de tiempo continua:* ${Math.floor(Math.abs(new Date() - startTime) / (1000 * 60 * 60))} horas.`);
                if (command === 'sistema') await msg.reply(`🖥️ *Core:* Linux Nube | Mongoose v8 | Arquitectura Anti-Crash.`);
                if (command === 'ping') await msg.reply('🚀 *Latency Test:* Pong! Estabilidad completa del canal de red.');
                if (command === 's' || command === 'sticker') {
                    if (msg.hasMedia || (msg.hasQuotedMsg && (await msg.getQuotedMessage()).hasMedia)) {
                        try {
                            const m = msg.hasMedia ? msg : await msg.getQuotedMessage();
                            const media = await m.downloadMedia();
                            if (media) await chat.sendMessage(media, { sendMediaAsSticker: true, stickerName: "KORI EXECUTIVE 🤖", stickerAuthor: "DEYVI A.O.C ✨" });
                        } catch (e) { await msg.reply('❌ Error de renderizado.'); }
                    } else { await msg.reply('❌ Adjunta o responde a un elemento multimedia.'); }
                }
                break;

            default:
                break;
        }
    } catch (error) { console.log('Error interceptado por el núcleo:', error); }
}

function vincularEventosEspeciales(client) {
    client.on('group_join', async (notification) => {
        try {
            const chat = await notification.getChat();
            const contact = await client.getContactById(notification.recipientIds[0]);
            const config = await GrupoModel.findOne({ groupId: chat.id._serialized });
            if (config && config.welcome) {
                let mF = config.welcomeText.replace('@user', `@${contact.id.user}`);
                let fM; try { const url = await client.getProfilePicUrl(contact.id._serialized); if (url) fM = await MessageMedia.fromUrl(url); } catch (err) {}
                if (!fM) fM = await MessageMedia.fromUrl("https://i.postimg.cc/FsYfN5vK/welcome-image.jpg").catch(() => null);
                if (fM) await chat.sendMessage(fM, { caption: mF, mentions: [contact] });
                else await chat.sendMessage(mF, { mentions: [contact] });
            }
        } catch (e) {}
    });

    client.on('group_leave', async (notification) => {
        try {
            const chat = await notification.getChat();
            const contact = await client.getContactById(notification.recipientIds[0]);
            const config = await GrupoModel.findOne({ groupId: chat.id._serialized });
            if (config && config.bye) {
                let mF = config.byeText.replace('@user', `@${contact.id.user}`);
                const fD = await MessageMedia.fromUrl("https://i.postimg.cc/gJ0pM9qf/bye-image.jpg").catch(() => null);
                if (fD) await chat.sendMessage(fD, { caption: mF, mentions: [contact] });
                else await chat.sendMessage(mF, { mentions: [contact] });
            }
        } catch (e) {}
    });
}

module.exports = { ejecutar, vincularEventosEspeciales };
