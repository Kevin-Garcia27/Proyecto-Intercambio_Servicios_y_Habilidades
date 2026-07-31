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

        const querySQL = `
            SELECT 
                b.ID_Bitacora,
                b.ID_Usuario,
                COALESCE(CONCAT(p.nombre_Persona, ' ', p.apellido_Persona), 'Sistema') AS NombreUsuario,
                p.imagenUrl AS imagenUrl_Persona,
                b.Accion,
                b.Modulo,
                b.Detalles,
                b.IP,
                b.Fecha
            FROM 
                BitacoraAcciones b
            LEFT JOIN 
                Usuarios u ON b.ID_Usuario = u.id_usuario
            LEFT JOIN 
                Personas p ON u.id_usuario = p.id_Usuario
            WHERE 
                (? IS NULL OR CONCAT(p.nombre_Persona, ' ', p.apellido_Persona) LIKE CONCAT('%', ?, '%'))
                AND (? IS NULL OR b.Modulo = ?)
                AND (? IS NULL OR b.Fecha >= ?)
                AND (? IS NULL OR b.Fecha <= ?)
            ORDER BY 
                b.Fecha DESC
            LIMIT 1000
        `;

        const [rows] = await pool.query(querySQL, [
            f_usuario, f_usuario,
            f_modulo, f_modulo,
            f_inicio, f_inicio,
            f_fin, f_fin
        ]);
        
        const registros = rows || [];

        res.json({ success: true, data: registros });
    } catch (error) {
        console.error('❌ Error al obtener bitácora:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al consultar la bitácora.' });
    }
});

module.exports = router;
