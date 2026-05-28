// ================================================
// Rutas para el manejo de Órdenes de Trabajo
// ================================================

const express = require('express');
const router = express.Router();
const db = require('../db');
const { enviarNotificacionContextual } = require('../config/email');

const ESTADOS_OT_VALIDOS = ['pendiente', 'en_progreso', 'completada', 'cancelada'];

function normalizarEstadoOT(valor) {
    if (valor === undefined || valor === null) return null;

    const clave = String(valor)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/-+/g, '_');

    if (!clave) return null;
    if (clave === 'enprogreso') return 'en_progreso';

    return ESTADOS_OT_VALIDOS.includes(clave) ? clave : null;
}

// Crear las tablas automáticamente si no existen
(async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS OrdenesTrabajo (
                id_orden             INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id           INT NOT NULL,
                titulo               VARCHAR(255) NOT NULL,
                descripcion          TEXT,
                ubicacion_obra       VARCHAR(255),
                fecha_inicio         DATE NOT NULL,
                fecha_fin            DATE NOT NULL,
                especialidad         VARCHAR(150),
                presupuesto_estimado DECIMAL(12,2),
                max_postulantes      INT NOT NULL DEFAULT 1,
                estado               ENUM('pendiente','en_progreso','completada','cancelada') NOT NULL DEFAULT 'pendiente',
                fecha_creacion       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                fecha_actualiz       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Agregar columna max_postulantes si la tabla ya existía sin esa columna (compatible MySQL 5.7+)
        const [cols] = await db.query(`SHOW COLUMNS FROM OrdenesTrabajo LIKE 'max_postulantes'`);
        if (cols.length === 0) {
            await db.query(`ALTER TABLE OrdenesTrabajo ADD COLUMN max_postulantes INT NOT NULL DEFAULT 1`);
            console.log('✅ Columna max_postulantes agregada a OrdenesTrabajo.');
        }

        await db.query(`
            CREATE TABLE IF NOT EXISTS PostulacionesOrdenes (
                id_postulacion  INT AUTO_INCREMENT PRIMARY KEY,
                id_orden        INT NOT NULL,
                usuario_id      INT NOT NULL,
                mensaje         TEXT,
                portafolio_url  VARCHAR(512) DEFAULT NULL,
                estado          ENUM('pendiente','aceptada','rechazada') NOT NULL DEFAULT 'pendiente',
                fecha_postulacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_orden_usuario (id_orden, usuario_id),
                FOREIGN KEY (id_orden) REFERENCES OrdenesTrabajo(id_orden) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Agregar portafolio_url si la tabla ya existía sin esa columna
        const [colsPortafolio] = await db.query(`SHOW COLUMNS FROM PostulacionesOrdenes LIKE 'portafolio_url'`);
        if (colsPortafolio.length === 0) {
            await db.query(`ALTER TABLE PostulacionesOrdenes ADD COLUMN portafolio_url VARCHAR(512) DEFAULT NULL`);
            console.log('✅ Columna portafolio_url agregada a PostulacionesOrdenes.');
        }

        // Agregar restringir_por_ubicacion si no existe (filtro de visibilidad por ubicación)
        const [colsRestr] = await db.query(`SHOW COLUMNS FROM OrdenesTrabajo LIKE 'restringir_por_ubicacion'`);
        if (colsRestr.length === 0) {
            await db.query(`ALTER TABLE OrdenesTrabajo ADD COLUMN restringir_por_ubicacion TINYINT(1) NOT NULL DEFAULT 0`);
            console.log('✅ Columna restringir_por_ubicacion agregada a OrdenesTrabajo.');
        }

        console.log('✅ Tablas OrdenesTrabajo y PostulacionesOrdenes listas.');

        // ──────────────────────────────────────────────────────────────
        // Extensión de conversaciones para grupos de órdenes de trabajo
        // ──────────────────────────────────────────────────────────────
        try {
            // Hacer nullable las columnas que impiden INSERT de grupos
            const colsToNullify = ['id_solicitud', 'id_persona_1', 'id_persona_2'];
            for (const colName of colsToNullify) {
                try {
                    const [colInfo] = await db.query(`SHOW COLUMNS FROM conversaciones LIKE '${colName}'`);
                    if (colInfo.length > 0 && colInfo[0].Null === 'NO') {
                        const colType = colInfo[0].Type;
                        await db.query(`ALTER TABLE conversaciones MODIFY COLUMN \`${colName}\` ${colType} NULL DEFAULT NULL`);
                        console.log(`✅ ${colName} en conversaciones ahora es nullable.`);
                    } else if (colInfo.length === 0) {
                        // columna no existe, no es problema
                    } else {
                        console.log(`ℹ️  ${colName} ya es nullable.`);
                    }
                } catch (e) { console.warn(`⚠️  No se pudo modificar ${colName}:`, e.message); }
            }

            // Hacer nullable id_persona_recibe en mensajes (requerido para mensajes de grupo)
            try {
                const [colRec] = await db.query(`SHOW COLUMNS FROM mensajes LIKE 'id_persona_recibe'`);
                if (colRec.length > 0 && colRec[0].Null === 'NO') {
                    const recType = colRec[0].Type;
                    await db.query(`ALTER TABLE mensajes MODIFY COLUMN id_persona_recibe ${recType} NULL DEFAULT NULL`);
                    console.log('✅ id_persona_recibe en mensajes ahora es nullable.');
                } else {
                    console.log('ℹ️  id_persona_recibe ya es nullable.');
                }
            } catch (e) { console.warn('⚠️  No se pudo modificar id_persona_recibe en mensajes:', e.message); }

            const [colTipo]   = await db.query(`SHOW COLUMNS FROM conversaciones LIKE 'tipo'`);
            if (colTipo.length === 0) {
                await db.query(`ALTER TABLE conversaciones ADD COLUMN tipo ENUM('directo','grupo') NOT NULL DEFAULT 'directo'`);
                console.log('✅ Columna tipo agregada a conversaciones.');
            }
            const [colNombre] = await db.query(`SHOW COLUMNS FROM conversaciones LIKE 'nombre_grupo'`);
            if (colNombre.length === 0) {
                await db.query(`ALTER TABLE conversaciones ADD COLUMN nombre_grupo VARCHAR(255) NULL`);
                console.log('✅ Columna nombre_grupo agregada a conversaciones.');
            }
            const [colOrden]  = await db.query(`SHOW COLUMNS FROM conversaciones LIKE 'id_orden'`);
            if (colOrden.length === 0) {
                await db.query(`ALTER TABLE conversaciones ADD COLUMN id_orden INT NULL`);
                console.log('✅ Columna id_orden agregada a conversaciones.');
            }

            // Obtener el tipo exacto de id_conversacion para evitar incompatibilidades en FK
            let colTypeConv = 'INT';
            try {
                const [colInfo] = await db.query(`SHOW COLUMNS FROM conversaciones LIKE 'id_conversacion'`);
                if (colInfo.length > 0) colTypeConv = colInfo[0].Type.toUpperCase();
            } catch (e) { /* usar INT por defecto */ }

            await db.query(`
                CREATE TABLE IF NOT EXISTS conversaciones_miembros (
                    id                INT AUTO_INCREMENT PRIMARY KEY,
                    id_conversacion   ${colTypeConv} NOT NULL,
                    id_Perfil_Persona INT NOT NULL,
                    rol               ENUM('admin','miembro') NOT NULL DEFAULT 'miembro',
                    fecha_union       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_conv_perfil (id_conversacion, id_Perfil_Persona),
                    INDEX idx_conv (id_conversacion),
                    INDEX idx_perfil (id_Perfil_Persona)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log(`✅ Tabla conversaciones_miembros lista (id_conversacion tipo: ${colTypeConv}).`);

            // ── Migración retroactiva: crear grupos para órdenes con postulantes aceptados ──
            try {
                // Obtener órdenes que ya tienen postulantes aceptados pero aún sin grupo
                const [ordConAceptados] = await db.query(`
                    SELECT DISTINCT ot.id_orden, ot.titulo, ot.usuario_id AS owner_user_id
                    FROM OrdenesTrabajo ot
                    JOIN PostulacionesOrdenes po ON po.id_orden = ot.id_orden AND po.estado = 'aceptada'
                    WHERE NOT EXISTS (
                        SELECT 1 FROM conversaciones c WHERE c.tipo = 'grupo' AND c.id_orden = ot.id_orden
                    )
                `);

                if (ordConAceptados.length > 0) {
                    console.log(`🔄 Migrando ${ordConAceptados.length} orden(es) con postulantes aceptados sin grupo...`);
                    for (const ord of ordConAceptados) {
                        try {
                            // Obtener id_Perfil_Persona del dueño
                            const [[pOwner]] = await db.query(
                                `SELECT id_Perfil_Persona FROM Personas WHERE id_Usuario = ? LIMIT 1`,
                                [ord.owner_user_id]
                            );
                            if (!pOwner) continue;

                            const nombreGrupo = `OT: ${ord.titulo}`;
                            let convId;
                            try {
                                const [ins] = await db.query(
                                    `INSERT INTO conversaciones (tipo, nombre_grupo, id_orden) VALUES ('grupo', ?, ?)`,
                                    [nombreGrupo, ord.id_orden]
                                );
                                convId = ins.insertId;
                            } catch (eIns) {
                                const [ins] = await db.query(
                                    `INSERT INTO conversaciones (id_solicitud, tipo, nombre_grupo, id_orden) VALUES (NULL, 'grupo', ?, ?)`,
                                    [nombreGrupo, ord.id_orden]
                                );
                                convId = ins.insertId;
                            }

                            // Agregar dueño como admin
                            await db.query(
                                `INSERT IGNORE INTO conversaciones_miembros (id_conversacion, id_Perfil_Persona, rol) VALUES (?, ?, 'admin')`,
                                [convId, pOwner.id_Perfil_Persona]
                            );

                            // Agregar todos los postulantes aceptados
                            const [postAceptados] = await db.query(
                                `SELECT po.usuario_id FROM PostulacionesOrdenes po WHERE po.id_orden = ? AND po.estado = 'aceptada'`,
                                [ord.id_orden]
                            );
                            for (const pa of postAceptados) {
                                const [[pPost]] = await db.query(
                                    `SELECT id_Perfil_Persona FROM Personas WHERE id_Usuario = ? LIMIT 1`,
                                    [pa.usuario_id]
                                );
                                if (!pPost) continue;
                                await db.query(
                                    `INSERT IGNORE INTO conversaciones_miembros (id_conversacion, id_Perfil_Persona, rol) VALUES (?, ?, 'miembro')`,
                                    [convId, pPost.id_Perfil_Persona]
                                );
                            }

                            // Mensaje inicial del grupo (ahora id_persona_recibe es nullable)
                            await db.query(
                                `INSERT INTO mensajes (id_conversacion, id_persona_envia, id_persona_recibe, contenido, fecha_envio, leido, borrado_por_emisor, borrado_por_receptor)
                                 VALUES (?, ?, NULL, ?, CURRENT_TIMESTAMP, 0, 0, 0)`,
                                [convId, pOwner.id_Perfil_Persona, `📋 Grupo creado para la orden de trabajo: "${ord.titulo}"`]
                            );
                            console.log(`   ✅ Grupo creado para orden ${ord.id_orden}: "${ord.titulo}" (conv #${convId})`);
                        } catch (eOrd) {
                            console.warn(`   ⚠️  Error migrando orden ${ord.id_orden}:`, eOrd.message);
                        }
                    }
                    console.log('✅ Migración de grupos retroactiva completada.');
                } else {
                    console.log('ℹ️  No hay órdenes pendientes de migración de grupos.');
                }

                // ── Reparar grupos existentes: agregar miembros aceptados que falten ──────────
                const [gruposExistentes] = await db.query(
                    `SELECT c.id_conversacion, c.id_orden FROM conversaciones c WHERE c.tipo = 'grupo' AND c.id_orden IS NOT NULL`
                );
                for (const grp of gruposExistentes) {
                    try {
                        // Dueño de la orden
                        const [[ordInfo]] = await db.query(`SELECT usuario_id FROM OrdenesTrabajo WHERE id_orden = ? LIMIT 1`, [grp.id_orden]);
                        if (ordInfo) {
                            const [[pOwner]] = await db.query(`SELECT id_Perfil_Persona FROM Personas WHERE id_Usuario = ? LIMIT 1`, [ordInfo.usuario_id]);
                            if (pOwner) {
                                await db.query(
                                    `INSERT IGNORE INTO conversaciones_miembros (id_conversacion, id_Perfil_Persona, rol) VALUES (?, ?, 'admin')`,
                                    [grp.id_conversacion, pOwner.id_Perfil_Persona]
                                );
                            }
                        }
                        // Postulantes aceptados
                        const [aceptados] = await db.query(
                            `SELECT po.usuario_id FROM PostulacionesOrdenes po WHERE po.id_orden = ? AND po.estado = 'aceptada'`,
                            [grp.id_orden]
                        );
                        for (const pa of aceptados) {
                            const [[pPost]] = await db.query(`SELECT id_Perfil_Persona FROM Personas WHERE id_Usuario = ? LIMIT 1`, [pa.usuario_id]);
                            if (pPost) {
                                await db.query(
                                    `INSERT IGNORE INTO conversaciones_miembros (id_conversacion, id_Perfil_Persona, rol) VALUES (?, ?, 'miembro')`,
                                    [grp.id_conversacion, pPost.id_Perfil_Persona]
                                );
                            }
                        }
                        // Asegurar al menos 1 mensaje de bienvenida si la conv está vacía
                        const [[msgCount]] = await db.query(`SELECT COUNT(*) AS c FROM mensajes WHERE id_conversacion = ?`, [grp.id_conversacion]);
                        if (msgCount?.c === 0 || msgCount?.c === '0') {
                            const [[ordTitulo]] = await db.query(`SELECT titulo, usuario_id FROM OrdenesTrabajo WHERE id_orden = ? LIMIT 1`, [grp.id_orden]);
                            const [[pOwn]] = await db.query(`SELECT id_Perfil_Persona FROM Personas WHERE id_Usuario = ? LIMIT 1`, [ordTitulo?.usuario_id]);
                            if (pOwn && ordTitulo) {
                                await db.query(
                                    `INSERT INTO mensajes (id_conversacion, id_persona_envia, id_persona_recibe, contenido, fecha_envio, leido, borrado_por_emisor, borrado_por_receptor)
                                     VALUES (?, ?, NULL, ?, CURRENT_TIMESTAMP, 0, 0, 0)`,
                                    [grp.id_conversacion, pOwn.id_Perfil_Persona, `📋 Grupo para la orden de trabajo: "${ordTitulo.titulo}"`]
                                );
                            }
                        }
                    } catch (eRep) {
                        console.warn(`   ⚠️  Reparación grupo conv ${grp.id_conversacion}:`, eRep.message);
                    }
                }
                if (gruposExistentes.length > 0) console.log(`✅ Reparación de ${gruposExistentes.length} grupo(s) completada.`);

            } catch (eMig) {
                console.warn('⚠️  Migración retroactiva de grupos (no crítica):', eMig.message);
            }
            // ────────────────────────────────────────────────────────────────────────────

        } catch (errGrupo) {
            console.warn('⚠️  Setup grupos de mensajería (no crítico):', errGrupo.message);
        }
    } catch (err) {
        console.error('❌ Error al crear tablas de órdenes:', err.message);
    }
})();

// --------------------------------------------------
// GET /api/ordenes-trabajo
//   Sin param  → todas las órdenes con conteo de postulaciones
// --------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT ot.*,
                    u.correo AS correo_usuario,
                    CONCAT(p.nombre_Persona, ' ', IFNULL(p.apellido_Persona,'')) AS nombre_usuario,
                    p.imagenUrl_Persona AS imagen_usuario,
                    p.id_Perfil_Persona,
                    (SELECT COUNT(*) FROM PostulacionesOrdenes po
                     WHERE po.id_orden = ot.id_orden AND po.estado != 'rechazada') AS total_postulaciones
             FROM OrdenesTrabajo ot
             LEFT JOIN Usuarios u ON ot.usuario_id = u.id_usuario
             LEFT JOIN Personas p ON p.id_Usuario = u.id_usuario
             ORDER BY ot.fecha_creacion DESC`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[OT GET /]', err);
        res.status(500).json({ success: false, mensaje: 'Error al obtener órdenes.', error: err.message });
    }
});

// --------------------------------------------------
// GET /api/ordenes-trabajo/mis-postulaciones?usuario_id=X
//   Devuelve todas las postulaciones del usuario (id_orden + estado)
// --------------------------------------------------
router.get('/mis-postulaciones', async (req, res) => {
    const { usuario_id } = req.query;
    if (!usuario_id) return res.status(400).json({ success: false, mensaje: 'usuario_id requerido.' });
    try {
        const [rows] = await db.query(
            `SELECT
                po.id_postulacion,
                po.id_orden,
                po.mensaje,
                po.portafolio_url,
                po.estado        AS estado_postulacion,
                po.fecha_postulacion,
                ot.titulo,
                ot.descripcion,
                ot.ubicacion_obra,
                ot.fecha_inicio,
                ot.fecha_fin,
                ot.especialidad,
                ot.presupuesto_estimado,
                ot.max_postulantes,
                ot.estado        AS estado_orden,
                CONCAT(IFNULL(p.nombre_Persona,''), ' ', IFNULL(p.apellido_Persona,'')) AS nombre_publicador,
                p.imagenUrl_Persona AS imagen_publicador
             FROM PostulacionesOrdenes po
             JOIN OrdenesTrabajo ot ON ot.id_orden = po.id_orden
             LEFT JOIN Usuarios u ON u.id_usuario = ot.usuario_id
             LEFT JOIN Personas p ON p.id_Usuario = u.id_usuario
             WHERE po.usuario_id = ?
             ORDER BY po.fecha_postulacion DESC`,
            [usuario_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[OT GET /mis-postulaciones]', err);
        res.status(500).json({ success: false, mensaje: 'Error al obtener postulaciones.', error: err.message });
    }
});

// --------------------------------------------------
// GET /api/ordenes-trabajo/:id
// --------------------------------------------------
router.get('/:id', async (req, res) => {
    // Evitar que ":id" capture rutas especiales
    if (isNaN(req.params.id)) return res.status(400).json({ success: false, mensaje: 'ID inválido.' });
    try {
        const [rows] = await db.query(
            `SELECT ot.*,
                    u.correo AS correo_usuario,
                    CONCAT(p.nombre_Persona, ' ', IFNULL(p.apellido_Persona,'')) AS nombre_usuario,
                    (SELECT COUNT(*) FROM PostulacionesOrdenes po
                     WHERE po.id_orden = ot.id_orden AND po.estado != 'rechazada') AS total_postulaciones
             FROM OrdenesTrabajo ot
             LEFT JOIN Usuarios u ON ot.usuario_id = u.id_usuario
             LEFT JOIN Personas p ON p.id_Usuario = u.id_usuario
             WHERE ot.id_orden = ?`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, mensaje: 'Orden no encontrada.' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('[OT GET /:id]', err);
        res.status(500).json({ success: false, mensaje: 'Error al obtener la orden.', error: err.message });
    }
});

// --------------------------------------------------
// POST /api/ordenes-trabajo  → Crear nueva orden
// --------------------------------------------------
router.post('/', async (req, res) => {
    const { usuario_id, titulo, descripcion, ubicacion_obra, fecha_inicio, fecha_fin, especialidad, presupuesto_estimado, max_postulantes, restringir_por_ubicacion } = req.body;

    if (!usuario_id || !titulo || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ success: false, mensaje: 'Campos requeridos: usuario_id, titulo, fecha_inicio, fecha_fin.' });
    }
    if (fecha_fin < fecha_inicio) {
        return res.status(400).json({ success: false, mensaje: 'La fecha de fin no puede ser anterior a la fecha de inicio.' });
    }
    const maxPost = parseInt(max_postulantes) || 1;
    if (maxPost < 1) return res.status(400).json({ success: false, mensaje: 'El máximo de postulantes debe ser al menos 1.' });

    try {
        const [result] = await db.query(
            `INSERT INTO OrdenesTrabajo (usuario_id, titulo, descripcion, ubicacion_obra, fecha_inicio, fecha_fin, especialidad, presupuesto_estimado, max_postulantes, restringir_por_ubicacion)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [usuario_id, titulo, descripcion || null, ubicacion_obra || null, fecha_inicio, fecha_fin, especialidad || null, presupuesto_estimado || null, maxPost, restringir_por_ubicacion ? 1 : 0]
        );
        res.status(201).json({ success: true, mensaje: 'Orden creada exitosamente.', id_orden: result.insertId });
    } catch (err) {
        console.error('[OT POST /]', err);
        res.status(500).json({ success: false, mensaje: 'Error al crear la orden.', error: err.message });
    }
});

// --------------------------------------------------
// PUT /api/ordenes-trabajo/:id  → Actualizar orden completa
// --------------------------------------------------
router.put('/:id', async (req, res) => {
    const { titulo, descripcion, ubicacion_obra, fecha_inicio, fecha_fin, especialidad, presupuesto_estimado, estado, max_postulantes, restringir_por_ubicacion } = req.body;

    if (!titulo || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ success: false, mensaje: 'Campos requeridos: titulo, fecha_inicio, fecha_fin.' });
    }
    if (fecha_fin < fecha_inicio) {
        return res.status(400).json({ success: false, mensaje: 'La fecha de fin no puede ser anterior a la fecha de inicio.' });
    }
    const maxPost = parseInt(max_postulantes) || 1;
    const estadoNormalizado = normalizarEstadoOT(estado);
    if (estado !== undefined && estado !== null && String(estado).trim() !== '' && !estadoNormalizado) {
        return res.status(400).json({ success: false, mensaje: `Estado inválido. Valores permitidos: ${ESTADOS_OT_VALIDOS.join(', ')}.` });
    }

    try {
        const [result] = await db.query(
            `UPDATE OrdenesTrabajo
             SET titulo = ?, descripcion = ?, ubicacion_obra = ?, fecha_inicio = ?, fecha_fin = ?,
                 especialidad = ?, presupuesto_estimado = ?, estado = IFNULL(?, estado),
                 max_postulantes = ?, restringir_por_ubicacion = IFNULL(?, restringir_por_ubicacion)
             WHERE id_orden = ?`,
            [titulo, descripcion || null, ubicacion_obra || null, fecha_inicio, fecha_fin,
             especialidad || null, presupuesto_estimado || null, estadoNormalizado || null, maxPost,
             restringir_por_ubicacion !== undefined ? (restringir_por_ubicacion ? 1 : 0) : null,
             req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, mensaje: 'Orden no encontrada.' });
        res.json({ success: true, mensaje: 'Orden actualizada correctamente.' });
    } catch (err) {
        console.error('[OT PUT /:id]', err);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar la orden.', error: err.message });
    }
});

// --------------------------------------------------
// PATCH /api/ordenes-trabajo/:id  → Cambiar solo el estado
// --------------------------------------------------
router.patch('/:id', async (req, res) => {
    const { estado, restringir_por_ubicacion } = req.body;

    const setClauses = [];
    const params = [];

    if (estado !== undefined) {
        const estadoNormalizado = normalizarEstadoOT(estado);
        if (!estadoNormalizado) {
            return res.status(400).json({ success: false, mensaje: `Estado inválido. Valores permitidos: ${ESTADOS_OT_VALIDOS.join(', ')}.` });
        }
        setClauses.push('estado = ?');
        params.push(estadoNormalizado);
    }
    if (restringir_por_ubicacion !== undefined) {
        setClauses.push('restringir_por_ubicacion = ?');
        params.push(restringir_por_ubicacion ? 1 : 0);
    }
    if (setClauses.length === 0) {
        return res.status(400).json({ success: false, mensaje: 'No hay campos para actualizar.' });
    }
    params.push(req.params.id);

    try {
        const [result] = await db.query(
            `UPDATE OrdenesTrabajo SET ${setClauses.join(', ')} WHERE id_orden = ?`,
            params
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, mensaje: 'Orden no encontrada.' });
        res.json({ success: true, mensaje: 'Orden actualizada correctamente.' });
    } catch (err) {
        console.error('[OT PATCH /:id]', err);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar el estado.', error: err.message });
    }
});

// --------------------------------------------------
// DELETE /api/ordenes-trabajo/:id  → Eliminar orden
// --------------------------------------------------
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query(
            `DELETE FROM OrdenesTrabajo WHERE id_orden = ?`,
            [req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, mensaje: 'Orden no encontrada.' });
        res.json({ success: true, mensaje: 'Orden eliminada correctamente.' });
    } catch (err) {
        console.error('[OT DELETE /:id]', err);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar la orden.', error: err.message });
    }
});

// ==================================================
// POSTULACIONES
// ==================================================

// GET /api/ordenes-trabajo/:id/postulaciones  → listar postulantes de una orden (admin)
router.get('/:id/postulaciones', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT po.*,
                    CONCAT(IFNULL(p.nombre_Persona,''), ' ', IFNULL(p.apellido_Persona,'')) AS nombre_tecnico,
                    p.imagenUrl_Persona AS imagen_tecnico,
                    p.id_Perfil_Persona AS id_perfil_tecnico,
                    u.correo AS correo_tecnico,
                    md.puntualidad,
                    md.calidad_trabajo,
                    md.limpieza,
                    md.comunicacion,
                    md.cantidad_calificaciones
             FROM PostulacionesOrdenes po
             LEFT JOIN Usuarios u ON po.usuario_id = u.id_usuario
             LEFT JOIN Personas p ON p.id_Usuario = u.id_usuario
             LEFT JOIN Metricas_Desempeno md ON md.id_perfil_persona = p.id_Perfil_Persona
             WHERE po.id_orden = ?
             ORDER BY po.fecha_postulacion ASC`,
            [req.params.id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[OT GET /:id/postulaciones]', err);
        res.status(500).json({ success: false, mensaje: 'Error al obtener postulaciones.', error: err.message });
    }
});

// GET /api/ordenes-trabajo/:id/postulacion-status?usuario_id=X  → estado de mi postulación
router.get('/:id/postulacion-status', async (req, res) => {
    const { usuario_id } = req.query;
    if (!usuario_id) return res.status(400).json({ success: false, mensaje: 'usuario_id requerido.' });
    try {
        const [rows] = await db.query(
            `SELECT * FROM PostulacionesOrdenes WHERE id_orden = ? AND usuario_id = ? LIMIT 1`,
            [req.params.id, usuario_id]
        );
        if (!rows.length) return res.json({ success: true, postulado: false });
        res.json({ success: true, postulado: true, postulacion: rows[0] });
    } catch (err) {
        console.error('[OT GET /:id/postulacion-status]', err);
        res.status(500).json({ success: false, mensaje: 'Error.', error: err.message });
    }
});

// POST /api/ordenes-trabajo/:id/postular  → técnico se postula
router.post('/:id/postular', async (req, res) => {
    const { usuario_id, mensaje } = req.body;
    if (!usuario_id) return res.status(400).json({ success: false, mensaje: 'usuario_id requerido.' });

    try {
        // Verificar que la orden existe y está activa
        const [ordenes] = await db.query(
            `SELECT id_orden, max_postulantes, estado FROM OrdenesTrabajo WHERE id_orden = ?`,
            [req.params.id]
        );
        if (!ordenes.length) return res.status(404).json({ success: false, mensaje: 'Orden no encontrada.' });
        const orden = ordenes[0];

        if (orden.estado === 'cancelada' || orden.estado === 'completada') {
            return res.status(400).json({ success: false, mensaje: 'No es posible postularse a una orden cancelada o completada.' });
        }

        // Verificar si ya se postuló
        const [existente] = await db.query(
            `SELECT id_postulacion FROM PostulacionesOrdenes WHERE id_orden = ? AND usuario_id = ?`,
            [req.params.id, usuario_id]
        );
        if (existente.length) {
            return res.status(409).json({ success: false, mensaje: 'Ya te has postulado a esta orden.' });
        }

        // Verificar cupo disponible (postulaciones no rechazadas)
        const [conteo] = await db.query(
            `SELECT COUNT(*) AS total FROM PostulacionesOrdenes WHERE id_orden = ? AND estado != 'rechazada'`,
            [req.params.id]
        );
        if (conteo[0].total >= orden.max_postulantes) {
            return res.status(400).json({ success: false, mensaje: `Esta orden ya alcanzó el máximo de ${orden.max_postulantes} postulante(s).` });
        }

        const portafolio_url = req.body.portafolio_url || null;
        const [result] = await db.query(
            `INSERT INTO PostulacionesOrdenes (id_orden, usuario_id, mensaje, portafolio_url) VALUES (?, ?, ?, ?)`,
            [req.params.id, usuario_id, mensaje || null, portafolio_url]
        );
        res.status(201).json({ success: true, mensaje: 'Postulación enviada correctamente.', id_postulacion: result.insertId });
    } catch (err) {
        console.error('[OT POST /:id/postular]', err);
        res.status(500).json({ success: false, mensaje: 'Error al postularse.', error: err.message });
    }
});

// PATCH /api/ordenes-trabajo/:id/postulaciones/:postId  → admin acepta o rechaza
router.patch('/:id/postulaciones/:postId', async (req, res) => {
    const { estado } = req.body;
    if (!['aceptada', 'rechazada'].includes(estado)) {
        return res.status(400).json({ success: false, mensaje: "Estado debe ser 'aceptada' o 'rechazada'." });
    }
    try {
        const [result] = await db.query(
            `UPDATE PostulacionesOrdenes SET estado = ? WHERE id_postulacion = ? AND id_orden = ?`,
            [estado, req.params.postId, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, mensaje: 'Postulación no encontrada.' });

        // ── Al aceptar: crear/unirse al grupo de mensajería de la orden ──
        if (estado === 'aceptada') {
            try {
                // Obtener datos del postulante y de la orden
                const [[post]] = await db.query(
                    `SELECT usuario_id FROM PostulacionesOrdenes WHERE id_postulacion = ?`,
                    [req.params.postId]
                );
                const [[orden]] = await db.query(
                    `SELECT titulo, usuario_id FROM OrdenesTrabajo WHERE id_orden = ?`,
                    [req.params.id]
                );
                if (!post || !orden) throw new Error('Datos no encontrados');

                // Obtener id_Perfil_Persona del postulante y del dueño de la orden
                const [[pPost]]  = await db.query(`SELECT id_Perfil_Persona FROM Personas WHERE id_Usuario = ? LIMIT 1`, [post.usuario_id]);
                const [[pOwner]] = await db.query(`SELECT id_Perfil_Persona FROM Personas WHERE id_Usuario = ? LIMIT 1`, [orden.usuario_id]);
                if (!pPost || !pOwner) throw new Error('Personas no encontradas');

                const nombreGrupo = `OT: ${orden.titulo}`;

                // Buscar grupo existente para esta orden
                const [grupoRows] = await db.query(
                    `SELECT id_conversacion FROM conversaciones WHERE tipo = 'grupo' AND id_orden = ? LIMIT 1`,
                    [req.params.id]
                );

                let idConversacion;
                if (grupoRows.length === 0) {
                    // Crear nueva conversación de grupo
                    // Intentar sin id_solicitud; si falla por NOT NULL, usar NULL explícito
                    let ins;
                    try {
                        [ins] = await db.query(
                            `INSERT INTO conversaciones (tipo, nombre_grupo, id_orden) VALUES ('grupo', ?, ?)`,
                            [nombreGrupo, req.params.id]
                        );
                    } catch (errIns) {
                        // Si la columna id_solicitud sigue siendo NOT NULL, insertar con NULL
                        if (errIns.code === 'ER_NO_DEFAULT_FOR_FIELD' || errIns.code === 'WARN_DATA_TRUNCATED' || errIns.message.includes('id_solicitud')) {
                            [ins] = await db.query(
                                `INSERT INTO conversaciones (id_solicitud, tipo, nombre_grupo, id_orden) VALUES (NULL, 'grupo', ?, ?)`,
                                [nombreGrupo, req.params.id]
                            );
                        } else throw errIns;
                    }
                    idConversacion = ins.insertId;

                    // Agregar dueño de la orden como admin
                    await db.query(
                        `INSERT IGNORE INTO conversaciones_miembros (id_conversacion, id_Perfil_Persona, rol) VALUES (?, ?, 'admin')`,
                        [idConversacion, pOwner.id_Perfil_Persona]
                    );

                    // Mensaje de creación del grupo
                    await db.query(
                        `INSERT INTO mensajes (id_conversacion, id_persona_envia, id_persona_recibe, contenido, fecha_envio, leido, borrado_por_emisor, borrado_por_receptor)
                         VALUES (?, ?, NULL, ?, CURRENT_TIMESTAMP, 0, 0, 0)`,
                        [idConversacion, pOwner.id_Perfil_Persona, `📋 Grupo creado para la orden de trabajo: "${orden.titulo}"`]
                    );
                } else {
                    idConversacion = grupoRows[0].id_conversacion;
                }

                // Agregar postulante al grupo (INSERT IGNORE: no falla si ya era miembro)
                await db.query(
                    `INSERT IGNORE INTO conversaciones_miembros (id_conversacion, id_Perfil_Persona, rol) VALUES (?, ?, 'miembro')`,
                    [idConversacion, pPost.id_Perfil_Persona]
                );

                // Mensaje de bienvenida al nuevo integrante
                const [[personaPost]] = await db.query(
                    `SELECT TRIM(CONCAT(IFNULL(nombre_Persona,''), ' ', IFNULL(apellido_Persona,''))) AS nombre FROM Personas WHERE id_Perfil_Persona = ? LIMIT 1`,
                    [pPost.id_Perfil_Persona]
                );
                const nombrePost = personaPost?.nombre || 'El técnico';
                await db.query(
                    `INSERT INTO mensajes (id_conversacion, id_persona_envia, id_persona_recibe, contenido, fecha_envio, leido, borrado_por_emisor, borrado_por_receptor)
                     VALUES (?, ?, NULL, ?, CURRENT_TIMESTAMP, 0, 0, 0)`,
                    [idConversacion, pOwner.id_Perfil_Persona, `✅ ${nombrePost} se ha sumado al equipo.`]
                );

                // Notificar vía socket al nuevo miembro (tiempo real)
                const { getIo } = require('../socketInstance');
                const io = getIo();
                if (io) {
                    io.to(`user_${pPost.id_Perfil_Persona}`).emit('nuevo_grupo', {
                        id_conversacion: idConversacion,
                        nombre_grupo: nombreGrupo
                    });
                }

                // ── Enviar correo de notificación al postulante ──
                try {
                    const [[usuarioPost]] = await db.query(
                        `SELECT correo FROM Usuarios WHERE id_usuario = ? LIMIT 1`,
                        [post.usuario_id]
                    );
                    if (usuarioPost?.correo) {
                        const frontendUrl = req.headers.origin || process.env.FRONTEND_URL;
                        await enviarNotificacionContextual(usuarioPost.correo, [{
                            tipo: 'exito',
                            titulo: '¡Tu postulación fue aceptada!',
                            detalle: `Has sido aceptado para la orden de trabajo "${orden.titulo}". Ya puedes ver el grupo de mensajería.`,
                            orden: orden.titulo
                        }], frontendUrl);
                    }
                } catch (errMail) {
                    console.warn('[OT PATCH correo aceptado]', errMail.message);
                }

                return res.json({
                    success: true,
                    mensaje: `Postulación ${estado} correctamente.`,
                    grupo: { id_conversacion: idConversacion, nombre_grupo: nombreGrupo }
                });
            } catch (errGrupo) {
                console.warn('[OT PATCH grupo]', errGrupo.message);
                // No fallamos la petición principal si el grupo falla
                return res.json({ success: true, mensaje: `Postulación ${estado} correctamente.` });
            }
        }

        // ── Al rechazar: enviar correo de notificación ──
        if (estado === 'rechazada') {
            try {
                const [[postData]] = await db.query(
                    `SELECT po.usuario_id, ot.titulo
                     FROM PostulacionesOrdenes po
                     JOIN OrdenesTrabajo ot ON ot.id_orden = po.id_orden
                     WHERE po.id_postulacion = ? LIMIT 1`,
                    [req.params.postId]
                );
                if (postData) {
                    const [[usuarioPost]] = await db.query(
                        `SELECT correo FROM Usuarios WHERE id_usuario = ? LIMIT 1`,
                        [postData.usuario_id]
                    );
                    if (usuarioPost?.correo) {
                        const frontendUrl = req.headers.origin || process.env.FRONTEND_URL;
                        await enviarNotificacionContextual(usuarioPost.correo, [{
                            tipo: 'alerta',
                            titulo: 'Tu postulación no fue seleccionada',
                            detalle: `El administrador revisó tu postulación para "${postData.titulo}" y en esta ocasión no fue seleccionada. ¡Sigue intentándolo!`,
                            orden: postData.titulo
                        }], frontendUrl);
                    }
                }
            } catch (errMail) {
                console.warn('[OT PATCH correo rechazado]', errMail.message);
            }
        }

        res.json({ success: true, mensaje: `Postulación ${estado} correctamente.` });
    } catch (err) {
        console.error('[OT PATCH /:id/postulaciones/:postId]', err);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar postulación.', error: err.message });
    }
});

// =====================================================
// POST /enviar-alerta-email  (H8 — notificaciones)
// Body: { usuario_id, alertas: [{tipo, titulo, detalle, orden}] }
// =====================================================
router.post('/enviar-alerta-email', async (req, res) => {
    const { usuario_id, alertas } = req.body;
    if (!usuario_id || !alertas || !Array.isArray(alertas) || alertas.length === 0) {
        return res.status(400).json({ success: false, mensaje: 'Faltan datos: usuario_id y alertas[]' });
    }
    try {
        const [rows] = await db.query('SELECT correo FROM Usuarios WHERE id_usuario = ?', [usuario_id]);
        if (!rows.length || !rows[0].correo) {
            return res.status(404).json({ success: false, mensaje: 'Usuario o correo no encontrado.' });
        }
        const resultado = await enviarNotificacionContextual(rows[0].correo, alertas, req.headers.origin || process.env.FRONTEND_URL);
        return res.json(resultado);
    } catch (err) {
        console.error('[OT /enviar-alerta-email]', err);
        return res.status(500).json({ success: false, mensaje: 'Error al enviar correo.', error: err.message });
    }
});

module.exports = router;
