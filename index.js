const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const startTime = new Date();

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        // Se eliminó la ruta de Termux para que sea compatible con la nube
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-extensions',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
        ]
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    // Esto genera un link en tus logs de Railway
    console.log('====================================');
    console.log('🔗 SACA EL QR DESDE ESTE ENLACE:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
    console.log('====================================');
});

client.on('ready', () => {
    console.log('¡El Bot está completamente en línea y respondiendo!');
});

client.on('group_join', async (notification) => {
    const chat = await notification.getChat();
    const contact = await client.getContactById(notification.recipientIds[0]);
    await chat.sendMessage(`✨ ¡Bienvenido/a @${contact.id.user} al grupo! ✨\nDisfruta tu estadía. Usa *.bot menú* para ver mis comandos.`, {
        mentions: [contact]
    });
});

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const body = msg.body.trim();
    
    if (!body.startsWith('.') && !body.toLowerCase().startsWith('aviso')) return;

    const args = body.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

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

                const menuTexto = `🌐 *\`Menú Principal\`*
────────────────────────────
👤 Usuario: ${username.toUpperCase()}
🔰 Rol: Novato \`\`\`V\`\`\` ⚔️
📈 Nivel: 0 (110358 XP)
💎 Gemas: 15
⏱ Activo: ${hours}:${minutes}:${seconds}

📊 *\`Info\`* ╰➤ .owner | .creador | .ds | .fixmsgespera | .ping
╰➤ .botetiquetas | .report | .uptime | .sistema
╰➤ .sugerencia | .totalf | .horario

⚙ *\`On/Off\`*
╰➤ .enable opción | .disable opción

⬇ *\`Download\`*
╰➤ .apk | .audio | .ig | .mediafire | .mega | .pindl
╰➤ .playstore | .spotify | .tiktok | .ytmp3 | .ytmp4
╰➤ .deezer <búsqueda> | .capcut

🔍 *\`Search\`*
╰➤ .appstore | .pinterest | .githubsearch | .tiktoksearch
╰➤ .spotifysearch | .pornhubsearch | .xnxxsearch | .yts

💭 *\`Inteligencias\`*
╰➤ .aimath | .flux | .ai | .luminai | .polli

🥧 *\`Free Fire\`*
╰➤ .4vs4 | .6vs6 | .8vs8 | .12vs12 | .sala

🍯 *\`Frases\`*
╰➤ .consejo | .fraseromantica | .piropo

🪾 *\`Convertidores\`*
╰➤ .toptt | .toimg | .tovideo

🧰 *\`Tools\`*
╰➤ .removebg | .cccheck | .font | .hd | .remini | .traductor
╰➤ .react <emoji> | .reenviar | .ssweb | .tourl | .whatmusic

👥 *\`Grupos\`*
╰➤ .add <numero> | .admins | .grouptime | .delete | .demote
╰➤ .encuesta | .Aviso | .kick | .link | .mute | .unmute
╰➤ .promote | .grupo abrir/cerrar | .todos <txt>

💰 *\`RPG\`*
╰➤ .ruleta | .bank | .pelear | .diamantes | .cofre | .work

📇 *\`Registro\`*
╰➤ .perfil | .reg | .unreg | .setdesc

⚒ *\`Owner\`*
╰➤ .addowner | .banchat | .block | .restart | .update`;

                await chat.sendMessage(menuTexto);
            }
            break;

        case 'todos':
            if (!chat.isGroup) return msg.reply('❌ Este comando solo funciona en grupos.');
            if (!isAdmin) return msg.reply('❌ Solo los administradores pueden usar este comando.');

            let infoTexto = `📢 *MENSAJE GENERAL:* ${args.join(' ')}\n\n`;
            let mencionesMiembros = [];

            for (let participante of chat.participants) {
                const contacto = await client.getContactById(participante.id._serialized);
                mencionesMiembros.push(contacto);
                infoTexto += `@${participante.id.user} `;
            }
            await chat.sendMessage(infoTexto, { mentions: mencionesMiembros });
            break;

        case 'aviso':
            if (!chat.isGroup) return msg.reply('❌ Este comando solo funciona en grupos.');
            if (!isAdmin) return msg.reply('❌ Solo administradores.');

            if (msg.hasQuotedMsg) {
                const quotedMsg = await msg.getQuotedMessage();
                let txtAviso = `📢 *\`AVISO IMPORTANTE DE ADM:\`*\n\n${quotedMsg.body}\n\n`;
                let mentionsList = [];

                for (let part of chat.participants) {
                    const cont = await client.getContactById(part.id._serialized);
                    mentionsList.push(cont);
                    txtAviso += `@${part.id.user} `;
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
                    const cont = await client.getContactById(part.id._serialized);
                    mencionesAdmins.push(cont);
                    txtAdmins += `@${part.id.user} `;
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

        case 'owner':
        case 'creador':
            await chat.sendMessage(`👤 *Creador del Bot:* KILLTBEST\n💬 *Contacto:* Escríbele al privado para soporte técnico.`);
            break;

        default:
            console.log(`Comando ingresado: .${command}`);
            break;
    }
});

client.initialize();
