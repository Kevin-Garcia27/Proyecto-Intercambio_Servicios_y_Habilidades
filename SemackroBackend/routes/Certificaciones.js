/**
 * ========================================
 * RUTAS DE CERTIFICACIONES
 * Endpoints para gestionar formación y certificaciones de usuarios
 * ========================================
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// ============================================
// GET /certificaciones/persona/:id
// Obtener todas las certificaciones de una persona
// ============================================
router.get('/persona/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [certificaciones] = await db.execute(`
            SELECT 
                id_certificacion,
                id_Perfil_Persona,
                titulo_certificacion,
                institucion,
                url_certificado,
                fecha_registro
            FROM Certificaciones
            WHERE id_Perfil_Persona = ?
            ORDER BY fecha_registro DESC
        `, [id]);
        
        res.json({
            success: true,
            count: certificaciones.length,
            data: certificaciones
        });
        
    } catch (error) {
        console.error('Error al obtener certificaciones:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener certificaciones',
            details: error.message
        });
    }
});

// ============================================
// GET /certificaciones/:id
// Obtener una certificación específica por ID
// ============================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [certificaciones] = await db.execute(`
            SELECT 
                id_certificacion,
                id_Perfil_Persona,
                titulo_certificacion,
                institucion,
                url_certificado,
                fecha_registro
            FROM Certificaciones
            WHERE id_certificacion = ?
        `, [id]);
        
        if (certificaciones.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Certificación no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: certificaciones[0]
        });
        
    } catch (error) {
        console.error('Error al obtener certificación:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener certificación',
            details: error.message
        });
    }
});

// ============================================
// POST /certificaciones
// Crear una nueva certificación usando SP
// Body: { id_Perfil_Persona, titulo_certificacion, institucion, url_certificado }
// ============================================
router.post('/', async (req, res) => {
    const { id_Perfil_Persona, titulo_certificacion, institucion, url_certificado } = req.body;
    
    // Validaciones
    if (!id_Perfil_Persona) {
        return res.status(400).json({
            success: false,
            error: 'El campo id_Perfil_Persona es requerido'
        });
    }
    
    if (!titulo_certificacion || titulo_certificacion.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'El campo titulo_certificacion es requerido'
        });
    }
    
    try {
        // Usar el stored procedure sp_insertar_certificacion
        await db.execute(
            'CALL sp_insertar_certificacion(?, ?, ?, ?)',
            [id_Perfil_Persona, titulo_certificacion.trim(), institucion || null, url_certificado || null]
        );
        
        // Obtener la última certificación insertada
        const [ultima] = await db.execute(`
            SELECT * FROM Certificaciones 
            WHERE id_Perfil_Persona = ? 
            ORDER BY id_certificacion DESC 
            LIMIT 1
        `, [id_Perfil_Persona]);
        
        res.status(201).json({
            success: true,
            message: 'Certificación creada exitosamente',
            data: ultima[0]
        });
        
    } catch (error) {
        console.error('Error al crear certificación:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al crear certificación',
            details: error.message
        });
    }
});

// ============================================
// PUT /certificaciones/:id
// Actualizar una certificación existente
// Body: { titulo_certificacion, institucion, url_certificado }
// ============================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { titulo_certificacion, institucion, url_certificado } = req.body;
    
    try {
        // Verificar que la certificación existe
        const [existe] = await db.execute(
            'SELECT id_certificacion FROM Certificaciones WHERE id_certificacion = ?',
            [id]
        );
        
        if (existe.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Certificación no encontrada'
            });
        }
        
        // Construir la consulta de actualización dinámicamente
        const updates = [];
        const values = [];
        
        if (titulo_certificacion !== undefined) {
            updates.push('titulo_certificacion = ?');
            values.push(titulo_certificacion.trim());
        }
        if (institucion !== undefined) {
            updates.push('institucion = ?');
            values.push(institucion);
        }
        if (url_certificado !== undefined) {
            updates.push('url_certificado = ?');
            values.push(url_certificado);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionaron campos para actualizar'
            });
        }
        
        values.push(id);
        
        await db.execute(
            `UPDATE Certificaciones SET ${updates.join(', ')} WHERE id_certificacion = ?`,
            values
        );
        
        // Obtener la certificación actualizada
        const [actualizada] = await db.execute(
            'SELECT * FROM Certificaciones WHERE id_certificacion = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Certificación actualizada exitosamente',
            data: actualizada[0]
        });
        
    } catch (error) {
        console.error('Error al actualizar certificación:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar certificación',
            details: error.message
        });
    }
});

// ============================================
// DELETE /certificaciones/:id
// Eliminar una certificación
// ============================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Verificar que la certificación existe
        const [existe] = await db.execute(
            'SELECT id_certificacion, titulo_certificacion FROM Certificaciones WHERE id_certificacion = ?',
            [id]
        );
        
        if (existe.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Certificación no encontrada'
            });
        }
        
        await db.execute('DELETE FROM Certificaciones WHERE id_certificacion = ?', [id]);
        
        res.json({
            success: true,
            message: `Certificación "${existe[0].titulo_certificacion}" eliminada exitosamente`
        });
        
    } catch (error) {
        console.error('Error al eliminar certificación:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar certificación',
            details: error.message
        });
    }
});

module.exports = router;
