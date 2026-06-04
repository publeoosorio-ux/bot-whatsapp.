// Servidor para evitar que Railway apague el bot
const http = require('http');
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot activo 24/7\n');
}).listen(port, () => {
    console.log(`🌍 Servidor corriendo en puerto ${port}`);
});

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const comandos = require('./comandos.js');

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
    await comandos.ejecutar(client, msg);
});

// Activador de las bienvenidas y despedidas automáticas desde comandos.js
try {
    comandos.vincularEventosEspeciales(client);
} catch (e) {
    console.log("Error al vincular eventos especiales:", e);
}

client.initialize();
