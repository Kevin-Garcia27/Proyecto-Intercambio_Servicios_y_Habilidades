const express = require('express');
const router = express.Router();

const db = require('../db');
const verificarPermiso = require('../middlewares/verificarPermiso');
const registrarAuditoria = require('../middlewares/auditLogger');

// ----------------------------------------------------
// ENDPOINT: Obtener todas las configuraciones (GET /configuraciones)
// ----------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const [configuraciones] = await db.execute('SELECT id_configuracion, clave, valor, tipo, descripcion FROM Configuraciones_Sistema');
        
        // Convertir valores al tipo correcto
        const configsParsed = {};
        configuraciones.forEach(cfg => {
            let valor = cfg.valor;
            if (cfg.tipo === 'number') {
                valor = Number(valor);
            } else if (cfg.tipo === 'boolean') {
                valor = valor === '1' || valor === 'true';
            } else if (cfg.tipo === 'json') {
                try {
                    valor = JSON.parse(valor);
                } catch (e) {
                    // keep as string if invalid JSON
                }
            }
            configsParsed[cfg.clave] = { valor, tipo: cfg.tipo, descripcion: cfg.descripcion };
        });
        
        res.json({
            success: true,
            data: configsParsed
        });
    } catch (error) {
        console.error('Error al obtener configuraciones:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al obtener las configuraciones'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Actualizar una configuración (PUT /configuraciones)
// ----------------------------------------------------
router.put('/', verificarPermiso('configGenerales:editar'), async (req, res) => {
    const { clave, valor } = req.body;
    
    if (!clave) {
        return res.status(400).json({ 
            success: false,
            message: 'La clave de configuración es requerida' 
        });
    }

    try {
        const [result] = await db.execute('UPDATE Configuraciones_Sistema SET valor = ? WHERE clave = ?', [String(valor), clave]);
        
        if (result.affectedRows === 0) {
            // Si no existía, lo insertamos
            await db.execute('INSERT INTO Configuraciones_Sistema (clave, valor, tipo) VALUES (?, ?, ?)', [clave, String(valor), 'general']);
        }
        
        // ── BITÁCORA ────────────────────────────────────────────────────────────
        registrarAuditoria(req.user?.usuarioId || null, 'EDITAR_CONFIG_GENERAL', 'Configuraciones', 
            `Se actualizó la configuración general "${clave}"`, req.ip || '127.0.0.1');
        // ────────────────────────────────────────────────────────────────────────
        res.json({
            success: true,
            message: 'Configuración actualizada correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar configuración:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al actualizar la configuración'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Obtener todas las modalidades (GET /configuraciones/modalidades)
// ----------------------------------------------------
router.get('/modalidades', async (req, res) => {
    try {
        const [resultado] = await db.execute('SELECT id_modalidad, nombre, activo FROM Modalidades_Intercambio');
        
        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        console.error('Error al obtener modalidades:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al obtener las modalidades'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Agregar una modalidad (POST /configuraciones/modalidades)
// ----------------------------------------------------
router.post('/modalidades', verificarPermiso('modalidades:crear'), async (req, res) => {
    const { nombre } = req.body;
    
    if (!nombre) {
        return res.status(400).json({ 
            success: false,
            message: 'El nombre de la modalidad es requerido' 
        });
    }

    try {
        await db.execute('INSERT INTO Modalidades_Intercambio (nombre, activo) VALUES (?, 1)', [nombre.trim()]);
        
        // ── BITÁCORA ────────────────────────────────────────────────────────────
        registrarAuditoria(req.user?.usuarioId || null, 'CREAR_MODALIDAD', 'Configuraciones', 
            `Se creó la modalidad de intercambio "${nombre.trim()}"`, req.ip || '127.0.0.1');
        // ────────────────────────────────────────────────────────────────────────
        res.json({
            success: true,
            message: 'Modalidad agregada correctamente'
        });
    } catch (error) {
        console.error('Error al agregar modalidad:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al agregar la modalidad'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Actualizar una modalidad (PUT /configuraciones/modalidades/:id)
// ----------------------------------------------------
router.put('/modalidades/:id', verificarPermiso('modalidades:editar'), async (req, res) => {
    const id = parseInt(req.params.id);
    const { nombre, activo } = req.body;
    
    if (isNaN(id)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID no válido' 
        });
    }

    if (!nombre) {
        return res.status(400).json({ 
            success: false,
            message: 'El nombre de la modalidad es requerido' 
        });
    }

    try {
        await db.execute('UPDATE Modalidades_Intercambio SET nombre = ?, activo = ? WHERE id_modalidad = ?', [nombre.trim(), activo ? 1 : 0, id]);
        
        // ── BITÁCORA ────────────────────────────────────────────────────────────
        registrarAuditoria(req.user?.usuarioId || null, 'EDITAR_MODALIDAD', 'Configuraciones', 
            `Se editó la modalidad de intercambio ID ${id} (nombre: "${nombre.trim()}", activo: ${activo ? 1 : 0})`, req.ip || '127.0.0.1');
        // ────────────────────────────────────────────────────────────────────────
        res.json({
            success: true,
            message: 'Modalidad actualizada correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar modalidad:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al actualizar la modalidad'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Eliminar una modalidad (DELETE /configuraciones/modalidades/:id)
// ----------------------------------------------------
router.delete('/modalidades/:id', verificarPermiso('modalidades:eliminar'), async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID no válido' 
        });
    }

    try {
        await db.execute('DELETE FROM Modalidades_Intercambio WHERE id_modalidad = ?', [id]);
        
        // ── BITÁCORA ────────────────────────────────────────────────────────────
        registrarAuditoria(req.user?.usuarioId || null, 'ELIMINAR_MODALIDAD', 'Configuraciones', 
            `Se eliminó la modalidad de intercambio con ID ${id}`, req.ip || '127.0.0.1');
        // ────────────────────────────────────────────────────────────────────────
        res.json({
            success: true,
            message: 'Modalidad eliminada correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar modalidad:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al eliminar la modalidad'
        });
    }
});

// ====================================================
// MOTIVOS DE BLOQUEO PREDEFINIDOS
// ====================================================

// Obtener motivos (GET /configuraciones/motivos-bloqueo)
router.get('/motivos-bloqueo', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id_motivo, motivo FROM Motivos_Bloqueo_Predefinidos ORDER BY id_motivo ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener motivos de bloqueo:', error.message);
        res.status(500).json({ success: false, error: 'Error del servidor al obtener motivos de bloqueo' });
    }
});

// Agregar motivo (POST /configuraciones/motivos-bloqueo)
router.post('/motivos-bloqueo', verificarPermiso('motivosBloqueo:crear'), async (req, res) => {
    const { motivo } = req.body;
    if (!motivo) {
        return res.status(400).json({ success: false, message: 'El motivo es requerido' });
    }
    try {
        await db.execute('INSERT INTO Motivos_Bloqueo_Predefinidos (motivo) VALUES (?)', [motivo]);
        // ── BITÁCORA ────────────────────────────────────────────────────────────
        registrarAuditoria(req.user?.usuarioId || null, 'CREAR_MOTIVO_BLOQUEO', 'Configuraciones', 
            `Se agregó un nuevo motivo de bloqueo predefinido: "${motivo}"`, req.ip || '127.0.0.1');
        // ────────────────────────────────────────────────────────────────────────
        res.json({ success: true, message: 'Motivo agregado correctamente' });
    } catch (error) {
        console.error('Error al agregar motivo de bloqueo:', error.message);
        res.status(500).json({ success: false, error: 'Error del servidor al agregar motivo de bloqueo' });
    }
});

// Editar motivo (PUT /configuraciones/motivos-bloqueo/:id)
router.put('/motivos-bloqueo/:id', verificarPermiso('motivosBloqueo:editar'), async (req, res) => {
    const id = parseInt(req.params.id);
    const { motivo } = req.body;
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    if (!motivo || !motivo.trim()) return res.status(400).json({ success: false, message: 'El motivo es requerido' });
    try {
        await db.execute('UPDATE Motivos_Bloqueo_Predefinidos SET motivo = ? WHERE id_motivo = ?', [motivo.trim(), id]);
        // ── BITÁCORA ────────────────────────────────────────────────────────────
        registrarAuditoria(req.user?.usuarioId || null, 'EDITAR_MOTIVO_BLOQUEO', 'Configuraciones', 
            `Se modificó el motivo de bloqueo ID ${id} a "${motivo.trim()}"`, req.ip || '127.0.0.1');
        // ────────────────────────────────────────────────────────────────────────
        res.json({ success: true, message: 'Motivo actualizado correctamente' });
    } catch (error) {
        console.error('Error al editar motivo de bloqueo:', error.message);
        res.status(500).json({ success: false, error: 'Error del servidor al editar motivo de bloqueo' });
    }
});

// Eliminar motivo (DELETE /configuraciones/motivos-bloqueo)
router.delete('/motivos-bloqueo', verificarPermiso('motivosBloqueo:eliminar'), async (req, res) => {
    const { motivo } = req.body;
    if (!motivo) {
        return res.status(400).json({ success: false, message: 'El motivo a eliminar es requerido' });
    }
    try {
        await db.execute('DELETE FROM Motivos_Bloqueo_Predefinidos WHERE motivo = ?', [motivo]);
        // ── BITÁCORA ────────────────────────────────────────────────────────────
        registrarAuditoria(req.user?.usuarioId || null, 'ELIMINAR_MOTIVO_BLOQUEO', 'Configuraciones', 
            `Se eliminó el motivo de bloqueo predefinido: "${motivo}"`, req.ip || '127.0.0.1');
        // ────────────────────────────────────────────────────────────────────────
        res.json({ success: true, message: 'Motivo eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar motivo de bloqueo:', error.message);
        res.status(500).json({ success: false, error: 'Error del servidor al eliminar motivo de bloqueo' });
    }
});

// ====================================================
// ROLES Y PERMISOS
// ====================================================

// Obtener permisos disponibles en el sistema (GET /configuraciones/permisos)
router.get('/permisos', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT link as clave, nombre FROM opciones ORDER BY orden ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener permisos:', error.message);
        res.status(500).json({ success: false, error: 'Error al obtener permisos' });
    }
});

// Reasignar rol a múltiples usuarios (PUT /configuraciones/roles/reasignar-usuarios)
router.put('/roles/reasignar-usuarios', verificarPermiso('rolesPermisos:editar'), async (req, res) => {
    const { asignaciones } = req.body; // array de { usuario_id, nuevo_rol_id }
    
    if (!Array.isArray(asignaciones)) {
        return res.status(400).json({ success: false, message: 'Las asignaciones deben ser un array' });
    }

    try {
        // Ejecutar las actualizaciones en un bucle
        for (let asig of asignaciones) {
            await db.execute('UPDATE d_usuarios_roles SET rol_id = ? WHERE usuario_id = ?', [asig.nuevo_rol_id, asig.usuario_id]);
        }
        // ── BITÁCORA ──────────────────────────────────────────────────────────────
        registrarAuditoria(req.user?.usuarioId, 'REASIGNAR_ROL_USUARIOS', 'Configuraciones',
            `Se reasignó el rol a ${asignaciones.length} usuario(s)`,
            req.ip || '127.0.0.1');
        // ─────────────────────────────────────────────────────────────────────────
        res.json({ success: true, message: 'Usuarios reasignados correctamente' });
    } catch (error) {
        console.error('Error al reasignar usuarios:', error.message);
        res.status(500).json({ success: false, error: 'Error al reasignar usuarios' });
    }
});

// Actualizar nombre de un permiso (PUT /configuraciones/permisos/:clave)
router.put('/permisos/:clave', verificarPermiso('rolesPermisos:editar'), async (req, res) => {
    const { clave } = req.params;
    const { nombre } = req.body;

    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ success: false, message: 'El nombre es requerido' });
    }

    try {
        const [result] = await db.execute('UPDATE opciones SET nombre = ? WHERE link = ?', [nombre.trim(), clave]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Permiso no encontrado' });
        }
        res.json({ success: true, message: 'Permiso actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar permiso:', error.message);
        res.status(500).json({ success: false, error: 'Error al actualizar permiso' });
    }
});

// Obtener todos los roles con sus permisos (GET /configuraciones/roles)
router.get('/roles', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT r.id_rol, r.nombre_rol, r.descripcion_rol, r.es_default,
                   GROUP_CONCAT(o.link) as permisos_lista
            FROM Roles r
            LEFT JOIN d_roles_opciones ro ON r.id_rol = ro.rol_id
            LEFT JOIN opciones o ON ro.opcion_id = o.opcion_id
            GROUP BY r.id_rol
        `);
        
        const roles = rows.map(r => ({
            id_rol: r.id_rol,
            nombre_rol: r.nombre_rol,
            descripcion_rol: r.descripcion_rol,
            es_default: r.es_default === 1,
            permisos: r.permisos_lista ? r.permisos_lista.split(',') : []
        }));

        res.json({ success: true, data: roles });
    } catch (error) {
        console.error('Error al obtener roles:', error.message);
        res.status(500).json({ success: false, error: 'Error del servidor al obtener roles y permisos' });
    }
});

// Crear un nuevo rol personalizado (POST /configuraciones/roles)
router.post('/roles', verificarPermiso('rolesPermisos:crear'), async (req, res) => {
    const { nombre_rol, descripcion_rol } = req.body;
    if (!nombre_rol) {
        return res.status(400).json({ success: false, message: 'El nombre del rol es requerido' });
    }
    try {
        const [result] = await db.execute(
            'INSERT INTO Roles (nombre_rol, descripcion_rol, es_default) VALUES (?, ?, 0)',
            [nombre_rol, descripcion_rol || '']
        );
        const nuevoId = result.insertId;
        
        // Asignar el permiso básico predeterminado: VER_POSTULACIONES_GLOBALES
        const [opcion] = await db.execute('SELECT opcion_id FROM opciones WHERE link = "VER_POSTULACIONES_GLOBALES" LIMIT 1');
        if (opcion.length > 0) {
            await db.execute('INSERT IGNORE INTO d_roles_opciones (rol_id, opcion_id) VALUES (?, ?)', [nuevoId, opcion[0].opcion_id]);
        }

        // PREVENCIÓN DE BLOQUEO (Evitar que el creador se quede afuera al salir del Modo Apocalipsis)
        const [totalRolesResult] = await db.execute('SELECT COUNT(*) as total FROM Roles');
        if (totalRolesResult[0].total === 1 && req.user && req.user.usuarioId) {
            // Es el primer rol creado en todo el sistema. Se lo asignamos automáticamente al creador.
            await db.execute('INSERT INTO d_usuarios_roles (usuario_id, rol_id) VALUES (?, ?)', [req.user.usuarioId, nuevoId]);
        }
        
        // ── BITÁCORA ──────────────────────────────────────────────────────────────
        registrarAuditoria(req.user?.usuarioId, 'CREAR_ROL', 'Configuraciones',
            `Se creó el rol "${nombre_rol}" (ID: ${nuevoId})`,
            req.ip || '127.0.0.1');
        // ─────────────────────────────────────────────────────────────────────────
        res.json({ success: true, message: 'Rol creado correctamente', id_rol: nuevoId });
    } catch (error) {
        console.error('Error al crear rol:', error.message);
        res.status(500).json({ success: false, error: 'Error al crear el rol' });
    }
});

// Actualizar nombre y descripción de un rol (PUT /configuraciones/roles/:id)
router.put('/roles/:id', verificarPermiso('rolesPermisos:editar'), async (req, res) => {
    const id = parseInt(req.params.id);
    const { nombre_rol, descripcion_rol } = req.body;
    
    if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID de rol no válido' });
    }
    if (!nombre_rol) {
        return res.status(400).json({ success: false, message: 'El nombre del rol es requerido' });
    }

    try {
        await db.execute(
            'UPDATE Roles SET nombre_rol = ?, descripcion_rol = ? WHERE id_rol = ?',
            [nombre_rol, descripcion_rol || '', id]
        );
        // ── BITÁCORA ──────────────────────────────────────────────────────────────
        registrarAuditoria(req.user?.usuarioId, 'EDITAR_ROL', 'Configuraciones',
            `Se editó el nombre del rol ID ${id} a "${nombre_rol}"`,
            req.ip || '127.0.0.1');
        // ─────────────────────────────────────────────────────────────────────────
        res.json({ success: true, message: 'Rol actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar rol:', error.message);
        res.status(500).json({ success: false, error: 'Error al actualizar el rol' });
    }
});

// Obtener usuarios asignados a un rol (GET /configuraciones/roles/:id/usuarios)
router.get('/roles/:id/usuarios', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID de rol no válido' });

    try {
        const [usuarios] = await db.execute(`
            SELECT u.id_usuario, u.correo, p.nombre_Persona, p.apellido_Persona, p.imagenUrl_Persona 
            FROM Usuarios u 
            JOIN d_usuarios_roles ur ON u.id_usuario = ur.usuario_id 
            LEFT JOIN Personas p ON u.id_usuario = p.id_Usuario
            WHERE ur.rol_id = ?
        `, [id]);
        res.json({ success: true, data: usuarios });
    } catch (error) {
        console.error('Error al obtener usuarios del rol:', error.message);
        res.status(500).json({ success: false, error: 'Error al obtener usuarios' });
    }
});

// Eliminar un rol (DELETE /configuraciones/roles/:id)
router.delete('/roles/:id', verificarPermiso('rolesPermisos:eliminar'), async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID de rol no válido' });
    }

    try {
        // El check de es_default se ha eliminado para permitir borrar roles base.
        // Se mantiene la verificación de usuarios asignados.

        // Contar el total de roles en el sistema
        const [totalRolesResult] = await db.execute('SELECT COUNT(*) as total FROM Roles');
        const totalRoles = totalRolesResult[0].total;

        // Verificar si hay usuarios asignados a este rol
        const [users] = await db.execute('SELECT COUNT(*) as count FROM d_usuarios_roles WHERE rol_id = ?', [id]);
        
        // Si no es el último rol, aplicar la validación estricta
        if (totalRoles > 1 && users[0].count > 0) {
            return res.status(400).json({ success: false, error: `No se puede eliminar el rol porque hay ${users[0].count} usuario(s) asignado(s) a él. Reasigne a estos usuarios antes de eliminar el rol.` });
        }

        // Si es el último rol (totalRoles === 1), permitimos eliminar (entraremos en Modo Apocalipsis)
        // Eliminamos primero las asignaciones para evitar violaciones de clave foránea si no hay CASCADE
        await db.execute('DELETE FROM d_usuarios_roles WHERE rol_id = ?', [id]);
        await db.execute('DELETE FROM Roles WHERE id_rol = ?', [id]);
        // ── BITÁCORA ──────────────────────────────────────────────────────────────
        registrarAuditoria(req.user?.usuarioId, 'ELIMINAR_ROL', 'Configuraciones',
            `Se eliminó el rol con ID ${id}`,
            req.ip || '127.0.0.1');
        // ─────────────────────────────────────────────────────────────────────────
        res.json({ success: true, message: 'Rol eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar rol:', error.message);
        res.status(500).json({ success: false, error: 'Error al eliminar el rol' });
    }
});

// Guardar permisos asignados a un rol (PUT /configuraciones/roles/:id/permisos)
router.put('/roles/:id/permisos', verificarPermiso('rolesPermisos:editar'), async (req, res) => {
    const id = parseInt(req.params.id);
    const { permisos } = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID de rol no válido' });
    }
    if (!Array.isArray(permisos)) {
        return res.status(400).json({ success: false, message: 'Los permisos deben enviarse como un array' });
    }

    try {
        // Obtener IDs de las opciones correspondientes
        const [opcionesDB] = await db.execute('SELECT opcion_id, link FROM opciones');
        const mapOpciones = new Map();
        opcionesDB.forEach(o => mapOpciones.set(o.link, o.opcion_id));
        
        // Borrar permisos actuales
        await db.execute('DELETE FROM d_roles_opciones WHERE rol_id = ?', [id]);

        // Batch INSERT: construir una sola query con todos los permisos
        const valores = [];
        const placeholders = [];
        for (const clave of permisos) {
            const opId = mapOpciones.get(clave);
            if (opId) {
                placeholders.push('(?, ?)');
                valores.push(id, opId);
            }
        }

        if (placeholders.length > 0) {
            await db.execute(
                `INSERT IGNORE INTO d_roles_opciones (rol_id, opcion_id) VALUES ${placeholders.join(', ')}`,
                valores
            );
        }

        // ── BITÁCORA ──────────────────────────────────────────────────────────────
        registrarAuditoria(req.user?.usuarioId, 'EDITAR_PERMISOS_ROL', 'Configuraciones',
            `Se actualizaron los permisos del rol ID ${id} (${permisos.length} permisos asignados)`,
            req.ip || '127.0.0.1');
        // ─────────────────────────────────────────────────────────────────────────
        res.json({ success: true, message: 'Permisos actualizados correctamente' });
    } catch (error) {
        console.error('Error al actualizar permisos del rol:', error.message);
        res.status(500).json({ success: false, error: 'Error al guardar los permisos' });
    }
});

// Asignar rol masivamente a usuarios sin rol (POST /configuraciones/roles/:id/asignar-masivo)
router.post('/roles/:id/asignar-masivo', verificarPermiso('rolesPermisos:editar'), async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID de rol no válido' });
    }
    
    try {
        // Verificar que el rol existe
        const [roles] = await db.execute('SELECT id_rol FROM Roles WHERE id_rol = ?', [id]);
        if (roles.length === 0) {
            return res.status(404).json({ success: false, message: 'El rol no existe' });
        }

        // Obtener todos los usuarios que NO están en la tabla d_usuarios_roles
        const [usuariosSinRol] = await db.execute(`
            SELECT u.id_usuario 
            FROM Usuarios u 
            LEFT JOIN d_usuarios_roles ur ON u.id_usuario = ur.usuario_id 
            WHERE ur.usuario_id IS NULL
        `);

        // Excluir al admin actual por seguridad
        const idAdminActual = req.user && req.user.usuarioId ? parseInt(req.user.usuarioId) : -1;
        const usuariosAAsignar = usuariosSinRol.filter(u => parseInt(u.id_usuario) !== idAdminActual);

        if (usuariosAAsignar.length === 0) {
            return res.json({ success: true, message: 'No hay usuarios sin rol para asignar.', count: 0 });
        }

        // Hacer la inserción masiva
        const valores = [];
        const placeholders = [];
        for (const u of usuariosAAsignar) {
            placeholders.push('(?, ?)');
            valores.push(u.id_usuario, id);
        }

        await db.execute(
            `INSERT INTO d_usuarios_roles (usuario_id, rol_id) VALUES ${placeholders.join(', ')}`,
            valores
        );

        res.json({ success: true, message: `Rol asignado correctamente a ${usuariosAAsignar.length} usuarios sin rol.`, count: usuariosAAsignar.length });
    } catch (error) {
        console.error('Error al asignar rol masivamente:', error.message);
        res.status(500).json({ success: false, error: 'Error del servidor al asignar rol masivamente' });
    }
});


// ====================================================
// ENDPOINTS PARA GESTIÓN DE VARIABLES DE ENTORNO
// ====================================================

// Obtener todas las variables de entorno
router.get('/variables', async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT clave, valor FROM Configuraciones_Sistema WHERE tipo = 'variable_entorno'");
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener variables de entorno:', error.message);
        res.status(500).json({ success: false, error: 'Error del servidor al obtener variables' });
    }
});

// Guardar nueva variable de entorno
router.post('/variables', verificarPermiso('variables:crear'), async (req, res) => {
    const { clave, valor } = req.body;
    if (!clave || !valor) {
        return res.status(400).json({ success: false, message: 'La clave y el valor son requeridos' });
    }
    try {
        await db.execute(
            "INSERT INTO Configuraciones_Sistema (clave, valor, tipo, descripcion) VALUES (?, ?, 'variable_entorno', 'Variable de entorno del sistema')",
            [clave, String(valor)]
        );
        // ── BITÁCORA ────────────────────────────────────────────────────────────
        registrarAuditoria(req.user?.usuarioId || null, 'AGREGAR_VARIABLE_ENTORNO', 'Configuraciones', 
            `Se agregó la variable de entorno "${clave}"`, req.ip || '127.0.0.1');
        // ────────────────────────────────────────────────────────────────────────
        res.json({ success: true, message: 'Variable de entorno agregada con éxito' });
    } catch (error) {
        console.error('Error al agregar variable de entorno:', error.message);
        res.status(500).json({ success: false, error: 'Error al agregar la variable en la base de datos' });
    }
});

// Actualizar variable de entorno
router.put('/variables/:clave', verificarPermiso('variables:editar'), async (req, res) => {
    const { clave } = req.params;
    const { valor } = req.body;
    if (!valor) {
        return res.status(400).json({ success: false, message: 'El valor es requerido' });
    }
    try {
        await db.execute(
            "UPDATE Configuraciones_Sistema SET valor = ? WHERE clave = ? AND tipo = 'variable_entorno'",
            [String(valor), clave]
        );
        // ── BITÁCORA ────────────────────────────────────────────────────────────
        registrarAuditoria(req.user?.usuarioId || null, 'EDITAR_VARIABLE_ENTORNO', 'Configuraciones', 
            `Se actualizó la variable de entorno "${clave}"`, req.ip || '127.0.0.1');
        // ────────────────────────────────────────────────────────────────────────
        res.json({ success: true, message: 'Variable de entorno actualizada con éxito' });
    } catch (error) {
        console.error('Error al actualizar variable de entorno:', error.message);
        res.status(500).json({ success: false, error: 'Error al actualizar la variable' });
    }
});

// Eliminar variable de entorno
router.delete('/variables/:clave', verificarPermiso('variables:eliminar'), async (req, res) => {
    const { clave } = req.params;
    try {
        await db.execute("DELETE FROM Configuraciones_Sistema WHERE clave = ? AND tipo = 'variable_entorno'", [clave]);
        // ── BITÁCORA ────────────────────────────────────────────────────────────
        registrarAuditoria(req.user?.usuarioId || null, 'ELIMINAR_VARIABLE_ENTORNO', 'Configuraciones', 
            `Se eliminó la variable de entorno "${clave}"`, req.ip || '127.0.0.1');
        // ────────────────────────────────────────────────────────────────────────
        res.json({ success: true, message: 'Variable de entorno eliminada con éxito' });
    } catch (error) {
        console.error('Error al eliminar variable de entorno:', error.message);
        res.status(500).json({ success: false, error: 'Error al eliminar la variable' });
    }
});

// ====================================================
// ENDPOINTS PARA PERMISOS INDIVIDUALES DE USUARIOS
// ====================================================

// Obtener permisos individuales de un usuario
router.get('/usuarios/:id/permisos', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID no válido' });

    try {
        const [rows] = await db.execute(
            `SELECT o.link, uo.concedido
             FROM d_usuarios_opciones uo
             JOIN opciones o ON uo.opcion_id = o.opcion_id
             WHERE uo.usuario_id = ?`,
            [id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener permisos de usuario:', error.message);
        res.status(500).json({ success: false, error: 'Error al obtener permisos' });
    }
});

// Actualizar permisos individuales de un usuario
router.put('/usuarios/:id/permisos', verificarPermiso('rolesPermisos:editar'), async (req, res) => {
    const id = parseInt(req.params.id);
    const { permisos } = req.body; // array de objetos: { link: 'mensajes', concedido: true/false }

    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID no válido' });
    if (!Array.isArray(permisos)) return res.status(400).json({ success: false, message: 'Formato incorrecto' });

    try {
        // Obtener map de opciones para convertir link a opcion_id
        const [opcionesDB] = await db.execute('SELECT opcion_id, link FROM opciones');
        const mapOpciones = new Map();
        opcionesDB.forEach(o => mapOpciones.set(o.link, o.opcion_id));

        // Borramos todos los permisos individuales actuales del usuario
        await db.execute('DELETE FROM d_usuarios_opciones WHERE usuario_id = ?', [id]);

        // Batch INSERT: construir una sola query con todos los permisos
        const valores = [];
        const placeholders = [];
        for (const p of permisos) {
            const opcion_id = mapOpciones.get(p.link);
            if (opcion_id) {
                placeholders.push('(?, ?, ?)');
                valores.push(id, opcion_id, p.concedido ? 1 : 0);
            }
        }

        if (placeholders.length > 0) {
            await db.execute(
                `INSERT INTO d_usuarios_opciones (usuario_id, opcion_id, concedido) VALUES ${placeholders.join(', ')}`,
                valores
            );
        }

        // ── BITÁCORA ──────────────────────────────────────────────────────────────
        registrarAuditoria(req.user?.usuarioId, 'EDITAR_PERMISOS_USUARIO', 'Configuraciones',
            `Se modificaron los permisos individuales del usuario ID ${id} (${permisos.length} excepciones guardadas)`,
            req.ip || '127.0.0.1');
        // ─────────────────────────────────────────────────────────────────────────
        res.json({ success: true, message: 'Permisos de usuario actualizados correctamente' });
    } catch (error) {
        console.error('Error al actualizar permisos de usuario:', error.message);
        res.status(500).json({ success: false, error: 'Error al guardar permisos de usuario' });
    }
});

module.exports = router;
