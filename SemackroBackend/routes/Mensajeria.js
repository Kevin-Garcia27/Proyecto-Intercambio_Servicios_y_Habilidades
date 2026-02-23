// routes/Mensajeria.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
// Multer para manejo de multipart/form-data (subida de archivos en memoria)
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
// Cloudflare R2 helper
const { uploadToR2, deleteFromR2, extractFileNameFromUrl } = require('../cloudflareR2');

// Helper: insertar adjuntos asociados a un mensaje.
// Intenta usar stored procedure `sp_InsertAdjuntoMensaje` si existe, si no hace batch INSERT.
async function insertarAdjuntosMensaje(idMensaje, adjuntos) {
    if (!Array.isArray(adjuntos) || adjuntos.length === 0) return;

    // Intentar insertar con SP por cada adjunto
    try {
        for (const a of adjuntos) {
            // Normalizar campos
            const url = a.url;
            const mime = a.mime || null;
            const tipo = a.tipo || null;
            const nombre = a.nombre_original || a.nombre || null;
            const tamano = a.tamano_bytes || a.size || null;

            try {
                await pool.query('CALL sp_InsertAdjuntoMensaje(?, ?, ?, ?, ?, ?)', [idMensaje, url, mime, tipo, nombre, tamano]);
            } catch (errSp) {
                // Si falla por SP inexistente o cualquier error, lanzamos para fallback
                throw errSp;
            }
        }
        return; // todo ok con SP
    } catch (err) {
        // Fallback: batch INSERT directo
        try {
            const values = adjuntos.map(a => [idMensaje, a.url, a.mime || null, a.tipo || null, a.nombre_original || a.nombre || null, a.tamano_bytes || a.size || null]);
            const sql = 'INSERT INTO mensajes_adjuntos (id_mensaje, url, mime, tipo, nombre_original, tamano_bytes) VALUES ?';
            await pool.query(sql, [values]);
            return;
        } catch (err2) {
            console.warn('insertarAdjuntosMensaje - fallback INSERT falló:', err2.message);
            throw err2;
        }
    }
}

// =========================================================
// 1. OBTENER CONVERSACIONES DE UNA PERSONA
// GET /mensajeria/conversaciones/:idPersona
// =========================================================
router.get('/conversaciones/:idPersona', async (req, res) => {
    try {
        const personaId = req.params.idPersona;

        const [results] = await pool.query(
            'CALL sp_ObtenerConversacionesPorPersona(?)',
            [personaId]
        );

        let conversaciones = results[0];
        
        // Procesar los datos para asegurar valores por defecto
        conversaciones = conversaciones.map(conv => {
            const nombreContacto = conv.nombre_contacto || 'Usuario';
            const imagenUrl = conv.imagenUrl_contacto;
            
            // Si no hay imagen o es una cadena vacía, generar avatar por defecto
            let imagenFinal = imagenUrl;
            if (!imagenUrl || imagenUrl.trim() === '') {
                const iniciales = nombreContacto.charAt(0).toUpperCase() || 'U';
                const colors = ['4F46E5', '10B981', '8B5CF6', '14B8A6', 'F59E0B', 'EF4444'];
                const colorIndex = (nombreContacto.length || 0) % colors.length;
                const bgColor = colors[colorIndex];
                imagenFinal = `https://ui-avatars.com/api/?name=${iniciales}&background=${bgColor}&color=ffffff&size=200&bold=true&rounded=true`;
            }
            
            return {
                ...conv,
                nombre_contacto: nombreContacto,
                imagenUrl_contacto: imagenFinal
            };
        });

        // Asegurar que la vista previa (ultimo_mensaje) no muestre un mensaje que el usuario ocultó
        try {
            const personaId = personaIdParam = req.params.idPersona;
            // Para cada conversación, obtener el último mensaje VISIBLE para personaId
            const updates = conversaciones.map(async (conv) => {
                try {
                    const [rows] = await pool.query(
                        `SELECT id_mensaje, contenido, fecha_envio FROM mensajes
                         WHERE id_conversacion = ?
                         AND NOT (borrado_por_emisor = 1 AND id_persona_envia = ?)
                         AND NOT (borrado_por_receptor = 1 AND id_persona_recibe = ?)
                         ORDER BY fecha_envio DESC LIMIT 1`,
                        [conv.id_conversacion, personaId, personaId]
                    );
                    if (rows && rows[0]) {
                        const last = rows[0];
                        const texto = (last.contenido || '').toString().trim();
                        if (texto && texto.length > 0) {
                            conv.ultimo_mensaje = texto;
                        } else {
                            // Si el contenido está vacío, verificar si el mensaje tiene adjuntos
                            try {
                                const [adj] = await pool.query(
                                    'SELECT mime, tipo, nombre_original FROM mensajes_adjuntos WHERE id_mensaje = ? LIMIT 1',
                                    [last.id_mensaje]
                                );
                                if (adj && adj[0]) {
                                    const mime = adj[0].mime || '';
                                    // Determinar etiqueta según mime
                                    if (mime.startsWith('image/')) conv.ultimo_mensaje = 'Imagen';
                                    else if (mime.startsWith('video/')) conv.ultimo_mensaje = 'Video';
                                    else conv.ultimo_mensaje = 'Archivo';
                                } else {
                                    conv.ultimo_mensaje = 'Adjunto';
                                }
                            } catch (errAdj) {
                                // Si falla al consultar adjuntos, usar texto por defecto
                                conv.ultimo_mensaje = 'Adjunto';
                            }
                        }
                    } else {
                        conv.ultimo_mensaje = 'Sin mensajes aún';
                    }
                } catch (err) {
                    // No crítico: dejar el valor que retorne el SP
                    console.warn('No se pudo obtener ultimo mensaje visible para conversacion', conv.id_conversacion, err.message);
                }
            });
            await Promise.all(updates);
        } catch (err) {
            console.warn('Error ajustando preview de conversaciones:', err.message);
        }

        res.json({ success: true, count: conversaciones.length, data: conversaciones });

    } catch (error) {
        console.error('Error al obtener conversaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener conversaciones',
            error: error.message
        });
    }
});


// =========================================================
// 2. OBTENER MENSAJES DE UNA CONVERSACIÓN
// GET /mensajeria/conversacion/:idConversacion/mensajes
// Query param: personaId (para marcar tipo enviado/recibido)
// =========================================================
router.get('/conversacion/:idConversacion/mensajes', async (req, res) => {
    try {
        const conversacionId = req.params.idConversacion;
        const personaId = req.query.personaId;

        if (!personaId) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere personaId como query parameter'
            });
        }

        const [results] = await pool.query(
            'CALL sp_ObtenerMensajesConversacion(?, ?)',
            [conversacionId, personaId]
        );

        let mensajes = results[0] || [];

        // Obtener flags de borrado directamente desde la tabla mensajes para garantizar filtrado
        try {
            if (mensajes.length > 0) {
                const ids = mensajes.map(m => m.id_mensaje).filter(Boolean);
                if (ids.length > 0) {
                    const [flagsRows] = await pool.query(
                        'SELECT id_mensaje, id_persona_envia, id_persona_recibe, borrado_por_emisor, borrado_por_receptor FROM mensajes WHERE id_mensaje IN (?)',
                        [ids]
                    );
                    const flagsMap = {};
                    flagsRows.forEach(r => { flagsMap[r.id_mensaje] = r; });

                    mensajes = mensajes.filter(m => {
                        const f = flagsMap[m.id_mensaje];
                        if (!f) return true;
                        if (f.borrado_por_emisor == 1 && String(f.id_persona_envia) === String(personaId)) return false;
                        if (f.borrado_por_receptor == 1 && String(f.id_persona_recibe) === String(personaId)) return false;
                        return true;
                    });
                }
            }
        } catch (err) {
            console.warn('Error filtrando mensajes por flags de borrado:', err.message);
        }

        // Si hay mensajes, obtener adjuntos asociados (si la tabla existe)
        try {
            if (mensajes.length > 0) {
                const ids = mensajes.map(m => m.id_mensaje).filter(Boolean);
                if (ids.length > 0) {
                    const [adjRows] = await pool.query(
                        'SELECT id_adjunto, id_mensaje, url, mime, tipo, nombre_original, tamano_bytes FROM mensajes_adjuntos WHERE id_mensaje IN (?)',
                        [ids]
                    );

                    const adjMap = {};
                    adjRows.forEach(a => {
                        if (!adjMap[a.id_mensaje]) adjMap[a.id_mensaje] = [];
                        adjMap[a.id_mensaje].push({
                            id_adjunto: a.id_adjunto,
                            url: a.url,
                            mime: a.mime,
                            tipo: a.tipo,
                            nombre_original: a.nombre_original,
                            tamano_bytes: a.tamano_bytes
                        });
                    });

                    mensajes = mensajes.map(m => ({ ...m, adjuntos: adjMap[m.id_mensaje] || [] }));
                }
            }
        } catch (err) {
            console.warn('No se pudo cargar adjuntos para mensajes:', err.message);
            // dejar mensajes sin adjuntos si falla
            mensajes = mensajes.map(m => ({ ...m, adjuntos: [] }));
        }

        res.json({ success: true, count: mensajes.length, data: mensajes });

    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener mensajes',
            error: error.message
        });
    }
});

// =========================================================
// UPLOAD A R2
// POST /mensajeria/upload (multipart/form-data, campo 'file')
// =========================================================
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió archivo' });

        const allowed = ['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/ogg'];
        if (!allowed.includes(req.file.mimetype)) {
            return res.status(400).json({ success: false, message: 'Tipo de archivo no permitido' });
        }

        const maxBytes = req.file.mimetype.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (req.file.size > maxBytes) return res.status(413).json({ success: false, message: 'Archivo demasiado grande' });

        // Subir a R2
        const publicUrl = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);

        return res.json({
            success: true,
            url: publicUrl,
            mime: req.file.mimetype,
            nombre_original: req.file.originalname,
            tamano_bytes: req.file.size
        });

    } catch (err) {
        console.error('Error al subir archivo:', err);
        return res.status(500).json({ success: false, message: 'Error al subir archivo', error: err.message });
    }
});


// =========================================================
// 3. ENVIAR MENSAJE
// POST /mensajeria/enviar
// Body: { conversacionId, personaEnviaId, contenido }
// =========================================================
router.post('/enviar', async (req, res) => {
    try {
        const { conversacionId, personaEnviaId, personaRecibeId, contenido } = req.body;
        // adjuntos puede venir como array de objetos [{url,mime,nombre_original,tamano_bytes}] o como JSON string
        let adjuntos = req.body.adjuntos || [];
        if (typeof adjuntos === 'string' && adjuntos.trim() !== '') {
            try { adjuntos = JSON.parse(adjuntos); } catch (e) { adjuntos = []; }
        }

        // Validación básica: `conversacionId` y `personaEnviaId` son obligatorios.
        // El `contenido` puede estar vacío sólo si se envía al menos un adjunto.
        if (!conversacionId || !personaEnviaId) {
            return res.status(400).json({ success: false, message: 'Se requieren conversacionId y personaEnviaId' });
        }

        // Normalizar contenido a string trimmed
        const contenidoStr = (typeof contenido === 'string') ? contenido.trim() : '';

        if (contenidoStr.length === 0 && (!Array.isArray(adjuntos) || adjuntos.length === 0)) {
            return res.status(400).json({ success: false, message: 'Se requiere contenido o al menos un adjunto' });
        }

        // Si se proporciona personaRecibeId, intentar insertar directamente (si la DB tiene la columna)
        if (personaRecibeId) {
            try {
                const [insert] = await pool.query(
                    `INSERT INTO mensajes (id_conversacion, id_persona_envia, id_persona_recibe, contenido, fecha_envio, leido, borrado_por_emisor, borrado_por_receptor)
                     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 0, 0, 0)`,
                    [conversacionId, personaEnviaId, personaRecibeId, contenidoStr]
                );

                const [rows] = await pool.query('SELECT * FROM mensajes WHERE id_mensaje = ?', [insert.insertId]);
                const mensaje = rows && rows[0] ? rows[0] : null;

                // Si hay adjuntos, insertarlos en mensajes_adjuntos usando helper (SP o fallback)
                try {
                    await insertarAdjuntosMensaje(mensaje.id_mensaje, adjuntos);
                } catch (errAdj) {
                    console.warn('No se pudieron insertar adjuntos para mensaje', insert.insertId, errAdj.message);
                }

                return res.status(201).json({ success: true, message: 'Mensaje enviado exitosamente', data: mensaje });
            } catch (errInsert) {
                // Si falla por estructura de tabla (columna no existe), caemos al SP para compatibilidad
                console.warn('Insert con personaRecibeId falló, intentando SP por compatibilidad:', errInsert.message);
                // no hacemos return, continua y ejecuta el SP path
            }
        }

        // Si no hay personaRecibeId, intentar usar el stored procedure existente (compatibilidad)
        const [results] = await pool.query('CALL sp_EnviarMensaje(?, ?, ?)', [conversacionId, personaEnviaId, contenidoStr]);
        const mensaje = results[0] && results[0][0] ? results[0][0] : null;

        // Si el SP devolvió un id_mensaje y hay adjuntos, insertarlos
        try {
            if (mensaje && mensaje.id_mensaje && Array.isArray(adjuntos) && adjuntos.length) {
                await insertarAdjuntosMensaje(mensaje.id_mensaje, adjuntos);
            }
        } catch (errAdj2) {
            console.warn('No se pudieron insertar adjuntos para mensaje (SP)', errAdj2.message);
        }

        res.status(201).json({ success: true, message: 'Mensaje enviado exitosamente', data: mensaje });

    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({ success: false, message: 'Error al enviar el mensaje', error: error.message });
    }
});


// =========================================================
// 4. MARCAR MENSAJES COMO LEÍDOS
// PUT /mensajeria/conversacion/:idConversacion/marcar-leidos
// Body: { personaId }
// =========================================================
router.put('/conversacion/:idConversacion/marcar-leidos', async (req, res) => {
    try {
        const conversacionId = req.params.idConversacion;
        const { personaId } = req.body;

        if (!personaId) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere personaId en el body'
            });
        }

        // Marcar como leídos todos los mensajes de esta conversación que no fueron enviados por mí
        const [result] = await pool.query(
            `UPDATE mensajes 
             SET leido = 1 
             WHERE id_conversacion = ? 
             AND id_persona_envia != ? 
             AND leido = 0`,
            [conversacionId, personaId]
        );

        res.json({
            success: true,
            message: 'Mensajes marcados como leídos',
            mensajes_marcados: result.affectedRows
        });

    } catch (error) {
        console.error('Error al marcar mensajes como leídos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al marcar mensajes como leídos',
            error: error.message
        });
    }
});


// =========================================================
// 5. EDITAR MENSAJE
// PUT /mensajeria/mensajes/:idMensaje
// Body: { contenido }
// =========================================================
router.put('/mensajes/:idMensaje', async (req, res) => {
    try {
        const mensajeId = req.params.idMensaje;
        const { contenido } = req.body;
        // Validación básica de contenido
        if (!contenido || contenido.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El contenido del mensaje no puede estar vacío'
            });
        }

        // Obtener mensaje para validar ventana de edición y contador de ediciones
        const [rows] = await pool.query('SELECT id_mensaje, fecha_envio FROM mensajes WHERE id_mensaje = ?', [mensajeId]);
        const mensaje = rows && rows[0] ? rows[0] : null;

        if (!mensaje) {
            return res.status(404).json({ success: false, message: 'Mensaje no encontrado' });
        }

        // Validar tiempo de edición: 2 minutos
        try {
            const ahora = new Date();
            const fechaMensaje = new Date(mensaje.fecha_envio);
            const minutosDiferencia = (ahora - fechaMensaje) / (1000 * 60);

            if (minutosDiferencia > 2) {
                return res.status(410).json({
                    success: false,
                    error: 'Tiempo de edición expirado. Solo 2 minutos.'
                });
            }
        } catch (err) {
            // Si no se puede parsear la fecha, permitir la edición por seguridad (pero loggear)
            console.warn('No se pudo parsear fecha_envio para mensaje', mensajeId, err.message);
        }


        // Actualizar el contenido y aumentar contador de ediciones
        const [result] = await pool.query(
            'UPDATE mensajes SET contenido = ? WHERE id_mensaje = ?',
            [contenido.trim(), mensajeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mensaje no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Mensaje actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al editar mensaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al editar el mensaje',
            error: error.message
        });
    }
});


// =========================================================
// 6. ELIMINAR MENSAJE (soporta 'todos' o 'mi')
// DELETE /mensajeria/mensajes/:idMensaje?tipo=mi|todos&personaId=123
// - tipo=mi  -> marca borrado_por_emisor / borrado_por_receptor según quien solicita
// - tipo=todos -> elimina el registro (sujeto a ventana de 3 minutos)
// =========================================================
router.delete('/mensajes/:idMensaje', async (req, res) => {
    try {
        const mensajeId = req.params.idMensaje;
        const tipo = (req.query.tipo || 'todos').toString();
        const personaId = req.query.personaId || req.body.personaId || null;

        // Si piden borrar solo para mí, requieren personaId
        if (tipo === 'mi') {
            if (!personaId) {
                return res.status(400).json({ success: false, message: 'Se requiere personaId para borrar solo para mí' });
            }

            // Actualizar flags de borrado según si la persona es emisor o receptor
            const [rows] = await pool.query('SELECT id_mensaje, id_persona_envia, id_persona_recibe FROM mensajes WHERE id_mensaje = ?', [mensajeId]);
            const mensaje = rows && rows[0] ? rows[0] : null;
            if (!mensaje) {
                return res.status(404).json({ success: false, message: 'Mensaje no encontrado' });
            }

            let updateSql = 'UPDATE mensajes SET ';
            const updates = [];
            const params = [];

            // Si el usuario es el emisor
            if (String(mensaje.id_persona_envia) === String(personaId)) {
                updates.push('borrado_por_emisor = 1');
            }

            // Si el usuario es el receptor
            if (String(mensaje.id_persona_recibe) === String(personaId)) {
                updates.push('borrado_por_receptor = 1');
            }

            if (updates.length === 0) {
                return res.status(403).json({ success: false, message: 'No tienes permiso para borrar este mensaje para ti' });
            }

            updateSql += updates.join(', ') + ' WHERE id_mensaje = ?';
            params.push(mensajeId);

            const [result] = await pool.query(updateSql, params);

            return res.json({ success: true, message: 'Mensaje marcado como borrado para el usuario' });
        }

        // Si es tipo 'todos' (o por defecto), validar que la persona que solicita sea el emisor
        // y que la diferencia en minutos desde fecha_envio sea <= 3 usando SQL (TIMESTAMPDIFF)
        if (!personaId) {
            return res.status(400).json({ success: false, message: 'Se requiere personaId para borrar para todos' });
        }

        // Obtener datos y calcular diferencia en minutos en la BD para evitar problemas de parseo/zonas
        const [rows2] = await pool.query(
            'SELECT id_mensaje, id_persona_envia, fecha_envio, TIMESTAMPDIFF(MINUTE, fecha_envio, NOW()) AS minutos_diferencia FROM mensajes WHERE id_mensaje = ?',
            [mensajeId]
        );
        const msgRow = rows2 && rows2[0] ? rows2[0] : null;
        if (!msgRow) {
            return res.status(404).json({ success: false, message: 'Mensaje no encontrado' });
        }

        // Verificar que quien solicita es el emisor (solo el emisor puede eliminar para todos)
        if (String(msgRow.id_persona_envia) !== String(personaId)) {
            return res.status(403).json({ success: false, message: 'Solo el emisor puede eliminar el mensaje para todos' });
        }

        const minutosDiferencia = (typeof msgRow.minutos_diferencia === 'number') ? msgRow.minutos_diferencia : Number(msgRow.minutos_diferencia);
        console.log('Intento borrar mensaje', mensajeId, 'minutosDiferencia=', minutosDiferencia);

        if (isNaN(minutosDiferencia)) {
            console.warn('No se pudo calcular minutos_diferencia para mensaje', mensajeId, 'fecha_envio:', msgRow.fecha_envio);
            return res.status(410).json({ success: false, error: 'No se pudo validar la ventana de eliminación (fecha inválida).' });
        }

        if (minutosDiferencia > 3) {
            return res.status(410).json({ success: false, error: 'Tiempo de eliminación expirado. Solo puedes eliminar mensajes para todos durante 3 minutos.' });
        }

        // Antes de eliminar el mensaje, intentar eliminar los adjuntos asociados en R2
        try {
            const [adjRows] = await pool.query('SELECT url FROM mensajes_adjuntos WHERE id_mensaje = ?', [mensajeId]);
            if (adjRows && adjRows.length) {
                for (const a of adjRows) {
                    try {
                        // Intentar borrar del bucket
                        await deleteFromR2(a.url);
                    } catch (errDel) {
                        console.warn('No se pudo eliminar archivo de R2, se ignorará y continuará:', a.url, errDel.message);
                    }
                }
            }
        } catch (errAdjFetch) {
            console.warn('Error buscando adjuntos para eliminar en R2:', errAdjFetch.message);
        }

        const [result] = await pool.query('DELETE FROM mensajes WHERE id_mensaje = ?', [mensajeId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Mensaje no encontrado' });
        }

        // Si la tabla mensajes_adjuntos existe con FK ON DELETE CASCADE, las filas se eliminarán; si no, limpiamos por seguridad
        try {
            await pool.query('DELETE FROM mensajes_adjuntos WHERE id_mensaje = ?', [mensajeId]);
        } catch (errCleanup) {
            // No crítico
        }

        return res.json({ success: true, message: 'Mensaje eliminado exitosamente' });

    } catch (error) {
        console.error('Error al eliminar mensaje:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el mensaje', error: error.message });
    }
});
module.exports = router;
