const express = require('express');
const router = express.Router();
const pool = require('../db');
const verificarPermiso = require('../middlewares/verificarPermiso');

// Endpoint para obtener la bitácora con filtros
// Protegido: Solo usuarios con permiso VER_BITACORA pueden acceder
router.get('/', verificarPermiso('VER_BITACORA'), async (req, res) => {
    try {
        const { usuario, modulo, fechaInicio, fechaFin } = req.query;
        
        const f_usuario = usuario || null;
        const f_modulo = modulo || null;
        const f_inicio = fechaInicio ? new Date(fechaInicio) : null;
        const f_fin = fechaFin ? new Date(fechaFin) : null;

        const [rows] = await pool.query(
            'CALL sp_ObtenerBitacora(?, ?, ?, ?)',
            [f_usuario, f_modulo, f_inicio, f_fin]
        );

        // Los SP en MySQL devuelven un array de arrays (el primero es el resultset)
        const registros = rows[0] || [];

        res.json({ success: true, data: registros });
    } catch (error) {
        console.error('❌ Error al obtener bitácora:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al consultar la bitácora.' });
    }
});

module.exports = router;
