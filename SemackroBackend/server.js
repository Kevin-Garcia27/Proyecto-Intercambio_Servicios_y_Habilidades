// server.js

// 0. Configuración del Entorno (DEBE IR PRIMERO)
require('dotenv').config({ override: true }); 

// 1. Importaciones de Librerías
const express = require('express');
const cors = require('cors'); 
const session = require('express-session');
const passport = require('./config/passport');
const path = require('path');

// Importar rutas
const authRoutes = require('./routes/auth');
const authGoogleRoutes = require('./routes/authGoogle');
const loginRoutes = require('./routes/Login');
const uploadRoutes = require('./routes/upload');
const personasRoutes = require('./routes/Personas');
const habilidadesRoutes = require('./routes/HabilidadesYServicios_Persona');
const direccionesRoutes = require('./routes/Direcciones');
const categoriasRoutes = require('./routes/CategoriasGeneralesHabilidades');
const geolocalizacionRoutes = require('./routes/Geolocalizacion');
const solicitudesRoutes = require('./routes/SolicitudesIntercambio');
const mensajeriaRoutes = require('./routes/Mensajeria');
const recuperarPasswordRoutes = require('./routes/recuperarPassword');
const favoritosRoutes = require('./routes/favoritos');
const intercambiosRoutes = require('./routes/intercambios');
const verificacionUsuariosRoutes = require('./routes/verificacionUsuarios');
const reportesUsuariosRoutes = require('./routes/ReportesUsuarios');
const respuestasReseniaRoutes = require('./routes/Respuestas_Resenia');
const notificacionesRoutes = require('./routes/notificaciones_reseñas');
const videollamadasRoutes = require('./routes/videollamadas');
const callSignalsRoutes = require('./routes/call-signals');
const certificacionesRoutes = require('./routes/Certificaciones');
const metricasRoutes = require('./routes/MetricasDesempeno');
const perfilCompletoRoutes = require('./routes/PerfilCompleto');
const ordenesTrabajoRoutes = require('./routes/ordenesTrabajo');
const onboardingDriversRoutes = require('./routes/onboardingDrivers');

// 2. Crear instancia de Express
const app = express();

// 3. Definir el puerto (CRÍTICO - FALTABA ESTO)
const port = process.env.PORT || 3001;

// 4. Configurar CORS con soporte dinámico para ngrok
app.use(cors({
    origin: function (origin, callback) {
        // Orígenes permitidos fijos
        const allowedOrigins = [
            'http://127.0.0.1:5500',
            'http://localhost:5500',
            'http://127.0.0.1:5050',
            'http://localhost:5050',
            'http://localhost:3000',
            'http://localhost:3001',
            'https://semackro.vercel.app',
            'https://tu-dominio.com',
            'https://www.tu-dominio.com'
        ];
        
        // Verificar si es un origen permitido fijo
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Verificar si es una URL de ngrok (cualquier subdominio)
        if (origin.includes('.ngrok-free.dev') || origin.includes('.ngrok.io')) {
            return callback(null, true);
        }

        // Permitir previews/despliegues de Vercel
        if (origin.includes('.vercel.app')) {
            return callback(null, true);
        }
        
        // Rechazar otros orígenes
        callback(new Error('No permitido por CORS'));
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Configurar sesiones para Passport
app.use(session({
    secret: process.env.SESSION_SECRET || 'tu_secreto_de_sesion_super_seguro_2025',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // En producción debe ser true con HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// 6. Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// 7. Configurar las rutas
app.use('/api', authRoutes);
app.use('/api/auth', authGoogleRoutes); // Rutas de Google OAuth
app.use('/api', loginRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/personas', personasRoutes);
app.use('/api/habilidades', habilidadesRoutes);
app.use('/api/direcciones', direccionesRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/geolocalizacion', geolocalizacionRoutes);
app.use('/api/solicitudes-intercambio', solicitudesRoutes);
app.use('/api/mensajeria', mensajeriaRoutes);
app.use('/api/password', recuperarPasswordRoutes); // Rutas de recuperación de contraseña
app.use('/api/favoritos', favoritosRoutes); // Rutas de favoritos
app.use('/api/intercambios', intercambiosRoutes); // Rutas de intercambios finalizados y calificaciones
app.use('/api/verificacion-usuarios', verificacionUsuariosRoutes); // Rutas de verificación de usuarios
app.use('/api/reportes', reportesUsuariosRoutes); // Rutas para reportes de usuarios
app.use('/api/respuestas-resenia', respuestasReseniaRoutes); // Rutas de respuestas a reseñas
app.use('/api/notificaciones', notificacionesRoutes); // Rutas de notificaciones
// Rutas para señalización de videollamadas (offer/answer/candidates)
app.use('/api/videollamadas', videollamadasRoutes);
// Rutas para señalización sin sockets (polling puro)
app.use('/api/call-signals', callSignalsRoutes);
 
app.use('/api/certificaciones', certificacionesRoutes); // Rutas de certificaciones
app.use('/api/metricas', metricasRoutes); // Rutas de métricas de desempeño
app.use('/api/perfil-completo', perfilCompletoRoutes); // Rutas de perfil completo
app.use('/api/ordenes-trabajo', ordenesTrabajoRoutes); // Rutas de órdenes de trabajo
app.use('/api/onboarding-drivers', onboardingDriversRoutes); // Estado de drivers/onboarding por persona

// 8. Prueba básica de que el servidor Express funciona
app.get('/', (req, res) => {
    res.send('Servidor Skill Connect Activo! ');
});

// 9. Servir archivos estáticos del frontend (SEMACKROFrontend)
const frontendPath = path.join(__dirname, '..', 'SEMACKROFrontend');

// Middleware para establecer CSP (relajada para desarrollo)
app.use('/SEMACKROFrontend', (req, res, next) => {
    // Política de ejemplo: permite recursos propios, fuentes/estilos de Google
    // CSP relajada para desarrollo: permitimos recursos propios y datos,
    // especificamos `img-src` y `media-src` para permitir reproducción desde
    // Cloudflare R2 (si está configurado en R2_PUBLIC_URL) y previews `blob:`/`data:`.
    let r2Host = process.env.R2_PUBLIC_URL || 'https:';
    try { r2Host = new URL(r2Host).origin; } catch (e) { /* dejar r2Host tal cual si no es URL */ }

    const csp = "default-src 'self' data:; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: https://www.gstatic.com https://*.firebase.com https://*.googleapis.com https://meet.jit.si https://*.jitsi.net https://web-cdn.jitsi.net https://8x8.vc https://*.8x8.vc https://sso.8x8.com https://*.8x8.com https://alpha.jitsi.net https://beta.meet.jit.si; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://meet.jit.si https://*.jitsi.net https://8x8.vc https://*.8x8.vc https://alpha.jitsi.net; " +
                "font-src 'self' https://fonts.gstatic.com data:; " +
                "img-src 'self' data: blob: https: " + r2Host + " https://*.googleusercontent.com https://www.gstatic.com https://meet.jit.si https://*.jitsi.net https://8x8.vc https://*.8x8.vc https://alpha.jitsi.net; " +
                "media-src 'self' data: blob: " + r2Host + " https://meet.jit.si https://8x8.vc https://*.8x8.vc https://alpha.jitsi.net; " +
                "frame-src 'self' https://meet.jit.si https://*.jitsi.net https://web-cdn.jitsi.net https://8x8.vc https://*.8x8.vc https://sso.8x8.com https://*.8x8.com https://alpha.jitsi.net; " +
                "connect-src 'self' http://127.0.0.1:5050 http://localhost:5050 http://127.0.0.1:3001 http://localhost:3001 ws: wss: https://meet.jit.si wss://meet.jit.si https://*.jitsi.net wss://*.jitsi.net https://8x8.vc https://*.8x8.vc wss://8x8.vc wss://*.8x8.vc https://alpha.jitsi.net wss://alpha.jitsi.net https://beta.meet.jit.si wss://beta.meet.jit.si https://cdn.jsdelivr.net https://*.googleapis.com https://api-inference.huggingface.co https://*.firebase.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.gstatic.com;";
    res.setHeader('Content-Security-Policy', csp);
    next();
});

// Servir estáticos (index por defecto)
app.use('/SEMACKROFrontend', express.static(frontendPath, { index: 'index.html' }));

// Si la petición comienza con /SEMACKROFrontend y no se encontró un archivo,
// devolvemos la página 404 personalizada del frontend
app.use('/SEMACKROFrontend', (req, res) => {
    res.status(404).sendFile(path.join(frontendPath, '404.html'));
});

// 10. Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error del servidor:', err);
    res.status(err.status || 500).json({ 
        error: err.message || 'Error interno del servidor' 
    });
});

// 11. Iniciar el servidor usando HTTP + Socket.io (para señalización en tiempo real)
const http = require('http');
const { Server } = require('socket.io');

// Importar el pool de conexiones (pool.promise() desde db.js)
const pool = require('./db');

const server = http.createServer(app);

// Configuración básica de CORS para Socket.io (ajusta orígenes en producción)
const io = new Server(server, {
    cors: {
        origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:5050', 'http://localhost:5050', 'http://localhost:3000', 'http://localhost:3001', 'https://semackro.vercel.app', 'https://tu-dominio.com', 'https://www.tu-dominio.com'],
        methods: ['GET', 'POST']
    }
});

// Registrar la instancia de io en el singleton para que las rutas puedan usarla
require('./socketInstance').setIo(io);

io.on('connection', (socket) => {
    console.log('Socket conectado:', socket.id);
    // map userId -> socket.id
    // Se usa para entregar ofertas/directamente a un usuario concreto (callee)
    // userId debe ser proporcionado por el cliente mediante el evento 'register'
    socket.data.userId = null;

    socket.on('join', (roomId) => {
        try { socket.join(roomId); } catch(e) { console.warn('join room failed', e); }
    });

    // Registrar un userId asociado a este socket (opcional pero recomendado)
    socket.on('register', (payload) => {
        try{
            const uid = (payload && payload.userId) ? String(payload.userId) : null;
            if(uid){
                socket.data.userId = uid;
                // almacenar en un room privado por userId para facilitar targeting
                try{ socket.join(`user_${uid}`); }catch(e){}
                console.log('Registered socket', socket.id, 'for user', uid);
            }
        }catch(e){ console.warn('register payload error', e); }
    });

    socket.on('offer', async (data) => {
        try{
            if (!data || !data.roomId) return;
            // Si se incluye id_mensaje, resolver participantes desde la tabla mensajes
            if (data.id_mensaje) {
                try {
                    const [rows] = await pool.query('SELECT id_persona_envia, id_persona_recibe FROM mensajes WHERE id_mensaje = ? LIMIT 1', [data.id_mensaje]);
                    const m = (rows && rows[0]) ? rows[0] : null;
                    if (m) {
                        const sender = String(data.callerId || socket.data.userId || '');
                        const targets = [];
                        if (m.id_persona_envia && String(m.id_persona_envia) !== sender) targets.push(String(m.id_persona_envia));
                        if (m.id_persona_recibe && String(m.id_persona_recibe) !== sender) targets.push(String(m.id_persona_recibe));
                        // Emitir offer a cada participante (excepto al emisor)
                        targets.forEach(t => io.to(`user_${t}`).emit('offer', data));
                        return;
                    }
                } catch (e) {
                    console.warn('Error buscando participantes por id_mensaje', e);
                }
            }

            // Si el caller incluye calleeId y ese user está registrado, enviarle directamente
            const calleeId = data.calleeId ? String(data.calleeId) : null;
            if(calleeId){
                io.to(`user_${calleeId}`).emit('offer', data);
                return;
            }

            // reenviar offer a otros miembros de la sala por defecto
            socket.to(data.roomId).emit('offer', data);
        } catch(err) {
            console.warn('offer handler error', err);
        }
    });

    socket.on('answer', async (data) => {
        try{
            if (!data || !data.roomId) return;
            // Si llega id_mensaje, enviar a participantes del mensaje
            if (data.id_mensaje) {
                try {
                    const [rows] = await pool.query('SELECT id_persona_envia, id_persona_recibe FROM mensajes WHERE id_mensaje = ? LIMIT 1', [data.id_mensaje]);
                    const m = (rows && rows[0]) ? rows[0] : null;
                    if (m) {
                        const sender = String(socket.data.userId || '');
                        const targets = [];
                        if (m.id_persona_envia && String(m.id_persona_envia) !== sender) targets.push(String(m.id_persona_envia));
                        if (m.id_persona_recibe && String(m.id_persona_recibe) !== sender) targets.push(String(m.id_persona_recibe));
                        targets.forEach(t => io.to(`user_${t}`).emit('answer', data));
                        return;
                    }
                } catch (e) { console.warn('Error buscando participantes por id_mensaje (answer)', e); }
            }

            const targetId = data.targetUserId || data.userId || null;
            if(targetId){ io.to(`user_${String(targetId)}`).emit('answer', data); return; }
            socket.to(data.roomId).emit('answer', data);
        } catch(err) { console.warn('answer handler error', err); }
    });

    socket.on('candidate', async (data) => {
        try{
            if (!data || !data.roomId) return;
            if (data.id_mensaje) {
                try {
                    const [rows] = await pool.query('SELECT id_persona_envia, id_persona_recibe FROM mensajes WHERE id_mensaje = ? LIMIT 1', [data.id_mensaje]);
                    const m = (rows && rows[0]) ? rows[0] : null;
                    if (m) {
                        const sender = String(socket.data.userId || '');
                        const targets = [];
                        if (m.id_persona_envia && String(m.id_persona_envia) !== sender) targets.push(String(m.id_persona_envia));
                        if (m.id_persona_recibe && String(m.id_persona_recibe) !== sender) targets.push(String(m.id_persona_recibe));
                        targets.forEach(t => io.to(`user_${t}`).emit('candidate', data));
                        return;
                    }
                } catch (e) { console.warn('Error buscando participantes por id_mensaje (candidate)', e); }
            }

            const targetId = data.targetUserId || data.userId || null;
            if(targetId){ io.to(`user_${String(targetId)}`).emit('candidate', data); return; }
            socket.to(data.roomId).emit('candidate', data);
        } catch(err) { console.warn('candidate handler error', err); }
    });

    socket.on('endCall', async (data) => {
        try{
            if (!data || !data.roomId) return;
            if (data.id_mensaje) {
                try {
                    const [rows] = await pool.query('SELECT id_persona_envia, id_persona_recibe FROM mensajes WHERE id_mensaje = ? LIMIT 1', [data.id_mensaje]);
                    const m = (rows && rows[0]) ? rows[0] : null;
                    if (m) {
                        const sender = String(socket.data.userId || '');
                        const targets = [];
                        if (m.id_persona_envia && String(m.id_persona_envia) !== sender) targets.push(String(m.id_persona_envia));
                        if (m.id_persona_recibe && String(m.id_persona_recibe) !== sender) targets.push(String(m.id_persona_recibe));
                        targets.forEach(t => io.to(`user_${t}`).emit('endCall', data));
                        return;
                    }
                } catch (e) { console.warn('Error buscando participantes por id_mensaje (endCall)', e); }
            }

            const targetId = data.targetUserId || data.userId || null;
            if(targetId){ io.to(`user_${String(targetId)}`).emit('endCall', data); return; }
            socket.to(data.roomId).emit('endCall', data);
        } catch(err) { console.warn('endCall handler error', err); }
    });

    socket.on('disconnect', () => {
        // console.log('Socket desconectado:', socket.id);
    });
});

server.listen(port, () => {
    console.log(` Servidor escuchando en http://localhost:${port}`);
    console.log(` Frontend disponible en http://localhost:${port}/SEMACKROFrontend`);
});