// =============================================
// Rutas para el manejo de Intercambios Finalizados y Calificaciones
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db');

// =========================================================
// 1. FINALIZAR INTERCAMBIO
// POST /api/intercambios/finalizar
// Body: { id_conversacion, id_persona_finalizador, id_persona_otro }
// =========================================================
router.post('/finalizar', async (req, res) => {
    const { id_conversacion, id_persona_finalizador, id_persona_otro } = req.body;
    
    console.log('Body:', req.body);
    
    try {
        // Validación
        if (!id_conversacion || !id_persona_finalizador || !id_persona_otro) {
            return res.status(400).json({
                success: false,
                mensaje: 'Faltan parámetros requeridos'
            });
        }

        // 1. Obtener información de la conversación
        const [conversacion] = await db.query(
            `SELECT * FROM conversaciones WHERE id_conversacion = ?`,
            [id_conversacion]
        );

        if (conversacion.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Conversación no encontrada'
            });
        }

        const conv = conversacion[0];
        
        // 1.1 Obtener información de la solicitud relacionada si existe
        let solicitudInfo = { modalidad: 'Virtual' };
        if (conv.id_solicitud) {
            const [solicitud] = await db.query(
                `SELECT id_solicitud, id_habilidad_ofrecida, id_habilidad_solicitada, modalidad 
                 FROM solicitudes_intercambio WHERE id_solicitud = ?`,
                [conv.id_solicitud]
            );
            if (solicitud.length > 0) {
                solicitudInfo = solicitud[0];
            }
        }
        
        const id_solicitud = conv.id_solicitud || null;

        // 2. Insertar en Intercambios_Finalizados
        const [result] = await db.query(
            `INSERT INTO Intercambios_Finalizados (
                id_solicitud_intercambio,
                id_persona_1,
                id_persona_2,
                fecha_finalizacion,
                id_habilidad_persona1,
                id_habilidad_persona2,
                modalidad,
                finalizado_por,
                estado
            ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, 'Completado')`,
            [
                id_solicitud,
                conv.id_persona_1 || id_persona_finalizador,
                conv.id_persona_2 || id_persona_otro,
                solicitudInfo.id_habilidad_solicitada || null,
                solicitudInfo.id_habilidad_ofrecida || null,
                solicitudInfo.modalidad || 'Virtual',
                id_persona_finalizador
            ]
        );

        const id_intercambio = result.insertId;

        // 2.5. VERIFICAR QUE SE INSERTÓ CORRECTAMENTE
        const [verificacion] = await db.query(
            'SELECT * FROM Intercambios_Finalizados WHERE id_intercambio = ?',
            [id_intercambio]
        );

        // 3. Eliminar la conversación y sus mensajes
        await db.query('DELETE FROM mensajes WHERE id_conversacion = ?', [id_conversacion]);
        await db.query('DELETE FROM conversaciones WHERE id_conversacion = ?', [id_conversacion]);

        // 4. Marcar la solicitud como 'Completado' para permitir nuevas solicitudes
        if (id_solicitud) {
            await db.query(
                `UPDATE solicitudes_intercambio 
                 SET estado = 'Completado' 
                 WHERE id_solicitud = ?`,
                [id_solicitud]
            );
            console.log('✅ Solicitud marcada como Completado. ID:', id_solicitud);
        }

     
        res.json({
            success: true,
            mensaje: 'Intercambio finalizado exitosamente',
            intercambio: {
                id_intercambio,
                id_persona_1: conv.id_persona_1 || id_persona_finalizador,
                id_persona_2: conv.id_persona_2 || id_persona_otro
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al finalizar intercambio',
            error: error.message
        });
    }
});

// =========================================================
// 2. CALIFICAR INTERCAMBIO
// POST /api/intercambios/calificar
// Body: { id_intercambio, id_persona_calificadora, id_persona_calificada, puntuacion, comentario }
// =========================================================
router.post('/calificar', async (req, res) => {
    const { id_intercambio, id_persona_calificadora, id_persona_calificada, puntuacion, comentario } = req.body;
    
    console.log('Body:', req.body);
    
    try {
        // Validación
        if (!id_intercambio || !id_persona_calificadora || !id_persona_calificada || !puntuacion) {
            return res.status(400).json({
                success: false,
                mensaje: 'Faltan parámetros requeridos'
            });
        }

        // Validar rango de puntuación
        if (puntuacion < 1 || puntuacion > 5) {
            return res.status(400).json({
                success: false,
                mensaje: 'La puntuación debe estar entre 1 y 5'
            });
        }

        // Verificar que no se califique a sí mismo
        if (id_persona_calificadora == id_persona_calificada) {
            return res.status(400).json({
                success: false,
                mensaje: 'No puedes calificarte a ti mismo'
            });
        }

        // Verificar que el intercambio existe
        const [intercambio] = await db.query(
            'SELECT * FROM Intercambios_Finalizados WHERE id_intercambio = ?',
            [id_intercambio]
        );

        if (intercambio.length === 0) {
            // Verificar todos los intercambios para debug
            const [todos] = await db.query('SELECT id_intercambio FROM Intercambios_Finalizados ORDER BY id_intercambio DESC LIMIT 10');
            
            return res.status(404).json({
                success: false,
                mensaje: 'Intercambio no encontrado'
            });
        }

        // Verificar que la persona calificadora participó en el intercambio
        const inter = intercambio[0];
        if (inter.id_persona_1 != id_persona_calificadora && inter.id_persona_2 != id_persona_calificadora) {
            return res.status(403).json({
                success: false,
                mensaje: 'No tienes permiso para calificar este intercambio'
            });
        }

        // Insertar calificación
        const [result] = await db.query(
            `INSERT INTO Calificaciones_Intercambio (
                id_intercambio,
                id_persona_calificadora,
                id_persona_calificada,
                puntuacion,
                comentario,
                visible
            ) VALUES (?, ?, ?, ?, ?, TRUE)`,
            [id_intercambio, id_persona_calificadora, id_persona_calificada, puntuacion, comentario]
        );


        res.json({
            success: true,
            mensaje: 'Calificación registrada exitosamente',
            calificacion: {
                id_calificacion: result.insertId,
                puntuacion,
                comentario
            }
        });

    } catch (error) {
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                mensaje: 'Ya calificaste este intercambio'
            });
        }

        res.status(500).json({
            success: false,
            mensaje: 'Error al registrar calificación',
            error: error.message
        });
    }
});

// =========================================================
// 3. OBTENER HISTORIAL DE INTERCAMBIOS DE UNA PERSONA
// GET /api/intercambios/historial/:idPersona?page=1&limit=10
// =========================================================
router.get('/historial/:idPersona', async (req, res) => {
    const { idPersona } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    
    try {
        // Contar total de intercambios
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total 
             FROM Intercambios_Finalizados 
             WHERE id_persona_1 = ? OR id_persona_2 = ?`,
            [idPersona, idPersona]
        );
        
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        // Obtener intercambios con paginación
        const [intercambios] = await db.query(
            `SELECT 
                i.id_intercambio,
                i.fecha_finalizacion,
                i.duracion_real,
                i.modalidad,
                i.estado,
                i.id_persona_1,
                i.id_persona_2,
                
                -- Persona 1
                p1.nombre_Persona AS nombre_persona1,
                p1.apellido_Persona AS apellido_persona1,
                p1.imagenUrl_Persona AS imagen_persona1,
                
                -- Persona 2
                p2.nombre_Persona AS nombre_persona2,
                p2.apellido_Persona AS apellido_persona2,
                p2.imagenUrl_Persona AS imagen_persona2,
                
                -- Habilidades
                h1.nombre_Habilidad AS habilidad_persona1,
                h2.nombre_Habilidad AS habilidad_persona2,
                
                -- Calificaciones
                c1.puntuacion AS mi_calificacion,
                c1.comentario AS mi_comentario,
                c2.puntuacion AS calificacion_recibida,
                c2.comentario AS comentario_recibido
                
            FROM Intercambios_Finalizados i
            INNER JOIN Personas p1 ON i.id_persona_1 = p1.id_Perfil_Persona
            INNER JOIN Personas p2 ON i.id_persona_2 = p2.id_Perfil_Persona
            LEFT JOIN Habilidades_Ofrecidas_Necesitadas h1 ON i.id_habilidad_persona1 = h1.id_Habilidad
            LEFT JOIN Habilidades_Ofrecidas_Necesitadas h2 ON i.id_habilidad_persona2 = h2.id_Habilidad
            LEFT JOIN Calificaciones_Intercambio c1 ON i.id_intercambio = c1.id_intercambio AND c1.id_persona_calificadora = ?
            LEFT JOIN Calificaciones_Intercambio c2 ON i.id_intercambio = c2.id_intercambio AND c2.id_persona_calificada = ?
            
            WHERE i.id_persona_1 = ? OR i.id_persona_2 = ?
            ORDER BY i.fecha_finalizacion DESC
            LIMIT ? OFFSET ?`,
            [idPersona, idPersona, idPersona, idPersona, limit, offset]
        );

        // Formatear resultados
        const historial = intercambios.map(inter => {
            const soyPersona1 = inter.id_persona_1 == idPersona;
            
            return {
                id_intercambio: inter.id_intercambio,
                fecha: inter.fecha_finalizacion,
                duracion: inter.duracion_real,
                modalidad: inter.modalidad,
                estado: inter.estado,
                
                // Datos del otro usuario
                otro_usuario: {
                    id: soyPersona1 ? inter.id_persona_2 : inter.id_persona_1,
                    nombre: soyPersona1 ? `${inter.nombre_persona2} ${inter.apellido_persona2}` : `${inter.nombre_persona1} ${inter.apellido_persona1}`,
                    imagen: soyPersona1 ? inter.imagen_persona2 : inter.imagen_persona1
                },
                
                // Habilidades intercambiadas
                mi_habilidad: soyPersona1 ? inter.habilidad_persona1 : inter.habilidad_persona2,
                habilidad_recibida: soyPersona1 ? inter.habilidad_persona2 : inter.habilidad_persona1,
                
                // Calificaciones
                mi_calificacion: inter.mi_calificacion,
                mi_comentario: inter.mi_comentario,
                calificacion_recibida: inter.calificacion_recibida,
                comentario_recibido: inter.comentario_recibido
            };
        });


        res.json({
            success: true,
            total,
            page,
            totalPages,
            limit,
            data: historial
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener historial',
            error: error.message
        });
    }
});

// =========================================================
// 4. OBTENER CALIFICACIONES RECIBIDAS POR UNA PERSONA
// GET /api/intercambios/calificaciones/:idPersona?page=1&limit=10
// =========================================================
router.get('/calificaciones/:idPersona', async (req, res) => {
    const { idPersona } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    
    try {
        // Contar total de calificaciones
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total 
             FROM Calificaciones_Intercambio 
             WHERE id_persona_calificada = ? AND visible = TRUE`,
            [idPersona]
        );
        
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        // Obtener calificaciones con datos del calificador
        const [calificaciones] = await db.query(
            `SELECT 
                c.id_calificacion,
                c.id_intercambio,
                c.id_persona_calificadora,
                c.id_persona_calificada,
                c.puntuacion,
                c.comentario,
                c.fecha_calificacion,
                c.visible,
                
                p.id_Perfil_Persona,
                p.nombre_Persona AS nombre_calificador,
                p.apellido_Persona AS apellido_calificador,
                p.imagenUrl_Persona AS imagen_calificador,
                
                i.fecha_finalizacion,
                i.modalidad
                
            FROM Calificaciones_Intercambio c
            INNER JOIN Personas p ON c.id_persona_calificadora = p.id_Perfil_Persona
            INNER JOIN Intercambios_Finalizados i ON c.id_intercambio = i.id_intercambio
            
            WHERE c.id_persona_calificada = ? AND c.visible = TRUE
            ORDER BY c.fecha_calificacion DESC
            LIMIT ? OFFSET ?`,
            [idPersona, limit, offset]
        );


        res.json({
            success: true,
            total,
            page,
            totalPages,
            limit,
            data: calificaciones
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener calificaciones',
            error: error.message
        });
    }
});

// =========================================================
// 5. OBTENER ESTADÍSTICAS DE UNA PERSONA
// GET /api/intercambios/estadisticas/:idPersona
// =========================================================
router.get('/estadisticas/:idPersona', async (req, res) => {
    const { idPersona } = req.params;
    
    
    try {
        // Obtener estadísticas (creadas automáticamente por triggers)
        const [estadisticas] = await db.query(
            'SELECT * FROM Estadisticas_Persona WHERE id_persona = ?',
            [idPersona]
        );

        if (estadisticas.length === 0) {
            // Si no existen estadísticas, retornar valores por defecto
            return res.json({
                success: true,
                data: {
                    total_intercambios_completados: 0,
                    promedio_calificacion: null,
                    total_calificaciones_recibidas: 0,
                    distribucion_calificaciones: {
                        cinco_estrellas: 0,
                        cuatro_estrellas: 0,
                        tres_estrellas: 0,
                        dos_estrellas: 0,
                        una_estrella: 0
                    }
                }
            });
        }

        const stats = estadisticas[0];

        res.json({
            success: true,
            data: {
                total_intercambios_completados: stats.total_intercambios_completados,
                total_intercambios_cancelados: stats.total_intercambios_cancelados,
                promedio_calificacion: stats.promedio_calificacion ? parseFloat(stats.promedio_calificacion) : null,
                total_calificaciones_recibidas: stats.total_calificaciones_recibidas,
                distribucion_calificaciones: {
                    cinco_estrellas: stats.total_calificaciones_5_estrellas,
                    cuatro_estrellas: stats.total_calificaciones_4_estrellas,
                    tres_estrellas: stats.total_calificaciones_3_estrellas,
                    dos_estrellas: stats.total_calificaciones_2_estrellas,
                    una_estrella: stats.total_calificaciones_1_estrella
                },
                fecha_ultimo_intercambio: stats.fecha_ultimo_intercambio
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener estadísticas',
            error: error.message
        });
    }
});

// =========================================================
// 6. OBTENER ESTADÍSTICAS GLOBALES DEL SISTEMA
// GET /api/intercambios/estadisticas-globales
// =========================================================
router.get('/estadisticas-globales', async (req, res) => {
    try {
        
        // Contar total de usuarios activos
        const [usuarios] = await db.query(
            'SELECT COUNT(*) as total FROM Personas'
        );
        
        // Obtener todas las categorías y contar
        const [resultadoCategorias] = await db.execute('CALL sp_Categorias_ObtenerTodo()');
        const categorias = resultadoCategorias[0];
        const totalCategorias = categorias ? categorias.length : 0;
        
        // Contar total de intercambios completados (estado 'Completado')
        const [intercambios] = await db.query(
            'SELECT COUNT(*) as total FROM solicitudes_intercambio WHERE estado = "Completado"'
        );
        
        const resultado = {
            success: true,
            data: {
                usuarios_activos: usuarios[0].total,
                categorias_disponibles: totalCategorias,
                intercambios_exitosos: intercambios[0].total
            }
        };
        
        res.json(resultado);
        
    } catch (error) {
        console.error('Detalle del error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener estadísticas globales',
            error: error.message
        });
    }
});

module.exports = router;
