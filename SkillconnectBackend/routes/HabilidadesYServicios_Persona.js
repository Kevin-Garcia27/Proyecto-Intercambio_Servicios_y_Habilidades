const express = require('express');
const router = express.Router();

// Importar configuración centralizada de la base de datos
const db = require('../db');

// ----------------------------------------------------
// ENDPOINT: Obtener todas las habilidades (GET /habilidades)
// ----------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const [resultado] = await db.execute('CALL sp_Habilidades_ObtenerTodo()');
        const habilidades = resultado[0];
        
        res.json({
            success: true,
            data: habilidades
        });
    } catch (error) {
        console.error('Error al obtener habilidades:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al obtener las habilidades'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Obtener habilidad por ID (GET /habilidades/:id)
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
        const [resultado] = await db.execute('CALL sp_Habilidades_ObtenerPorId(?)', [id]);
        const habilidad = resultado[0][0];
        
        if (!habilidad) {
            return res.status(404).json({ 
                success: false,
                message: 'Habilidad no encontrada' 
            });
        }
        
        res.json({
            success: true,
            data: habilidad
        });
    } catch (error) {
        console.error(`Error al obtener habilidad con ID ${id}:`, error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al obtener la habilidad'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Obtener habilidades por ID de Persona (GET /habilidades/persona/:idPersona)
// ----------------------------------------------------
router.get('/persona/:idPersona', async (req, res) => {
    const idPersona = parseInt(req.params.idPersona);
    
    if (isNaN(idPersona)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID de persona no válido' 
        });
    }

    try {
        const [resultado] = await db.execute('CALL sp_Habilidades_ObtenerPorPersona(?)', [idPersona]);
        const habilidades = resultado[0];
        
        res.json({
            success: true,
            data: habilidades || []
        });
    } catch (error) {
        console.error(`Error al obtener habilidades de persona ${idPersona}:`, error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al obtener las habilidades'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Crear una nueva habilidad (POST /habilidades)
// ----------------------------------------------------
router.post('/', async (req, res) => {
    const { 
        tipoEstado,
        nombre,
        descripcion,
        idPersona,
        idCategoria
    } = req.body;
    
    // Validación básica
    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ 
            success: false, 
            message: 'El nombre de la habilidad es requerido' 
        });
    }

    // Validar tipoEstado
    if (tipoEstado && !['Ofrece', 'Necesita'].includes(tipoEstado)) {
        return res.status(400).json({ 
            success: false, 
            message: 'El tipo de estado debe ser "Ofrece" o "Necesita"' 
        });
    }

    // Validar que idPersona sea proporcionado
    if (!idPersona) {
        return res.status(400).json({ 
            success: false, 
            message: 'El ID de la persona es requerido' 
        });
    }

    try {
        const [resultado] = await db.execute(
            'CALL sp_Habilidades_Insertar(?, ?, ?, ?, ?)',
            [
                tipoEstado || null,
                nombre.trim(),
                descripcion?.trim() || null,
                idPersona,
                idCategoria || null
            ]
        );
        
        const idInsertado = resultado[0][0] ? resultado[0][0].id_Habilidad_Nueva : null;
        
        res.status(201).json({
            success: true,
            message: 'Habilidad creada exitosamente',
            data: { 
                id: idInsertado,
                tipoEstado,
                nombre: nombre.trim(),
                descripcion: descripcion?.trim() || null
            }
        });
    } catch (error) {
        console.error('Error al crear habilidad:', error.message);
        
        // Error de clave foránea - persona no existe
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ 
                success: false,
                error: 'La persona o categoría especificada no existe'
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al crear la habilidad'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Actualizar una habilidad (PUT /habilidades/:id)
// ----------------------------------------------------
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID no válido' 
        });
    }

    const { 
        tipoEstado,
        nombre,
        descripcion,
        idPersona,
        idCategoria
    } = req.body;

    // Validación básica
    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ 
            success: false, 
            message: 'El nombre de la habilidad es requerido' 
        });
    }

    // Validar tipoEstado
    if (tipoEstado && !['Ofrece', 'Necesita'].includes(tipoEstado)) {
        return res.status(400).json({ 
            success: false, 
            message: 'El tipo de estado debe ser "Ofrece" o "Necesita"' 
        });
    }

    try {
        // Verificar si la habilidad existe
        const [checkResult] = await db.execute('CALL sp_Habilidades_ObtenerPorId(?)', [id]);
        if (!checkResult[0][0]) {
            return res.status(404).json({ 
                success: false,
                message: 'Habilidad no encontrada' 
            });
        }

        // Actualizar la habilidad
        await db.execute(
            'CALL sp_Habilidades_Actualizar(?, ?, ?, ?, ?, ?)',
            [
                id,
                tipoEstado || null,
                nombre.trim(),
                descripcion?.trim() || null,
                idPersona || null,
                idCategoria || null
            ]
        );
        
        res.json({
            success: true,
            message: 'Habilidad actualizada exitosamente',
            data: {
                id,
                tipoEstado,
                nombre: nombre.trim(),
                descripcion: descripcion?.trim() || null
            }
        });
    } catch (error) {
        console.error(`Error al actualizar habilidad ${id}:`, error.message);
        
        // Error de clave foránea
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ 
                success: false,
                error: 'La persona o categoría especificada no existe'
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al actualizar la habilidad'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Eliminar una habilidad (DELETE /habilidades/:id)
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
        // Verificar si la habilidad existe
        const [checkResult] = await db.execute('CALL sp_Habilidades_ObtenerPorId(?)', [id]);
        if (!checkResult[0][0]) {
            return res.status(404).json({ 
                success: false,
                message: 'Habilidad no encontrada' 
            });
        }

        // Eliminar la habilidad
        await db.execute('CALL sp_Habilidades_Eliminar(?)', [id]);
        
        res.json({
            success: true,
            message: 'Habilidad eliminada exitosamente'
        });
    } catch (error) {
        console.error(`Error al eliminar habilidad ${id}:`, error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al eliminar la habilidad'
        });
    }
});

module.exports = router;
