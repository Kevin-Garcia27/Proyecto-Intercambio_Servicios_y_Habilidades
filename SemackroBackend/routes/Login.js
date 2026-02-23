const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db'); // Conexión a la base de datos

// Endpoint: POST /api/login

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

// GET endpoint: Obtener rol completo de un usuario usando el procedimiento almacenado
// Ruta: GET /login/rol/:id_usuario
router.get('/login/rol/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;

    if (!id_usuario) {
        return res.status(400).json({ error: 'Parámetro id_usuario es requerido.' });
    }

    try {
        // Llamar al procedimiento almacenado
        const [rows] = await pool.execute('CALL GetUsuarioRolCompleto(?)', [id_usuario]);

        // Dependiendo del driver MySQL, la respuesta de CALL puede venir anidada.
        const result = Array.isArray(rows) && rows.length > 0 ? rows[0] : rows;

        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'No se encontró rol para el usuario.' });
        }

        res.status(200).json({
            id_usuario: Number(id_usuario),
            rol: result[0].rol,
            id_rol: result[0].id_rol,
            raw: result
        });

    } catch (error) {
        console.error('Error al obtener rol del usuario:', error);
        res.status(500).json({ error: 'Error del servidor al obtener rol del usuario.' });
    }
});

// GET endpoint: Obtener id_usuario por correo y luego su rol completo
// Ruta: GET /login/rol/correo/:correo
router.get('/login/rol/correo/:correo', async (req, res) => {
    const { correo } = req.params;

    if (!correo) {
        return res.status(400).json({ error: 'Parámetro correo es requerido.' });
    }

    try {
        // Llamar al procedimiento que obtiene el id por correo
        const [rowsId] = await pool.execute('CALL GetIdUsuarioByCorreo(?)', [correo]);

        // Manejar posible anidamiento del resultado
        const idResult = Array.isArray(rowsId) && rowsId.length > 0 ? rowsId[0] : rowsId;

        if (!idResult || idResult.length === 0 || !idResult[0].id_usuario) {
            return res.status(404).json({ error: 'No se encontró usuario con ese correo.' });
        }

        const id_usuario = idResult[0].id_usuario;

        // Ahora llamar al procedimiento que devuelve el rol completo
        const [rowsRol] = await pool.execute('CALL GetUsuarioRolCompleto(?)', [id_usuario]);
        const rolResult = Array.isArray(rowsRol) && rowsRol.length > 0 ? rowsRol[0] : rowsRol;

        if (!rolResult || rolResult.length === 0) {
            return res.status(404).json({ error: 'No se encontró rol para el usuario.' });
        }

        res.status(200).json({
            id_usuario: Number(id_usuario),
            correo,
            rol: rolResult[0].rol,
            id_rol: rolResult[0].id_rol,
            raw: { idResult, rolResult }
        });

    } catch (error) {
        console.error('Error al obtener id o rol por correo:', error);
        res.status(500).json({ error: 'Error del servidor al obtener id o rol por correo.' });
    }
});





module.exports = router;
