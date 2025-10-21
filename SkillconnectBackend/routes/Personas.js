// Personas.js
// ========================================
// API Personas - SkillConnect2025
// ========================================
// 
// Campos de imágenes:
// - imagenUrl: Foto de perfil principal
// - imagen1Url: Primera imagen de galería
// - imagen2Url: Segunda imagen de galería
// - imagen3Url: Tercera imagen de galería
// ========================================

const express = require('express');
const router = express.Router();

// Importar configuración centralizada de la base de datos
const db = require('../db');

// ----------------------------------------------------
// ENDPOINT: Obtener TODAS las personas (GET /personas)
// ----------------------------------------------------
router.get('/', async (req, res) => {
    try {
        // Llamar al procedimiento almacenado que devuelve todas las personas
        const [resultado] = await db.execute('CALL sp_Personas_ObtenerTodo()');
        
        // El resultado de los procedimientos almacenados en mysql2 suele ser un array de arrays
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
    
    // Verificación básica de ID
    if (isNaN(id)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID no válido' 
        });
    }

    try {
        // Llamar al procedimiento almacenado
        const [resultado] = await db.execute('CALL sp_Personas_ObtenerPorId(?)', [id]);
        
        // Obtener los datos de la persona
        const persona = resultado[0][0]; // Acceder al primer resultado del primer array
        
        // Si no existe, devolver error 404
        if (!persona) {
            return res.status(404).json({ 
                success: false,
                message: 'Persona no encontrada' 
            });
        }
        
        // Devolver los datos
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
        nombre,
        apellido,
        fechaNac,
        genero,
        estadoCivil,
        tipoIdentificacion,
        identificacion,
        imagenUrl,
        imagen1Url,
        imagen2Url,
        imagen3Url,
        descripcionPerfil
    } = req.body;
    
    // Validación de campos requeridos
    if (!nombre || !apellido || !identificacion) {
        return res.status(400).json({ 
            success: false, 
            message: 'Faltan campos requeridos: nombre, apellido e identificación' 
        });
    }

    // Validación de enums
    const generosValidos = ['Masculino', 'Femenino', 'Otro'];
    const estadosCivilesValidos = ['Soltero', 'Casado', 'Divorciado', 'Viudo'];
    const tiposIdentificacionValidos = ['DNI', 'Pasaporte'];

    if (genero && !generosValidos.includes(genero)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Género no válido. Debe ser: Masculino, Femenino u Otro' 
        });
    }

    if (estadoCivil && !estadosCivilesValidos.includes(estadoCivil)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Estado civil no válido. Debe ser: Soltero, Casado, Divorciado o Viudo' 
        });
    }

    if (tipoIdentificacion && !tiposIdentificacionValidos.includes(tipoIdentificacion)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Tipo de identificación no válido. Debe ser: DNI o Pasaporte' 
        });
    }

    try {
        // Llamar al procedimiento almacenado con todos los parámetros
        const [resultado] = await db.execute(
            'CALL sp_Personas_Insertar(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                nombre,
                apellido,
                fechaNac || null,
                genero || null,
                estadoCivil || null,
                tipoIdentificacion || null,
                identificacion,
                imagenUrl || null,
                imagen1Url || null,
                imagen2Url || null,
                imagen3Url || null,
                descripcionPerfil || null
            ]
        );
        
        // Obtener el ID insertado del resultado
        const idInsertado = resultado[0][0] ? resultado[0][0].id_Perfil_Persona_Nuevo : null;
        
        res.status(201).json({
            success: true,
            message: 'Persona creada exitosamente',
            data: { 
                id: idInsertado,
                nombre, 
                apellido, 
                identificacion,
                descripcionPerfil
            }
        });
        
    } catch (error) {
        console.error('Error al crear persona:', error.message);
        
        // Manejar errores específicos (como duplicado de identificación)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                success: false,
                error: 'Ya existe una persona con esa identificación'
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al crear la persona'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Actualizar una persona (PUT /personas/:id)
// ----------------------------------------------------
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { 
        nombre,
        apellido,
        fechaNac,
        genero,
        estadoCivil,
        tipoIdentificacion,
        identificacion,
        imagenUrl,
        imagen1Url,
        imagen2Url,
        imagen3Url,
        descripcionPerfil
    } = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID no válido' 
        });
    }

    // Validación de enums si se proporcionan
    const generosValidos = ['Masculino', 'Femenino', 'Otro'];
    const estadosCivilesValidos = ['Soltero', 'Casado', 'Divorciado', 'Viudo'];
    const tiposIdentificacionValidos = ['DNI', 'Pasaporte'];

    if (genero && !generosValidos.includes(genero)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Género no válido. Debe ser: Masculino, Femenino u Otro' 
        });
    }

    if (estadoCivil && !estadosCivilesValidos.includes(estadoCivil)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Estado civil no válido. Debe ser: Soltero, Casado, Divorciado o Viudo' 
        });
    }

    if (tipoIdentificacion && !tiposIdentificacionValidos.includes(tipoIdentificacion)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Tipo de identificación no válido. Debe ser: DNI o Pasaporte' 
        });
    }
    
    try {
        // Primero verificar si la persona existe
        const [verificacion] = await db.execute('CALL sp_Personas_ObtenerPorId(?)', [id]);
        
        if (!verificacion[0] || verificacion[0].length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Persona no encontrada' 
            });
        }

        // Obtener datos actuales para mantener los valores no actualizados
        const personaActual = verificacion[0][0];

        // Llamar al procedimiento almacenado de actualización
        await db.execute(
            'CALL sp_Personas_Actualizar(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                id,
                nombre !== undefined ? nombre : personaActual.nombre_Persona,
                apellido !== undefined ? apellido : personaActual.apellido_Persona,
                fechaNac !== undefined ? fechaNac : personaActual.fechaNac_Persona,
                genero !== undefined ? genero : personaActual.genero_Persona,
                estadoCivil !== undefined ? estadoCivil : personaActual.estadoCivil_Persona,
                tipoIdentificacion !== undefined ? tipoIdentificacion : personaActual.tipoIdentificacion_Persona,
                identificacion !== undefined ? identificacion : personaActual.identificacion_Persona,
                imagenUrl !== undefined ? imagenUrl : personaActual.imagenUrl_Persona,
                imagen1Url !== undefined ? imagen1Url : personaActual.imagen1Url_Persona,
                imagen2Url !== undefined ? imagen2Url : personaActual.imagen2Url_Persona,
                imagen3Url !== undefined ? imagen3Url : personaActual.imagen3Url_Persona,
                descripcionPerfil !== undefined ? descripcionPerfil : personaActual.descripcionPerfil_Persona
            ]
        );
        
        res.json({
            success: true,
            message: `Persona con ID ${id} actualizada exitosamente`,
            data: { 
                id,
                nombre: nombre !== undefined ? nombre : personaActual.nombre_Persona,
                apellido: apellido !== undefined ? apellido : personaActual.apellido_Persona,
                descripcionPerfil: descripcionPerfil !== undefined ? descripcionPerfil : personaActual.descripcionPerfil_Persona
            }
        });

    } catch (error) {
        console.error(`Error al actualizar persona con ID ${id}:`, error.message);
        
        // Manejar error de identificación duplicada
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                success: false,
                error: 'Ya existe una persona con esa identificación'
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al actualizar la persona'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Eliminar una persona (DELETE /personas/:id)
// ----------------------------------------------------
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID no válido' 
        });
    }
    
    try {
        // Primero verificar si la persona existe
        const [verificacion] = await db.execute('CALL sp_Personas_ObtenerPorId(?)', [id]);
        
        if (!verificacion[0] || verificacion[0].length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Persona no encontrada' 
            });
        }

        // Llamar al procedimiento almacenado para la eliminación
        await db.execute('CALL sp_Personas_Eliminar(?)', [id]);
        
        res.json({
            success: true,
            message: `Persona con ID ${id} eliminada exitosamente`
        });
        
    } catch (error) {
        console.error(`Error al eliminar persona con ID ${id}:`, error.message);
        
        // Manejar restricciones de clave foránea (si la persona tiene habilidades, etc.)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ 
                success: false,
                error: 'No se puede eliminar la persona porque tiene registros relacionados (habilidades, ubicaciones, etc.)'
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al eliminar la persona'
        });
    }
});

// Exportar el router para usarlo en el archivo principal (e.g., app.js)
module.exports = router;