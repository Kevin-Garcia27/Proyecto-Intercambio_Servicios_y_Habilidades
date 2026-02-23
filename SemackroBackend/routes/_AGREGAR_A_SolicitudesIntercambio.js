// =========================================================
// NUEVOS ENDPOINTS PARA SOLICITUDES DETALLADAS
// Agregar estos endpoints al final de SolicitudesIntercambio.js
// ANTES de la línea: module.exports = router;
// =========================================================

// 9. ENVIAR SOLICITUD DETALLADA CON CAMPOS OPCIONALES
// POST /solicitudes-intercambio/enviar-detallada
router.post('/enviar-detallada', async (req, res) => {
    try {
        const { 
            solicitanteId, 
            receptorId,
            fechaPropuesta,
            horaPropuesta,
            duracionEstimada,
            idHabilidadSolicitada,
            idHabilidadOfrecida,
            mensajeAdicional,
            modalidad
        } = req.body;

        // Validación básica
        if (!solicitanteId || !receptorId) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren solicitanteId y receptorId'
            });
        }

        // Evitar auto-solicitud
        if (solicitanteId === receptorId) {
            return res.status(400).json({
                success: false,
                message: 'No puedes enviarte una solicitud a ti mismo'
            });
        }

        // Verificar si ya existe una solicitud pendiente
        const [solicitudesExistentes] = await pool.query(
            `SELECT id_solicitud, estado 
             FROM solicitudes_intercambio 
             WHERE ((id_persona_solicitante = ? AND id_persona_receptor = ?) 
                OR (id_persona_solicitante = ? AND id_persona_receptor = ?))
             AND estado IN ('Pendiente', 'Aceptada')`,
            [solicitanteId, receptorId, receptorId, solicitanteId]
        );

        if (solicitudesExistentes.length > 0) {
            const solicitud = solicitudesExistentes[0];
            if (solicitud.estado === 'Aceptada') {
                return res.status(400).json({
                    success: false,
                    message: 'Ya tienes una conexión establecida con este usuario'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una solicitud pendiente con este usuario'
                });
            }
        }

        // Insertar solicitud con detalles
        const [result] = await pool.query(
            `INSERT INTO solicitudes_intercambio (
                id_persona_solicitante,
                id_persona_receptor,
                fecha_solicitud,
                estado,
                fecha_propuesta,
                hora_propuesta,
                duracion_estimada,
                id_habilidad_solicitada,
                id_habilidad_ofrecida,
                mensaje_adicional,
                modalidad
            ) VALUES (?, ?, NOW(), 'Pendiente', ?, ?, ?, ?, ?, ?, ?)`,
            [
                solicitanteId, 
                receptorId,
                fechaPropuesta || null,
                horaPropuesta || null,
                duracionEstimada || null,
                idHabilidadSolicitada || null,
                idHabilidadOfrecida || null,
                mensajeAdicional || null,
                modalidad || 'Virtual'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Solicitud de intercambio enviada exitosamente',
            data: {
                id_solicitud: result.insertId
            }
        });

    } catch (error) {
        console.error('Error al enviar solicitud detallada:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar la solicitud',
            error: error.message
        });
    }
});


// 10. OBTENER HABILIDADES OFRECIDAS POR UNA PERSONA
// GET /solicitudes-intercambio/habilidades-ofrecidas/:idPersona
router.get('/habilidades-ofrecidas/:idPersona', async (req, res) => {
    try {
        const personaId = req.params.idPersona;

        const [habilidades] = await pool.query(
            `SELECT 
                h.id_Habilidad_Servicio_Persona,
                h.nombre_Habilidad,
                h.descripcion_Habilidad,
                h.tipoEstado_Habilidad,
                c.nombre_Categoria AS categoria
            FROM Habilidades_Y_Servicios_Persona h
            LEFT JOIN Categorias_Generales_Habilidades c 
                ON h.id_Categoria_General_Habilidad = c.id_Categoria_General_Habilidad
            WHERE h.id_Perfil_Persona = ?
              AND h.tipoEstado_Habilidad = 'Ofrece'
            ORDER BY h.nombre_Habilidad`,
            [personaId]
        );

        res.json({
            success: true,
            data: habilidades
        });

    } catch (error) {
        console.error('Error al obtener habilidades ofrecidas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener habilidades',
            error: error.message
        });
    }
});


// 11. OBTENER HABILIDADES BUSCADAS POR UNA PERSONA
// GET /solicitudes-intercambio/habilidades-buscadas/:idPersona
router.get('/habilidades-buscadas/:idPersona', async (req, res) => {
    try {
        const personaId = req.params.idPersona;

        const [habilidades] = await pool.query(
            `SELECT 
                h.id_Habilidad_Servicio_Persona,
                h.nombre_Habilidad,
                h.descripcion_Habilidad,
                h.tipoEstado_Habilidad,
                c.nombre_Categoria AS categoria
            FROM Habilidades_Y_Servicios_Persona h
            LEFT JOIN Categorias_Generales_Habilidades c 
                ON h.id_Categoria_General_Habilidad = c.id_Categoria_General_Habilidad
            WHERE h.id_Perfil_Persona = ?
              AND h.tipoEstado_Habilidad = 'Busca'
            ORDER BY h.nombre_Habilidad`,
            [personaId]
        );

        res.json({
            success: true,
            data: habilidades
        });

    } catch (error) {
        console.error('Error al obtener habilidades buscadas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener habilidades',
            error: error.message
        });
    }
});
