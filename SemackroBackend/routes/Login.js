const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db'); // Conexión a la base de datos
const registrarAuditoria = require('../middlewares/auditLogger');

// Endpoint: POST /api/login

// **********************************************
// POST /api/login
// **********************************************
router.post('/login', async (req, res) => {
    const { correo, contrasena } = req.body;

    // Validar campos vacíos
    if (!correo || !contrasena) {
        return res.status(400).json({ error: 'Los campos no pueden estar vacíos.' });
    }

    try {
        // 1️⃣ Buscar usuario por correo
        const [rows] = await pool.execute(
            'SELECT id_usuario, correo, contrasena_hash, activo, intentos_fallidos, bloqueado_hasta FROM Usuarios WHERE correo = ?',
            [correo]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'El usuario no existe.' });
        }

        const usuario = rows[0];

        // Verificar si está bloqueado
        if (usuario.bloqueado_hasta && new Date() < new Date(usuario.bloqueado_hasta)) {
            if (usuario.bloqueado_hasta.getFullYear() === 9999) {
                return res.status(423).json({ error: 'Tu cuenta está bloqueada permanentemente por demasiados intentos fallidos. Contacta con el administrador para poder acceder.' });
            } else {
                const minutosRestantes = Math.ceil((new Date(usuario.bloqueado_hasta) - new Date()) / (1000 * 60));
                return res.status(423).json({ error: `Tu cuenta está bloqueada temporalmente. Intenta de nuevo en ${minutosRestantes} minuto(s).` });
            }
        } else if (usuario.bloqueado_hasta && new Date() >= new Date(usuario.bloqueado_hasta) && usuario.intentos_fallidos === 5) {
            // Si el bloqueo temporal terminó y estábamos en 5 intentos, mantener el contador en 5 para empezar los 3 intentos finales
            await pool.execute(
                'UPDATE Usuarios SET bloqueado_hasta = NULL WHERE id_usuario = ?',
                [usuario.id_usuario]
            );
        }

        // Verificar si el acceso está restringido
        if (usuario.activo === 0) {
            return res.status(403).json({ error: 'Tu cuenta ha sido restringida por el administrador. Ponte en contacto con el soporte técnico.' });
        }

        // 2️⃣ Verificar contraseña
        const esValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);

        if (!esValida) {
            // Incrementar contador de intentos fallidos
            const nuevosIntentos = usuario.intentos_fallidos + 1;
            let bloqueadoHasta = usuario.bloqueado_hasta;
            
            if (nuevosIntentos === 5) {
                // Bloquear temporalmente por 2 minutos después de 5 intentos
                bloqueadoHasta = new Date(Date.now() + 2 * 60 * 1000);
                await pool.execute(
                    'UPDATE Usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id_usuario = ?',
                    [nuevosIntentos, bloqueadoHasta, usuario.id_usuario]
                );
                return res.status(423).json({ error: 'Has alcanzado 5 intentos fallidos. Tu cuenta está bloqueada temporalmente por 2 minutos.' });
            } else if (nuevosIntentos === 6) {
                await pool.execute(
                    'UPDATE Usuarios SET intentos_fallidos = ? WHERE id_usuario = ?',
                    [nuevosIntentos, usuario.id_usuario]
                );
                return res.status(401).json({ error: 'La contraseña es incorrecta. Te quedan 2 intentos antes del bloqueo permanente.' });
            } else if (nuevosIntentos === 7) {
                await pool.execute(
                    'UPDATE Usuarios SET intentos_fallidos = ? WHERE id_usuario = ?',
                    [nuevosIntentos, usuario.id_usuario]
                );
                return res.status(401).json({ error: 'La contraseña es incorrecta. Te queda 1 intento antes del bloqueo permanente.' });
            } else if (nuevosIntentos >= 8) {
                // Bloquear permanentemente después de 8 intentos (5 + 3)
                bloqueadoHasta = new Date('9999-12-31 23:59:59');
                await pool.execute(
                    'UPDATE Usuarios SET intentos_fallidos = 0, bloqueado_hasta = ? WHERE id_usuario = ?',
                    [bloqueadoHasta, usuario.id_usuario]
                );
                return res.status(423).json({ error: 'Tu cuenta está bloqueada permanentemente por demasiados intentos fallidos. Contacta con el administrador para poder acceder.' });
            }
            
            await pool.execute(
                'UPDATE Usuarios SET intentos_fallidos = ? WHERE id_usuario = ?',
                [nuevosIntentos, usuario.id_usuario]
            );
            return res.status(401).json({ error: 'La contraseña es incorrecta.' });
        }

        // Si la contraseña es correcta, resetear intentos fallidos y bloqueo
        await pool.execute(
            'UPDATE Usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id_usuario = ?',
            [usuario.id_usuario]
        );

        // 3️⃣ Si todo está bien, responder con éxito
        await registrarAuditoria(
            usuario.id_usuario, 
            'INICIO_SESION', 
            'Seguridad', 
            'El usuario inició sesión exitosamente', 
            req.ip || req.connection?.remoteAddress || '127.0.0.1'
        );

        res.status(200).json({
            mensaje: 'Inicio de sesión exitoso.',
            usuario: {
                id_usuario: usuario.id_usuario,
                correo: usuario.correo
            }
        });

    } catch (error) {
        console.error('Error durante el inicio de sesión:', error);
        res.status(500).json({ error: 'Error del servidor al intentar iniciar sesión.' });
    }
});

// GET endpoint: Obtener rol completo de un usuario usando el procedimiento almacenado
// Ruta: GET /login/rol/:id_usuario
router.get('/login/rol/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;

    if (!id_usuario) {
        return res.status(400).json({ error: 'Parámetro id_usuario es requerido.' });
    }

    try {
        // Llamar al procedimiento almacenado
        const [rows] = await pool.execute('CALL GetUsuarioRolCompleto(?)', [id_usuario]);

        // Dependiendo del driver MySQL, la respuesta de CALL puede venir anidada.
        const result = Array.isArray(rows) && rows.length > 0 ? rows[0] : rows;

        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'No se encontró rol para el usuario.' });
        }

        res.status(200).json({
            id_usuario: Number(id_usuario),
            rol: result[0].rol,
            id_rol: result[0].id_rol,
            raw: result
        });

    } catch (error) {
        console.error('Error al obtener rol del usuario:', error);
        res.status(500).json({ error: 'Error del servidor al obtener rol del usuario.' });
    }
});

// GET endpoint: Obtener id_usuario por correo y luego su rol completo + permisos
// Ruta: GET /login/rol/correo/:correo
router.get('/login/rol/correo/:correo', async (req, res) => {
    const { correo } = req.params;

    if (!correo) {
        return res.status(400).json({ error: 'Parámetro correo es requerido.' });
    }

    try {
        // Llamar al procedimiento que obtiene el id por correo
        const [rowsId] = await pool.execute('CALL GetIdUsuarioByCorreo(?)', [correo]);

        // Manejar posible anidamiento del resultado
        const idResult = Array.isArray(rowsId) && rowsId.length > 0 ? rowsId[0] : rowsId;

        if (!idResult || idResult.length === 0 || !idResult[0].id_usuario) {
            return res.status(404).json({ error: 'No se encontró usuario con ese correo.' });
        }

        const id_usuario = idResult[0].id_usuario;

        // VERIFICAR MODO INSTALACION (0 roles)
        const [rolesCountResult] = await pool.execute('SELECT COUNT(*) as totalRoles FROM Roles');
        const isApocalypseMode = rolesCountResult[0].totalRoles === 0;

        let rolResult = null;
        let id_rol = null;

        if (!isApocalypseMode) {
            // Ahora obtener el rol desde d_usuarios_roles (asumiendo que tiene al menos un rol)
            const [rowsRol] = await pool.execute(`
                SELECT r.id_rol, r.nombre_rol as rol
                FROM d_usuarios_roles dur
                JOIN Roles r ON dur.rol_id = r.id_rol
                WHERE dur.usuario_id = ?
                LIMIT 1
            `, [id_usuario]);
            rolResult = Array.isArray(rowsRol) && rowsRol.length > 0 ? rowsRol[0] : null;

            if (!rolResult) {
                return res.status(404).json({ error: 'No se encontró rol para el usuario.' });
            }
            id_rol = rolResult.id_rol;
        } else {
            // Modo Instalación: Asignamos rol virtual
            rolResult = { rol: 'Super Administrador (Modo Instalación)' };
        }

        // Obtener las opciones de menú y mapear sus links como permisos para compatibilidad con el frontend
        let opciones = [];
        let permisos = [];
        try {
            if (isApocalypseMode) {
                // 1. Obtener absolutamente TODAS las opciones
                const [todasOpciones] = await pool.execute(
                    `SELECT opcion_id as id_opcion, nombre as nombre_opcion, link, orden FROM opciones`
                );
                
                opciones = todasOpciones.sort((a, b) => (a.orden || 0) - (b.orden || 0));
                permisos = opciones.map(o => o.link).filter(Boolean);
            } else {
                // 1. Obtener opciones del ROL
                const [opcionesRolRows] = await pool.execute(
                    `SELECT o.opcion_id as id_opcion, o.nombre as nombre_opcion, o.link, o.orden 
                     FROM d_roles_opciones ro 
                     JOIN opciones o ON ro.opcion_id = o.opcion_id 
                     WHERE ro.rol_id = ?`,
                    [id_rol]
                );
                
                // 2. Obtener excepciones del USUARIO INDIVIDUAL
                const [opcionesUsuarioRows] = await pool.execute(
                    `SELECT o.opcion_id as id_opcion, o.nombre as nombre_opcion, o.link, o.orden, uo.concedido
                     FROM d_usuarios_opciones uo
                     JOIN opciones o ON uo.opcion_id = o.opcion_id
                     WHERE uo.usuario_id = ?`,
                    [id_usuario]
                );

                // 3. Mezclar priorizando excepciones individuales
                const opcionesMap = new Map();
                opcionesRolRows.forEach(o => opcionesMap.set(o.id_opcion, o));
                
                opcionesUsuarioRows.forEach(uo => {
                    if (uo.concedido) {
                        opcionesMap.set(uo.id_opcion, {
                            id_opcion: uo.id_opcion,
                            nombre_opcion: uo.nombre_opcion,
                            link: uo.link,
                            orden: uo.orden
                        });
                    } else {
                        opcionesMap.delete(uo.id_opcion); // Si concedido es false, quitamos el permiso (incluso si el rol lo daba)
                    }
                });

                opciones = Array.from(opcionesMap.values()).sort((a, b) => (a.orden || 0) - (b.orden || 0));
                // Usamos 'link' como la antigua 'clave_permiso'
                permisos = opciones.map(o => o.link).filter(Boolean);
            }
        } catch (opcErr) {
            console.warn('No se pudieron obtener opciones/permisos combinados:', opcErr.message);
        }

        res.status(200).json({
            id_usuario: Number(id_usuario),
            correo,
            rol: rolResult.rol,
            id_rol: id_rol,
            permisos: permisos,
            opciones: opciones,
            raw: { idResult, rolResult }
        });

    } catch (error) {
        console.error('Error al obtener id o rol por correo:', error);
        res.status(500).json({ error: 'Error del servidor al obtener id o rol por correo.' });
    }
});





module.exports = router;
