import express from "express";
import db from '../db.js'; // Asumiendo que tu archivo db.js exporta la conexión por defecto

const router = express.Router ();


// Para obtener todas las notificaciones de un usuario (ordenadas por fecha descendente)
router.get('/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const [rows] = await db.query(
            `SELECT id, mensaje, leida, fecha 
             FROM notificaciones 
             WHERE user_id = ? 
             ORDER BY fecha DESC`,
            [user_id]
        );
        res.json(rows);

    } catch (error) {
        console.error("Error al obtener notificaciones:", error);
        res.status(500).json({ error: "Error al obtener notificaciones" });
    }
});


// ====================================================================
// B. POST: CREAR NOTIFICACIÓN (Se usa principalmente desde otro router)
// ====================================================================

// Esta ruta permite crear una notificación manualmente (aunque se recomienda hacerlo desde el router de calificaciones)
router.post('/', async (req, res) => {
    const { user_id, mensaje } = req.body;

    if (!user_id || !mensaje) {
        return res.status(400).json({ error: "Faltan datos obligatorios (user_id, mensaje)" });
    }

    try {
        await db.query(
            `INSERT INTO notificaciones (user_id, mensaje) 
             VALUES (?, ?)`,
            [user_id, mensaje]
        );

        res.status(201).json({ mensaje: "Notificación creada correctamente" });

    } catch (error) {
        console.error("Error al crear notificación:", error);
        res.status(500).json({ error: "Error al crear notificación" });
    }
});


// ====================================================================
// C. PUT/PATCH: MARCAR COMO LEÍDA (UPDATE)
// ====================================================================

// Usa PATCH para actualizar solo un campo ('leida')
router.patch('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            `UPDATE notificaciones SET leida = 1 WHERE id = ? AND leida = 0`,
            [id]
        );

        if (result.affectedRows === 0) {
            // Podría no encontrarla o ya estaba leída
            return res.status(404).json({ error: "Notificación no encontrada o ya leída" });
        }

        res.status(200).json({ mensaje: `Notificación eliminada correctamente` });

    } catch (error) {
        console.error("Error al actualizar notificación:", error);
        res.status(500).json({ error: "Error al actualizar notificación" });
    }
});


// ====================================================================
// /D. DELETE: ELIMINAR NOTIFICACIÓN POR ID
// ====================================================================

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            `DELETE FROM notificaciones WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Notificación no encontrada" });
        }

        res.status(200).json({ mensaje:` Notificación eliminada correctamente` });

    } catch (error) {
        console.error("Error al eliminar notificación:", error);
        res.status(500).json({ error: "Error al eliminar notificación" });
    }
});


export default router;