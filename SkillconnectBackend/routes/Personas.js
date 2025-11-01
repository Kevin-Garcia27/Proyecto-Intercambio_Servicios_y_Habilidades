const express = require('express');
const router = express.Router();
// ENDPOINT: Obtener perfil persona por usuarioId (GET /personas/by-usuario/:usuarioId)
router.get('/by-usuario/:usuarioId', async (req, res) => {
    const usuarioId = parseInt(req.params.usuarioId);
    if (isNaN(usuarioId)) {
        return res.status(400).json({ success: false, message: 'ID de usuario no válido' });
    }
    try {
        const [rows] = await db.execute('SELECT * FROM Personas WHERE id_Usuario = ?', [usuarioId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No se encontró persona para este usuario' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al buscar persona', error: error.message });
    }
});
// Personas.js
// ========================================
// API Personas - SkillConnect2025
// ========================================
// 
// Campos de imágenes:
// - imagenUrl: Foto de perfil principal
// - imagen1Url: Primera imagen de galería
// - - imagen2Url: Segunda imagen de galería
// - imagen3Url: Tercera imagen de galería
// ========================================



// Importar configuración centralizada de la base de datos
const db = require('../db');

// Definición de las constantes de validación
const GENEROS_VALIDOS = ['Masculino', 'Femenino', 'Otro'];
const ESTADOS_CIVILES_VALIDOS = ['Soltero', 'Casado', 'Divorciado', 'Viudo'];
const TIPOS_IDENTIFICACION_VALIDOS = ['DNI', 'Pasaporte'];
const CAMPOS_REQUERIDOS_REEMPLAZO = [
    'nombre_Persona', 'apellido_Persona', 'fechaNac_Persona', 'genero_Persona', // ✅ CORREGIDO: fechaNac_Persona
    'estadoCivil_Persona', 'tipoIdentificacion_Persona', 'identificacion_Persona',
    'imagenUrl_Persona', 'imagen1Url_Persona', 'imagen2Url_Persona', 'imagen3Url_Persona',
    'descripcionPerfil_Persona', 'disponibilidad'
];

/**
 * Función auxiliar para verificar si todos los campos requeridos para el PUT están en el body.
 * @param {object} body - El cuerpo de la solicitud (req.body).
 * @returns {boolean} - true si todos los campos están presentes.
 */
function validarCamposReemplazo(body) {
    for (const field of CAMPOS_REQUERIDOS_REEMPLAZO) {
        if (!(field in body)) {
            return false;
        }
    }
    return true;
}


// ----------------------------------------------------
// ENDPOINT: Obtener TODAS las personas (GET /personas)
// ----------------------------------------------------
router.get('/', async (req, res) => {
    try {
        // Llamar al procedimiento almacenado que devuelve todas las personas
        const [resultado] = await db.execute('CALL sp_Personas_ObtenerTodo()');
        
        const personas = resultado[0]; 
        
        res.json({
            success: true,
            count: personas.length,
            data: personas
        });
        
    } catch (error) {
        console.error('Error al obtener todas las personas:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al obtener las personas'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Obtener persona por ID (GET /personas/:id)
// ----------------------------------------------------
router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({
            success: false,
            message: 'ID no válido'
        });
    }

    try {
        const [rows] = await db.execute(
            `SELECT 
                p.id_Perfil_Persona,
                p.nombre_Persona,
                p.apellido_Persona,
                p.fechaNac_Persona,
                p.genero_Persona,
                p.estadoCivil_Persona,
                p.tipoIdentificacion_Persona,
                p.identificacion_Persona,
                p.imagenUrl_Persona,
                p.imagen1Url_Persona,
                p.imagen2Url_Persona,
                p.imagen3Url_Persona,
                p.descripcionPerfil_Persona,
                p.disponibilidad,
                p.id_Usuario,
                u.correo,
                u.nombre AS nombre_usuario_cuenta,
                u.activo
            FROM Personas p
            INNER JOIN Usuarios u ON p.id_Usuario = u.id_usuario
            WHERE u.id_usuario = ?
            LIMIT 1`,
            [id]
        );

        const persona = rows[0];

        if (!persona) {
            return res.status(404).json({
                success: false,
                message: 'Perfil de usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: persona
        });

    } catch (error) {
        console.error(`Error al obtener persona con ID ${id}:`, error.message);
        res.status(500).json({
            success: false,
            error: 'Error del servidor al obtener la persona'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Crear una nueva persona (POST /personas)
// ----------------------------------------------------
router.post('/', async (req, res) => {
    const { 
        id_Usuario,
        nombre_Persona,
        apellido_Persona,
        fechaNac_Persona, // ✅ CORREGIDO
        genero_Persona,
        estadoCivil_Persona,
        tipoIdentificacion_Persona,
        identificacion_Persona,
        imagenUrl_Persona,
        imagen1Url_Persona,
        imagen2Url_Persona,
        imagen3Url_Persona,
        descripcionPerfil_Persona,
        disponibilidad
    } = req.body;
    
    // Validación de campos mínimos
    if (!id_Usuario || !nombre_Persona || !apellido_Persona || !identificacion_Persona) {
        return res.status(400).json({ 
            success: false, 
            message: 'Faltan campos requeridos: id_Usuario, nombre, apellido e identificación' 
        });
    }

    // Validación de enums
    if (genero_Persona && !GENEROS_VALIDOS.includes(genero_Persona)) {
        return res.status(400).json({ success: false, message: 'Género no válido.' });
    }
    if (estadoCivil_Persona && !ESTADOS_CIVILES_VALIDOS.includes(estadoCivil_Persona)) {
        return res.status(400).json({ success: false, message: 'Estado civil no válido.' });
    }
    if (tipoIdentificacion_Persona && !TIPOS_IDENTIFICACION_VALIDOS.includes(tipoIdentificacion_Persona)) {
        return res.status(400).json({ success: false, message: 'Tipo de identificación no válido.' });
    }

    try {
        // Llamar al SP de REEMPLAZO (DELETE + INSERT)
        await db.execute(
             `CALL SP_REEMPLAZAR_PERFIL_PERSONA(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
             [
                 id_Usuario,
                 nombre_Persona,
                 apellido_Persona,
                 fechaNac_Persona || null, // ✅ CORREGIDO
                 genero_Persona || null,
                 estadoCivil_Persona || null,
                 tipoIdentificacion_Persona || null,
                 identificacion_Persona,
                 imagenUrl_Persona || null,
                 imagen1Url_Persona || null,
                 imagen2Url_Persona || null,
                 imagen3Url_Persona || null,
                 descripcionPerfil_Persona || null,
                 disponibilidad || null
             ]
         );
        
        res.status(201).json({
            success: true,
            message: 'Persona creada/reemplazada exitosamente',
            data: { id_Usuario, nombre_Persona, apellido_Persona }
        });
        
    } catch (error) {
        console.error('Error al crear/reemplazar persona:', error.message);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'Ya existe una persona con esa identificación o el id_Usuario está duplicado (revisar unicidad).' });
        }
        
        res.status(500).json({ success: false, error: 'Error del servidor al crear la persona' });
    }
});

// ----------------------------------------------------
// ENDPOINT: Actualizar una persona (PUT /personas/:id)
// ----------------------------------------------------
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    // 1. VALIDACIÓN DEL ID
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ success: false, message: 'ID de usuario no válido.' });
    }

    // 2. Validar y construir el SET dinámico solo con los campos enviados
    const camposPermitidos = [
        'nombre_Persona', 'apellido_Persona', 'fechaNac_Persona', 'genero_Persona',
        'estadoCivil_Persona', 'tipoIdentificacion_Persona', 'identificacion_Persona',
        'imagenUrl_Persona', 'imagen1Url_Persona', 'imagen2Url_Persona', 'imagen3Url_Persona',
        'descripcionPerfil_Persona', 'disponibilidad'
    ];
    const camposActualizar = Object.keys(req.body).filter(campo => camposPermitidos.includes(campo));
    if (camposActualizar.length === 0) {
        return res.status(400).json({ success: false, message: 'No se enviaron campos válidos para actualizar.' });
    }

    // Validación de enums si se envían
    if ('genero_Persona' in req.body && !GENEROS_VALIDOS.includes(req.body.genero_Persona)) {
        return res.status(400).json({ success: false, message: 'Género no válido.' });
    }
    if ('estadoCivil_Persona' in req.body && !ESTADOS_CIVILES_VALIDOS.includes(req.body.estadoCivil_Persona)) {
        return res.status(400).json({ success: false, message: 'Estado civil no válido.' });
    }
    if ('tipoIdentificacion_Persona' in req.body && !TIPOS_IDENTIFICACION_VALIDOS.includes(req.body.tipoIdentificacion_Persona)) {
        return res.status(400).json({ success: false, message: 'Tipo de identificación no válido.' });
    }

    // 3. Construir la consulta UPDATE dinámica
    const setClause = camposActualizar.map(campo => `${campo} = ?`).join(', ');
    const valores = camposActualizar.map(campo => req.body[campo]);
    valores.push(id); // Para el WHERE

    try {
        const [result] = await db.execute(
            `UPDATE Personas SET ${setClause} WHERE id_Usuario = ?`,
            valores
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Perfil de usuario no encontrado' });
        }
        res.json({
            success: true,
            message: `Perfil de usuario ${id} actualizado exitosamente`,
            data: { id, campos_actualizados: camposActualizar }
        });
    } catch (error) {
        console.error(`Error al actualizar persona con ID ${id}:`, error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'Ya existe una persona con esa identificación.' });
        }
        res.status(500).json({ success: false, error: 'Error del servidor al actualizar la persona' });
    }
});

// ----------------------------------------------------
// ENDPOINT: Eliminar una persona (DELETE /personas/:id)
// ----------------------------------------------------
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID no válido' });
    }
    
    try {
        // Ejecutar el DELETE directo para borrar el perfil de la persona
        const [result] = await db.execute(
            'DELETE FROM Personas WHERE id_Usuario = ?', 
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Perfil de Persona no encontrado para el ID de Usuario proporcionado.' 
            });
        }
        
        res.json({
            success: true,
            message: `Perfil de Persona asociado al Usuario ${id} eliminado exitosamente`
        });
        
    } catch (error) {
        console.error(`Error al eliminar perfil de persona con ID ${id}:`, error.message);
        
        // Manejar restricciones de clave foránea
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ 
                success: false,
                error: 'No se puede eliminar el perfil porque tiene registros relacionados (habilidades, etc.).'
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al eliminar el perfil.'
        });
    }
});

// Exportar el router para usarlo en el archivo principal (e.g., app.js)
module.exports = router;
