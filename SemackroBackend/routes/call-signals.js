/**
 * API de señalización de llamadas SIN SOCKETS
 * Usa polling + base de datos para señalización WebRTC
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * POST /api/call-signals/send
 * Envía una señal (offer/answer/candidate/notification)
 */
router.post('/send', async (req, res) => {
    try {
        const { id_mensaje, room_id, signal_type, sender_id, receiver_id, payload } = req.body;

        if (!room_id || !signal_type || !sender_id) {
            return res.status(400).json({ 
                success: false, 
                error: 'Faltan campos requeridos: room_id, signal_type, sender_id' 
            });
        }

        // Intentar con procedimiento almacenado
        try {
            const [result] = await pool.execute(
                'CALL sp_SendCallSignal(?, ?, ?, ?, ?, ?)',
                [
                    id_mensaje || null,
                    room_id,
                    signal_type,
                    sender_id,
                    receiver_id || null,
                    typeof payload === 'string' ? payload : JSON.stringify(payload)
                ]
            );

            return res.json({
                success: true,
                data: result[0] || { message: 'Signal sent' }
            });
        } catch (spError) {
            // Fallback: inserción directa
            console.warn('sp_SendCallSignal failed, using fallback:', spError.message);
            
            const [insertResult] = await pool.execute(
                `INSERT INTO call_signals 
                (id_mensaje, room_id, signal_type, sender_id, receiver_id, payload, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [
                    id_mensaje || null,
                    room_id,
                    signal_type,
                    sender_id,
                    receiver_id || null,
                    typeof payload === 'string' ? payload : JSON.stringify(payload)
                ]
            );

            return res.json({
                success: true,
                data: {
                    signal_id: insertResult.insertId,
                    message: 'Signal sent (fallback)'
                }
            });
        }
    } catch (error) {
        console.error('Error sending signal:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al enviar señal',
            details: error.message 
        });
    }
});

/**
 * GET /api/call-signals/pending/:receiver_id
 * Obtiene señales pendientes para un usuario (polling endpoint)
 */
router.get('/pending/:receiver_id', async (req, res) => {
    try {
        const { receiver_id } = req.params;

        if (!receiver_id) {
            return res.status(400).json({ 
                success: false, 
                error: 'receiver_id requerido' 
            });
        }

        // Intentar con procedimiento almacenado
        try {
            const [rows] = await pool.execute(
                'CALL sp_GetPendingSignals(?)',
                [receiver_id]
            );

            const signals = rows[0] || [];
            
            return res.json({
                success: true,
                count: signals.length,
                data: signals
            });
        } catch (spError) {
            // Fallback: consulta directa
            console.warn('sp_GetPendingSignals failed, using fallback:', spError.message);
            
            // Seleccionar primero
            const [signals] = await pool.execute(
                `SELECT 
                    id, id_mensaje, room_id, signal_type, 
                    sender_id, receiver_id, payload, status, created_at
                FROM call_signals
                WHERE receiver_id = ? AND status = 'pending'
                ORDER BY created_at ASC`,
                [receiver_id]
            );

            // Marcar como entregadas
            if (signals.length > 0) {
                await pool.execute(
                    `UPDATE call_signals 
                    SET status = 'delivered', delivered_at = NOW()
                    WHERE receiver_id = ? AND status = 'pending'`,
                    [receiver_id]
                );
            }

            return res.json({
                success: true,
                count: signals.length,
                data: signals
            });
        }
    } catch (error) {
        console.error('Error getting pending signals:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener señales',
            details: error.message 
        });
    }
});

/**
 * GET /api/call-signals/room/:room_id/:receiver_id
 * Obtiene todas las señales de una sala (para sincronizar ICE candidates)
 */
router.get('/room/:room_id/:receiver_id', async (req, res) => {
    try {
        const { room_id, receiver_id } = req.params;

        // Intentar con procedimiento almacenado
        try {
            const [rows] = await pool.execute(
                'CALL sp_GetSignalsByRoom(?, ?)',
                [room_id, receiver_id]
            );

            return res.json({
                success: true,
                data: rows[0] || []
            });
        } catch (spError) {
            // Fallback
            console.warn('sp_GetSignalsByRoom failed, using fallback:', spError.message);
            
            const [signals] = await pool.execute(
                `SELECT * FROM call_signals
                WHERE room_id = ? 
                  AND (receiver_id = ? OR receiver_id IS NULL)
                  AND signal_type IN ('offer', 'answer', 'candidate', 'call_accepted', 'call_rejected', 'call_ended')
                ORDER BY created_at ASC`,
                [room_id, receiver_id]
            );

            return res.json({
                success: true,
                data: signals
            });
        }
    } catch (error) {
        console.error('Error getting room signals:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener señales de sala',
            details: error.message 
        });
    }
});

/**
 * GET /api/call-signals/notification/:receiver_id
 * Obtiene notificación de llamada entrante (para mostrar UI de aceptar/rechazar)
 */
router.get('/notification/:receiver_id', async (req, res) => {
    try {
        const { receiver_id } = req.params;

        // Intentar con procedimiento almacenado
        try {
            const [rows] = await pool.execute(
                'CALL sp_GetCallNotification(?)',
                [receiver_id]
            );

            const notification = rows[0] && rows[0][0] ? rows[0][0] : null;

            return res.json({
                success: true,
                data: notification,
                has_incoming_call: !!notification
            });
        } catch (spError) {
            // Fallback
            console.warn('sp_GetCallNotification failed, using fallback:', spError.message);
            
            const [notifications] = await pool.execute(
                `SELECT 
                    cs.id,
                    cs.id_mensaje,
                    cs.room_id,
                    cs.sender_id,
                    cs.payload,
                    cs.created_at,
                    p.nombre_Persona AS caller_name,
                    p.apellido_Persona AS caller_apellido,
                    p.imagenUrl_Persona AS caller_photo
                FROM call_signals cs
                LEFT JOIN Personas p ON p.id_Perfil_Persona = cs.sender_id
                WHERE cs.receiver_id = ?
                  AND cs.signal_type = 'call_notification'
                  AND cs.status = 'pending'
                ORDER BY cs.created_at DESC
                LIMIT 1`,
                [receiver_id]
            );

            const notification = notifications.length > 0 ? notifications[0] : null;

            return res.json({
                success: true,
                data: notification,
                has_incoming_call: !!notification
            });
        }
    } catch (error) {
        console.error('Error getting call notification:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener notificación',
            details: error.message 
        });
    }
});

/**
 * POST /api/call-signals/mark-processed
 * Marca señales como procesadas
 */
router.post('/mark-processed', async (req, res) => {
    try {
        const { signal_ids } = req.body; // Array de IDs

        if (!signal_ids || !Array.isArray(signal_ids) || signal_ids.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'signal_ids array requerido' 
            });
        }

        const idsString = signal_ids.join(',');

        // Intentar con procedimiento almacenado
        try {
            const [result] = await pool.execute(
                'CALL sp_MarkSignalsProcessed(?)',
                [idsString]
            );

            return res.json({
                success: true,
                data: result[0] || {}
            });
        } catch (spError) {
            // Fallback
            console.warn('sp_MarkSignalsProcessed failed, using fallback:', spError.message);
            
            const placeholders = signal_ids.map(() => '?').join(',');
            const [result] = await pool.execute(
                `UPDATE call_signals SET status = 'processed' WHERE id IN (${placeholders})`,
                signal_ids
            );

            return res.json({
                success: true,
                data: { rows_updated: result.affectedRows }
            });
        }
    } catch (error) {
        console.error('Error marking signals processed:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al marcar señales',
            details: error.message 
        });
    }
});

module.exports = router;
