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
const mongoose = require('mongoose'); // 🔌 NUEVO: Motor de base de datos integrado
const comandos = require('./comandos.js');

// 🔌 CONEXIÓN PERMANENTE CON MONGODB ATLAS
// Reemplaza esto con tu URL de conexión real que obtuviste de tu cluster de MongoDB Atlas.
const MONGO_URI = process.env.MONGO_URI || "TU_URL_DE_CONEXION_DE_MONGODB_ATLAS";

mongoose.connect(MONGO_URI)
    .then(() => console.log("🔌 Conectado con éxito a MongoDB Atlas (Base de datos blindada) 🟢"))
    .catch(err => console.error("❌ Error crítico de infraestructura al conectar a MongoDB:", err));

// Configuración avanzada de Puppeteer optimizada para entornos Linux Cloud (Railway)
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
    console.log('🚀 KORI BOT MULTI-DEVICE EN LÍNEA Y TOTALMENTE OPERATIVO 🚀');
});

// Captura y procesa todos los mensajes entrantes y salientes (Sincronización total)
client.on('message_create', async (msg) => {
    await comandos.ejecutar(client, msg);
});

// Activador de las bienvenidas y despedidas automáticas desde comandos.js
try {
    comandos.vincularEventosEspeciales(client);
} catch (e) {
    console.log("Error al vincular eventos especiales:", e);
}

client.initialize();
