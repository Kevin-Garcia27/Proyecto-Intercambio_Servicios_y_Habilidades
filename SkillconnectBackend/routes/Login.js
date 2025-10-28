const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db'); // Conexión a la base de datos

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
        // 1️⃣ Buscar usuario por correo
        const [rows] = await pool.execute(
            'SELECT id_usuario, correo, contrasena_hash FROM Usuarios WHERE correo = ?',
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

        // 3️⃣ Si todo está bien, responder con éxito
        res.status(200).json({
            mensaje: 'Inicio de sesión exitoso.',
            usuario: {
                id_usuario: usuario.id_usuario,
                correo: usuario.correo
            }
        });

    } catch (error) {
        console.error('Error durante el inicio de sesión:', error);
        res.status(500).json({ error: 'Error del servidor al intentar iniciar sesión.' });
    }
});

module.exports = router;
