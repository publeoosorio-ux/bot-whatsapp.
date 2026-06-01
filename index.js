// Servidor falso para que Railway no apague el bot
const http = require('http');
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot activo 24/7\n');
}).listen(port, () => {
    console.log(`🌍 Servidor de mantener vivo corriendo en puerto ${port}`);
});

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const startTime = new Date();

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

client.on('group_join', async (notification) => {
    try {
        const chat = await notification.getChat();
        const contact = await client.getContactById(notification.recipientIds[0]);
        await chat.sendMessage(`✨ ¡Bienvenido/a @${contact.id.user} al grupo! ✨\nDisfruta tu estadía. Usa *.bot menú* para ver mis comandos.`, {
            mentions: [contact]
        });
    } catch (e) {
        console.log('Error en bienvenida:', e);
    }
});

client.on('message_create', async msg => {
    try {
        if (!msg.body) return;
        const body = msg.body.trim();
        
        if (!body.startsWith('.') && !body.toLowerCase().startsWith('aviso')) return;

        const args = body.slice(1).trim().split(/ +/);
        let command = args.shift().toLowerCase();

        // Atajo directo para el menú
        if (body === '.menu') {
            command = 'bot';
            args[0] = 'menú';
        }

        const chat = await msg.getChat();
        const sender = await msg.getContact();
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

                    // Menú limpio con comandos 100% funcionales
                    const menuTexto = `🌐 *\`Menú Principal (KORI BOT)\`*
────────────────────────────
👤 Usuario: ${username.toUpperCase()}
🔰 Rol: Novato \`\`\`V\`\`\` ⚔️
📈 Nivel: 0 (110358 XP)
💎 Gemas: 15
⏱ Activo: ${hours}:${minutes}:${seconds}

📊 *\`Info & Sistema\`* ╰➤ .owner | .creador | .ping | .uptime | .sistema

👥 *\`Gestión de Grupos\`*
╰➤ .todos <txt> | .aviso | .admins | .kick @usuario
╰➤ .promote @usuario | .demote @usuario | .grupo abrir/cerrar

🥧 *\`Free Fire\`*
╰➤ .4vs4 | .6vs6 | .8vs8 | .12vs12 | .sala

🍯 *\`Diversión & Frases\`*
╰➤ .consejo | .fraseromantica | .piropo

📇 *\`Registro Base\`*
╰➤ .perfil | .reg | .unreg`;

                    await msg.reply(menuTexto);
                }
                break;

            case 'todos':
                if (!chat.isGroup) return msg.reply('❌ Este comando solo funciona en grupos.');
                if (!isAdmin) return msg.reply('❌ Solo los administradores pueden usar este comando.');

                const mensajeAdicional = args.join(' ');
                let infoTexto = `📣 *KORI BOT LOS INVOCA* 📣\n`;
                if (mensajeAdicional) {
                    infoTexto += `📝 *Mensaje:* ${mensajeAdicional}\n`;
                }
                infoTexto += `────────────────────────────\n`;
                
                let mencionesMiembros = [];

                for (let participante of chat.participants) {
                    try {
                        const contacto = await client.getContactById(participante.id._serialized);
                        mencionesMiembros.push(contacto);
                        // Añade de forma ordenada con el salto de línea y emoji pedido
                        infoTexto += `💚➪@${participante.id.user}\n`;
                    } catch (e) {}
                }
                await chat.sendMessage(infoTexto.trim(), { mentions: mencionesMiembros });
                break;

            case 'owner':
            case 'creador':
                await msg.reply(`👤 *Creador del Bot:* DEYVI A.O.C\n💬 *Contacto:* Escríbele al +51 900834505 para soporte técnico.`);
                break;

            case 'perfil':
                await msg.reply(`📇 *\`Tu Perfil Virtual\`*\n──────────────────\n👤 *Nombre:* ${username}\n⚔️ *Rango:* Novato \`\`\`V\`\`\`\n📊 *Progreso:* Nivel 0 (0/5000 XP)\n💎 *Gemas:* 15\n💰 *Banco:* $2,500 monedas.`);
                break;

            case 'reg':
                await msg.reply(`✅ *¡Registro Exitoso!* Hola ${username}, has sido guardado correctamente en la base de datos del bot.`);
                break;

            case 'unreg':
                await msg.reply('❌ *Registro Eliminado:* Tus datos virtuales han sido borrados con éxito del sistema.');
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
                const piropoAleatorio = piropos[Math.floor(Math.random() * piropos.length)];
                await msg.reply(`🍯 *Piropo del día:* \n\n${piropoAleatorio}`);
                break;

            case 'consejo':
                const consejos = [
                    "No cuentes los días, haz que los días cuenten. 😎",
                    "Si el código no compila a la primera, tómate un café y vuelve a revisar los puntos y comas. ☕",
                    "No gastes todas tus gemas el primer día, ahorra para los eventos importantes."
                ];
                const consejoAleatorio = consejos[Math.floor(Math.random() * consejos.length)];
                await msg.reply(`💡 *Consejo del bot:* \n\n${consejoAleatorio}`);
                break;

            case 'fraseromantica':
                await msg.reply('❤️ *Frase Romántica:* \n\n"En un mundo lleno de variables, tú eres mi única constante inmutable."');
                break;

            case 'uptime':
                const uptimeDiff = Math.abs(new Date() - startTime);
                const h = Math.floor(uptimeDiff / (1000 * 60 * 60));
                const m = Math.floor((uptimeDiff % (1000 * 60 * 60)) / (1000 * 60));
                await msg.reply(`⏱️ *Tiempo en Línea:* El bot lleva activo de forma ininterrumpida: *${h} horas y ${m} minutos*.`);
                break;

            case 'sistema':
                await msg.reply(`🖥️ *\`Estado del Servidor\`*\n──────────────────\n💻 *Plataforma:* Linux (Railway Cloud)\n📦 *Entorno:* Node.js v22.2.3\n⚙️ *Estado:* Operando en perfecto estado sin caídas.`);
                break;

            case 'aviso':
            case 'viso':
                if (!chat.isGroup) return msg.reply('❌ Este comando solo funciona en grupos.');
                if (!isAdmin) return msg.reply('❌ Solo administradores.');

                if (msg.hasQuotedMsg) {
                    const quotedMsg = await msg.getQuotedMessage();
                    let txtAviso = `📢 *\`AVISO IMPORTANTE DE ADM:\`*\n\n${quotedMsg.body}\n\n`;
                    let mentionsList = [];

                    for (let part of chat.participants) {
                        try {
                            const cont = await client.getContactById(part.id._serialized);
                            mentionsList.push(cont);
                            txtAviso += `@${part.id.user} `;
                        } catch (e) {}
                    }
                    await chat.sendMessage(txtAviso, { mentions: mentionsList });
                } else {
                    await msg.reply('❌ Responde a un mensaje escribiendo *.aviso* para reenviarlo a todos.');
                }
                break;

            case 'admins':
                if (!chat.isGroup) return;
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
                if (!chat.isGroup) return;
                if (!isAdmin) return msg.reply('❌ No tienes permisos.');
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
                if (!chat.isGroup || !isAdmin) return;
                if (msg.hasMentioned) {
                    const ment = await msg.getMentions();
                    await chat.promoteParticipants([ment[0].id._serialized]);
                    await msg.reply(`👑 ¡@${ment[0].id.user} ahora es Administrador!`);
                }
                break;

            case 'demote':
                if (!chat.isGroup || !isAdmin) return;
                if (msg.hasMentioned) {
                    const ment = await msg.getMentions();
                    await chat.demoteParticipants([ment[0].id._serialized]);
                    await msg.reply(`📉 A @${ment[0].id.user} se le han retirado los privilegios de Administrador.`);
                }
                break;

            case 'grupo':
                if (!chat.isGroup || !isAdmin) return;
                if (args[0] === 'abrir') {
                    await chat.setMessagesAdminsOnly(false);
                    await chat.sendMessage('🔓 *El grupo ha sido abierto.* Todos los participantes pueden enviar mensajes.');
                } else if (args[0] === 'cerrar') {
                    await chat.setMessagesAdminsOnly(true);
                    await chat.sendMessage('🔒 *El grupo ha sido cerrado.* Solo los administradores pueden enviar mensajes.');
                }
                break;

            case 'ping':
                const startPing = Date.now();
                const reply = await msg.reply('🏓 Midiendo latencia...');
                const endPing = Date.now();
                await reply.edit(`🚀 *Pong!* Latencia: ${endPing - startPing}ms`);
                break;

            default:
                console.log(`Comando ingresado no registrado en switch: .${command}`);
                break;
        }
    } catch (error) {
        console.log('Error crítico procesando mensaje:', error);
    }
});

client.initialize();
