// routes/SolicitudesIntercambio.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// =========================================================
// 1. ENVIAR SOLICITUD DE INTERCAMBIO
// POST /solicitudes-intercambio/enviar
// Body: { solicitanteId, receptorId }
// =========================================================
router.post('/enviar', async (req, res) => {
    try {
        const { solicitanteId, receptorId } = req.body;

        // Validación básica
        if (!solicitanteId || !receptorId) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren solicitanteId y receptorId'
            });
        }

        // Evitar auto-solicitud
        if (solicitanteId === receptorId) {
            return res.status(400).json({
                success: false,
                message: 'No puedes enviarte una solicitud a ti mismo'
            });
        }

        // Verificar si ya existe una solicitud activa entre estos usuarios
        const [solicitudesExistentes] = await pool.query(
            `SELECT s.id_solicitud, s.estado 
             FROM solicitudes_intercambio s
             LEFT JOIN conversaciones c ON c.id_solicitud = s.id_solicitud
             WHERE ((s.id_persona_solicitante = ? AND s.id_persona_receptor = ?) 
                OR (s.id_persona_solicitante = ? AND s.id_persona_receptor = ?))
             AND s.estado IN ('Pendiente', 'Aceptada')
             AND c.id_conversacion IS NOT NULL`,
            [solicitanteId, receptorId, receptorId, solicitanteId]
        );

        if (solicitudesExistentes.length > 0) {
            const solicitud = solicitudesExistentes[0];
            if (solicitud.estado === 'Aceptada') {
                return res.status(400).json({
                    success: false,
                    message: 'Ya tienes una conexión activa con este usuario'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una solicitud pendiente con este usuario'
                });
            }
        }

        // Llamar al stored procedure para insertar la solicitud
        await pool.query(
            'CALL sp_InsertarSolicitud(?, ?)',
            [solicitanteId, receptorId]
        );

        res.status(201).json({
            success: true,
            message: 'Solicitud de intercambio enviada exitosamente'
        });

    } catch (error) {
        console.error('Error al enviar solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar la solicitud',
            error: error.message
        });
    }
});


// =========================================================
// 2. ACEPTAR SOLICITUD
// PUT /solicitudes-intercambio/:id/aceptar
// =========================================================
router.put('/:id/aceptar', async (req, res) => {
    try {
        const solicitudId = req.params.id;

        // Primero obtener datos de la solicitud
        const [solicitudData] = await pool.query(
            'SELECT id_persona_solicitante, id_persona_receptor FROM solicitudes_intercambio WHERE id_solicitud = ?',
            [solicitudId]
        );

        if (!solicitudData || solicitudData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        const { id_persona_solicitante, id_persona_receptor } = solicitudData[0];

        // Actualizar estado a 'Aceptada'
        await pool.query(
            'CALL sp_ActualizarEstadoSolicitud(?, ?)',
            [solicitudId, 'Aceptada']
        );

        // Crear conversación automáticamente
        const [conversacionResult] = await pool.query(
            'CALL sp_CrearConversacion(?, ?, ?)',
            [id_persona_solicitante, id_persona_receptor, solicitudId]
        );

        const conversacion = conversacionResult[0][0];

        res.json({
            success: true,
            message: 'Solicitud aceptada exitosamente',
            conversacion: {
                id_conversacion: conversacion.id_conversacion,
                fecha_creacion: conversacion.fecha_creacion
            }
        });

    } catch (error) {
        console.error('Error al aceptar solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error al aceptar la solicitud',
            error: error.message
        });
    }
});


// =========================================================
// 3. RECHAZAR SOLICITUD
// PUT /solicitudes-intercambio/:id/rechazar
// =========================================================
router.put('/:id/rechazar', async (req, res) => {
    try {
        const solicitudId = req.params.id;

        // Actualizar estado a 'Rechazada'
        await pool.query(
            'CALL sp_ActualizarEstadoSolicitud(?, ?)',
            [solicitudId, 'Rechazada']
        );

        res.json({
            success: true,
            message: 'Solicitud rechazada'
        });

    } catch (error) {
        console.error('Error al rechazar solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error al rechazar la solicitud',
            error: error.message
        });
    }
});


// =========================================================
// 4. CANCELAR SOLICITUD (por el solicitante)
// PUT /solicitudes-intercambio/:id/cancelar
// =========================================================
router.put('/:id/cancelar', async (req, res) => {
    try {
        const solicitudId = req.params.id;

        // Actualizar estado a 'Cancelada'
        await pool.query(
            'CALL sp_ActualizarEstadoSolicitud(?, ?)',
            [solicitudId, 'Cancelada']
        );

        res.json({
            success: true,
            message: 'Solicitud cancelada exitosamente'
        });

    } catch (error) {
        console.error('Error al cancelar solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar la solicitud',
            error: error.message
        });
    }
});


// =========================================================
// 5. ELIMINAR SOLICITUD
// DELETE /solicitudes-intercambio/:id
// =========================================================
router.delete('/:id', async (req, res) => {
    try {
        const solicitudId = req.params.id;

        await pool.query(
            'CALL sp_EliminarSolicitud(?)',
            [solicitudId]
        );

        res.json({
            success: true,
            message: 'Solicitud eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar solicitud:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la solicitud',
            error: error.message
        });
    }
});


// =========================================================
// 6. OBTENER TODAS LAS SOLICITUDES DE UN USUARIO
// GET /solicitudes-intercambio/usuario/:id
// Retorna solicitudes enviadas Y recibidas
// =========================================================
router.get('/usuario/:id', async (req, res) => {
    try {
        const personaId = req.params.id;

        const [results] = await pool.query(
            'CALL sp_ObtenerSolicitudesPorPersona(?)',
            [personaId]
        );

        // Los stored procedures devuelven un array de arrays
        const solicitudes = results[0];

        res.json({
            success: true,
            data: solicitudes
        });

    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las solicitudes',
            error: error.message
        });
    }
});


// =========================================================
// 7. OBTENER SOLICITUDES RECIBIDAS PENDIENTES
// GET /solicitudes-intercambio/recibidas/:id
// Solo las solicitudes que el usuario ha RECIBIDO y están PENDIENTES
// =========================================================
router.get('/recibidas/:id', async (req, res) => {
    try {
        const personaId = req.params.id;

        // Consulta directa con JOIN para obtener datos del solicitante y detalles de la solicitud
        // Sin JOIN de habilidades por ahora, se pueden agregar después si la tabla existe
        const [solicitudesRecibidas] = await pool.query(
            `SELECT 
                si.id_solicitud,
                si.id_persona_solicitante,
                si.id_persona_receptor,
                si.fecha_solicitud,
                si.estado,
                si.fecha_propuesta,
                si.hora_propuesta,
                si.duracion_estimada,
                si.mensaje_adicional,
                si.modalidad,
                si.id_habilidad_solicitada,
                si.id_habilidad_ofrecida,
                p_sol.nombre_Persona AS nombre_solicitante,
                p_sol.apellido_Persona AS apellido_solicitante,
                p_sol.imagenUrl_Persona AS foto_solicitante
            FROM solicitudes_intercambio si
            INNER JOIN Personas p_sol ON si.id_persona_solicitante = p_sol.id_Perfil_Persona
            WHERE si.id_persona_receptor = ? AND si.estado = 'Pendiente' AND si.id_persona_solicitante != ?
            ORDER BY si.fecha_solicitud DESC`,
            [personaId, personaId]
        );

        // Si hay habilidades, obtenerlas por separado
        for (let solicitud of solicitudesRecibidas) {
            if (solicitud.id_habilidad_ofrecida) {
                try {
                    const [habilidadOfrecida] = await pool.query(
                        'SELECT nombre_Habilidad FROM Habilidades_Ofrecidas_Necesitadas WHERE id_Habilidad = ?',
                        [solicitud.id_habilidad_ofrecida]
                    );
                    if (habilidadOfrecida.length > 0) {
                        solicitud.habilidad_ofrecida = habilidadOfrecida[0].nombre_Habilidad;
                    }
                } catch (error) {
                    console.log('No se pudo cargar habilidad ofrecida:', error.message);
                }
            }

            if (solicitud.id_habilidad_solicitada) {
                try {
                    const [habilidadSolicitada] = await pool.query(
                        'SELECT nombre_Habilidad FROM Habilidades_Ofrecidas_Necesitadas WHERE id_Habilidad = ?',
                        [solicitud.id_habilidad_solicitada]
                    );
                    if (habilidadSolicitada.length > 0) {
                        solicitud.habilidad_solicitada = habilidadSolicitada[0].nombre_Habilidad;
                    }
                } catch (error) {
                    console.log('No se pudo cargar habilidad solicitada:', error.message);
                }
            }
        }

        res.json({
            success: true,
            count: solicitudesRecibidas.length,
            data: solicitudesRecibidas
        });

    } catch (error) {
        console.error('Error al obtener solicitudes recibidas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener solicitudes recibidas',
            error: error.message
        });
    }
});


// =========================================================
// 8. OBTENER SOLICITUDES ENVIADAS PENDIENTES
// GET /solicitudes-intercambio/enviadas/:id
// Solo las solicitudes que el usuario ha ENVIADO y están PENDIENTES
// =========================================================
router.get('/enviadas/:id', async (req, res) => {
    try {
        const personaId = req.params.id;

        // Query directa con JOIN para obtener todos los datos incluyendo imágenes
        const [solicitudesEnviadas] = await pool.query(
            `SELECT 
                si.id_solicitud,
                si.id_persona_solicitante AS id_solicitante,
                si.id_persona_receptor AS id_receptor,
                si.estado,
                si.fecha_solicitud,
                
                p_rec.nombre_Persona AS nombre_receptor,
                p_rec.apellido_Persona AS apellido_receptor,
                p_rec.imagenUrl_Persona AS imagenUrl_receptor
                
            FROM solicitudes_intercambio si
            INNER JOIN Personas p_rec ON si.id_persona_receptor = p_rec.id_Perfil_Persona
            WHERE si.id_persona_solicitante = ?
              AND si.estado = 'Pendiente'
            ORDER BY si.fecha_solicitud DESC`,
            [personaId]
        );

        res.json({
            success: true,
            count: solicitudesEnviadas.length,
            data: solicitudesEnviadas
        });

    } catch (error) {
        console.error('Error al obtener solicitudes enviadas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener solicitudes enviadas',
            error: error.message
        });
    }
});


// 9. ENVIAR SOLICITUD DETALLADA CON CAMPOS OPCIONALES
// POST /solicitudes-intercambio/enviar-detallada
router.post('/enviar-detallada', async (req, res) => {
    try {
        const { 
            solicitanteId, 
            receptorId,
            fechaPropuesta,
            horaPropuesta,
            duracionEstimada,
            idHabilidadSolicitada,
            idHabilidadOfrecida,
            mensajeAdicional,
            modalidad
        } = req.body;

        console.log('   Solicitud detallada recibida:', {
            solicitanteId,
            receptorId,
            fechaPropuesta,
            horaPropuesta,
            duracionEstimada,
            idHabilidadSolicitada,
            idHabilidadOfrecida,
            modalidad
        });

        // Validación básica
        if (!solicitanteId || !receptorId) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren solicitanteId y receptorId'
            });
        }

        // Evitar auto-solicitud
        if (solicitanteId === receptorId) {
            return res.status(400).json({
                success: false,
                message: 'No puedes enviarte una solicitud a ti mismo'
            });
        }

        // Verificar si ya existe una solicitud activa entre estos usuarios
        const [solicitudesExistentes] = await pool.query(
            `SELECT s.id_solicitud, s.estado 
             FROM solicitudes_intercambio s
             LEFT JOIN conversaciones c ON c.id_solicitud = s.id_solicitud
             WHERE ((s.id_persona_solicitante = ? AND s.id_persona_receptor = ?) 
                OR (s.id_persona_solicitante = ? AND s.id_persona_receptor = ?))
             AND s.estado IN ('Pendiente', 'Aceptada')
             AND c.id_conversacion IS NOT NULL`,
            [solicitanteId, receptorId, receptorId, solicitanteId]
        );

        if (solicitudesExistentes.length > 0) {
            const solicitud = solicitudesExistentes[0];
            if (solicitud.estado === 'Aceptada') {
                return res.status(400).json({
                    success: false,
                    message: 'Ya tienes una conexión activa con este usuario'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una solicitud pendiente con este usuario'
                });
            }
        }

        // Convertir valores vacíos a null
        const habilidadSolicitada = idHabilidadSolicitada && idHabilidadSolicitada !== '' ? idHabilidadSolicitada : null;
        const habilidadOfrecida = idHabilidadOfrecida && idHabilidadOfrecida !== '' ? idHabilidadOfrecida : null;

        // Insertar solicitud con detalles
        const [result] = await pool.query(
            `INSERT INTO solicitudes_intercambio (
                id_persona_solicitante,
                id_persona_receptor,
                fecha_solicitud,
                estado,
                fecha_propuesta,
                hora_propuesta,
                duracion_estimada,
                id_habilidad_solicitada,
                id_habilidad_ofrecida,
                mensaje_adicional,
                modalidad
            ) VALUES (?, ?, NOW(), 'Pendiente', ?, ?, ?, ?, ?, ?, ?)`,
            [
                solicitanteId, 
                receptorId,
                fechaPropuesta || null,
                horaPropuesta || null,
                duracionEstimada || null,
                habilidadSolicitada,
                habilidadOfrecida,
                mensajeAdicional || null,
                modalidad || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Solicitud de intercambio enviada exitosamente',
            data: {
                id_solicitud: result.insertId
            }
        });

    } catch (error) {
        console.error('Error al enviar solicitud detallada:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar la solicitud',
            error: error.message
        });
    }
});

// =========================================================
// VERIFICAR SI EXISTE SOLICITUD ACTIVA ENTRE DOS USUARIOS
// GET /solicitudes-intercambio/verificar/:solicitanteId/:receptorId
// =========================================================
router.get('/verificar/:solicitanteId/:receptorId', async (req, res) => {
    try {
        const { solicitanteId, receptorId } = req.params;

        const [solicitudes] = await pool.query(
            `SELECT id_solicitud, estado, id_persona_solicitante, id_persona_receptor,
                    fecha_solicitud
             FROM solicitudes_intercambio 
             WHERE ((id_persona_solicitante = ? AND id_persona_receptor = ?) 
                OR (id_persona_solicitante = ? AND id_persona_receptor = ?))
             AND estado IN ('Pendiente', 'Aceptada')
             ORDER BY fecha_solicitud DESC
             LIMIT 1`,
            [solicitanteId, receptorId, receptorId, solicitanteId]
        );

        if (solicitudes.length > 0) {
            const solicitud = solicitudes[0];
            let mensaje = '';
            let esMiSolicitud = solicitud.id_persona_solicitante == solicitanteId;
            
            if (solicitud.estado === 'Aceptada') {
                mensaje = 'Ya tienes una conexión establecida con este usuario';
            } else if (esMiSolicitud) {
                mensaje = 'Ya enviaste una solicitud a este usuario';
            } else {
                mensaje = 'Este usuario ya te envió una solicitud. Revisa tus notificaciones.';
            }

            return res.json({
                success: true,
                existeSolicitud: true,
                solicitud: {
                    id: solicitud.id_solicitud,
                    estado: solicitud.estado,
                    esMiSolicitud: esMiSolicitud,
                    mensaje: mensaje
                }
            });
        }

        res.json({
            success: true,
            existeSolicitud: false,
            mensaje: 'No hay solicitudes activas con este usuario'
        });

    } catch (error) {
        console.error('Error al verificar solicitud:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


module.exports = router;