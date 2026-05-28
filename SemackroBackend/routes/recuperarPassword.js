const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { enviarCorreoRecuperacion } = require('../config/email');
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_2025_SEMACKRO';

function maskEmail(email) {
    if (!email || typeof email !== 'string' || !email.includes('@')) return '[email-invalido]';
    const [local, domain] = email.split('@');
    const visibleLocal = local.length <= 2 ? local[0] || '*' : local.slice(0, 2);
    return `${visibleLocal}***@${domain}`;
}

function buildTraceId() {
    return `pwdrec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// POST /api/password/solicitar-recuperacion
// Solicitar recuperación de contraseña
router.post('/solicitar-recuperacion', async (req, res) => {
    const { correo, FRONTEND_URL, EMAIL_FROM_NAME } = req.body;
    const traceId = buildTraceId();
    const startedAt = Date.now();
    const maskedCorreo = maskEmail(correo);

    console.log(`[password-recovery][${traceId}] Inicio solicitud para ${maskedCorreo}`);

    if (!correo) {
        console.warn(`[password-recovery][${traceId}] Solicitud rechazada: correo ausente`);
        return res.status(400).json({ 
            success: false, 
            mensaje: 'El correo es requerido' 
        });
    }

    try {
        // Verificar si el usuario existe
        const query = 'SELECT id_usuario, correo FROM Usuarios WHERE correo = ?';
        const [usuarios] = await db.query(query, [correo]);
        console.log(`[password-recovery][${traceId}] Resultado búsqueda usuario: ${usuarios.length > 0 ? 'encontrado' : 'no encontrado'}`);

        // Por seguridad, siempre devolvemos el mismo mensaje
        // (no revelamos si el correo existe o no)
        const mensajeGenerico = 'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.';

        if (usuarios.length === 0) {
            console.log(`[password-recovery][${traceId}] Correo no registrado (${maskedCorreo}). Respuesta genérica enviada en ${Date.now() - startedAt}ms`);
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
            JWT_SECRET,
            { expiresIn: '15m' }
        );
        console.log(`[password-recovery][${traceId}] Token de recuperación generado para usuario ${usuario.id_usuario}`);

        // Responder de inmediato para evitar timeouts en la interfaz.
        res.status(200).json({
            success: true,
            mensaje: mensajeGenerico
        });
        console.log(`[password-recovery][${traceId}] Respuesta genérica enviada en ${Date.now() - startedAt}ms`);

        // Enviar correo en segundo plano; los fallos se registran en logs.
        setImmediate(async () => {
            const mailStartedAt = Date.now();
            try {
                console.log(`[password-recovery][${traceId}] Intentando envío de correo a ${maskedCorreo}`);
                const resultado = await enviarCorreoRecuperacion(correo, token, {
                    frontendUrl: FRONTEND_URL,
                    emailFromName: EMAIL_FROM_NAME,
                    traceId
                });
                if (resultado.success) {
                    console.log(`[password-recovery][${traceId}] Correo enviado correctamente (${maskedCorreo}) messageId=${resultado.messageId || 'n/a'} en ${Date.now() - mailStartedAt}ms`);
                } else {
                    console.error(`[password-recovery][${traceId}] Fallo al enviar correo (${maskedCorreo}) en ${Date.now() - mailStartedAt}ms:`, resultado.error);
                }
            } catch (mailError) {
                console.error(`[password-recovery][${traceId}] Error inesperado en envío de correo (${maskedCorreo}) en ${Date.now() - mailStartedAt}ms:`, mailError);
            }
        });

        return;

    } catch (error) {
        console.error(`[password-recovery][${traceId}] Error en solicitar-recuperacion tras ${Date.now() - startedAt}ms:`, error);
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
        const decoded = jwt.verify(token, JWT_SECRET);

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
        const decoded = jwt.verify(token, JWT_SECRET);

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
