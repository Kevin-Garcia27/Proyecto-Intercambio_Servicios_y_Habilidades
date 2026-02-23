// =============================================
// Rutas para el manejo de Favoritos
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/favoritos/:idPerfilPersona
// Nota: El parámetro es id_Perfil_Persona, no id_Usuario
router.get('/:idPerfilPersona', async (req, res) => {
    const { idPerfilPersona } = req.params;
    
    try {
        // Usar el stored procedure existente
        const [results] = await db.query('CALL sp_obtener_favoritos(?)', [idPerfilPersona]);
        
        // Los procedimientos almacenados devuelven múltiples resultsets
        const favoritos = results[0] || [];
        
        
        const favoritosFormateados = favoritos.map(fav => ({
            id_favorito: fav.id_favorito,
            id_persona: fav.id_Perfil_Persona_Favorito,
            nombre: fav.nombre_Persona + ' ' + fav.apellido_Persona,
            imagen: fav.imagenUrl_Persona,
            descripcion: fav.descripcionPerfil_Persona,
            notas: fav.notas,
            fecha_agregado: fav.fecha_agregado
        }));
        
        
        res.json({
            success: true,
            total: favoritosFormateados.length,
            favoritos: favoritosFormateados
        });
    } catch (err) {
        res.status(500).json({ success: false, mensaje: 'Error al obtener favoritos', error: err.message });
    }
});

// POST /api/favoritos/toggle
router.post('/toggle', async (req, res) => {
    const { id_persona, id_persona_favorito } = req.body;
    
    if (!id_persona || !id_persona_favorito) {
        return res.status(400).json({ success: false, mensaje: 'Faltan parámetros' });
    }
    
    // Validar que no intente agregarse a sí mismo
    if (id_persona === id_persona_favorito) {
        return res.status(400).json({ success: false, mensaje: 'No puedes agregarte a ti mismo como favorito' });
    }
    
    
    try {
        // 1. Verificar si existe
        const [verificarResults] = await db.query('CALL sp_verificar_favorito(?, ?)', [id_persona, id_persona_favorito]);
        const verificacion = verificarResults[0][0];
        console.log('Verificacion:', verificacion);
        
        // 2. Si existe y está activo: eliminar (desactivar)
        if (verificacion.existe > 0 && verificacion.estado === 'activo') {
            const [eliminarResults] = await db.query('CALL sp_eliminar_favorito(?, ?)', [id_persona, id_persona_favorito]);
            const resultado = eliminarResults[0][0];
            
            console.log('Favorito eliminado');
            return res.status(200).json({
                success: true,
                accion: resultado.accion,
                mensaje: resultado.mensaje,
                es_favorito: false
            });
        } 
        // 3. Si no existe o está inactivo: agregar/reactivar
        else {
            const [agregarResults] = await db.query('CALL sp_agregar_favorito(?, ?)', [id_persona, id_persona_favorito]);
            const resultado = agregarResults[0][0];
            
            console.log('Favorito agregado/reactivado');
            return res.status(201).json({
                success: true,
                accion: resultado.accion,
                mensaje: resultado.mensaje,
                es_favorito: true
            });
        }
        
        
    } catch (err) {
        
        // Manejo específico de errores de foreign key
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ 
                success: false, 
                mensaje: 'Usuario no encontrado. Verifica que ambos usuarios existan.' 
            });
        }
        
        return res.status(500).json({ 
            success: false, 
            mensaje: 'Error al procesar', 
            error: err.sqlMessage || err.message 
        });
    }
});

// GET /api/favoritos/conteo-seguidores/:idPerfilPersona
// Cuenta cuántos usuarios tienen a este perfil en sus favoritos
router.get('/conteo-seguidores/:idPerfilPersona', async (req, res) => {
    const { idPerfilPersona } = req.params;
    
    try {
        // Contar cuántos registros de favoritos tienen este id_Perfil_Persona_Favorito
        const [results] = await db.query(
            `SELECT COUNT(*) as total 
             FROM Favoritos 
             WHERE id_Perfil_Persona_Favorito = ? AND estado = 'activo'`,
            [idPerfilPersona]
        );
        
        const total = results[0].total;
        
        res.json({
            success: true,
            total: total
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al contar seguidores', 
            error: err.message 
        });
    }
});

module.exports = router;