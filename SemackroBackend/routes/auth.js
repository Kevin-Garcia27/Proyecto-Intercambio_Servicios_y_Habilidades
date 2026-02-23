// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Necesario para el Hashing de Contraseñas
const jwt = require('jsonwebtoken'); // Para generar tokens JWT
const pool = require('../db'); // Importa la conexión a la base de datos (DB)

// El número de "rondas de sal" para bcrypt. Más alto es más seguro pero más lento.
const saltRounds = 10;

// ✅ CLAVE SECRETA PARA JWT (En producción, usar variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_2025_SEMACKRO';
const JWT_EXPIRES_IN = '7d'; // Token válido por 7 días 

// **********************************************
// POST /api/registro 
// **********************************************

router.post('/registro', async (req, res) => {
    // 1. OBTENER DATOS (Paso F del Diagrama: Backend recibe datos)
    const { correo, contrasena } = req.body;

    // 1.1 Validación básica de campos no vacíos (una vez que el frontend falle en validarlo)
    if (!correo || !contrasena) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }

    try {
        // 2. CONSULTAR DB: ¿CORREO YA EXISTE? (Paso G del Diagrama)
        const [rows] = await pool.execute('SELECT id_usuario FROM Usuarios WHERE correo = ?', [correo]);

        if (rows.length > 0) {
            // El correo ya existe (Paso H y I del Diagrama)
            return res.status(409).json({ error: 'El correo electrónico ya está registrado. Por favor, intenta con otro.' });
        }

        // 3. GENERAR HASH SEGURO (Paso J del Diagrama)
        const contrasena_hash = await bcrypt.hash(contrasena, saltRounds);

        // 4. GUARDAR NUEVO USUARIO EN DB (Paso K del Diagrama)
        const [result] = await pool.execute(
            'INSERT INTO Usuarios (correo, contrasena_hash) VALUES (?, ?)',
            [correo, contrasena_hash]
        );

        const nuevoUsuarioId = result.insertId;

        // 5. CREAR REGISTRO EN TABLA PERSONAS (Reservar espacio para el perfil)
        await pool.execute(
            'INSERT INTO Personas (id_Usuario) VALUES (?)',
            [nuevoUsuarioId]
        );

        // 6. RESPUESTA DE ÉXITO (Paso L del Diagrama)
        res.status(201).json({ 
            mensaje: 'Usuario registrado exitosamente.',
            id_usuario: nuevoUsuarioId 
        });

    } catch (error) {
        console.error('Error durante el registro:', error);
        res.status(500).json({ error: 'Ocurrió un error en el servidor al intentar registrar el usuario.' });
    }
});

// **********************************************
// POST /api/login 
// **********************************************

router.post('/login', async (req, res) => {
    // 1. OBTENER DATOS DEL FRONTEND
    const { correo, contrasena } = req.body;

    // 1.1 Validación básica de campos
    if (!correo || !contrasena) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }

    try {
        // 2. BUSCAR USUARIO EN LA BASE DE DATOS POR CORREO
        const [rows] = await pool.execute(
            'SELECT id_usuario, correo, contrasena_hash FROM Usuarios WHERE correo = ?',
            [correo]
        );

        if (rows.length === 0) {
            // Usuario no encontrado
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const usuario = rows[0];

        // 3. VERIFICAR CONTRASEÑA CON BCRYPT
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);

        if (!contrasenaValida) {
            // Contraseña incorrecta
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // 4. RESPUESTA DE ÉXITO - DEVOLVER ID DE USUARIO
        res.status(200).json({ 
            mensaje: 'Inicio de sesión exitoso',
            usuarioId: usuario.id_usuario,
            correo: usuario.correo
        });

    } catch (error) {
        console.error('Error durante el login:', error);
        res.status(500).json({ error: 'Ocurrió un error en el servidor al intentar iniciar sesión.' });
    }
});

// **********************************************
// POST /api/login-jwt (CON TOKEN JWT)
// **********************************************

router.post('/login-jwt', async (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }

    try {
        // 1. BUSCAR USUARIO
        const [rows] = await pool.execute(
            'SELECT id_usuario, correo, contrasena_hash FROM Usuarios WHERE correo = ?',
            [correo]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const usuario = rows[0];

        // 2. VERIFICAR CONTRASEÑA
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);

        if (!contrasenaValida) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // 3. GENERAR TOKEN JWT
        const token = jwt.sign(
            { 
                usuarioId: usuario.id_usuario,
                correo: usuario.correo
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // 4. DEVOLVER TOKEN
        res.status(200).json({ 
            mensaje: 'Inicio de sesión exitoso',
            token: token,
            usuarioId: usuario.id_usuario,
            correo: usuario.correo
        });

    } catch (error) {
        console.error('Error durante el login JWT:', error);
        res.status(500).json({ error: 'Ocurrió un error en el servidor al intentar iniciar sesión.' });
    }
});

// **********************************************
// MIDDLEWARE: Verificar Token JWT
// **********************************************

function verificarToken(req, res, next) {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado. Inicia sesión nuevamente.' });
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded; // Guardar info del usuario en req
        next(); // Continuar con la siguiente función
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
}

// **********************************************
// GET /api/verificar-sesion (Verificar si el token es válido)
// **********************************************

router.get('/verificar-sesion', verificarToken, (req, res) => {
    // Si llegó aquí, el token es válido
    res.status(200).json({ 
        mensaje: 'Sesión válida',
        usuarioId: req.usuario.usuarioId,
        correo: req.usuario.correo
    });
});

module.exports = router;