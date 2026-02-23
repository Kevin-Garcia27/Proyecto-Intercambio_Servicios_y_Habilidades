const express = require('express');
const router = express.Router();
const db = require('../db');

// Crear solicitud de verificación
router.post('/', async (req, res) => {
    const { id_Perfil } = req.body;
    if (!id_Perfil) return res.status(400).json({ error: 'Falta id_Perfil' });
    try {
        // Evitar duplicados pendientes
        const [existe] = await db.query(
            'SELECT id FROM solicitud_verificacion WHERE id_Perfil = ? AND estado = "pendiente"',
            [id_Perfil]
        );
        if (existe && existe.length > 0) {
            return res.status(409).json({ error: 'Ya existe una solicitud pendiente' });
        }
        await db.query(
            'INSERT INTO solicitud_verificacion (id_Perfil) VALUES (?)',
            [id_Perfil]
        );
        res.json({ ok: true, mensaje: 'Solicitud registrada correctamente' });
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar la solicitud' });
    }
});

// Obtener todas las solicitudes (admin)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM solicitud_verificacion');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener las solicitudes' });
    }
});

// Obtener solicitudes de un usuario
router.get('/usuario/:id_Perfil', async (req, res) => {
    const { id_Perfil } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM solicitud_verificacion WHERE id_Perfil = ?', [id_Perfil]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener las solicitudes del usuario' });
    }
});

// Actualizar estado de la solicitud (admin)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { estado, revisado_por, comentario_admin } = req.body;
    if (!estado) return res.status(400).json({ error: 'Falta estado' });
    try {
        await db.query(
            'UPDATE solicitud_verificacion SET estado = ?, fecha_revision = NOW(), revisado_por = ?, comentario_admin = ? WHERE id = ?',
            [estado, revisado_por || null, comentario_admin || null, id]
        );
        res.json({ ok: true, mensaje: 'Solicitud actualizada' });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar la solicitud' });
    }
});

// Eliminar solicitud (admin)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM solicitud_verificacion WHERE id = ?', [id]);
        res.json({ ok: true, mensaje: 'Solicitud eliminada' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar la solicitud' });
    }
});
// Obtener perfil con estado de verificación
router.get('/perfil/:id_Perfil', async (req, res) => {
    const { id_Perfil } = req.params;
    try {
        const [rows] = await db.query('CALL perfil_con_verificacion(?)', [id_Perfil]);
        // El resultado de un CALL es un array de arrays, el primero es el resultado
        const perfil = rows[0][0] || null;
        res.json(perfil);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener el perfil con verificación' });
    }
});

// Recomendaciones de usuarios por habilidades requeridas
// GET /api/verificacion-usuarios/recomendaciones/:id_Perfil
router.get('/recomendaciones/:id_Perfil', async (req, res) => {
   const { id_Perfil } = req.params;
   try {
       // 1. Obtener IDs de habilidades requeridas por el usuario actual
       const [habilidadesReq] = await db.query(
           'SELECT id_categorias_Habilidades_Servicios FROM habilidades_persona WHERE id_Perfil = ? AND tipoEstado_Habilidad = "Necesita"',
           [id_Perfil]
       );
       if (!habilidadesReq || habilidadesReq.length === 0) {
           return res.json([]);
       }
       const idsCategorias = habilidadesReq.map(h => h.id_categorias_Habilidades_Servicios);
       // 2. Buscar usuarios que ofrezcan esas habilidades
       const [usuarios] = await db.query(
           `SELECT p.id_Perfil_Persona, p.nombre_Persona, p.apellido_Persona, p.imagenUrl_Persona, h.nombre_Habilidad, h.id_categorias_Habilidades_Servicios
            FROM Personas p
            JOIN habilidades_persona h ON p.id_Perfil_Persona = h.id_Perfil
            WHERE h.tipoEstado_Habilidad = "Ofrece"
            AND h.id_categorias_Habilidades_Servicios IN (?)
            AND p.id_Perfil_Persona != ?
            GROUP BY p.id_Perfil_Persona, h.id_categorias_Habilidades_Servicios`,
           [idsCategorias, id_Perfil]
       );
       res.json(usuarios);
   } catch (err) {
       res.status(500).json({ error: 'Error al buscar recomendaciones' });
   }
});
module.exports = router;