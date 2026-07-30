const pool = require('../db');

/**
 * Función helper para registrar acciones en la bitácora de auditoría.
 * @param {number} idUsuario - ID del usuario que realiza la acción
 * @param {string} accion - Acción realizada (ej. 'INICIO_SESION', 'CREAR_ORDEN')
 * @param {string} modulo - Módulo afectado (ej. 'Seguridad', 'Órdenes de Trabajo')
 * @param {string} detalles - Descripción adicional de la acción
 * @param {string} ip - Dirección IP del usuario (opcional)
 */
async function registrarAuditoria(idUsuario, accion, modulo, detalles, ip = '127.0.0.1') {
    try {
        if (!idUsuario) return; // Si no hay usuario, no se puede auditar quien lo hizo

        await pool.query(
            'CALL sp_RegistrarAccionBitacora(?, ?, ?, ?, ?)',
            [idUsuario, accion, modulo, detalles, ip]
        );
    } catch (error) {
        console.error('❌ Error al registrar en bitácora:', error);
        // No lanzamos el error para no romper el flujo principal de la app si la auditoría falla
    }
}

module.exports = registrarAuditoria;
