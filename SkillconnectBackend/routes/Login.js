const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); //  Importación de JWT
const pool = require('../db'); // Conexión a la base de datos

//  La clave secreta debe ser la misma que uses para verificar tokens
const JWT_SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro'; 

// **********************************************
// POST /api/login
// **********************************************
router.post('/login', async (req, res) => {
    const { correo, contrasena } = req.body;

    // Validar campos vacíos
    if (!correo || !contrasena) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }

    try {
        // 1️⃣ Buscar usuario por correo e INCLUIR el id_rol
        const [rows] = await pool.execute(
            'SELECT id_usuario, correo, contrasena_hash, id_rol FROM Usuarios WHERE correo = ?',
            [correo]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Correo no registrado.' });
        }

        const usuario = rows[0];

        // 2️⃣ Verificar contraseña
        const esValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);

        if (!esValida) {
            return res.status(401).json({ error: 'Contraseña incorrecta.' });
        }
        
        // 3️⃣ Crear el Token JWT (Incluye el id_rol)
        const token = jwt.sign(
            { 
                id_usuario: usuario.id_usuario, 
                id_rol: usuario.id_rol // 🔑 Campo clave para autorización
            }, 
            JWT_SECRET,
            { expiresIn: '24h' } // Token expira en 24 horas
        );

        // 4️⃣ Si todo está bien, responder con éxito, devolver el token y el id_rol
        res.status(200).json({
            mensaje: 'Inicio de sesión exitoso.',
            token: token,
            usuario: {
                id_usuario: usuario.id_usuario,
                correo: usuario.correo,
                id_rol: usuario.id_rol // 🔑 Lo devolvemos al frontend
            }
        });

    } catch (error) {
        console.error('Error durante el inicio de sesión:', error);
        res.status(500).json({ error: 'Error del servidor al intentar iniciar sesión.' });
    }
});

module.exports = router;
