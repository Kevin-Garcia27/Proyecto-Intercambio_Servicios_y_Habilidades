/**
 * ========================================
 * RUTAS DE PERFIL COMPLETO
 * Endpoint para obtener toda la información del perfil:
 * - Datos personales
 * - Métricas de desempeño (progress bars)
 * - Certificaciones
 * - Estadísticas (calificaciones, intercambios)
 * ========================================
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// ============================================
// GET /perfil-completo/:id
// Obtener perfil completo de una persona usando SP
// ============================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // 1. Usar el stored procedure sp_obtener_perfil_completo
        const [resultados] = await db.execute('CALL sp_obtener_perfil_completo(?)', [id]);
        
        // El SP puede devolver múltiples filas (una por cada certificación)
        // Necesitamos agrupar las certificaciones
        const filas = resultados[0] || [];
        
        if (filas.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Persona no encontrada'
            });
        }
        
        // Tomar los datos de métricas de la primera fila
        const metricas = {
            puntualidad: filas[0].puntualidad || 0,
            calidad_trabajo: filas[0].calidad_trabajo || 0,
            limpieza: filas[0].limpieza || 0,
            comunicacion: filas[0].comunicacion || 0
        };
        
        // Agrupar certificaciones (pueden haber múltiples)
        const certificaciones = filas
            .filter(f => f.titulo_certificacion !== null)
            .map(f => ({
                titulo_certificacion: f.titulo_certificacion,
                institucion: f.institucion,
                url_certificado: f.url_certificado,
                fecha_registro: f.fecha_registro
            }));
        
        // 2. Obtener datos adicionales de la persona
        const [personaData] = await db.execute(`
            SELECT 
                id_Perfil_Persona,
                nombre_Persona,
                apellido_Persona,
                fechaNac_Persona,
                genero_Persona,
                estadoCivil_Persona,
                imagenUrl_Persona,
                imagen1Url_Persona,
                imagen2Url_Persona,
                imagen3Url_Persona,
                descripcionPerfil_Persona,
                disponibilidad,
                id_Usuario
            FROM Personas
            WHERE id_Perfil_Persona = ?
        `, [id]);
        
        if (personaData.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Persona no encontrada'
            });
        }
        
        // 3. Calcular años de experiencia (si tienes el campo, sino calculamos)
        // Por ahora, usamos un campo calculado o lo obtenemos de alguna tabla
        let aniosExperiencia = 0;
        
        // Si tienes el campo anios_experiencia en la tabla Personas:
        // aniosExperiencia = personaData[0].anios_experiencia || 0;
        
        // Alternativamente, calcular basado en la primera certificación:
        if (certificaciones.length > 0) {
            const fechaMasAntigua = certificaciones.reduce((min, cert) => {
                const fecha = new Date(cert.fecha_registro);
                return fecha < min ? fecha : min;
            }, new Date());
            
            const ahora = new Date();
            aniosExperiencia = Math.floor((ahora - fechaMasAntigua) / (1000 * 60 * 60 * 24 * 365));
        }
        
        // 4. Obtener estadísticas de intercambios
        let estadisticas = {
            promedio_calificacion: 0,
            total_calificaciones: 0,
            total_intercambios_completados: 0
        };
        
        try {
            const [statsResult] = await db.execute(`
                SELECT 
                    COALESCE(AVG(i.calificacion), 0) AS promedio_calificacion,
                    COUNT(CASE WHEN i.calificacion IS NOT NULL THEN 1 END) AS total_calificaciones,
                    COUNT(*) AS total_intercambios_completados
                FROM Intercambios i
                WHERE i.id_Receptor = ? AND i.estado = 'finalizado'
            `, [id]);
            
            if (statsResult.length > 0) {
                estadisticas = {
                    promedio_calificacion: parseFloat(statsResult[0].promedio_calificacion) || 0,
                    total_calificaciones: parseInt(statsResult[0].total_calificaciones) || 0,
                    total_intercambios_completados: parseInt(statsResult[0].total_intercambios_completados) || 0
                };
            }
        } catch (e) {
            console.log('No se pudieron obtener estadísticas:', e.message);
        }
        
        res.json({
            success: true,
            data: {
                persona: personaData[0],
                metricas: metricas,
                certificaciones: certificaciones,
                anios_experiencia: aniosExperiencia,
                estadisticas: estadisticas
            }
        });
        
    } catch (error) {
        console.error('Error al obtener perfil completo:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener perfil completo',
            details: error.message
        });
    }
});

// ============================================
// GET /perfil-completo/:id/metricas
// Obtener solo las métricas de una persona
// ============================================
router.get('/:id/metricas', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [metricas] = await db.execute(`
            SELECT 
                IFNULL(puntualidad, 0) AS puntualidad,
                IFNULL(calidad_trabajo, 0) AS calidad_trabajo,
                IFNULL(limpieza, 0) AS limpieza,
                IFNULL(comunicacion, 0) AS comunicacion
            FROM Metricas_Desempeno
            WHERE id_Perfil_Persona = ?
        `, [id]);
        
        if (metricas.length === 0) {
            return res.json({
                success: true,
                data: {
                    puntualidad: 0,
                    calidad_trabajo: 0,
                    limpieza: 0,
                    comunicacion: 0
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
            error: 'Error al obtener métricas',
            details: error.message
        });
    }
});

// ============================================
// GET /perfil-completo/:id/certificaciones
// Obtener solo las certificaciones de una persona
// ============================================
router.get('/:id/certificaciones', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [certificaciones] = await db.execute(`
            SELECT 
                id_certificacion,
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

module.exports = router;
