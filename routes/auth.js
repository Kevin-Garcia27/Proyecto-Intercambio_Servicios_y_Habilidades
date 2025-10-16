// routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Necesario para el Hashing de Contraseñas
const pool = require('../db'); // Importa la conexión a la base de datos (DB)

// El número de "rondas de sal" para bcrypt. Más alto es más seguro pero más lento.
const saltRounds = 10; 

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

        // 5. RESPUESTA DE ÉXITO (Paso L del Diagrama)
        res.status(201).json({ 
            mensaje: 'Usuario registrado exitosamente.',
            id_usuario: result.insertId 
        });

    } catch (error) {
        console.error('Error durante el registro:', error);
        res.status(500).json({ error: 'Ocurrió un error en el servidor al intentar registrar el usuario.' });
    }
});

module.exports = router;