const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { enviarCorreoRecuperacion } = require('../config/email');

// POST /api/password/solicitar-recuperacion
// Solicitar recuperación de contraseña
router.post('/solicitar-recuperacion', async (req, res) => {
    const { correo } = req.body;

    if (!correo) {
        return res.status(400).json({ 
            success: false, 
            mensaje: 'El correo es requerido' 
        });
    }

    try {
        // Verificar si el usuario existe
        const query = 'SELECT id_usuario, correo FROM Usuarios WHERE correo = ?';
        const [usuarios] = await db.query(query, [correo]);

        // Por seguridad, siempre devolvemos el mismo mensaje
        // (no revelamos si el correo existe o no)
        const mensajeGenerico = 'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.';

        if (usuarios.length === 0) {
            console.log(`Intento de recuperación para correo no existente: ${correo}`);
            return res.status(200).json({ 
                success: true, 
                mensaje: mensajeGenerico 
            });
        }

        const usuario = usuarios[0];

        // Generar token JWT que expira en 15 minutos
        const token = jwt.sign(
            { 
                id_usuario: usuario.id_usuario, 
                correo: usuario.correo,
                tipo: 'recuperacion_password'
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Enviar correo con el token
        const resultado = await enviarCorreoRecuperacion(correo, token);

        if (resultado.success) {
            console.log(`Correo de recuperación enviado a: ${correo}`);
            return res.status(200).json({ 
                success: true, 
                mensaje: mensajeGenerico 
            });
        } else {
            console.error('Error al enviar correo:', resultado.error);
            return res.status(500).json({ 
                success: false, 
                mensaje: 'Error al enviar el correo. Intenta nuevamente.' 
            });
        }

    } catch (error) {
        console.error('Error en solicitar-recuperacion:', error);
        return res.status(500).json({ 
            success: false, 
            mensaje: 'Error del servidor' 
        });
    }
});

// POST /api/password/validar-token
// Validar si el token es válido
router.post('/validar-token', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ 
            success: false, 
            mensaje: 'Token requerido' 
        });
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verificar que sea un token de tipo recuperación
        if (decoded.tipo !== 'recuperacion_password') {
            return res.status(400).json({ 
                success: false, 
                mensaje: 'Token inválido' 
            });
        }

        // Verificar que el usuario aún existe
        const query = 'SELECT id_usuario FROM Usuarios WHERE id_usuario = ?';
        const [usuarios] = await db.query(query, [decoded.id_usuario]);

        if (usuarios.length === 0) {
            return res.status(400).json({ 
                success: false, 
                mensaje: 'Usuario no encontrado' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            mensaje: 'Token válido',
            correo: decoded.correo
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ 
                success: false, 
                mensaje: 'El enlace ha expirado. Solicita uno nuevo.' 
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ 
                success: false, 
                mensaje: 'El enlace es inválido.' 
            });
        }

        console.error('Error en validar-token:', error);
        return res.status(500).json({ 
            success: false, 
            mensaje: 'Error del servidor' 
        });
    }
});

// POST /api/password/restablecer
// Restablecer contraseña con token válido
router.post('/restablecer', async (req, res) => {
    const { token, nuevaPassword } = req.body;

    if (!token || !nuevaPassword) {
        return res.status(400).json({ 
            success: false, 
            mensaje: 'Token y nueva contraseña son requeridos' 
        });
    }

    if (nuevaPassword.length < 6) {
        return res.status(400).json({ 
            success: false, 
            mensaje: 'La contraseña debe tener al menos 6 caracteres' 
        });
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verificar que sea un token de tipo recuperación
        if (decoded.tipo !== 'recuperacion_password') {
            return res.status(400).json({ 
                success: false, 
                mensaje: 'Token inválido' 
            });
        }

        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

        // Actualizar la contraseña en la base de datos
        const updateQuery = 'UPDATE Usuarios SET contrasena_hash = ? WHERE id_usuario = ?';
        const [result] = await db.query(updateQuery, [hashedPassword, decoded.id_usuario]);

        console.log(`Contraseña actualizada para usuario ID: ${decoded.id_usuario}`, result);

        return res.status(200).json({ 
            success: true, 
            mensaje: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' 
        });

    } catch (error) {
        console.error('Error completo en restablecer:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ 
                success: false, 
                mensaje: 'El enlace ha expirado. Solicita uno nuevo.' 
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ 
                success: false, 
                mensaje: 'El enlace es inválido.' 
            });
        }

        console.error('Error en restablecer:', error);
        return res.status(500).json({ 
            success: false, 
            mensaje: 'Error del servidor: ' + error.message 
        });
    }
});

module.exports = router;
