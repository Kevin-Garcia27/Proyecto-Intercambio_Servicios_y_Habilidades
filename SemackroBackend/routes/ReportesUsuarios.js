const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/reportes
router.post('/', async (req, res) => {
    const { reporter_id, reported_user_id, id_perfil_persona, motivo_descripcion, descripcion } = req.body;

    if (!reporter_id || !reported_user_id || !id_perfil_persona || !motivo_descripcion) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para el reporte.' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO ReportesUsuarios (reporter_id, reported_user_id, id_perfil_persona, motivo_descripcion, descripcion)
             VALUES (?, ?, ?, ?, ?)`,
            [reporter_id, reported_user_id, id_perfil_persona, motivo_descripcion, descripcion || null]
        );

        res.status(201).json({
            mensaje: 'Reporte creado exitosamente.',
            id_reporte: result.insertId || null
        });

    } catch (error) {
        console.error('Error al crear reporte:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});


// GET /api/reportes/all
router.get('/all', async (req, res) => {
    try {
        // Obtener reportes con datos del usuario reportado y del reportero
        const [rows] = await db.query(
            `SELECT r.*, p.nombre_Persona AS reported_nombre, p.apellido_Persona AS reported_apellido,
                ur.correo AS reporter_correo, ued.correo AS reported_correo
             FROM ReportesUsuarios r
             LEFT JOIN Personas p ON r.id_perfil_persona = p.id_perfil_persona
             LEFT JOIN Usuarios ur ON r.reporter_id = ur.id_usuario
             LEFT JOIN Usuarios ued ON r.reported_user_id = ued.id_usuario
             ORDER BY r.fecha_reporte DESC`
        );

        res.status(200).json(rows || []);
    } catch (error) {
        console.error('Error al obtener todos los reportes:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// GET /api/reportes/user/:reported_user_id
router.get('/user/:reported_user_id', async (req, res) => {
    const { reported_user_id } = req.params;

    try {
        const [rows] = await db.query(
            `SELECT r.*, p.nombre_Persona AS reported_nombre, p.apellido_Persona AS reported_apellido,
                    ur.correo AS reporter_correo
             FROM ReportesUsuarios r
             LEFT JOIN Personas p ON r.id_perfil_persona = p.id_perfil_persona
             LEFT JOIN Usuarios ur ON r.reporter_id = ur.id_usuario
             WHERE r.reported_user_id = ?
             ORDER BY r.fecha_reporte DESC`,
            [reported_user_id]
        );

        res.status(200).json(rows || []);
    } catch (error) {
        console.error('Error al obtener reportes del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// PUT /api/reportes/:id_reporte/estado
router.put('/:id_reporte/estado', async (req, res) => {
    const { id_reporte } = req.params;
    const { nuevo_estado } = req.body; // El cuerpo debe enviar el nuevo estado

    if (!nuevo_estado) {
        return res.status(400).json({ error: 'El campo nuevo_estado es requerido.' });
    }

    // Opcional: Validar que el nuevo_estado sea uno permitido (ej: 'Resuelto', 'Desestimado')

    try {
        const [result] = await db.query('UPDATE ReportesUsuarios SET estado = ? WHERE id_reporte = ?', [nuevo_estado, id_reporte]);
        if (result.affectedRows === 0) return res.status(404).json({ error: `Reporte ${id_reporte} no encontrado.` });

        res.status(200).json({
            mensaje: `Estado del reporte ${id_reporte} actualizado a ${nuevo_estado}.`
        });
    } catch (error) {
        console.error('Error al actualizar estado del reporte:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});


// DELETE /api/reportes/:id_reporte
router.delete('/:id_reporte', async (req, res) => {
    const { id_reporte } = req.params;

    try {
        const [result] = await db.query('DELETE FROM ReportesUsuarios WHERE id_reporte = ?', [id_reporte]);
        if (result.affectedRows === 0) return res.status(404).json({ error: `No se encontró reporte con ID ${id_reporte}.` });

        res.status(200).json({ mensaje: `Reporte ${id_reporte} eliminado exitosamente.` });
    } catch (error) {
        console.error('Error al eliminar reporte:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;