// routes/auth.js - VERSIÓN CON PROCEDIMIENTOS ALMACENADOS

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Necesario para el Hashing de Contraseñas
const jwt = require('jsonwebtoken'); // Para generar tokens JWT
const pool = require('../db'); // Importa la conexión a la base de datos (DB)

// El número de "rondas de sal" para bcrypt. Más alto es más seguro pero más lento.
const saltRounds = 10;

// ✅ CLAVE SECRETA PARA JWT (En producción, usar variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_2025_SkillConnect';
const JWT_EXPIRES_IN = '7d'; // Token válido por 7 días

// **********************************************
// POST /api/registro (CON PROCEDIMIENTO ALMACENADO)
// **********************************************

router.post('/registro', async (req, res) => {
    // 1. OBTENER DATOS (Paso F del Diagrama: Backend recibe datos)
    const { correo, contrasena } = req.body;

    // 1.1 Validación básica de campos no vacíos
    if (!correo || !contrasena) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }

    try {
        // 2. GENERAR HASH SEGURO
        const contrasena_hash = await bcrypt.hash(contrasena, saltRounds);

        // 3. LLAMAR PROCEDIMIENTO ALMACENADO
        const [rows] = await pool.execute(
            'CALL sp_Registro_Usuario_Completo(?, ?)',
            [correo, contrasena_hash]
        );

        // El procedimiento devuelve los IDs en rows[0][0]
        const resultado = rows[0][0];

        // 4. RESPUESTA DE ÉXITO
        res.status(201).json({ 
            mensaje: 'Usuario registrado exitosamente.',
            id_usuario: resultado.id_usuario,
            id_perfil: resultado.id_perfil
        });

    } catch (error) {
        console.error('Error durante el registro:', error);
        
        // Si el error es del procedimiento almacenado (correo duplicado)
        if (error.sqlState === '45000') {
            return res.status(409).json({ error: error.sqlMessage });
        }
        
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
            'CALL sp_Login_ObtenerDatosUsuario(?)',
            [correo]
        );

        const usuario = rows[0][0];

        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // 3. VERIFICAR CONTRASEÑA CON BCRYPT
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);

        if (!contrasenaValida) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // 4. VERIFICAR SI EL USUARIO ESTÁ ACTIVO
        if (usuario.activo !== 1) {
            return res.status(403).json({ error: 'Usuario inactivo. Contacta al administrador.' });
        }

        // 5. RESPUESTA DE ÉXITO - DEVOLVER ID DE USUARIO Y PERFIL
        res.status(200).json({ 
            mensaje: 'Inicio de sesión exitoso',
            usuarioId: usuario.id_usuario,
            perfilId: usuario.id_perfil,
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
        // 1. BUSCAR USUARIO CON PROCEDIMIENTO ALMACENADO
        const [rows] = await pool.execute(
            'CALL sp_Login_ObtenerDatosUsuario(?)',
            [correo]
        );

        const usuario = rows[0][0];

        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // 2. VERIFICAR CONTRASEÑA
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);

        if (!contrasenaValida) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // 3. VERIFICAR SI ESTÁ ACTIVO
        if (usuario.activo !== 1) {
            return res.status(403).json({ error: 'Usuario inactivo. Contacta al administrador.' });
        }

        // 4. GENERAR TOKEN JWT
        const token = jwt.sign(
            { 
                usuarioId: usuario.id_usuario,
                perfilId: usuario.id_perfil,
                correo: usuario.correo
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // 5. DEVOLVER TOKEN
        res.status(200).json({ 
            mensaje: 'Inicio de sesión exitoso',
            token: token,
            usuarioId: usuario.id_usuario,
            perfilId: usuario.id_perfil,
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
        perfilId: req.usuario.perfilId,
        correo: req.usuario.correo
    });
});

module.exports = router;
