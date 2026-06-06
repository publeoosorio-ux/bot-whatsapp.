const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');

const startTime = new Date();
let cofreActivo = { activo: false, monedas: 0 };

// ⚙️ BANCO DE MEMORIA LOCAL (ESTABLE)
const bancoStickers = { random: [], amor: [] };
const memoriaGrupos = {}; 
const memoriaUsuarios = {};

// 🧠 BASE DE DATOS LOCAL: 50 FRASES DE AMOR PREMIUM
const listaFrasesAmor = [
    "✨ Eres la forma más bonita que tuvo la vida de decirme que el amor existe.",
    "✨ Si pudiera elegir estar con alguien en este momento, sería contigo sin pensarlo.",
    "✨ No es lo que quiero sentir por ti, es lo que me haces sentir sin poder evitarlo.",
    "✨ Eres mi momento favorito del día y mi pensamiento más bonito de la noche.",
    "✨ El amor no se busca, se encuentra, y yo tuve la suerte de encontrarte a ti.",
    "✨ Bastó una mirada tuya para saber que mi mundo entero cambiaría para siempre.",
    "✨ Contigo los días son más brillantes y las sonrisas son completamente sinceras.",
    "✨ Eres ese mensaje en la pantalla que me hace sonreír como un tonto frente al cel.",
    "✨ No te necesito para nada, pero te quiero para todo en esta vida.",
    "✨ Tu único defecto es no despertar a mi lado todas las mañanas.",
    "✨ Si tuviera que volver a comenzar mi vida, intentaría encontrarte mucho antes.",
    "✨ Eres la casualidad más hermosa que ha llegado a mi existencia.",
    "✨ Mi lugar favorito en el mundo entero es justo en medio de tus abrazos.",
    "✨ Eres el pensamiento constante que alegra mis días más oscuros.",
    "✨ Te quiero no solo por cómo eres, sino por cómo soy yo cuando estoy contigo.",
    "✨ Me gustas tanto que si no eres el amor de mi vida, me equivoqué de vida.",
    "✨ Lo mejor de mi reality es que tú formas parte de ella.",
    "✨ Eres la melodía que mi corazón prefiere escuchar todos los días.",
    "✨ Tantos mundos, tanto espacio, tanta gente, y coincidir contigo fue lo mejor.",
    "✨ Si me dieran a elegir entre todo el oro del mundo y tú, te elegiría mil veces.",
    "✨ Eres mi calma en medio de la tormenta y mi alegría en medio de la rutina.",
    "✨ No sé qué nos depara el destino, pero quiero que lo descubramos juntos.",
    "✨ Tu sonrisa es mi debilidad y tu felicidad es mi prioridad número uno.",
    "✨ Quererte es fácil, pero demostrártelo cada día es mi pasatiempo favorito.",
    "✨ Desde que estás en mi vida, el cielo se ve un poco más azul y la vida más bonita."
];

function obtenerPerfilLocal(userId, pushname) {
    if (!memoriaUsuarios[userId]) {
        memoriaUsuarios[userId] = {
            userId, name: pushname || 'Usuario', coins: 500, bank: 1000, gems: 0,
            level: 1, xp: 0, lastDaily: 0, lastWork: 0, lastMinar: 0, lastCrimen: 0, asegurado: false
        };
    }
    return memoriaUsuarios[userId];
}

function obtenerGrupoLocal(groupId) {
    if (!memoriaGrupos[groupId]) {
        memoriaGrupos[groupId] = {
            groupId, welcome: false, bye: false, modoAdmin: false,
            welcomeText: "✨ ¡Hola @user! Bienvenido(a) al grupo. Pásala genial y respeta las reglas. 🥳👑",
            byeText: "👋 Un miembro menos... @user se ha retirado. ¡Que te vaya bien! ✨",
            msgPersonalizado: "✨ *MENSAJE CORPORATIVO KORI BOT* ✨\n\n💻 Desarrollador Oficial: DEYVI A.O.C\n📞 Soporte Técnico: +51 900834505\n💬 ¡Escríbenos si tienes dudas o reportes!"
        };
    }
    return memoriaGrupos[groupId];
                }
listaFrasesAmor.push(
    "✨ Eres todo lo que está bien en este mundo lleno de caos.",
    "✨ No hay distancia que pueda borrar lo que siento por ti cada segundo.",
    "✨ Te elegiría en esta vida y en las siguientes cien vidas que tuviera.",
    "✨ Tu amor es el motor que me impulso a ser una mejor versión de mí.",
    "✨ No importa el lugar, si es contigo, sé que estoy en el sitio correcto.",
    "✨ Me enamoré de tu mente, de tus risas y de la forma en que ves la vida.",
    "✨ Eres mi principio, mi medio y mi fin de cada pensamiento del día.",
    "✨ La felicidad tiene un nombre de cinco letras en mi vida, y eres tú.",
    "✨ Si pudiera regalarte algo, te regalaría un espejo para que veas lo increíble que eres.",
    "✨ A tu lado aprendí lo que realmente significa querer sin condiciones.",
    "✨ Eres la respuesta a todas las preguntas bonitas que le hice al universo.",
    "✨ Tu voz es mi sonido favorito y tus ojos mi paisaje preferido.",
    "✨ Qué bonito es saber que existes y que tengo la dicha de compartir contigo.",
    "✨ Eres el refugio perfecto donde siempre quiero regresar a descansar.",
    "✨ Te amo por el pasado que dejamos atrás, el presente que vivimos y el futuro que crearemos.",
    "✨ Eres mi sol en los días nublados y mi abrigo en las noches frías.",
    "✨ Mi felicidad se resume en verte sonreír y saber que estás bien.",
    "✨ Eres esa persona que llegó de la nada y se convirtió en mi todo.",
    "✨ Contigo no me da miedo el futuro, porque sé que cualquier tormenta la pasaremos juntos.",
    "✨ No hay un solo día en que no agradezca haber cruzado miradas contigo.",
    "✨ Eres el secreto mejor guardado de mi corazón y mi orgullo más grande.",
    "✨ Me encanta saber que entre tanta gente del mundo, nos elegimos nosotros.",
    "✨ Eres la razón por la que creo en las segundas oportunidades de la vida.",
    "✨ No te cambio por nadie, porque nadie me hace sentir la magia que tú desprendes.",
    "✨ Eres, fuiste y siempre serás el amor de mi vida entera."
);

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

        // 📥 CAPTURADOR MEJORADO: Captura stickers en el grupo de respaldo automáticamente
        if (chat.isGroup && (chatNameLower.includes("banco") || chatNameLower.includes("respaldo") || chatNameLower.includes("sticker"))) {
            const tag = body.toLowerCase();
            if (msg.type === 'sticker') {
                try {
                    const media = await msg.downloadMedia();
                    if (media) {
                        if (tag.includes('#amor')) { bancoStickers.amor.push(media); }
                        else { bancoStickers.random.push(media); }
                    }
                } catch (e) { console.log("Error de procesamiento de sticker"); }
                return;
            }
        }

        // RESPUESTAS AUTOMÁTICAS CUANDO TE MENCIONAN
        if (!body.startsWith('.') && !body.toLowerCase().startsWith('aviso')) {
            if (body.toLowerCase().includes('bot') || (msg.mentionedIds && msg.mentionedIds.includes(client.info.wid._serialized))) {
                const frasesBot = [
                    `¿Qué pasó, ${username}? Aquí estoy online y listo. Pon *.menu* para ver mis opciones. 😎`,
                    `¿Me llamaste, crack? Pon *.menu* para empezar la diversión. 🔥`,
                    `Presente. Ejecutando procesos al 100% de velocidad estable. ⚡`,
                    `¿Quién invoca al rey del servidor? Hola, ${username}. 👋`
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
        const gConfig = chat.isGroup ? obtenerGrupoLocal(chat.id._serialized) : null;

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
                
                const menuTexto = `✨ ╔════════════════════════╗ ✨
       👑  *KORI BOT - EXECUTIVE* ✨ ╚════════════════════════╝ ✨

👤 *Usuario:* \`${username.toUpperCase()}\`
⏱️ *Uptime:* \`${hours}h ${minutes}m\`
⚡ *Status:* \`Memoria Local Activa (Estable) 🟢\`

────────────────────────────
📊 *STATUS & SISTEMA*
────────────────────────────
📝 ➪ \`.owner\` ── Info del desarrollador oficial
⚡ ➪ \`.ping\` ── Verificar latencia del sistema
🕒 ➪ \`.uptime\` ── Tiempo de actividad continua

🛡️ *ADMINISTRACIÓN & SEGURIDAD*
────────────────────────────
📣 ➪ \`.todos <txt>\` ── Mencionar a todos los miembros
📢 ➪ \`aviso\` ── Comunicado oficial con imagen
🚷 ➪ \`.kick @user\` ── Remover miembro del grupo
🚪 ➪ \`.welcome on/off/texto\` ── Mensaje de Bienvenida
👋 ➪ \`.bye on/off/texto\` ── Mensaje de Despedida
⚙️ ➪ \`.modoadmin on/off\` ── Exclusividad para admins
📝 ➪ \`.editmsg <texto>\` ── Cambiar info del comando \`.vermsg\`
📋 ➪ \`.vermsg\` ── Envía los datos fijados del grupo

🎰 *MINIJUEGOS & ECONOMÍA LOCAL*
────────────────────────────
📇 ➪ \`.perfil\` ── Ver tu saldo y nivel actual
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
🤡 ➪ \`.stickerazar\` ── Sticker variado aleatorio
💖 ➪ \`.stickeramor\` ── Sticker romántico interactivo
❤️ ➪ \`.frasestexto\` ── Lanza una de las 50 Frases de Amor

🎮 *ÁREA DE CAMPAÑA FREE FIRE*
────────────────────────────
🏆 ➪ \`.4vs4\` | \`.6v6\` | \`.8vs8\` | \`.12vs12\`
🔑 ➪ \`.sala\` ── Plantilla para organizar salas

────────────────────────────
💻 *DATOS DEL PROGRAMADOR & SOPORTE*
────────────────────────────
👑 *Creador Principal:* DEYVI A.O.C
📞 *Contacto / WhatsApp:* +51 900834505

✨ ─── \`By: DEYVI A.O.C\` ─── ✨`;
                await msg.reply(menuTexto);
                break;

            case 'editmsg':
                if (!chat.isGroup || !isAdmin) return msg.reply('❌ Comando exclusivo de administradores.');
                const contenidoMensaje = args.join(' ');
                if (!contenidoMensaje) return msg.reply('❌ Uso: `.editmsg Texto aquí`');
                gConfig.msgPersonalizado = contenidoMensaje;
                await msg.reply('✅ Mensaje guardado en el sistema.');
                break;

            case 'vermsg':
                if (!chat.isGroup) return;
                await msg.reply(gConfig.msgPersonalizado);
                break;

            case 'modoadmin':
                if (!chat.isGroup || !isAdmin) return;
                if (args[0] === 'on') { gConfig.modoAdmin = true; await msg.reply('🔒 Modo Admin Activo.'); }
                else if (args[0] === 'off') { gConfig.modoAdmin = false; await msg.reply('🔓 Modo Admin Inactivo.'); }
                break;

            case 'kick':
                if (!chat.isGroup || !isAdmin) return;
                if (!msg.mentionedIds.length) return msg.reply('❌ Menciona al usuario.');
                try {
                    for (let target of msg.mentionedIds) { await chat.removeParticipants([target]); }
                    await msg.reply('🔨 Miembro removido.');
                } catch (e) { await msg.reply('❌ Error de jerarquía de administrador.'); }
                break;

            case 'welcome':
                if (!chat.isGroup || !isAdmin) return;
                if (args[0] === 'on') gConfig.welcome = true;
                else if (args[0] === 'off') gConfig.welcome = false;
                else if (args[0] === 'texto') gConfig.welcomeText = args.slice(1).join(' ');
                await msg.reply('📝 Configuración de bienvenida cambiada.');
                break;

            case 'bye':
                if (!chat.isGroup || !isAdmin) return;
                if (args[0] === 'on') gConfig.bye = true;
                else if (args[0] === 'off') gConfig.bye = false;
                else if (args[0] === 'texto') gConfig.byeText = args.slice(1).join(' ');
                await msg.reply('📝 Configuración de despedida cambiada.');
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
                const perf = obtenerPerfilLocal(userId, username);
                await msg.reply(`📇 *\`KORI PROFILE\`*\n\n👤 *Nombre:* ${perf.name}\n📈 *Nivel:* ${perf.level}\n💰 *Bolsillo:* $${perf.coins}\n🏦 *Banco:* $${perf.bank}\n💎 *Gemas:* ${perf.gems}\n🛡️ *Seguro:* ${perf.asegurado ? 'ACTIVO ✅' : 'INACTIVO ❌'}`);
                break;

            case 'trabajar':
                const pW = obtenerPerfilLocal(userId, username);
                if (Date.now() - pW.lastWork < 300000) return msg.reply('⏳ Estás agotado. Descansa 5 minutos.');
                const sueldo = Math.floor(Math.random() * 250) + 150; pW.coins += sueldo; pW.lastWork = Date.now(); pW.asegurado = false;
                await msg.reply(`💰 Trabajaste duro y ganaste *$${sueldo} monedas*.`);
                break;

            case 'daily':
                const pD = obtenerPerfilLocal(userId, username);
                if (Date.now() - pD.lastDaily < 86400000) return msg.reply('❌ Ya reclamaste tu bono diario.');
                pD.coins += 1000; pD.lastDaily = Date.now(); pD.asegurado = false;
                await msg.reply('🎁 *DIARIO:* Sumaste *$1,000 monedas*.');
                break;

            case 'ruleta':
            case 'slot':
                const pRul = obtenerPerfilLocal(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Ingresa una cantidad válida.');
                const ap = parseInt(args[0]);
                if (pRul.coins < ap || ap <= 0) return msg.reply('❌ No tienes suficientes monedas.');
                pRul.asegurado = false;
                if (Math.random() >= 0.5) { pRul.coins += ap; await msg.reply(`🎰 *¡GANASTE!:* Duplicaste tu apuesta. +$${ap}.`); } 
                else { pRul.coins -= ap; await msg.reply(`🎰 *PERDISTE:* La mesa gana. -$${ap}.`); }
                break;

            case 'tragamonedas':
                const pSlot = obtenerPerfilLocal(userId, username);
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
                await msg.reply(resS);
                break;

            case 'ruletarusa':
                if (Math.floor(Math.random() * 6) === 0) {
                    await msg.reply('💥 *¡PUMMMMMM!* Bala en la recámara. Has muerto. 💀');
                    if (chat.isGroup && !isAdmin) { try { await chat.removeParticipants([userId]); } catch (e) {} }
                } else { await msg.reply('🛡️ *¡CLIC!* Tambor vacío. Has sobrevivido.'); }
                break;

            case 'robar':
                if (!chat.isGroup || !msg.mentionedIds.length) return msg.reply('❌ Menciona a quién robar.');
                const ladron = obtenerPerfilLocal(userId, username); const vId = msg.mentionedIds[0];
                if (userId === vId) return;
                const vCont = await client.getContactById(vId); const victima = obtenerPerfilLocal(vId, vCont.pushname);
                if (victima.coins <= 50) return msg.reply('❌ El objetivo está en la quiebra.');
                if (victima.asegurado) { victima.asegurado = false; ladron.coins = Math.max(0, ladron.coins - 100); return await chat.sendMessage(`🚨 *ALERTA:* @${sender.id.user} rebotó contra el escudo de @${vCont.id.user}. Multa de $100.`, { mentions: [sender, vCont] }); }
                if (Math.random() >= 0.5) { const rob = Math.floor(Math.random() * (victima.coins * 0.3)) + 20; victima.coins -= rob; ladron.coins += rob; await chat.sendMessage(`🦹‍♂️ *ÉXITO:* @${sender.id.user} asaltó con éxito a @${vCont.id.user} llevándose *$${rob}*.`, { mentions: [sender, vCont] }); }
                else { ladron.coins = Math.max(0, ladron.coins - 80); await chat.sendMessage(`👮‍♂️ *FALLO:* Te agarró la ley. Penalización de $80 para @${sender.id.user}.`, { mentions: [sender] }); }
                break;

            case 'asegurar':
                const uAs = obtenerPerfilLocal(userId, username);
                if (uAs.coins < 50) return msg.reply('❌ Requiere $50 monedas.');
                uAs.coins -= 50; uAs.asegurado = true;
                await msg.reply('🛡️ Seguro anti-robos activado.');
                break;

            case 'blackjack':
                const pBj = obtenerPerfilLocal(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Digita el valor.');
                const aB = parseInt(args[0]);
                if (pBj.coins < aB || aB <= 0) return msg.reply('❌ Saldo insuficiente.');
                const tP = Math.floor(Math.random() * 12) + 10; const bP = Math.floor(Math.random() * 11) + 11;
                if (tP > 21) { pBj.coins -= aB; await msg.reply(`🃏 Te pasaste con \`${tP}\`. Perdiste *$${aB}*.`); }
                else if (bP > 21 || tP > bP) { pBj.coins += aB; await msg.reply(`🃏 ¡Victoria! Lograste \`${tP}\` contra \`${bP}\` de la casa. +$${aB}.`); }
                else { pBj.coins -= aB; await msg.reply(`🃏 Derrota. La casa plantó \`${bP}\` frente a tu \`${tP}\`. -$${aB}.`); }
                break;

            case 'dados':
                const pDd = obtenerPerfilLocal(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Digita la apuesta.');
                const aD = parseInt(args[0]);
                if (pDd.coins < aD || aD <= 0) return msg.reply('❌ Balance insuficiente.');
                const dU = Math.floor(Math.random() * 6) + 1; const dB = Math.floor(Math.random() * 6) + 1;
                if (dU > dB) { pDd.coins += aD; await msg.reply(`🎲 Tu dado: \`${dU}\` vs Bot: \`${dB}\`. ¡Ganaste *$${aD}*!`); }
                else if (dU < dB) { pDd.coins -= aD; await msg.reply(`🎲 Tu dado: \`${dU}\` vs Bot: \`${dB}\`. ¡Perdiste *$${aD}*!`); }
                else { await msg.reply(`🎲 Empate a \`${dU}\`. Fondos devueltos.`); }
                break;

            case 'desafio':
                if (!chat.isGroup || !msg.mentionedIds.length || !args[1] || isNaN(args[1])) return msg.reply('❌ Uso: `.desafio @user 100`');
                const d1 = obtenerPerfilLocal(userId, username); const d2Id = msg.mentionedIds[0];
                if (userId === d2Id) return;
                const cD2 = await client.getContactById(d2Id); const d2 = obtenerPerfilLocal(d2Id, cD2.pushname);
                const pz = parseInt(args[1]);
                if (d1.coins < pz || d2.coins < pz || pz <= 0) return msg.reply('❌ Saldo insuficiente en alguna cuenta.');
                if (Math.random() >= 0.5) { d1.coins += pz; d2.coins -= pz; await chat.sendMessage(`⚔️ @${sender.id.user} venció en combate a @${cD2.id.user} ganando *$${pz}*.`, { mentions: [sender, cD2] }); }
                else { d2.coins += pz; d1.coins -= pz; await chat.sendMessage(`⚔️ @${cD2.id.user} ganó el encuentro y cobró *$${pz}* de @${sender.id.user}.`, { mentions: [sender, cD2] }); }
                break;

            case 'minar':
                const pM = obtenerPerfilLocal(userId, username);
                if (Date.now() - pM.lastMinar < 600000) return msg.reply('⏳ Herramientas calientes. Espera 10 minutos.');
                pM.lastMinar = Date.now();
                if (Math.random() >= 0.7) { pM.gems += 2; await msg.reply('⛏️💎 Encontraste **2 Gemas Preciosas**.'); }
                else { const min = Math.floor(Math.random() * 300) + 100; pM.coins += min; await msg.reply(`⛏️ Extrajiste carbón comercial. Valor: +$${min}.`); }
                break;

            case 'crimen':
                const pCr = obtenerPerfilLocal(userId, username);
                if (Date.now() - pCr.lastCrimen < 900000) return msg.reply('🕵️‍♂️ Zona caliente. Espera 15 minutos.');
                pCr.lastCrimen = Date.now();
                if (Math.random() >= 0.6) { const gp = Math.floor(Math.random() * 800) + 400; pCr.coins += gp; await msg.reply(`🦹‍♂️💰 Éxito de infiltración. Recompensa: *$${gp}*.`); }
                else { pCr.coins = Math.max(0, pCr.coins - 200); await msg.reply('🚓 Fuiste arrestado. Fianza obligatoria: *$200*.'); }
                break;

            case 'invertir':
                const pIv = obtenerPerfilLocal(userId, username);
                if (!args.length || isNaN(args[0])) return msg.reply('❌ Digita el capital.');
                const cIv = parseInt(args[0]);
                if (pIv.coins < cIv || cIv <= 0) return msg.reply('❌ Saldo insuficiente.');
                if (Math.random() >= 0.45) { const rI = Math.floor(cIv * 2.2); pIv.coins += rI; await msg.reply(`📈 Mercado alcista. Ganancia del 120%: +$${rI}.`); }
                else { pIv.coins -= cIv; await msg.reply(`📉 Mercado bajista. Pérdida completa de *$${cIv}*.`); }
                break;

            case 'cofre':
                if (!isAdmin) return;
                cofreActivo.activo = true; cofreActivo.monedas = Math.floor(Math.random() * 1500) + 500;
                await chat.sendMessage('📦🎁 *¡COFRE EXCLUSIVO DROP EN EL GRUPO!* 🎁📦\nColoca de inmediato el comando *.abricofre* para reclamarlo.');
                break;

            case 'abricofre':
                if (!cofreActivo.activo) return msg.reply('❌ No hay cofres disponibles.');
                const pCf = obtenerPerfilLocal(userId, username); pCf.coins += cofreActivo.monedas;
                await chat.sendMessage(`🎉🥳 @${sender.id.user} abrió el cofre y ganó *$${cofreActivo.monedas}* monedas!`, { mentions: [sender] });
                cofreActivo.activo = false;
                break;

            case 'ppt':
                const pPp = obtenerPerfilLocal(userId, username);
                if (!args[0] || isNaN(args[0]) || !args[1]) return msg.reply('❌ Formato: `.ppt 50 piedra`');
                const aP = parseInt(args[0]); const jU = args[1].toLowerCase();
                if (pPp.coins < aP || aP <= 0) return msg.reply('❌ Fondos suficientes.');
                if (!['piedra', 'papel', 'tijera'].includes(jU)) return msg.reply('❌ Elige piedra, papel o tijera.');
                const ops = ['piedra', 'papel', 'tijera']; const jB = ops[Math.floor(Math.random() * 3)];
                let rP = `🎮 Elección: \`${jU}\` | Bot: \`${jB}\`\n`;
                if (jU === jB) { await msg.reply(rP + '👔 Empate.'); }
                else if ((jU==='piedra'&&jB==='tijera') || (jU==='papel'&&jB==='piedra') || (jU==='tijera'&&jB==='papel')) { pPp.coins += aP; await msg.reply(rP + `🏆 Ganaste *$${aP}*.`); }
                else { pPp.coins -= aP; await msg.reply(rP + `📉 Perdiste *$${aP}*.`); }
                break;

            case 'pelear':
                if (!chat.isGroup || !msg.mentionedIds.length) return msg.reply('❌ Menciona a tu oponente.');
                const rtd = obtenerPerfilLocal(userId, username); const rvId = msg.mentionedIds[0];
                if (userId === rvId) return;
                const rvC = await client.getContactById(rvId); const rvl = obtenerPerfilLocal(rvId, rvC.pushname);
                const bt = Math.floor(Math.random() * 100) + 50;
                await msg.reply(`🥊 ¡Pelea iniciada entre @${sender.id.user} y @${rvC.id.user}...`);
                setTimeout(async () => {
                    if (Math.random() >= 0.5) { rtd.coins += bt; rvl.coins = Math.max(0, rvl.coins - bt); await chat.sendMessage(`🏆 @${sender.id.user} ganó el combate. +$${bt}.`, { mentions: [sender, rvC] }); }
                    else { rvl.coins += bt; rtd.coins = Math.max(0, rtd.coins - bt); await chat.sendMessage(`🏆 @${rvC.id.user} ganó el combate. +$${bt}.`, { mentions: [sender, rvC] }); }
                }, 1500);
                break;

            case 'frasestexto':
                const fraseElegida = listaFrasesAmor[Math.floor(Math.random() * listaFrasesAmor.length)];
                await msg.reply(fraseElegida);
                break;

            case 'stickerazar':
                if (bancoStickers.random.length === 0) return msg.reply('📦 El banco de respaldo está vacío por ahora. Envía stickers al grupo de respaldo.');
                await chat.sendMessage(bancoStickers.random[Math.floor(Math.random() * bancoStickers.random.length)], { sendMediaAsSticker: true });
                break;

            case 'stickeramor':
                if (bancoStickers.amor.length === 0) return msg.reply('📦 El banco no registra stickers con el tag #amor.');
                await chat.sendMessage(bancoStickers.amor[Math.floor(Math.random() * bancoStickers.amor.length)], { sendMediaAsSticker: true });
                break;

            case 'chapar':
                if (!chat.isGroup || !msg.mentionedIds.length) return;
                const bC = await client.getContactById(msg.mentionedIds[0]);
                await chat.sendMessage(`💋 @${sender.id.user} le dio un beso a @${bC.id.user}. 💕`, { mentions: [sender, bC] });
                break;

            case 'matar':
                if (!chat.isGroup || !msg.mentionedIds.length) return;
                const rC = await client.getContactById(msg.mentionedIds[0]);
                await chat.sendMessage(`☠️ @${sender.id.user} eliminó a @${rC.id.user}. 🎯`, { mentions: [sender, rC] });
                break;

            case 'crush':
                if (!chat.isGroup) return;
                const mbs = chat.participants;
                if (!msg.mentionedIds.length) {
                    const u1 = mbs[Math.floor(Math.random() * mbs.length)].id.user;
                    let u2 = mbs[Math.floor(Math.random() * mbs.length)].id.user;
                    while (u1 === u2) u2 = mbs[Math.floor(Math.random() * mbs.length)].id.user;
                    const c1 = await client.getContactById(u1 + '@c.us'); const c2 = await client.getContactById(u2 + '@c.us');
                    await chat.sendMessage(`💘 *CUPIDO:* @${u1} x @${u2} ── \`100% Compatibles\` 😍`, { mentions: [c1, c2] });
                } else {
                    const oC = await client.getContactById(msg.mentionedIds[0]); const pr = Math.floor(Math.random() * 100) + 1;
                    await chat.sendMessage(`💕 *COMPATIBILIDAD:* @${sender.id.user} x @${oC.id.user} ── \`${pr}%\` 🔥`, { mentions: [sender, oC] });
                }
                break;

            case 'rey':
                const ry = chat.participants[Math.floor(Math.random() * chat.participants.length)].id.user;
                const cRy = await client.getContactById(ry + '@c.us');
                await chat.sendMessage(`👑 *DECRETO:* Rey del grupo: @${ry} ✨`, { mentions: [cRy] });
                break;

            case 'gay':
                const gy = chat.participants[Math.floor(Math.random() * chat.participants.length)].id.user;
                const cGy = await client.getContactById(gy + '@c.us');
                await chat.sendMessage(`🌈 *SCANNER:* @${gy} registra \`${Math.floor(Math.random() * 100) + 1}%\` 💅`, { mentions: [cGy] });
                break;

            case 'suerte':
                if (!args.length) return msg.reply('❌ Añade tu pregunta.');
                const rps = ["🔮 Absolutamente Sí. ✅", "🔮 Las probabilidades dicen que No. ❌", "🔮 El destino es incierto. 🌀"];
                await msg.reply(rps[Math.floor(Math.random() * rps.length)]);
                break;

            case 'owner':
            case 'creador':
            case '4vs4':
            case '6vs6':
            case '8vs8':
            case '12vs12':
            case 'sala':
            case 'uptime':
            case 'ping':
            case 's':
            case 'sticker':
                if (command === 'owner' || command === 'creador') await msg.reply(`👤 *Líder:* DEYVI A.O.C\n📞 *Soporte:* +51 900834505`);
                if (['4vs4','6vs6','8vs8','12vs12'].includes(command)) await msg.reply(`🎮 *CAMPAMENTO FF:* @everyone ¡Versus activo *${command.toUpperCase()}*!`);
                if (command === 'sala') await msg.reply('🔑 *SALA DE COMPETENCIA:* Armando parámetros...');
                if (command === 'uptime') await msg.reply(`⏱️ *Uptime:* ${Math.floor(Math.abs(new Date() - startTime) / (1000 * 60 * 60))} horas.`);
                if (command === 'ping') await msg.reply('🚀 *Latency:* ¡Pong! Sistema estable.');
                if (command === 's' || command === 'sticker') {
                    if (msg.hasMedia || (msg.hasQuotedMsg && (await msg.getQuotedMessage()).hasMedia)) {
                        try {
                            const m = msg.hasMedia ? msg : await msg.getQuotedMessage();
                            const media = await m.downloadMedia();
                            if (media) await chat.sendMessage(media, { sendMediaAsSticker: true, stickerName: "KORI EXECUTIVE 🤖", stickerAuthor: "DEYVI A.O.C ✨" });
                        } catch (e) { await msg.reply('❌ Error al renderizar.'); }
                    } else { await msg.reply('❌ Responde a una imagen.'); }
                }
                break;

            default:
                break;
        }
    } catch (error) { console.log('Error interceptado:', error); }
}

function vincularEventosEspeciales(client) {
    client.on('group_join', async (notification) => {
        try {
            const chat = await notification.getChat();
            const contact = await client.getContactById(notification.recipientIds[0]);
            const config = obtenerGrupoLocal(chat.id._serialized);
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
            const config = obtenerGrupoLocal(chat.id._serialized);
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
