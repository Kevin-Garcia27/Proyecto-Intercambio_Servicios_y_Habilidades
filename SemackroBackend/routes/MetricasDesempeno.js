/**
 * ========================================
 * RUTAS DE MÉTRICAS DE DESEMPEÑO
 * Endpoints para gestionar métricas (puntualidad, calidad, limpieza, comunicación)
 * y estadísticas globales del dashboard
 * ========================================
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// ============================================
// GET /metricas-desempeno/ (Estadísticas Globales)
// Devuelve contadores para el dashboard
// ============================================
router.get('/', async (req, res) => {
    try {
        const [registrados] = await db.execute('SELECT COUNT(*) as count FROM Personas');
        const [disponibles] = await db.execute("SELECT COUNT(*) as count FROM Personas WHERE disponibilidad = 'Disponible'");
        const [en_obra] = await db.execute("SELECT COUNT(*) as count FROM Personas WHERE disponibilidad = 'En Obra'");
        
        // Obtener promedio global de métricas de desempeño
        const [metricas] = await db.execute(`
            SELECT 
                IFNULL(AVG(puntualidad), 0) as promedio_puntualidad,
                IFNULL(AVG(calidad_trabajo), 0) as promedio_calidad,
                IFNULL(AVG(limpieza), 0) as promedio_limpieza,
                IFNULL(AVG(comunicacion), 0) as promedio_comunicacion,
                COUNT(*) as total_registros
            FROM Metricas_Desempeno
            WHERE cantidad_calificaciones > 0
        `);
        
        // Simular o calcular reportes pendientes
        // En una implementación real vendría de una tabla de reportes
        const tecnicos_registrados = registrados[0].count;
        const tecnicos_disponibles = disponibles[0].count;
        const tecnicos_en_obra = en_obra[0].count; // Usamos esto para reportes pendientes según solicitud, o corregimos la semántica

        res.json({
            success: true,
            data: {
                tecnicos_registrados,
                tecnicos_disponibles,
                tecnicos_en_obra,
                metricas_promedio: {
                    puntualidad: Math.round(metricas[0].promedio_puntualidad),
                    calidad_trabajo: Math.round(metricas[0].promedio_calidad),
                    limpieza: Math.round(metricas[0].promedio_limpieza),
                    comunicacion: Math.round(metricas[0].promedio_comunicacion),
                    total_tecnicos_calificados: metricas[0].total_registros
                }
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas globales:', error.message);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// ============================================
// GET /metricas-desempeno/listado-tecnicos
// Obtener listado de técnicos con foto, especialidad y ubicación
// ============================================
router.get('/listado-tecnicos', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id_Perfil_Persona,
                p.nombre_Persona,
                p.apellido_Persona,
                p.imagenUrl_Persona,
                p.disponibilidad as estado,
                IFNULL(d.ciudad_Direccion, 'Sin ubicación') as ubicacion,
                (
                    SELECT GROUP_CONCAT(cat.nombre_Categoria SEPARATOR ', ')
                    FROM Habilidades_Servicios_Persona hs
                    JOIN Habilidades_Servicios h ON hs.id_Habilidad = h.id_Habilidad
                    JOIN Categorias_Generales_Habilidades cat ON h.id_Categoria = cat.id_Categoria
                    WHERE hs.id_Perfil_Persona = p.id_Perfil_Persona
                ) as especialidades,
                 -- Alternativa si solo queremos la categoría principal o habilidades directas
                (
                    SELECT GROUP_CONCAT(h.nombre_Habilidad SEPARATOR ', ')
                    FROM Habilidades_Servicios_Persona hs
                    JOIN Habilidades_Servicios h ON hs.id_Habilidad = h.id_Habilidad
                    WHERE hs.id_Perfil_Persona = p.id_Perfil_Persona
                ) as habilidades_nombres,
                (
                     SELECT CAST(GROUP_CONCAT(DISTINCT h.id_Categoria) AS CHAR)
                     FROM Habilidades_Servicios_Persona hs
                     JOIN Habilidades_Servicios h ON hs.id_Habilidad = h.id_Habilidad
                     WHERE hs.id_Perfil_Persona = p.id_Perfil_Persona
                ) as categorias_ids
            FROM Personas p
            LEFT JOIN Direcciones d ON p.id_Perfil_Persona = d.id_Perfil_Persona
            GROUP BY p.id_Perfil_Persona
        `;
        
        const [rows] = await db.execute(query);
        
        res.json({
            success: true,
            data: rows
        });
        
    } catch (error) {
        console.error('Error al obtener listado de técnicos:', error.message);
        res.status(500).json({ success: false, error: 'Error del servidor: ' + error.message });
    }
});

// ============================================
// GET /metricas/persona/:id
// Obtener las métricas de desempeño de una persona
// ============================================
router.get('/persona/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [metricas] = await db.execute(`
            SELECT 
                id_metrica,
                id_Perfil_Persona,
                IFNULL(puntualidad, 0) AS puntualidad,
                IFNULL(calidad_trabajo, 0) AS calidad_trabajo,
                IFNULL(limpieza, 0) AS limpieza,
                IFNULL(comunicacion, 0) AS comunicacion,
                IFNULL(cantidad_calificaciones, 1) AS cantidad_calificaciones
            FROM Metricas_Desempeno
            WHERE id_Perfil_Persona = ?
        `, [id]);
        
        if (metricas.length === 0) {
            // Si no hay métricas, devolver valores por defecto
            return res.json({
                success: true,
                data: {
                    id_Perfil_Persona: parseInt(id),
                    puntualidad: 0,
                    calidad_trabajo: 0,
                    limpieza: 0,
                    comunicacion: 0,
                    cantidad_calificaciones: 0
                }
            });
        }
        
        res.json({
            success: true,
            data: metricas[0]
        });
        
    } catch (error) {
        console.error('Error al obtener métricas:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener métricas de desempeño',
            details: error.message
        });
    }
});

// ============================================
// POST /metricas
// Crear o actualizar métricas usando SP
// Body: { id_Perfil_Persona, puntualidad, calidad_trabajo, limpieza, comunicacion }
// ============================================
router.post('/', async (req, res) => {
    const { id_Perfil_Persona, puntualidad, calidad_trabajo, limpieza, comunicacion } = req.body;
    
    // Validaciones
    if (!id_Perfil_Persona) {
        return res.status(400).json({
            success: false,
            error: 'El campo id_Perfil_Persona es requerido'
        });
    }
    
    // Validar que los valores estén entre 0 y 100
    const validarRango = (valor, nombre) => {
        const num = parseInt(valor) || 0;
        if (num < 0 || num > 100) {
            return `El campo ${nombre} debe estar entre 0 y 100`;
        }
        return null;
    };
    
    const errores = [
        validarRango(puntualidad, 'puntualidad'),
        validarRango(calidad_trabajo, 'calidad_trabajo'),
        validarRango(limpieza, 'limpieza'),
        validarRango(comunicacion, 'comunicacion')
    ].filter(e => e !== null);
    
    if (errores.length > 0) {
        return res.status(400).json({
            success: false,
            error: errores[0]
        });
    }
    
    try {
        // Usar el stored procedure sp_actualizar_metricas
        await db.execute(
            'CALL sp_actualizar_metricas(?, ?, ?, ?, ?)',
            [
                id_Perfil_Persona,
                parseInt(puntualidad) || 0,
                parseInt(calidad_trabajo) || 0,
                parseInt(limpieza) || 0,
                parseInt(comunicacion) || 0
            ]
        );
        
        // Obtener las métricas actualizadas
        const [metricas] = await db.execute(`
            SELECT * FROM Metricas_Desempeno WHERE id_Perfil_Persona = ?
        `, [id_Perfil_Persona]);
        
        res.status(201).json({
            success: true,
            message: 'Métricas actualizadas exitosamente',
            data: metricas[0]
        });
        
    } catch (error) {
        console.error('Error al actualizar métricas:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar métricas de desempeño',
            details: error.message
        });
    }
});

// ============================================
// PUT /metricas/persona/:id
// Actualizar métricas de una persona específica
// Body: { puntualidad, calidad_trabajo, limpieza, comunicacion, cantidad_calificaciones }
// ============================================
router.put('/persona/:id', async (req, res) => {
    const { id } = req.params;
    const { puntualidad, calidad_trabajo, limpieza, comunicacion, cantidad_calificaciones } = req.body;
    
    console.log('=======================================');
    console.log('📥 PUT /metricas/persona/' + id);
    console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));
    console.log('🔢 Valores extraídos:');
    console.log('   puntualidad:', puntualidad);
    console.log('   calidad_trabajo:', calidad_trabajo);
    console.log('   limpieza:', limpieza);
    console.log('   comunicacion:', comunicacion);
    console.log('   cantidad_calificaciones:', cantidad_calificaciones);
    console.log('=======================================');
    
    // Validar que los valores estén entre 0 y 100
    const validarRango = (valor) => {
        if (valor === undefined) return true;
        const num = parseInt(valor);
        return num >= 0 && num <= 100;
    };
    
    if (!validarRango(puntualidad) || !validarRango(calidad_trabajo) || 
        !validarRango(limpieza) || !validarRango(comunicacion)) {
        return res.status(400).json({
            success: false,
            error: 'Los valores de las métricas deben estar entre 0 y 100'
        });
    }
    
    try {
        // Verificar si ya existen métricas
        const [existe] = await db.execute(
            'SELECT id_metrica FROM Metricas_Desempeno WHERE id_Perfil_Persona = ?',
            [id]
        );
        
        if (existe.length === 0) {
            // Si no existen, crear nuevas
            await db.execute(`
                INSERT INTO Metricas_Desempeno (id_Perfil_Persona, puntualidad, calidad_trabajo, limpieza, comunicacion, cantidad_calificaciones)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                id,
                parseInt(puntualidad) || 0,
                parseInt(calidad_trabajo) || 0,
                parseInt(limpieza) || 0,
                parseInt(comunicacion) || 0,
                parseInt(cantidad_calificaciones) || 1
            ]);
        } else {
            // Construir la consulta de actualización dinámicamente
            const updates = [];
            const values = [];
            
            if (puntualidad !== undefined) {
                updates.push('puntualidad = ?');
                values.push(parseInt(puntualidad));
            }
            if (calidad_trabajo !== undefined) {
                updates.push('calidad_trabajo = ?');
                values.push(parseInt(calidad_trabajo));
            }
            if (limpieza !== undefined) {
                updates.push('limpieza = ?');
                values.push(parseInt(limpieza));
            }
            if (comunicacion !== undefined) {
                updates.push('comunicacion = ?');
                values.push(parseInt(comunicacion));
            }
            if (cantidad_calificaciones !== undefined) {
                updates.push('cantidad_calificaciones = ?');
                values.push(parseInt(cantidad_calificaciones));
            }
            
            if (updates.length > 0) {
                values.push(id);
                await db.execute(
                    `UPDATE Metricas_Desempeno SET ${updates.join(', ')} WHERE id_Perfil_Persona = ?`,
                    values
                );
            }
        }
        
        // Obtener las métricas actualizadas
        const [metricas] = await db.execute(
            'SELECT * FROM Metricas_Desempeno WHERE id_Perfil_Persona = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Métricas actualizadas exitosamente',
            data: metricas[0]
        });
        
    } catch (error) {
        console.error('Error al actualizar métricas:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar métricas de desempeño',
            details: error.message
        });
    }
});

// ============================================
// DELETE /metricas/persona/:id
// Eliminar métricas de una persona (resetear a 0)
// ============================================
router.delete('/persona/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await db.execute(
            'DELETE FROM Metricas_Desempeno WHERE id_Perfil_Persona = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'No se encontraron métricas para esta persona'
            });
        }
        
        res.json({
            success: true,
            message: 'Métricas eliminadas exitosamente'
        });
        
    } catch (error) {
        console.error('Error al eliminar métricas:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar métricas de desempeño',
            details: error.message
        });
    }
});

module.exports = router;
